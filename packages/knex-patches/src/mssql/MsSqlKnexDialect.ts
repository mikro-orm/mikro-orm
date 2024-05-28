import { MonkeyPatchable } from '../MonkeyPatchable';
import { MsSqlTableCompiler } from './MsSqlTableCompiler';
import { MsSqlColumnCompiler } from './MsSqlColumnCompiler';
import { MsSqlQueryCompiler } from './MsSqlQueryCompiler';

export class MsSqlKnexDialect extends MonkeyPatchable.MsSqlDialect {

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlTableCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlColumnCompiler as any)(this, ...arguments);
  }

  queryCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlQueryCompiler as any)(this, ...arguments);
  }

}
