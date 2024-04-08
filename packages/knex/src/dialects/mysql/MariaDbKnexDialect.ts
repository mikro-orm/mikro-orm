import { MySqlKnexDialect } from './MySqlKnexDialect';

export class MariaDbKnexDialect extends MySqlKnexDialect {

  get driverName() {
    return 'mariadb';
  }

  _driver() {
    return require('mariadb/callback');
  }

  validateConnection(connection: any) {
    return connection.isValid();
  }

}
