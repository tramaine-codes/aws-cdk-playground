import * as cdk from 'aws-cdk-lib';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LambdaStack extends cdk.Stack {
  readonly lambdaCode: cdk.aws_lambda.CfnParametersCode;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.lambdaCode = lambda.Code.fromCfnParameters();

    const func = new lambda.Function(this, 'Function', {
      code: this.lambdaCode,
      handler: 'lib/api/lambda.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
    });

    // used to make sure each CDK synthesis produces a different Version
    const version = func.currentVersion;
    const alias = new lambda.Alias(this, 'Alias', {
      aliasName: 'Prod',
      version,
    });

    new codedeploy.LambdaDeploymentGroup(this, 'LambdaDeploymentGroup', {
      alias,
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
    });
  }
}
