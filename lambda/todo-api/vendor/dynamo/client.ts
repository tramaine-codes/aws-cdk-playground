import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { EitherAsync } from 'purify-ts';

export class Client {
  private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient());

  query = (params: QueryCommandInput) =>
    EitherAsync<Error, QueryCommandOutput>(() =>
      this.client.send(new QueryCommand(params))
    );

  put = (params: PutCommandInput) =>
    EitherAsync<Error, PutCommandOutput>(() =>
      this.client.send(new PutCommand(params))
    );
}
