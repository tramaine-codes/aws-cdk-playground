export class Config {
  readonly aws = {
    dynamo: {
      // biome-ignore lint/style/noNonNullAssertion: set on the function by ApiTodoStack
      tableName: process.env.DYNAMODB_TABLE!,
    },
    s3: {
      // biome-ignore lint/style/noNonNullAssertion: set on the function by ApiTodoStack
      bucketName: process.env.S3_BUCKET!,
      // biome-ignore lint/style/noNonNullAssertion: set on the function by ApiTodoStack
      key: process.env.KMS_KEY!,
    },
  };
}
