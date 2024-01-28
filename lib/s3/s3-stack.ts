import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'S3Bucket', {
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

    new events.Rule(this, 'S3EventRule', {
      eventPattern: {
        detail: {
          bucket: {
            name: [bucket.bucketName],
          },
        },
        detailType: ['Object Created'],
        source: ['aws.s3'],
      },
      targets: [new targets.SqsQueue(new sqs.Queue(this, 'S3EventQueue'))],
    });
  }
}
