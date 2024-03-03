import {
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
  SelectObjectContentCommand,
  SelectObjectContentCommandInput,
  SelectObjectContentCommandOutput,
} from '@aws-sdk/client-s3';
import { EitherAsync } from 'purify-ts';

export class Client {
  private readonly client = new S3Client();

  get = (params: GetObjectCommandInput) =>
    EitherAsync<Error, GetObjectCommandOutput>(() =>
      this.client.send(new GetObjectCommand(params))
    );

  put = (params: PutObjectCommandInput) =>
    EitherAsync<Error, PutObjectCommandOutput>(() =>
      this.client.send(new PutObjectCommand(params))
    );

  select = (params: SelectObjectContentCommandInput) =>
    EitherAsync<Error, SelectObjectContentCommandOutput>(() =>
      this.client.send(new SelectObjectContentCommand(params))
    );
}
