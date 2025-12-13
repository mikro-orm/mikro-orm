import { type Dictionary, LockMode, RawQueryFragment, Utils } from '@mikro-orm/core';
import { NativeQueryBuilder } from '../../query/NativeQueryBuilder.js';

/** @internal */
export class MySqlNativeQueryBuilder extends NativeQueryBuilder {

  protected override compileInsert() {
    if (!this.options.data) {
      throw new Error('No data provided');
    }

    this.parts.push('insert');

    if (this.options.onConflict?.ignore) {
      this.parts.push('ignore');
    }

    this.addHintComment();
    this.parts.push(`into ${this.getTableName()}`);

    if (Object.keys(this.options.data).length === 0) {
      this.parts.push('default values');
      return;
    }

    const parts = this.processInsertData();
    this.parts.push(parts.join(', '));
  }

  protected override addLockClause() {
    if (!this.options.lockMode) {
      return;
    }

    const map = {
      [LockMode.PESSIMISTIC_READ]: 'lock in share mode',
      [LockMode.PESSIMISTIC_WRITE]: 'for update',
      [LockMode.PESSIMISTIC_PARTIAL_WRITE]: 'for update skip locked',
      [LockMode.PESSIMISTIC_WRITE_OR_FAIL]: 'for update nowait',
      [LockMode.PESSIMISTIC_PARTIAL_READ]: 'lock in share mode skip locked',
      [LockMode.PESSIMISTIC_READ_OR_FAIL]: 'lock in share mode nowait',
    } as const;

    if (this.options.lockMode !== LockMode.OPTIMISTIC) {
      this.parts.push(map[this.options.lockMode]);
    }
  }

  protected override addOnConflictClause() {
    const clause = this.options.onConflict;

    if (!clause || clause.ignore) {
      return;
    }

    if (clause.merge) {
      this.parts.push('on duplicate key update');

      if (Utils.isObject(clause.merge)) {
        const fields = Object.keys(clause.merge).map(field => {
          this.params.push((clause.merge as Dictionary)[field]);
          return `${this.quote(field)} = ?`;
        });
        this.parts.push(fields.join(', '));
      } else if ((clause.merge as string[]).length === 0) {
        const dataAsArray = Utils.asArray(this.options.data);
        const keys = Object.keys(dataAsArray[0]);
        this.parts.push(keys.map(key => `${this.quote(key)} = values(${this.quote(key)})`).join(', '));
      } else {
        const fields = (clause.merge as string[]).map(key => `${this.quote(key)} = values(${this.quote(key)})`);
        this.parts.push(fields.join(', '));
      }

      if (clause.where) {
        this.parts.push(`where ${clause.where.sql}`);
        this.params.push(...clause.where.params);
      }

      return;
    }

    this.parts.push('on conflict');

    if (clause.fields instanceof RawQueryFragment) {
      this.parts.push(clause.fields.sql);
      this.params.push(...clause.fields.params);
    } else if (clause.fields.length > 0) {
      const fields = clause.fields.map(field => this.quote(field));
      this.parts.push(`(${fields.join(', ')})`);
    }
  }

}
