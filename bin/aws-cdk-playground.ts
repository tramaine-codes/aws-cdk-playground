#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';
import 'source-map-support/register';
import { ApiGatewayStack } from '../lib/api-gateway/api-gateway-stack.js';
import { CodeBuildStack } from '../lib/code-build/code-build-stack.js';
import {
  CodePipelineStack,
  LambdaStack,
} from '../lib/code-pipeline/code-pipeline-stack.js';
import { EcsStack } from '../lib/ecs/ecs-stack.js';
import { Environment } from '../lib/infrastructure/environment/environment.js';
import { OpenSearchStack } from '../lib/open-search/open-search-stack.js';

const environment = Environment.load();
const { awsAccount: account, awsRegion: region } = environment;
const app = new cdk.App();
const env = {
  account,
  region,
};

new ApiGatewayStack(app, 'ApiGatewayStack', { env });

new CodeBuildStack(app, 'CodeBuildStack', { env });

const { lambdaCode } = new LambdaStack(app, 'LambdaStack', { env });
new CodePipelineStack(app, 'CodePipelineStack', lambdaCode, { env });

new EcsStack(app, 'EcsStack', { env });

new OpenSearchStack(app, 'OpenSearchStack', { env, environment });
