/* eslint-disable no-console */
import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
} from '@aws-sdk/client-ec2';
import { Context, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import * as R from 'remeda';

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  console.log(
    `Lambda invocation event: ${JSON.stringify(event, undefined, 2)}`
  );
  console.log(
    `Lambda invocation context: ${JSON.stringify(context, undefined, 2)}`
  );

  const client = new EC2Client();

  const describeOutput = await client.send(new DescribeInstancesCommand({}));
  console.log(JSON.stringify(describeOutput, undefined, 2));

  const instanceIds = R.pipe(
    describeOutput.Reservations ?? [],
    R.flatMap(({ Instances }) => Instances),
    R.compact,
    R.map(({ InstanceId }) => InstanceId),
    R.compact
  );

  const startOutput = await client.send(
    new StartInstancesCommand({
      InstanceIds: instanceIds,
    })
  );
  console.log(JSON.stringify(startOutput, undefined, 2));

  return {
    batchItemFailures: [],
  };
};
