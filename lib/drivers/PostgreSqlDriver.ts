import { PostgreSqlConnection } from '../connections/PostgreSqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { PostgreSqlPlatform } from '../platforms/PostgreSqlPlatform';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  protected readonly connection = new PostgreSqlConnection(this.config);
  protected readonly replicas = this.createReplicas(conf => new PostgreSqlConnection(this.config, conf, 'read'));
  protected readonly platform = new PostgreSqlPlatform();

}
