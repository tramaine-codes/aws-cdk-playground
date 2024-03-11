import { Nothing } from 'purify-ts';
import { TodoDto } from '../../application/dto/todo-dto.js';
import { Client } from '../../vendor/dynamo/client.js';
import { Time } from '../../vendor/type/time.js';
import { Config } from '../config/config.js';

export class DynamoGateway {
  constructor(
    private readonly client: Client,
    private readonly config: Config
  ) {}

  create = ({ id }: TodoDto) => {
    const now = Time.now();
    const ttl = Time.unixTime(Time.addMinutes(now, 2));

    return this.client
      .put({
        TableName: this.config.aws.dynamo.tableName,
        Item: {
          PK: `TODO#${id}`,
          SK: now.toISOString(),
          Id: id,
          Type: 'Todo',
          S3Key: `todos/${id}.json`,
          CreatedAt: now.toISOString(),
          TTL: ttl,
        },
      })
      .map(() => Nothing);
  };

  read = (id: string) =>
    this.client.query({
      TableName: this.config.aws.dynamo.tableName,
      KeyConditionExpression: '#pk = :id',
      ExpressionAttributeNames: {
        '#pk': 'PK',
      },
      ExpressionAttributeValues: {
        ':id': `TODO#${id}`,
      },
      Limit: 1,
      ScanIndexForward: true,
    });

  static from = (config: Config) => new DynamoGateway(new Client(), config);
}
