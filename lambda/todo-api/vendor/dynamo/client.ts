import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { EitherAsync } from 'purify-ts';

export class Client {
  private readonly client = DynamoDBDocument.from(new DynamoDBClient());

  get = (params: GetCommandInput) =>
    EitherAsync<Error, GetCommandOutput>(() =>
      this.client.send(new GetCommand(params))
    );

  put = (params: PutCommandInput) =>
    EitherAsync<Error, PutCommandOutput>(() =>
      this.client.send(new PutCommand(params))
    );
}
