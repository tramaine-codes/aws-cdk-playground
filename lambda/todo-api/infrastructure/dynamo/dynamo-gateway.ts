import { GetCommandInput, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { Nothing } from 'purify-ts';
import { Client } from '../../vendor/dynamo/client.js';

export class DynamoGateway {
  private readonly client = new Client();

  get = (params: GetCommandInput) => {
    return this.client.get(params);
  };

  put = (params: PutCommandInput) => this.client.put(params).map(() => Nothing);
}
