import { NativeQueryBuilder } from '../../query/NativeQueryBuilder.js';

/** @internal */
export class SqliteNativeQueryBuilder extends NativeQueryBuilder {

  protected override compileTruncate() {
    const sql = `delete from ${this.getTableName()}`;
    this.parts.push(sql);
  }

  protected override addLockClause() {
    return; // not supported
  }

}
