import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Nothing } from 'purify-ts';
import { Client } from '../../vendor/s3/client.js';

export class S3Gateway {
  private readonly client = new Client();

  put = (params: PutObjectCommandInput) =>
    this.client.put(params).map(() => Nothing);

  select = this.client.select;
}
