import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { Package } from '../vendor/pkg/package.js';

export class S3Stack extends cdk.Stack {
  private readonly pkg = Package.build();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'Bucket', {
      // autoDeleteObjects: true,
      // eventBridgeEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    (bucket.node.defaultChild as s3.CfnBucket).notificationConfiguration = {
      eventBridgeConfiguration: {
        eventBridgeEnabled: true,
      },
      // topicConfigurations: [
      //   {
      //     topic: topic.topicArn,
      //     event: 's3:ObjectCreated:*',
      //   },
      // ],
    };

    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: cdk.Duration.minutes(5),
    });

    new events.Rule(this, 'Rule', {
      eventPattern: {
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
        },
        detailType: ['Object Created'],
        source: ['aws.s3'],
      },
      targets: [new targets.SqsQueue(queue)],
    });

    new ec2.Instance(this, 'Instance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: new ec2.Vpc(this, 'Vpc', {
        maxAzs: 1,
      }),
    });

    const fn = new nodejs.NodejsFunction(this, 'Function', {
      entry: `${this.pkg.rootDir()}/lambda/ec2/index.ts`,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_LATEST,
      timeout: cdk.Duration.seconds(60),
    });
    fn.addEventSource(new SqsEventSource(queue));
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:DescribeInstances',
          'ec2:StartInstances',
          'ec2:StopInstances',
        ],
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        sid: 'StartStopAndDescribeInstances',
      })
    );
  }
}
