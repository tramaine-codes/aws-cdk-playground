import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import { Package } from '../vendor/pkg/package.js';

export class ApiKeyAuthorizerStack extends cdk.Stack {
  private readonly pkg = Package.build();

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizer = new apigw.RequestAuthorizer(this, 'RequestAuthorizer', {
      handler: new nodejs.NodejsFunction(this, 'Authorizer', {
        entry: `${this.pkg.rootDir()}/lib/api-gateway/api-key-authorizer-stack.auth.ts`,
      }),
      identitySources: [apigw.IdentitySource.header('Authorization')],
      resultsCacheTtl: cdk.Duration.seconds(0),
    });
    const api = new apigw.RestApi(this, 'ApiKeyAuthorizer', {
      apiKeySourceType: apigw.ApiKeySourceType.AUTHORIZER,
    });
    const plan = api.addUsagePlan('UsagePlan', {
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });
    const key = api.addApiKey('ApiKey');

    api.root.addResource('hello').addMethod(
      'GET',
      new apigw.LambdaIntegration(
        new lambda.Function(this, 'HelloHandler', {
          runtime: lambda.Runtime.NODEJS_22_X,
          code: lambda.Code.fromAsset('lambda'),
          handler: 'hello.handler',
          environment: {
            NODE_OPTIONS: '--enable-source-maps',
          },
        })
      ),
      {
        apiKeyRequired: true,
        authorizer,
      }
    );
    plan.addApiKey(key);
    plan.addApiStage({
      api,
      stage: api.deploymentStage,
    });
  }
}
