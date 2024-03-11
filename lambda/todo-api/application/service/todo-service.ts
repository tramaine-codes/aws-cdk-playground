import { EitherAsync, List, Maybe } from 'purify-ts';
import { Config } from '../../infrastructure/config/config.js';
import { DynamoGateway } from '../../infrastructure/dynamo/dynamo-gateway.js';
import { IdGenerator } from '../../infrastructure/id/id-generator.js';
import { S3Gateway } from '../../infrastructure/s3/s3-gateway.js';
import { TodoDto } from '../dto/todo-dto.js';
import { Todo } from '../model/todo.js';

export class TodoService {
  constructor(
    private readonly dynamoGateway: DynamoGateway,
    private readonly s3Gateway: S3Gateway
  ) {}

  create = (todo: Todo) => {
    const id = IdGenerator.generate();
    const todoDto = new TodoDto(id, todo);

    return this.s3Gateway
      .create(todoDto)
      .chain(() => this.dynamoGateway.create(todoDto))
      .map(() => id);
  };

  read = (id: string) =>
    this.dynamoGateway
      .read(id)
      .chain(({ Items }) =>
        EitherAsync.liftEither(
          Maybe.fromNullable(Items)
            .chain((items) => List.at(0, items))
            .toEither(new Error('item not found'))
        )
      )
      .chain(({ S3Key }) =>
        EitherAsync.liftEither(
          Maybe.fromNullable(S3Key as string | undefined).toEither(
            new Error('s3key not found')
          )
        )
      )
      .chain((key) => this.s3Gateway.read(key, id))
      .map((todo) => JSON.parse(todo) as TodoDto);

  static from = (config: Config) =>
    new TodoService(DynamoGateway.from(config), S3Gateway.from(config));
}
