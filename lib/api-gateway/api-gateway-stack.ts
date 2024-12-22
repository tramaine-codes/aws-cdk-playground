import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type { Construct } from 'constructs';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: new lambda.Function(this, 'HelloHandler', {
        runtime: lambda.Runtime.NODEJS_22_X,
        code: lambda.Code.fromAsset('lambda/hello'),
        handler: 'hello.handler',
      }),
    });
  }
}
