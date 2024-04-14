import { Nothing } from 'purify-ts';
import { TodoDto } from '../../application/dto/todo-dto.js';
import { Client } from '../../vendor/s3/client.js';
import { Config } from '../config/config.js';

export class S3Gateway {
  constructor(
    private readonly client: Client,
    private readonly config: Config
  ) {}

  create = (todo: TodoDto) =>
    this.client
      .put({
        Body: JSON.stringify(todo),
        Bucket: this.config.aws.s3.bucketName,
        Key: `todos/${todo.id}.json`,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: this.config.aws.s3.key,
      })
      .map(() => Nothing);

  read = (key: string, id: string) =>
    this.client.select({
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
    });

  static from = (config: Config) => new S3Gateway(new Client(), config);
}
