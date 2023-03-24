import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class CodeBuildStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const gitHubSource = codebuild.Source.gitHub({
      owner: 'tgillus',
      repo: 'geo-api',
      webhook: true,
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
          'main'
        ),
      ],
    });
    const bucket = new s3.Bucket(this, 'Bucket');

    new codebuild.GitHubSourceCredentials(this, 'GitHubToken', {
      accessToken: cdk.SecretValue.secretsManager('github-token'),
    });
    new codebuild.Project(this, 'Project', {
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
      source: gitHubSource,
      artifacts: codebuild.Artifacts.s3({
        bucket,
        name: 'chemist.zip',
        packageZip: true,
        path: 'chemist',
      }),
    });
  }
}
