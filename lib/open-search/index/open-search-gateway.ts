import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import 'dotenv/config';
import { EitherAsync } from 'purify-ts';
import { Environment } from '../../infrastructure/environment/environment.js';

interface ShardsResponse {
  readonly total: number;
  readonly successful: number;
  readonly failed: number;
  readonly skipped: number;
}

interface Explanation {
  readonly value: number;
  readonly description: string;
  readonly details: Explanation[];
}

interface SearchResponse<T> {
  readonly took: number;
  readonly timed_out: boolean;
  readonly _scroll_id?: string;
  readonly _shards: ShardsResponse;
  readonly hits: {
    readonly total: number;
    readonly max_score: number;
    readonly hits: {
      readonly _index: string;
      readonly _type: string;
      readonly _id: string;
      readonly _score: number;
      readonly _source: T;
      readonly _version?: number;
      readonly _explanation?: Explanation;
      readonly fields?: unknown;
      readonly highlight?: unknown;
      readonly inner_hits?: unknown;
      readonly matched_queries?: string[];
      readonly sort?: string[];
    }[];
  };
  readonly aggregations?: unknown;
}

interface Source {
  readonly current: boolean;
}

export class OpenSearchGateway {
  constructor(private readonly client: Client) {}

  search = (params: Record<string, unknown>) =>
    EitherAsync(() =>
      this.client.search<SearchResponse<Source>>({
        index: 'pay_periods',
        body: params,
      })
    ).map(({ body }) => {
      const {
        hits: { hits },
      } = body;

      return hits.map(({ _source }) => _source);
    });

  static from(environment: Environment) {
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
  }
}

const gateway = OpenSearchGateway.from(Environment.load());
// eslint-disable-next-line no-console
console.log(
  await gateway.search({
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
);
// eslint-disable-next-line no-console
console.log(
  await gateway.search({
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
);
