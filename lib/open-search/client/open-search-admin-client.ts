import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { format } from 'date-fns';
import 'dotenv/config';
import { Environment } from '../../infrastructure/environment/environment.js';

export class OpenSearchAdminClient {
  constructor(private readonly client: Client) {}

  async create() {
    const index = `pay_periods_${format(Date.now(), 'yyyyMMddHHmmssSS')}`;

    return await this.client.indices.create({
      index,
      body: {
        settings: {
          index: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
        },
        mappings: {
          properties: {
            current: {
              type: 'boolean',
            },
            endDate: {
              type: 'date',
              format: 'strict_year_month_day',
            },
            sequence: {
              type: 'integer',
            },
            startDate: {
              type: 'date',
              format: 'strict_year_month_day',
            },
          },
        },
        aliases: {
          pay_periods: {},
        },
      },
    });
  }

  static from(environment: Environment) {
    const { awsRegion: region, openSearchDomain: node } = environment;

    return new OpenSearchAdminClient(
      new Client({
        ...AwsSigv4Signer({
          region,
          service: 'es',
          getCredentials: () => defaultProvider()(),
        }),
        node,
      })
    );
  }
}

await OpenSearchAdminClient.from(Environment.load()).create();
