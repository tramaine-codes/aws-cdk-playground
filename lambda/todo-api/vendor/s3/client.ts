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
  SelectObjectContentEventStream,
} from '@aws-sdk/client-s3';
import { EitherAsync, Left, Maybe } from 'purify-ts';
import { match } from 'ts-pattern';

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
    ).chain(this.selectOutput);

  private selectOutput = ({
    $metadata: { httpStatusCode },
    Payload,
  }: SelectObjectContentCommandOutput) =>
    match(httpStatusCode)
      .with(200, () =>
        EitherAsync.liftEither(
          Maybe.fromNullable(Payload).toEither(new Error('Payload not found'))
        ).chain(this.selectOutputPayload)
      )
      .otherwise((code) =>
        EitherAsync.liftEither(
          Left(
            new Error(
              `SelectObjectContentCommand failed with status code of ${code}`
            )
          )
        )
      );

  private selectOutputPayload = (
    payload: AsyncIterable<SelectObjectContentEventStream>
  ) =>
    EitherAsync<Error, string>(async () => {
      const chunks = [new Uint8Array()];
      for await (const stream of payload) {
        Maybe.fromNullable(stream.Records?.Payload).ifJust((chunk) =>
          chunks.push(chunk)
        );
      }
      return Buffer.concat(chunks).toString('utf8');
    });
}
