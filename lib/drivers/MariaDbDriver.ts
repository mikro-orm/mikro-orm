import { MariaDbConnection } from '../connections/MariaDbConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { MySqlPlatform } from '../platforms/MySqlPlatform';

export class MariaDbDriver extends AbstractSqlDriver<MariaDbConnection> {

  protected readonly connection = new MariaDbConnection(this.config);
  protected readonly replicas = this.createReplicas(conf => new MariaDbConnection(this.config, conf, 'read'));
  protected readonly platform = new MySqlPlatform();

}
