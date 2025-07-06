import 'dotenv/config';
import { Effect } from 'effect';
import got, { type Got } from 'got';
import { Environment } from '../../infrastructure/environment/environment.js';

export class SecuritySettings {
  private readonly awsIamUser: string;
  private readonly request: Got;

  constructor({
    awsIamUser,
    openSearchDomain: domain,
    openSearchMasterUsername: username,
    openSearchMasterPassword: password,
  }: Environment) {
    this.awsIamUser = awsIamUser;
    this.request = got.extend({
      prefixUrl: domain,
      method: 'PUT',
      username,
      password,
    });
  }

  setup = () =>
    this.updateReadAllCusterMonitorRole().pipe(
      Effect.andThen(this.addReadAllIndexMappingsRole),
      Effect.andThen(this.addIndicesFullAccessRole)
    );

  private updateReadAllCusterMonitorRole = () =>
    Effect.tryPromise(() =>
      this.request('_plugins/_security/api/rolesmapping/readall_and_monitor', {
        json: {
          users: [this.awsIamUser],
        },
      }).json()
    );

  private addReadAllIndexMappingsRole = () =>
    Effect.tryPromise(() =>
      this.request('_plugins/_security/api/roles/index_mappings_readall', {
        json: {
          index_permissions: [
            {
              index_patterns: ['*'],
              allowed_actions: ['indices:admin/mappings/get'],
            },
          ],
        },
      }).json()
    ).pipe(
      Effect.andThen(() =>
        Effect.tryPromise(() =>
          this.request(
            '_plugins/_security/api/rolesmapping/index_mappings_readall',
            {
              json: {
                users: [this.awsIamUser],
              },
            }
          ).json()
        )
      )
    );

  private addIndicesFullAccessRole = () =>
    Effect.tryPromise(() =>
      this.request('_plugins/_security/api/roles/indices_full_access', {
        json: {
          cluster_permissions: ['indices:data/write/bulk'],
          index_permissions: [
            {
              index_patterns: ['*'],
              allowed_actions: ['indices_all', 'indices:data/write/bulk'],
            },
          ],
        },
      }).json()
    ).pipe(
      Effect.andThen(() =>
        Effect.tryPromise(() =>
          this.request(
            '_plugins/_security/api/rolesmapping/indices_full_access',
            {
              json: {
                users: [this.awsIamUser],
              },
            }
          ).json()
        )
      )
    );
}

const settings = new SecuritySettings(Environment.load());
// eslint-disable-next-line no-console
console.log(await settings.setup());
