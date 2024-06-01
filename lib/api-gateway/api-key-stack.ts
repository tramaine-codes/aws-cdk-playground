import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import type { Construct } from 'constructs';

export class ApiKeyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigw.RestApi(this, 'ApiKey', {
      apiKeySourceType: apigw.ApiKeySourceType.HEADER,
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
      new apigw.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: { 'application/json': '{ "foo" : "bar" }' },
          },
        ],
        passthroughBehavior: apigw.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigw.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );
    plan.addApiKey(key);
    plan.addApiStage({
      api,
      stage: api.deploymentStage,
    });
  }
}
