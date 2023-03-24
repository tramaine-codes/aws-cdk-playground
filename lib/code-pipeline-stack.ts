import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

export class CodePipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    lambdaCode: cdk.aws_lambda.CfnParametersCode,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const pipeline = new codepipeline.Pipeline(this, 'CodePipeline', {
      crossAccountKeys: false,
    });
    const cdkSourceOutput = new codepipeline.Artifact();
    const cdkSourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'CdkSourceAction',
      owner: 'tgillus',
      repo: 'aws-cdk-playground',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: cdkSourceOutput,
      branch: 'main',
    });
    const lambdaSourceOutput = new codepipeline.Artifact();
    const lambdaSourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'LambdaSourceAction',
      owner: 'tgillus',
      repo: 'geo-api',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: lambdaSourceOutput,
      branch: 'main',
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [cdkSourceAction, lambdaSourceAction],
    });

    const cdkBuildProject = new codebuild.PipelineProject(
      this,
      'CdkBuildProject',
      {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        },
        buildSpec: codebuild.BuildSpec.fromObjectToYaml({
          version: 0.2,
          phases: {
            install: {
              commands: 'npm install',
            },
            build: {
              commands: [
                'npm run build',
                'npm run cdk synth LambdaStack -- -o .',
              ],
            },
          },
          artifacts: {
            files: 'LambdaStack.template.json',
          },
        }),
      }
    );
    const cdkBuildOutput = new codepipeline.Artifact();
    const cdkBuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CdkBuildAction',
      project: cdkBuildProject,
      input: cdkSourceOutput,
      outputs: [cdkBuildOutput],
    });

    const lambdaBuildProject = new codebuild.PipelineProject(
      this,
      'LambdaBuildProject',
      {
        buildSpec: codebuild.BuildSpec.fromObjectToYaml({
          version: 0.2,
          phases: {
            install: {
              'runtime-versions': {
                nodejs: 16,
              },
              commands: [
                'echo Installing latest version of npm',
                'npm install -g npm@latest',
              ],
            },
            pre_build: {
              commands: ['echo Installing project dependencies', 'npm install'],
            },
            build: {
              commands: [
                'echo Building project',
                'npm run build',
                'echo Pruning development dependencies',
                'npm prune --omit=dev',
              ],
            },
          },
          artifacts: {
            files: ['lib/**/*', 'package.json', 'node_modules/**/*'],
          },
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_6_0,
        },
      }
    );
    const lambdaBuildOutput = new codepipeline.Artifact();
    const lambdaBuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'LambdaCodeBuildAction',
      project: lambdaBuildProject,
      input: lambdaSourceOutput,
      outputs: [lambdaBuildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [cdkBuildAction, lambdaBuildAction],
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'LambdaCfnDeployAction',
          templatePath: cdkBuildOutput.atPath('LambdaStack.template.json'),
          stackName: 'LambdaStack',
          adminPermissions: true,
          parameterOverrides: lambdaCode.assign(lambdaBuildOutput.s3Location),
          extraInputs: [lambdaBuildOutput],
        }),
      ],
    });
  }
}
