import { EitherAsync, List, Maybe } from 'purify-ts';
import { TodoDto } from '../../../common/application/dto/todo-dto.js';
import { Todo } from '../../../common/application/model/todo.js';
import { Config } from '../../../common/infrastructure/config/config.js';
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

    return this.s3Gateway
      .create(dto)
      .chain(() => this.dynamoGateway.create(dto))
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
          Maybe.fromNullable<string>(S3Key).toEither(
            new Error('s3key not found')
          )
        )
      )
      .chain((key) => this.s3Gateway.read(key, id))
      .map((todo) => JSON.parse(todo) as TodoDto);

  static from = (config: Config) =>
    new TodoService(DynamoGateway.from(config), S3Gateway.from(config));
}
