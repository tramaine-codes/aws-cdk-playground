import {
  GetObjectCommandInput,
  PutObjectCommandInput,
  SelectObjectContentCommandInput,
} from '@aws-sdk/client-s3';
import { Nothing } from 'purify-ts';
import { Client } from '../../vendor/s3/client.js';

export class S3Gateway {
  private readonly client = new Client();

  get = (params: GetObjectCommandInput) => {
    return this.client.get(params);
  };

  put = (params: PutObjectCommandInput) =>
    this.client.put(params).map(() => Nothing);

  select = (params: SelectObjectContentCommandInput) => {
    return this.client.select(params);
  };
}
