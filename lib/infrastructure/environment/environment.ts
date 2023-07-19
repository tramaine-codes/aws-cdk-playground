import env from 'env-var';

export class Environment {
  readonly awsAccount?: string;
  readonly awsRegion: string;
  readonly openSearchDomain: string;
  readonly openSearchMasterUsername: string;
  readonly openSearchMasterUserPassword: string;

  constructor() {
    this.awsAccount = env.get('CDK_DEFAULT_ACCOUNT').asString();
    this.awsRegion = env
      .get('CDK_DEFAULT_REGION')
      .required()
      .default('us-east-1')
      .asString();
    this.openSearchDomain = env.get('OPEN_SEARCH_DOMAIN').required().asString();
    this.openSearchMasterUsername = env
      .get('OPEN_SEARCH_MASTER_USERNAME')
      .required()
      .asString();
    this.openSearchMasterUserPassword = env
      .get('OPEN_SEARCH_MASTER_USER_PASSWORD')
      .required()
      .asString();
  }

  static load() {
    return new Environment();
  }
}
