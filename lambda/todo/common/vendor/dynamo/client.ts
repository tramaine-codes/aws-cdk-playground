import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  type PutCommandInput,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Effect } from 'effect';

export class Client {
  private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient());

  query = (params: QueryCommandInput) =>
    Effect.tryPromise(() => this.client.send(new QueryCommand(params)));

  put = (params: PutCommandInput) =>
    Effect.tryPromise(() => this.client.send(new PutCommand(params)));
}
