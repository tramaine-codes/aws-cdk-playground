import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { format } from 'date-fns';
import 'dotenv/config';
import { EitherAsync, List, identity } from 'purify-ts';
import { Environment } from '../../infrastructure/environment/environment.js';

interface Alias {
  readonly alias: string;
  readonly index: string;
}
type AliasesResponse = readonly Alias[];
type IndicesResponse = readonly { readonly index: string }[];

export class PayPeriodsIndex {
  private static readonly ALIAS = 'pay_periods';

  private readonly index: string;

  constructor(private readonly client: Client) {
    this.index = `${PayPeriodsIndex.ALIAS}_${Time.now()}`;
  }

  setup = () => {
    return this.createIndex()
      .chain(this.loadIndex)
      .chain(this.aliases)
      .chain(this.updateAlias)
      .chain(this.indices)
      .chain(this.cleanupIndices);
  };

  private createIndex = () => {
    return EitherAsync(() =>
      this.client.indices.create({
        index: this.index,
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
        },
      })
    );
  };

  private loadIndex = () => {
    return EitherAsync(() =>
      this.client.helpers.bulk({
        datasource: [
          {
            startDate: '2023-01-01',
            endDate: '2023-01-14',
            current: false,
            sequence: 1,
          },
          {
            startDate: '2023-01-15',
            endDate: '2023-01-28',
            current: false,
            sequence: 2,
          },
          {
            startDate: '2023-01-29',
            endDate: '2023-02-11',
            current: false,
            sequence: 3,
          },
          {
            startDate: '2023-02-12',
            endDate: '2023-02-25',
            current: false,
            sequence: 4,
          },
          {
            startDate: '2023-02-26',
            endDate: '2023-03-11',
            current: false,
            sequence: 5,
          },
          {
            startDate: '2023-03-12',
            endDate: '2023-03-25',
            current: false,
            sequence: 6,
          },
          {
            startDate: '2023-03-26',
            endDate: '2023-04-08',
            current: false,
            sequence: 7,
          },
          {
            startDate: '2023-04-09',
            endDate: '2023-04-22',
            current: false,
            sequence: 8,
          },
          {
            startDate: '2023-04-23',
            endDate: '2023-05-06',
            current: false,
            sequence: 9,
          },
          {
            startDate: '2023-05-07',
            endDate: '2023-05-20',
            current: false,
            sequence: 10,
          },
          {
            startDate: '2023-05-21',
            endDate: '2023-06-03',
            current: false,
            sequence: 11,
          },
          {
            startDate: '2023-06-04',
            endDate: '2023-06-17',
            current: false,
            sequence: 12,
          },
          {
            startDate: '2023-06-18',
            endDate: '2023-07-01',
            current: false,
            sequence: 13,
          },
          {
            startDate: '2023-07-02',
            endDate: '2023-07-15',
            current: false,
            sequence: 14,
          },
          {
            startDate: '2023-07-16',
            endDate: '2023-07-29',
            current: true,
            sequence: 15,
          },
          {
            startDate: '2023-07-30',
            endDate: '2023-08-12',
            current: false,
            sequence: 16,
          },
          {
            startDate: '2023-08-13',
            endDate: '2023-08-26',
            current: false,
            sequence: 17,
          },
          {
            startDate: '2023-08-27',
            endDate: '2023-09-09',
            current: false,
            sequence: 18,
          },
          {
            startDate: '2023-09-10',
            endDate: '2023-09-23',
            current: false,
            sequence: 19,
          },
          {
            startDate: '2023-09-24',
            endDate: '2023-10-07',
            current: false,
            sequence: 20,
          },
        ],
        onDocument: () => {
          return { index: { _index: this.index } };
        },
      })
    );
  };

  private aliases = () =>
    EitherAsync(() =>
      this.client.cat.aliases<AliasesResponse>({
        name: PayPeriodsIndex.ALIAS,
        h: 'alias,index',
        format: 'json',
      })
    ).map(({ body }) => body);

  private updateAlias = (aliases: AliasesResponse) => {
    const removes = aliases.map(({ index, alias }) => ({
      remove: {
        index,
        alias,
      },
    }));

    return EitherAsync(() =>
      this.client.indices.updateAliases({
        body: {
          actions: [
            ...removes,
            {
              add: {
                index: this.index,
                alias: PayPeriodsIndex.ALIAS,
              },
            },
          ],
        },
      })
    );
  };

  private indices = () =>
    EitherAsync(() =>
      this.client.cat.indices<IndicesResponse>({
        index: `${PayPeriodsIndex.ALIAS}_2*`,
        h: 'index',
        format: 'json',
      })
    ).map(({ body }) => body.map(({ index }) => index));

  private cleanupIndices = (indices: readonly string[]) => {
    const sortedDesc: readonly string[] = [...indices].sort().reverse();
    const oldIndices = List.tail(sortedDesc).caseOf({
      Just: identity,
      Nothing: () => [],
    });

    return EitherAsync(() =>
      Promise.all(
        oldIndices.map((index) =>
          this.client.indices.delete({
            index,
          })
        )
      )
    );
  };

  static from(environment: Environment) {
    const { awsRegion: region, openSearchDomain: node } = environment;

    return new PayPeriodsIndex(
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

class Time {
  now() {
    return format(Date.now(), 'yyyyMMddHHmmssSS');
  }

  static now() {
    return Time.build().now();
  }

  static build() {
    return new Time();
  }
}

const index = PayPeriodsIndex.from(Environment.load());
// eslint-disable-next-line no-console
console.log(await index.setup());
