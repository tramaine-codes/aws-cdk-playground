import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
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

    const handler = new nodejs.NodejsFunction(this, 'TodoHandler', {
      entry: `${this.pkg.rootDir()}/lambda/todo-api/index.ts`,
      environment: {
        DYNAMODB_TABLE: table.tableName,
        KMS_KEY: key.keyArn,
        S3_BUCKET: bucket.bucketName,
      },
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
    });
    const integration = new apigw.LambdaIntegration(handler);

    table.grantReadWriteData(handler);
    bucket.grantReadWrite(handler);

    const api = new apigw.RestApi(this, 'TodoApi');

    const todos = api.root.addResource('todos');
    todos.addMethod('POST', integration);

    const todo = todos.addResource('{todoId}');
    todo.addMethod('GET', integration);
  }
}
