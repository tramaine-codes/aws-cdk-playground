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
import { Chunk, Effect, Match, Option, Sink, Stream } from 'effect';

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
  ) => {
    Effect.tryPromise(async () => {
      const stream = Stream.fromAsyncIterable(
        payload,
        () => new Error('failed processing stream')
      );

      return stream.pipe(
        Stream.run(
          Sink.foldLeft(Chunk.make(new Uint8Array()), (chunks, chunk) =>
            Option.fromNullable(chunk.Records).pipe(
              Option.flatMapNullable(({ Payload }) => Payload),
              Option.match({
                onNone: () => chunks,
                onSome: (chunk) => chunks.pipe(Chunk.append(chunk)),
              })
            )
          )
        ),
        Effect.andThen((chunks) =>
          Buffer.concat(chunks.pipe(Chunk.toReadonlyArray)).toString('utf8')
        )
      );
    });
  };
}
