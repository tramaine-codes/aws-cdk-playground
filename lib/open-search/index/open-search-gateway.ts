import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import 'dotenv/config';
import { Effect } from 'effect';
import { Environment } from '../../infrastructure/environment/environment.js';

export class OpenSearchGateway {
  constructor(private readonly client: Client) {}

  search = (params: Record<string, unknown>) =>
    Effect.tryPromise(() =>
      this.client.search({
        index: 'pay_periods',
        body: params,
      })
    ).pipe(
      Effect.andThen(({ body }) => {
        const {
          hits: { hits },
        } = body;

        return hits.map(({ _source }) => _source);
      })
    );

  static from = (environment: Environment) => {
    const { awsRegion: region, openSearchDomain: node } = environment;

    return new OpenSearchGateway(
      new Client({
        ...AwsSigv4Signer({
          region,
          service: 'es',
          getCredentials: () => defaultProvider()(),
        }),
        node,
      })
    );
  };
}

const gateway = OpenSearchGateway.from(Environment.load());

// eslint-disable-next-line no-console
console.log(
  await Effect.runPromise(
    gateway.search({
      size: 100,
      query: {
        query_string: {
          query: 'current: true',
        },
      },
      sort: [
        {
          startDate: {
            order: 'asc',
          },
        },
      ],
    })
  )
);

// eslint-disable-next-line no-console
console.log(
  await Effect.runPromise(
    gateway.search({
      size: 100,
      query: {
        query_string: {
          query: 'sequence: >=10 AND startDate: [* TO 2023-05-21]',
        },
      },
      sort: [
        {
          startDate: {
            order: 'desc',
          },
        },
      ],
    })
  )
);
