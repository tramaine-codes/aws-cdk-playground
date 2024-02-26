#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';
import 'source-map-support/register';
import { ApiGatewayStack } from '../lib/api-gateway/api-gateway-stack.js';
import { ApiKeyAuthorizerStack } from '../lib/api-gateway/api-key-authorizer-stack.js';
import { ApiKeyStack } from '../lib/api-gateway/api-key-stack.js';
import { ApiTodoStack } from '../lib/api-gateway/api-todo-stack.js';
import { CodeBuildStack } from '../lib/code-build/code-build-stack.js';
import {
  CodePipelineStack,
  LambdaStack,
} from '../lib/code-pipeline/code-pipeline-stack.js';
import { CustomResourceStack } from '../lib/custom-resource/custom-resource-stack.js';
import { EcsStack } from '../lib/ecs/ecs-stack.js';
import { Environment } from '../lib/infrastructure/environment/environment.js';
import { OpenSearchStack } from '../lib/open-search/open-search-stack.js';
import { S3Stack } from '../lib/s3/s3-stack.js';

const environment = Environment.load();
const { awsAccount: account, awsRegion: region } = environment;
const app = new cdk.App();
const env = {
  account,
  region,
};

new ApiGatewayStack(app, 'ApiGatewayStack', { env });
new ApiKeyStack(app, 'ApiKeyStack', { env });
new ApiKeyAuthorizerStack(app, 'ApiKeyAuthorizerStack', { env });
new ApiTodoStack(app, 'ApiTodoStack', { env });

new CodeBuildStack(app, 'CodeBuildStack', { env });

new CustomResourceStack(app, 'CustomResourceStack', { env });

new EcsStack(app, 'EcsStack', { env });

const { lambdaCode } = new LambdaStack(app, 'LambdaStack', { env });
new CodePipelineStack(app, 'CodePipelineStack', lambdaCode, { env });

new OpenSearchStack(app, 'OpenSearchStack', { env, environment });

new S3Stack(app, 'S3Stack', { env });
