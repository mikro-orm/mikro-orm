import { NativeQueryBuilder } from '../../query/NativeQueryBuilder.js';

/** @internal */
export class PostgreSqlNativeQueryBuilder extends NativeQueryBuilder {

  protected override compileTruncate() {
    super.compileTruncate();
    this.parts.push('restart identity cascade');
  }

}
