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

  const id = nanoid();

  if (event.httpMethod === 'POST') {
    const documentClient = DynamoDBDocument.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION,
      })
    );
    const date = new Date().toISOString();
    await documentClient.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK: `TODO#${id}`,
        SK: `TODO#${id}`,
        Id: id,
        Type: 'Todo',
        Completed: false,
        Text: 'Go grocery shopping',
        CreatedAt: date,
        UpdatedAt: date,
      },
    });
    console.log('POST request');
  }

  return {
    statusCode: 202,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Accepted', id }),
  };
};
