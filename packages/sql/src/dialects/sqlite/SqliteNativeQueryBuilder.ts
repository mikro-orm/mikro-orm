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

  protected override addLimitClause() {
    if (this.options.limit == null && this.options.offset != null) {
      // SQLite rejects `offset` without `limit`, a negative limit means no limit
      this.parts.push('limit -1');
      return;
    }

    super.addLimitClause();
  }
}
