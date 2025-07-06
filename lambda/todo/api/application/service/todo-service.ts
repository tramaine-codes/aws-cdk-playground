import { Array as Arr, Effect } from 'effect';
import { TodoDto } from '../../../common/application/dto/todo-dto.js';
import type { Todo } from '../../../common/application/model/todo.js';
import type { Config } from '../../../common/infrastructure/config/config.js';
import { DynamoGateway } from '../../../common/infrastructure/dynamo/dynamo-gateway.js';
import { IdGenerator } from '../../../common/infrastructure/id/id-generator.js';
import { S3Gateway } from '../../../common/infrastructure/s3/s3-gateway.js';

export class TodoService {
  constructor(
    private readonly dynamoGateway: DynamoGateway,
    private readonly s3Gateway: S3Gateway
  ) {}

  create = (todo: Todo) => {
    const id = IdGenerator.generate();
    const dto = new TodoDto(id, todo);

    return this.s3Gateway.create(dto).pipe(
      Effect.andThen(this.dynamoGateway.create(dto)),
      Effect.andThen(() => id)
    );
  };

  read = (id: string) =>
    this.dynamoGateway.read(id).pipe(
      Effect.andThen(({ Items }) => Effect.fromNullable(Items)),
      Effect.catchTag('NoSuchElementException', () =>
        Effect.fail(new Error('item not found'))
      ),
      Effect.andThen((items) => Arr.get(items, 0)),
      Effect.catchTag('NoSuchElementException', () =>
        Effect.fail(new Error('s3key not found'))
      ),
      Effect.andThen(({ S3Key }) => this.s3Gateway.read(S3Key, id)),
      Effect.andThen((todo) => JSON.parse(todo) as TodoDto)
    );

  static from = (config: Config) =>
    new TodoService(DynamoGateway.from(config), S3Gateway.from(config));
}
