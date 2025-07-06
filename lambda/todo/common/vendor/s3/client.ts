import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  SelectObjectContentCommand,
  type GetObjectCommandInput,
  type PutObjectCommandInput,
  type SelectObjectContentCommandInput,
  type SelectObjectContentCommandOutput,
  type SelectObjectContentEventStream,
} from '@aws-sdk/client-s3';
import { Effect, Match, Option } from 'effect';

export class Client {
  private readonly client = new S3Client();

  get = (params: GetObjectCommandInput) =>
    Effect.tryPromise(() => this.client.send(new GetObjectCommand(params)));

  put = (params: PutObjectCommandInput) =>
    Effect.tryPromise(() => this.client.send(new PutObjectCommand(params)));

  select = (params: SelectObjectContentCommandInput) =>
    Effect.tryPromise(() =>
      this.client.send(new SelectObjectContentCommand(params))
    ).pipe(Effect.andThen(this.selectOutput));

  private selectOutput = ({
    $metadata: { httpStatusCode },
    Payload,
  }: SelectObjectContentCommandOutput) =>
    Match.value(httpStatusCode).pipe(
      Match.when(200, () =>
        Effect.fromNullable(Payload).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(new Error('Payload not found'))
          ),
          Effect.andThen((payload) => this.selectOutputPayload(payload))
        )
      ),
      Match.orElse((code) =>
        Effect.fail(
          new Error(
            `SelectObjectContentCommand failed with status code of ${code}`
          )
        )
      )
    );

  private selectOutputPayload = (
    payload: AsyncIterable<SelectObjectContentEventStream>
  ) =>
    Effect.tryPromise(async () => {
      const chunks = [new Uint8Array()];
      for await (const stream of payload) {
        Option.fromNullable(stream.Records).pipe(
          Option.flatMapNullable(({ Payload }) => Payload),
          Option.andThen((chunk) => chunks.push(chunk))
        );
      }
      return Buffer.concat(chunks).toString('utf8');
    });
}
