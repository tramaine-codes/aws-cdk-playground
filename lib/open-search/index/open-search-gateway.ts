import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import 'dotenv/config';
import { EitherAsync } from 'purify-ts';
import { Environment } from '../../infrastructure/environment/environment.js';

interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

interface SearchResponse<T> {
  took: number;
  timed_out: boolean;
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: number;
    max_score: number;
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
      _version?: number;
      _explanation?: Explanation;
      fields?: unknown;
      highlight?: unknown;
      inner_hits?: unknown;
      matched_queries?: string[];
      sort?: string[];
    }[];
  };
  aggregations?: unknown;
}

interface Source {
  current: boolean;
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
