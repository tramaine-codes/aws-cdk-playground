import { TodoDto } from '../../../common/application/dto/todo-dto.js';
import { Config } from '../../../common/infrastructure/config/config.js';
import { DynamoGateway } from '../../../common/infrastructure/dynamo/dynamo-gateway.js';
import { S3Gateway } from '../../../common/infrastructure/s3/s3-gateway.js';

export class TodoService {
  constructor(
    private readonly dynamoGateway: DynamoGateway,
    private readonly s3Gateway: S3Gateway
  ) {}

  create = (key: string, id: string) =>
    this.s3Gateway
      .read(key, id)
      .map((todo) => JSON.parse(todo) as TodoDto)
      .chain((dto) => this.dynamoGateway.create(dto))
      .map(() => id);

  static from = (config: Config) =>
    new TodoService(DynamoGateway.from(config), S3Gateway.from(config));
}
