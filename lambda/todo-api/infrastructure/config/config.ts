export class Config {
  readonly aws = {
    dynamo: {
      tableName: process.env.DYNAMODB_TABLE!,
    },
    s3: {
      bucketName: process.env.S3_BUCKET!,
      key: process.env.KMS_KEY!,
    },
  };
}
