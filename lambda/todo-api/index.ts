/* eslint-disable no-console */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { nanoid } from 'nanoid';

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event, undefined, 2));
  console.log(JSON.stringify(process.env, undefined, 2));

  if (event.httpMethod === 'POST') {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
    const documentClient = DynamoDBDocument.from(client);
    const id = nanoid();
    console.log('POST request');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: `Hello, CDK! You've hit ${event.path}\n`,
  };
};
