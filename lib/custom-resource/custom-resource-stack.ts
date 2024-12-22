import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Package } from '../vendor/pkg/package.js';

export class CustomResourceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const result = new CustomResourceExample(this, 'CustomResourceResult', {
      customResourceNumber: 5,
    });

    new cdk.CfnOutput(this, 'CustomResourceOutput', {
      value: result.customResourceResult,
    });
  }
}

interface CdkCustomResourceExampleProps extends cdk.ResourceProps {
  readonly customResourceNumber: number;
}

class CustomResourceExample extends Construct {
  public readonly customResourceResult: string;
  private readonly pkg = Package.build();

  constructor(
    scope: Construct,
    id: string,
    props: CdkCustomResourceExampleProps
  ) {
    super(scope, id);

    const customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Custom Resource Construct Example',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });
    const customResourceLambda = new nodejs.NodejsFunction(
      this,
      'DynamoLambdaHandler',
      {
        entry: `${this.pkg.rootDir()}/lambda/custom-resource/index.ts`,
        handler: 'handler',
        role: customResourceRole,
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: cdk.Duration.seconds(60),
      }
    );
    const customResourceProvider = new cr.Provider(
      this,
      'CustomResourceProvider',
      {
        onEventHandler: customResourceLambda,
      }
    );
    const customResourceResult = new cdk.CustomResource(
      this,
      'CustomResourceResult',
      {
        properties: {
          customResourceNumber: props.customResourceNumber,
        },
        serviceToken: customResourceProvider.serviceToken,
      }
    );

    customResourceLambda.addEnvironment(
      'AWS_NODEJS_CONNECTION_REUSE_ENABLED',
      '1',
      {
        removeInEdge: true,
      }
    );
    this.customResourceResult = customResourceResult.getAttString('Result');
  }
}
