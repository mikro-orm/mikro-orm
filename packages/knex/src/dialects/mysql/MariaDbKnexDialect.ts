import { MonkeyPatchable } from '../../MonkeyPatchable';

export class MariaDbKnexDialect extends MonkeyPatchable.MySqlDialect {

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
