import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client, Types } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { format } from 'date-fns';
import 'dotenv/config';
import { Array as Arr, Effect, Option, Predicate } from 'effect';
import { Environment } from '../../infrastructure/environment/environment.js';

export class PayPeriodsIndex {
  private static readonly ALIAS = 'pay_periods';

  private readonly index: string;

  constructor(private readonly client: Client) {
    this.index = `${PayPeriodsIndex.ALIAS}_${Time.now()}`;
  }

  setup = () =>
    this.createIndex().pipe(
      Effect.andThen(() => this.loadIndex()),
      Effect.andThen(() => this.aliases()),
      Effect.andThen((aliases) => this.updateAlias(aliases)),
      Effect.andThen(() => this.indices()),
      Effect.andThen((indices) => this.cleanupIndices(indices))
    );

  private createIndex = () =>
    Effect.tryPromise(() =>
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

  private loadIndex = () =>
    Effect.tryPromise(() =>
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
        onDocument: () => ({ index: { _index: this.index } }),
      })
    );

  private aliases = () =>
    Effect.tryPromise(() =>
      this.client.cat.aliases({
        name: PayPeriodsIndex.ALIAS,
        format: 'json',
      })
    ).pipe(Effect.andThen(({ body }) => body));

  private updateAlias = (
    aliases: ReadonlyArray<Types.Cat_Aliases.AliasesRecord>
  ) => {
    const removes = aliases.map(({ alias, index }) => ({
      remove: {
        alias,
        index,
      },
    }));

    return Effect.tryPromise(() =>
      this.client.indices.updateAliases({
        body: {
          actions: [
            ...removes,
            {
              add: {
                alias: PayPeriodsIndex.ALIAS,
                index: this.index,
              },
            },
          ],
        },
      })
    );
  };

  private indices = () =>
    Effect.tryPromise(() =>
      this.client.cat.indices({
        index: `${PayPeriodsIndex.ALIAS}_2*`,
        format: 'json',
      })
    ).pipe(
      Effect.andThen(({ body }) => body.map(({ index }) => index)),
      Effect.andThen((indices) => Arr.filter(indices, Predicate.isString))
    );

  private cleanupIndices = (indices: ReadonlyArray<string>) => {
    const sortedDesc: ReadonlyArray<string> = [...indices].sort().reverse();
    const oldIndices = Arr.tail(sortedDesc).pipe(
      Option.match({
        onNone: () => [],
        onSome: (indices) => indices,
      })
    );

    return Effect.all(
      oldIndices.map((index) =>
        Effect.tryPromise(() => this.client.indices.delete({ index }))
      )
    );
  };

  static from = (environment: Environment) => {
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
  };
}

class Time {
  now = () => format(Date.now(), 'yyyyMMddHHmmssSS');

  static now = () => new Time().now();
}

const index = PayPeriodsIndex.from(Environment.load());

// eslint-disable-next-line no-console
console.log(await Effect.runPromise(index.setup()));
