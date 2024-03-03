import { EitherAsync, Maybe } from 'purify-ts';
import { Config } from '../../infrastructure/config/config.js';
import { DynamoGateway } from '../../infrastructure/dynamo/dynamo-gateway.js';
import { IdGenerator } from '../../infrastructure/id/id-generator.js';
import { S3Gateway } from '../../infrastructure/s3/s3-gateway.js';
import { Time } from '../../vendor/type/time.js';
import { TodoDto } from '../dto/todo-dto.js';
import { Todo } from '../model/todo.js';

export class TodoService {
  constructor(
    private readonly dynamoGateway: DynamoGateway,
    private readonly s3Gateway: S3Gateway,
    private readonly config: Config
  ) {}

  createTodo(todo: Todo) {
    const id = IdGenerator.generate();
    const now = Time.now();

    return this.s3Gateway
      .put({
        Body: JSON.stringify(new TodoDto(id, todo)),
        Bucket: this.config.aws.s3.bucketName,
        Key: `todos/${id}.json`,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.config.aws.s3.key,
      })
      .chain(() =>
        this.dynamoGateway.put({
          TableName: this.config.aws.dynamo.tableName,
          Item: {
            PK: 'TODO',
            SK: `TODO#${id}`,
            Id: id,
            Type: 'Todo',
            S3Key: `todos/${id}.json`,
            CreatedAt: now.toISOString(),
            TTL: Time.unixTime(Time.addMinutes(now, 2)),
          },
        })
      )
      .map(() => id);
  }

  getTodo = (id: string) =>
    this.dynamoGateway
      .get({
        TableName: this.config.aws.dynamo.tableName,
        Key: {
          PK: 'TODO',
          SK: `TODO#${id}`,
        },
      })
      .chain(({ Item }) =>
        EitherAsync.liftEither(
          Maybe.fromNullable(Item).toEither(new Error('Item not found'))
        )
      )
      .chain(({ S3Key }) =>
        EitherAsync.liftEither(
          Maybe.fromNullable(S3Key as string | undefined).toEither(
            new Error('S3Key not found')
          )
        )
      )
      .chain((key) =>
        this.s3Gateway.select({
          Bucket: this.config.aws.s3.bucketName,
          Key: key,
          ExpressionType: 'SQL',
          Expression: `SELECT * FROM s3object s WHERE s.id = '${id}'`,
          InputSerialization: {
            JSON: { Type: 'DOCUMENT' },
          },
          OutputSerialization: {
            JSON: { RecordDelimiter: '\n' },
          },
        })
      )
      .map((todo) => JSON.parse(todo) as TodoDto);
}
