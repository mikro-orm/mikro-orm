import { MySqlQueryCompiler } from './MySqlQueryCompiler';
import { MySqlColumnCompiler } from './MySqlColumnCompiler';
import { MonkeyPatchable } from '../MonkeyPatchable';

export class MySqlKnexDialect extends MonkeyPatchable.MySqlDialect {

  queryCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MySqlQueryCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MySqlColumnCompiler as any)(this, ...arguments);
  }

}
