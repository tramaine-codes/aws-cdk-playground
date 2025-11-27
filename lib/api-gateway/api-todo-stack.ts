import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import type { Construct } from 'constructs';
import { Package } from '../vendor/pkg/package.js';

export class ApiTodoStack extends cdk.Stack {
  private readonly pkg = Package.build();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.TableV2(this, 'TodoApiTable', {
      tableName: 'TodoApi',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
    });

    const key = new kms.Key(this, 'TodoApiBucketKey', {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bucket = new s3.Bucket(this, 'TodoApiBucket', {
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: key,
      enforceSSL: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(1),
          noncurrentVersionExpiration: cdk.Duration.days(1),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
    });
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireKMSEncryption',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireSpecificKMSKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringNotLikeIfExists: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': key.keyArn,
          },
        },
      })
    );

    const apiHandler = new nodejs.NodejsFunction(this, 'ApiHandler', {
      entry: `${this.pkg.rootDir()}/lambda/todo/api/index.ts`,
      environment: {
        DYNAMODB_TABLE: table.tableName,
        KMS_KEY: key.keyArn,
        S3_BUCKET: bucket.bucketName,
      },
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_24_X,
    });
    const integration = new apigw.LambdaIntegration(apiHandler);

    table.grantReadWriteData(apiHandler);
    bucket.grantReadWrite(apiHandler);

    const api = new apigw.RestApi(this, 'TodoApi');

    const todos = api.root.addResource('todos');
    todos.addMethod('POST', integration);

    const todo = todos.addResource('{todoId}');
    todo.addMethod('GET', integration);

    const middleHandler = new nodejs.NodejsFunction(this, 'MiddleHandler', {
      entry: `${this.pkg.rootDir()}/lambda/todo/middle/index.ts`,
      environment: {
        DYNAMODB_TABLE: table.tableName,
        KMS_KEY: key.keyArn,
        S3_BUCKET: bucket.bucketName,
      },
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_24_X,
    });

    const saveToDynamoJob = new tasks.LambdaInvoke(this, 'SaveToDynamoJob', {
      lambdaFunction: middleHandler,
    });

    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(saveToDynamoJob),
      timeout: cdk.Duration.minutes(5),
      comment: 'a super cool state machine',
    });

    stateMachine.grantStartExecution(apiHandler);

    const start = new sfn.Pass(this, 'JobOne', {
      stateName: 'One',
      parameters: {
        id: 'foo',
      },
    })
      .next(
        new sfn.Pass(this, 'JobTwo', {
          parameters: {
            action: 'bar',
            id: sfn.JsonPath.stringAt('$.id'),
          },
          stateName: 'Two',
        })
      )
      .next(
        new sfn.Parallel(this, 'JobThree', {
          stateName: 'Parallel',
        })
          .branch(
            new sfn.Pass(this, 'JobThreeA', {
              parameters: {
                action: 'baz',
                id: sfn.JsonPath.stringAt('$.id'),
              },
              stateName: 'ThreeA',
            })
          )
          .branch(
            new sfn.Pass(this, 'JobThreeB', {
              parameters: {
                action: 'qux',
                id: sfn.JsonPath.stringAt('$.id'),
              },
              stateName: 'ThreeB',
            }).next(
              new sfn.Pass(this, 'JobThreeBB', {
                parameters: {
                  action: 'quux',
                  id: sfn.JsonPath.stringAt('$.id'),
                },
                stateName: 'ThreeBB',
              })
            )
          )
      );

    new sfn.StateMachine(this, 'ParametersMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(start),
      timeout: cdk.Duration.minutes(5),
      comment: 'a super cool state machine',
    });
  }
}
