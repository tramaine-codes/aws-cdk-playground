export class Config {
  readonly aws = {
    dynamo: {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      tableName: process.env.DYNAMODB_TABLE!,
    },
    s3: {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      bucketName: process.env.S3_BUCKET!,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      key: process.env.KMS_KEY!,
    },
  };
}
