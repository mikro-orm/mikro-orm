import { MonkeyPatchable } from '../../MonkeyPatchable';
import { MsSqlTableCompiler } from './MsSqlTableCompiler';
import { MsSqlColumnCompiler } from './MsSqlColumnCompiler';

export class MsSqlKnexDialect extends MonkeyPatchable.MsSqlDialect {

  tableCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlTableCompiler as any)(this, ...arguments);
  }

  columnCompiler() {
    // eslint-disable-next-line prefer-rest-params
    return new (MsSqlColumnCompiler as any)(this, ...arguments);
  }

}
