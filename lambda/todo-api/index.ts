/* eslint-disable no-console */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addMinutes, getUnixTime } from 'date-fns';
import { nanoid } from 'nanoid';

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'POST') {
    return await post(event);
  }

  return await get(event);
};

const post = async (event: APIGatewayEvent) => {
  const id = nanoid();
  const documentClient = DynamoDBDocument.from(new DynamoDBClient());
  const s3Client = new S3Client();
  const newTodo = JSON.parse(event.body ?? '{}');
  const date = new Date().toISOString();
  await documentClient.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `TODO#${id}`,
      SK: `TODO#${id}`,
      Id: id,
      Type: 'Todo',
      S3Key: `todos/${id}.json`,
      CreatedAt: date,
      TTL: getUnixTime(addMinutes(date, 2)),
    },
  });

  await s3Client.send(
    new PutObjectCommand({
      Body: JSON.stringify(newTodo),
      Bucket: process.env.S3_BUCKET,
      Key: `todos/${id}.json`,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.KMS_KEY,
    })
  );

  return {
    statusCode: 202,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Accepted', id }),
  };
};

const get = async (event: APIGatewayEvent) => {
  const documentClient = DynamoDBDocument.from(
    new DynamoDBClient({
      region: process.env.AWS_REGION,
    })
  );
  const s3Client = new S3Client();
  const id = event.pathParameters?.todoId;
  const { Item } = await documentClient.get({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `TODO#${id}`,
      SK: `TODO#${id}`,
    },
  });
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: Item?.S3Key,
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: (await Body?.transformToString()) ?? '{}',
  };
};
