import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

export class CodeBuildStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new codebuild.GitHubSourceCredentials(this, 'GitHubToken', {
      accessToken: cdk.SecretValue.secretsManager('github-token'),
    });
    new codebuild.Project(this, 'Project', {
      source: codebuild.Source.gitHub({
        owner: 'tgillus',
        repo: 'geo-api',
        webhook: true,
        webhookFilters: [
          codebuild.FilterGroup.inEventOf(
            codebuild.EventAction.PUSH
          ).andBranchIs('main'),
        ],
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
      },
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: 0.2,
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 22,
            },
            commands: ['npm install -g npm@latest'],
          },
          pre_build: {
            commands: ['npm install'],
          },
          build: {
            commands: ['npm run build'],
          },
          post_build: {
            commands: ['npm prune --omit=dev'],
          },
        },
        artifacts: {
          files: ['lib/**/*', 'package.json', 'node_modules/**/*'],
          name: 'geo-api-$(npm pkg get version | tr -d \\").${CODEBUILD_BUILD_NUMBER}.zip',
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: new s3.Bucket(this, 'ArtifactsBucket', {
          autoDeleteObjects: true,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        includeBuildId: false,
        packageZip: true,
        path: 'geo-api',
      }),
    });
  }
}
