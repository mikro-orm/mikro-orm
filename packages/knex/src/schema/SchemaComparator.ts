import { inspect } from 'node:util';
import {
  ArrayType,
  BooleanType,
  DateTimeType,
  JsonType,
  parseJsonSafe,
  Utils,
  type Dictionary,
  type EntityProperty,
  type Logger,
} from '@mikro-orm/core';
import type { Column, ForeignKey, IndexDef, SchemaDifference, TableDifference } from '../typings.js';
import type { DatabaseSchema } from './DatabaseSchema.js';
import type { DatabaseTable } from './DatabaseTable.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import type { SchemaHelper } from './SchemaHelper.js';

/**
 * Compares two Schemas and return an instance of SchemaDifference.
 */
export class SchemaComparator {

  private readonly helper: SchemaHelper;
  private readonly logger: Logger;

  constructor(private readonly platform: AbstractSqlPlatform) {
    this.helper = this.platform.getSchemaHelper()!;
    this.logger = this.platform.getConfig().getLogger();
  }

  /**
   * Returns a SchemaDifference object containing the differences between the schemas fromSchema and toSchema.
   *
   * The returned differences are returned in such a way that they contain the
   * operations to change the schema stored in fromSchema to the schema that is
   * stored in toSchema.
   */
  compare(fromSchema: DatabaseSchema, toSchema: DatabaseSchema, inverseDiff?: SchemaDifference): SchemaDifference {
    const diff: SchemaDifference = {
      newTables: {},
      removedTables: {},
      changedTables: {},
      orphanedForeignKeys: [],
      newNativeEnums: [],
      removedNativeEnums: [],
      newNamespaces: new Set(),
      removedNamespaces: new Set(),
      fromSchema,
    };
    const foreignKeysToTable: Dictionary<ForeignKey[]> = {};

    for (const namespace of toSchema.getNamespaces()) {
      if (fromSchema.hasNamespace(namespace) || namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      diff.newNamespaces.add(namespace);
    }

    for (const namespace of fromSchema.getNamespaces()) {
      if (toSchema.hasNamespace(namespace) || namespace === this.platform.getDefaultSchemaName()) {
        continue;
      }

      diff.removedNamespaces.add(namespace);
    }

    for (const [key, nativeEnum] of Object.entries(toSchema.getNativeEnums())) {
      if (fromSchema.hasNativeEnum(key)) {
        continue;
      }

      if (nativeEnum.schema === '*' && fromSchema.hasNativeEnum(`${toSchema.name}.${key}`)) {
        continue;
      }

      diff.newNativeEnums.push(nativeEnum);
    }

    for (const [key, nativeEnum] of Object.entries(fromSchema.getNativeEnums())) {
      if (toSchema.hasNativeEnum(key)) {
        continue;
      }

      if (key.startsWith(`${fromSchema.name}.`) && (fromSchema.name !== toSchema.name || toSchema.getNativeEnum(key.substring(fromSchema.name.length + 1))?.schema === '*')) {
        continue;
      }

      diff.removedNativeEnums.push(nativeEnum);
    }

    for (const table of toSchema.getTables()) {
      const tableName = table.getShortestName(false);

      if (!fromSchema.hasTable(tableName)) {
        diff.newTables[tableName] = toSchema.getTable(tableName)!;
      } else {
        const tableDifferences = this.diffTable(fromSchema.getTable(tableName)!, toSchema.getTable(tableName)!, inverseDiff?.changedTables[tableName]);

        if (tableDifferences !== false) {
          diff.changedTables[tableName] = tableDifferences;
        }
      }
    }

    // Check if there are tables removed
    for (let table of fromSchema.getTables()) {
      const tableName = table.getShortestName();
      table = fromSchema.getTable(tableName)!;

      if (!toSchema.hasTable(tableName)) {
        diff.removedTables[tableName] = table;
      }

      // also remember all foreign keys that point to a specific table
      for (const foreignKey of Object.values(table.getForeignKeys())) {
        if (!foreignKeysToTable[foreignKey.referencedTableName]) {
          foreignKeysToTable[foreignKey.referencedTableName] = [];
        }

        foreignKeysToTable[foreignKey.referencedTableName].push(foreignKey);
      }
    }

    for (const table of Object.values(diff.removedTables)) {
      const tableName = (table.schema ? table.schema + '.' : '') + table.name;

      if (!foreignKeysToTable[tableName]) {
        continue;
      }

      diff.orphanedForeignKeys.push(...foreignKeysToTable[tableName]);

      // Deleting duplicated foreign keys present both on the orphanedForeignKey and the removedForeignKeys from changedTables.
      for (const foreignKey of foreignKeysToTable[tableName]) {
        const localTableName = foreignKey.localTableName;

        if (!diff.changedTables[localTableName]) {
          continue;
        }

        for (const [key, fk] of Object.entries(diff.changedTables[localTableName].removedForeignKeys)) {
          // We check if the key is from the removed table, if not we skip.
          if (tableName !== fk.referencedTableName) {
            continue;
          }

          delete diff.changedTables[localTableName].removedForeignKeys[key];
        }
      }
    }

    return diff;
  }

  /**
   * Returns the difference between the tables fromTable and toTable.
   * If there are no differences this method returns the boolean false.
   */
  diffTable(fromTable: DatabaseTable, toTable: DatabaseTable, inverseTableDiff?: TableDifference): TableDifference | false {
    let changes = 0;
    const tableDifferences: TableDifference = {
      name: fromTable.getShortestName(),
      addedColumns: {},
      addedForeignKeys: {},
      addedIndexes: {},
      addedChecks: {},
      changedColumns: {},
      changedForeignKeys: {},
      changedIndexes: {},
      changedChecks: {},
      removedColumns: {},
      removedForeignKeys: {},
      removedIndexes: {},
      removedChecks: {},
      renamedColumns: {},
      renamedIndexes: {},
      fromTable,
      toTable,
    };

    if (this.diffComment(fromTable.comment, toTable.comment)) {
      tableDifferences.changedComment = toTable.comment;
      this.log(`table comment changed for ${tableDifferences.name}`, { fromTableComment: fromTable.comment, toTableComment: toTable.comment });
    }

    const fromTableColumns = fromTable.getColumns();
    const toTableColumns = toTable.getColumns();

    // See if all the columns in "from" table exist in "to" table
    for (const column of toTableColumns) {
      if (fromTable.hasColumn(column.name)) {
        continue;
      }

      tableDifferences.addedColumns[column.name] = column;
      this.log(`column ${tableDifferences.name}.${column.name} of type ${column.type} added`);
      changes++;
    }

    /* See if there are any removed columns in "to" table */
    for (const column of fromTableColumns) {
      // See if column is removed in "to" table.
      if (!toTable.hasColumn(column.name)) {
        tableDifferences.removedColumns[column.name] = column;
        this.log(`column ${tableDifferences.name}.${column.name} removed`);
        changes++;
        continue;
      }

      // See if column has changed properties in "to" table.
      const changedProperties = this.diffColumn(column, toTable.getColumn(column.name)!, fromTable, true);

      if (changedProperties.size === 0) {
        continue;
      }

      if (changedProperties.size === 1 && changedProperties.has('generated')) {
        tableDifferences.addedColumns[column.name] = toTable.getColumn(column.name)!;
        tableDifferences.removedColumns[column.name] = column;
        changes++;
        continue;
      }

      tableDifferences.changedColumns[column.name] = {
        oldColumnName: column.name,
        fromColumn: column,
        column: toTable.getColumn(column.name)!,
        changedProperties,
      };
      this.log(`column ${tableDifferences.name}.${column.name} changed`, { changedProperties });
      changes++;
    }

    this.detectColumnRenamings(tableDifferences, inverseTableDiff);
    const fromTableIndexes = fromTable.getIndexes();
    const toTableIndexes = toTable.getIndexes();

    // See if all the indexes in "from" table exist in "to" table
    for (const index of Object.values(toTableIndexes)) {
      if ((index.primary && fromTableIndexes.find(i => i.primary)) || fromTable.hasIndex(index.keyName)) {
        continue;
      }

      tableDifferences.addedIndexes[index.keyName] = index;
      this.log(`index ${index.keyName} added to table ${tableDifferences.name}`, { index });
      changes++;
    }

    // See if there are any removed indexes in "to" table
    for (const index of fromTableIndexes) {
      // See if index is removed in "to" table.
      if ((index.primary && !toTable.hasPrimaryKey()) || !index.primary && !toTable.hasIndex(index.keyName)) {
        tableDifferences.removedIndexes[index.keyName] = index;
        this.log(`index ${index.keyName} removed from table ${tableDifferences.name}`);
        changes++;
        continue;
      }

      // See if index has changed in "to" table.
      const toTableIndex = index.primary ? toTable.getPrimaryKey()! : toTable.getIndex(index.keyName)!;

      if (!this.diffIndex(index, toTableIndex)) {
        continue;
      }

      tableDifferences.changedIndexes[index.keyName] = toTableIndex!;
      this.log(`index ${index.keyName} changed in table ${tableDifferences.name}`, { fromTableIndex: index, toTableIndex });
      changes++;
    }

    this.detectIndexRenamings(tableDifferences);

    const fromTableChecks = fromTable.getChecks();
    const toTableChecks = toTable.getChecks();

    // See if all the checks in "from" table exist in "to" table
    for (const check of toTableChecks) {
      if (fromTable.hasCheck(check.name)) {
        continue;
      }

      tableDifferences.addedChecks[check.name] = check;
      this.log(`check constraint ${check.name} added to table ${tableDifferences.name}`, { check });
      changes++;
    }

    // See if there are any removed checks in "to" table
    for (const check of fromTableChecks) {
      if (!toTable.hasCheck(check.name)) {
        tableDifferences.removedChecks[check.name] = check;
        this.log(`check constraint ${check.name} removed from table ${tableDifferences.name}`);
        changes++;
        continue;
      }

      // See if check has changed in "to" table
      const toTableCheck = toTable.getCheck(check.name)!;
      const toColumn = toTable.getColumn(check.columnName!);
      const fromColumn = fromTable.getColumn(check.columnName!);

      if (!this.diffExpression(check.expression as string, toTableCheck.expression as string)) {
        continue;
      }

      if (fromColumn?.enumItems && toColumn?.enumItems && !this.diffEnumItems(fromColumn.enumItems, toColumn.enumItems)) {
        continue;
      }

      this.log(`check constraint ${check.name} changed in table ${tableDifferences.name}`, { fromTableCheck: check, toTableCheck });
      tableDifferences.changedChecks[check.name] = toTableCheck;
      changes++;
    }

    const fromForeignKeys = { ...fromTable.getForeignKeys() };
    const toForeignKeys = { ...toTable.getForeignKeys() };

    for (const fromConstraint of Object.values(fromForeignKeys)) {
      for (const toConstraint of Object.values(toForeignKeys)) {
        if (!this.diffForeignKey(fromConstraint, toConstraint, tableDifferences)) {
          delete fromForeignKeys[fromConstraint.constraintName];
          delete toForeignKeys[toConstraint.constraintName];
        } else if (fromConstraint.constraintName.toLowerCase() === toConstraint.constraintName.toLowerCase()) {
          this.log(`FK constraint ${fromConstraint.constraintName} changed in table ${tableDifferences.name}`, { fromConstraint, toConstraint });
          tableDifferences.changedForeignKeys[toConstraint.constraintName] = toConstraint;
          changes++;
          delete fromForeignKeys[fromConstraint.constraintName];
          delete toForeignKeys[toConstraint.constraintName];
        }
      }
    }

    for (const fromConstraint of Object.values(fromForeignKeys)) {
      tableDifferences.removedForeignKeys[fromConstraint.constraintName] = fromConstraint;
      this.log(`FK constraint ${fromConstraint.constraintName} removed from table ${tableDifferences.name}`);
      changes++;
    }

    for (const toConstraint of Object.values(toForeignKeys)) {
      tableDifferences.addedForeignKeys[toConstraint.constraintName] = toConstraint;
      this.log(`FK constraint ${toConstraint.constraintName} added from table ${tableDifferences.name}`, { constraint: toConstraint });
      changes++;
    }

    return changes ? tableDifferences : false;
  }

  /**
   * Try to find columns that only changed their name, rename operations maybe cheaper than add/drop
   * however ambiguities between different possibilities should not lead to renaming at all.
   */
  private detectColumnRenamings(tableDifferences: TableDifference, inverseTableDiff?: TableDifference): void {
    const renameCandidates: Dictionary<[Column, Column][]> = {};
    const oldFKs = Object.values(tableDifferences.fromTable.getForeignKeys());
    const newFKs = Object.values(tableDifferences.toTable.getForeignKeys());

    for (const addedColumn of Object.values(tableDifferences.addedColumns)) {
      for (const removedColumn of Object.values(tableDifferences.removedColumns)) {
        const diff = this.diffColumn(addedColumn, removedColumn, tableDifferences.fromTable);

        if (diff.size !== 0) {
          continue;
        }

        const wasFK = oldFKs.some(fk => fk.columnNames.includes(removedColumn.name));
        const isFK = newFKs.some(fk => fk.columnNames.includes(addedColumn.name));

        if (wasFK !== isFK) {
          continue;
        }

        const renamedColumn = inverseTableDiff?.renamedColumns[addedColumn.name];

        if (renamedColumn && renamedColumn?.name !== removedColumn.name) {
          continue;
        }

        renameCandidates[addedColumn.name] = renameCandidates[addedColumn.name] ?? [];
        renameCandidates[addedColumn.name].push([removedColumn, addedColumn]);
      }
    }

    for (const candidateColumns of Object.values(renameCandidates)) {
      if (candidateColumns.length !== 1) {
        continue;
      }

      const [removedColumn, addedColumn] = candidateColumns[0];
      const removedColumnName = removedColumn.name;
      const addedColumnName = addedColumn.name;

      /* v8 ignore next 3 */
      if (tableDifferences.renamedColumns[removedColumnName]) {
        continue;
      }

      tableDifferences.renamedColumns[removedColumnName] = addedColumn;
      delete tableDifferences.addedColumns[addedColumnName];
      delete tableDifferences.removedColumns[removedColumnName];
      this.log(`renamed column detected in table ${tableDifferences.name}`, { old: removedColumnName, new: addedColumnName });
    }
  }

  /**
   * Try to find indexes that only changed their name, rename operations maybe cheaper than add/drop
   * however ambiguities between different possibilities should not lead to renaming at all.
   */
  private detectIndexRenamings(tableDifferences: TableDifference): void {
    const renameCandidates: Dictionary<[IndexDef, IndexDef][]> = {};

    // Gather possible rename candidates by comparing each added and removed index based on semantics.
    for (const addedIndex of Object.values(tableDifferences.addedIndexes)) {
      for (const removedIndex of Object.values(tableDifferences.removedIndexes)) {
        if (this.diffIndex(addedIndex, removedIndex)) {
          continue;
        }

        renameCandidates[addedIndex.keyName] = renameCandidates[addedIndex.keyName] ?? [];
        renameCandidates[addedIndex.keyName].push([removedIndex, addedIndex]);
      }
    }

    for (const candidateIndexes of Object.values(renameCandidates)) {
      // If the current rename candidate contains exactly one semantically equal index, we can safely rename it.
      // Otherwise it is unclear if a rename action is really intended, therefore we let those ambiguous indexes be added/dropped.
      if (candidateIndexes.length !== 1) {
        continue;
      }

      const [removedIndex, addedIndex] = candidateIndexes[0];
      const removedIndexName = removedIndex.keyName;
      const addedIndexName = addedIndex.keyName;

      if (tableDifferences.renamedIndexes[removedIndexName]) {
        continue;
      }

      tableDifferences.renamedIndexes[removedIndexName] = addedIndex;
      delete tableDifferences.addedIndexes[addedIndexName];
      delete tableDifferences.removedIndexes[removedIndexName];
      this.log(`renamed index detected in table ${tableDifferences.name}`, { old: removedIndexName, new: addedIndexName });
    }
  }

  diffForeignKey(key1: ForeignKey, key2: ForeignKey, tableDifferences: TableDifference): boolean {
    if (key1.columnNames.join('~').toLowerCase() !== key2.columnNames.join('~').toLowerCase()) {
      return true;
    }

    if (key1.referencedColumnNames.join('~').toLowerCase() !== key2.referencedColumnNames.join('~').toLowerCase()) {
      return true;
    }

    if (key1.constraintName !== key2.constraintName) {
      return true;
    }

    if (key1.referencedTableName !== key2.referencedTableName) {
      return true;
    }

    if (key1.deferMode !== key2.deferMode) {
      return true;
    }

    if (key1.localTableName === key1.referencedTableName && !this.platform.supportsMultipleCascadePaths()) {
      return false;
    }

    if (key1.columnNames.some(col => tableDifferences.changedColumns[col]?.changedProperties.has('type'))) {
      return true;
    }

    const defaultRule = ['restrict', 'no action'];
    const rule = (key: ForeignKey, method: 'updateRule' | 'deleteRule') => {
      return (key[method] ?? defaultRule[0])
        .toLowerCase()
        .replace(defaultRule[1], defaultRule[0])
        .replace(/"/g, '');
    };
    const compare = (method: 'updateRule' | 'deleteRule') => rule(key1, method) === rule(key2, method);

    return !compare('updateRule') || !compare('deleteRule');
  }

  /**
   * Returns the difference between the columns
   */
  diffColumn(fromColumn: Column, toColumn: Column, fromTable: DatabaseTable, logging?: boolean): Set<string> {
    const changedProperties = new Set<string>();
    const fromProp = this.mapColumnToProperty({ ...fromColumn, autoincrement: false });
    const toProp = this.mapColumnToProperty({ ...toColumn, autoincrement: false });
    const fromColumnType = this.platform.normalizeColumnType(fromColumn.mappedType.getColumnType(fromProp, this.platform).toLowerCase(), fromProp);
    const fromNativeEnum = fromTable.nativeEnums[fromColumnType] ?? Object.values(fromTable.nativeEnums).find(e => e.name === fromColumnType && e.schema !== '*');
    let toColumnType = this.platform.normalizeColumnType(toColumn.mappedType.getColumnType(toProp, this.platform).toLowerCase(), toProp);

    const log = (msg: string, params: Dictionary) => {
      if (logging) {
        const copy = Utils.copy(params);
        Utils.dropUndefinedProperties(copy);
        this.log(msg, copy);
      }
    };

    if (
      fromColumnType !== toColumnType &&
      (!fromNativeEnum || `${fromNativeEnum.schema}.${fromNativeEnum.name}` !== toColumnType) &&
      !(fromColumn.ignoreSchemaChanges?.includes('type') || toColumn.ignoreSchemaChanges?.includes('type')) &&
      !fromColumn.generated && !toColumn.generated
    ) {
      if (!toColumnType.includes('.') && fromTable.schema && fromTable.schema !== this.platform.getDefaultSchemaName()) {
        toColumnType = `${fromTable.schema}.${toColumnType}`;
      }

      if (fromColumnType !== toColumnType) {
        log(`'type' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumnType, toColumnType });
        changedProperties.add('type');
      }
    }

    if (fromColumn.nullable !== toColumn.nullable && !fromColumn.generated && !toColumn.generated) {
      log(`'nullable' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('nullable');
    }

    if (this.diffExpression(fromColumn.generated as string, toColumn.generated as string)) {
      log(`'generated' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('generated');
    }

    if (!!fromColumn.autoincrement !== !!toColumn.autoincrement) {
      log(`'autoincrement' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('autoincrement');
    }

    if (fromColumn.unsigned !== toColumn.unsigned && this.platform.supportsUnsigned()) {
      log(`'unsigned' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('unsigned');
    }

    if (
      !(
        fromColumn.ignoreSchemaChanges?.includes('default') ||
        toColumn.ignoreSchemaChanges?.includes('default')
      ) && !this.hasSameDefaultValue(fromColumn, toColumn)) {
      log(`'default' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('default');
    }

    if (this.diffComment(fromColumn.comment, toColumn.comment)) {
      log(`'comment' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('comment');
    }

    if (
      !(fromColumn.mappedType instanceof ArrayType) &&
      !(toColumn.mappedType instanceof ArrayType) &&
      this.diffEnumItems(fromColumn.enumItems, toColumn.enumItems)
    ) {
      log(`'enumItems' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('enumItems');
    }

    if (
      (fromColumn.extra || '').toLowerCase() !== (toColumn.extra || '').toLowerCase() &&
      !(
        fromColumn.ignoreSchemaChanges?.includes('extra') ||
        toColumn.ignoreSchemaChanges?.includes('extra')
      )
    ) {
      log(`'extra' changed for column ${fromTable.name}.${fromColumn.name}`, { fromColumn, toColumn });
      changedProperties.add('extra');
    }

    return changedProperties;
  }

  diffEnumItems(items1: string[] = [], items2: string[] = []): boolean {
    return items1.length !== items2.length || items1.some((v, i) => v !== items2[i]);
  }

  diffComment(comment1?: string, comment2?: string): boolean {
    // A null value and an empty string are actually equal for a comment so they should not trigger a change.
    // eslint-disable-next-line eqeqeq
    return comment1 != comment2 && !(comment1 == null && comment2 === '') && !(comment2 == null && comment1 === '');
  }

  /**
   * Finds the difference between the indexes index1 and index2.
   * Compares index1 with index2 and returns index2 if there are any differences or false in case there are no differences.
   */
  diffIndex(index1: IndexDef, index2: IndexDef): boolean {
    // if one of them is a custom expression or full text index, compare only by name
    if (index1.expression || index2.expression || index1.type === 'fulltext' || index2.type === 'fulltext') {
      return index1.keyName !== index2.keyName;
    }

    return !this.isIndexFulfilledBy(index1, index2) || !this.isIndexFulfilledBy(index2, index1);
  }

  /**
   * Checks if the other index already fulfills all the indexing and constraint needs of the current one.
   */
  isIndexFulfilledBy(index1: IndexDef, index2: IndexDef): boolean {
    // allow the other index to be equally large only. It being larger is an option but it creates a problem with scenarios of the kind PRIMARY KEY(foo,bar) UNIQUE(foo)
    if (index1.columnNames.length !== index2.columnNames.length) {
      return false;
    }

    function spansColumns(): boolean {
      for (let i = 0; i < index1.columnNames.length; i++) {
        if (index1.columnNames[i] === index2.columnNames[i]) {
          continue;
        }

        return false;
      }

      return true;
    }

    // Check if columns are the same, and even in the same order
    if (!spansColumns()) {
      return false;
    }

    if (!index1.unique && !index1.primary) {
      // this is a special case: If the current key is neither primary or unique, any unique or
      // primary key will always have the same effect for the index and there cannot be any constraint
      // overlaps. This means a primary or unique index can always fulfill the requirements of just an
      // index that has no constraints.
      return true;
    }

    if (this.platform.supportsDeferredUniqueConstraints() && index1.deferMode !== index2.deferMode) {
      return false;
    }

    return index1.primary === index2.primary && index1.unique === index2.unique;
  }

  diffExpression(expr1: string, expr2: string): boolean {
    // expressions like check constraints might be normalized by the driver,
    // e.g. quotes might be added (https://github.com/mikro-orm/mikro-orm/issues/3827)
    const simplify = (str?: string) => {
      return str
        ?.replace(/_\w+'(.*?)'/g, '$1')
        .replace(/in\s*\((.*?)\)/ig, '= any (array[$1])')
        .replace(/['"`()]|::\w+| +/g, '')
        .replace(/anyarray\[(.*)]/ig, '$1')
        .toLowerCase();
    };
    return simplify(expr1) !== simplify(expr2);
  }

  parseJsonDefault(defaultValue?: string | null): Dictionary | string | null {
    /* v8 ignore next 3 */
    if (!defaultValue) {
      return null;
    }

    const val = defaultValue
      .replace(/^(_\w+\\)?'(.*?)\\?'$/, '$2')
      .replace(/^\(?'(.*?)'\)?$/, '$1');

    return parseJsonSafe(val);
  }

  hasSameDefaultValue(from: Column, to: Column): boolean {
    if (from.default == null || from.default.toString().toLowerCase() === 'null' || from.default.toString().startsWith('nextval(')) {
      return to.default == null || to.default!.toLowerCase() === 'null';
    }

    if (to.mappedType instanceof BooleanType) {
      const defaultValueFrom = !['0', 'false', 'f', 'n', 'no', 'off'].includes('' + from.default!);
      const defaultValueTo = !['0', 'false', 'f', 'n', 'no', 'off'].includes('' + to.default!);

      return defaultValueFrom === defaultValueTo;
    }

    if (to.mappedType instanceof JsonType) {
      const defaultValueFrom = this.parseJsonDefault(from.default);
      const defaultValueTo = this.parseJsonDefault(to.default);

      return Utils.equals(defaultValueFrom, defaultValueTo);
    }

    if (to.mappedType instanceof DateTimeType && from.default && to.default) {
      // normalize now/current_timestamp defaults, also remove `()` from the end of default expression
      const defaultValueFrom = from.default.toLowerCase().replace('current_timestamp', 'now').replace(/\(\)$/, '');
      const defaultValueTo = to.default.toLowerCase().replace('current_timestamp', 'now').replace(/\(\)$/, '');

      return defaultValueFrom === defaultValueTo;
    }

    if (from.default && to.default) {
      return from.default.toString().toLowerCase() === to.default.toString().toLowerCase();
    }

    if (['', this.helper.getDefaultEmptyString()].includes(to.default!) && from.default != null) {
      return ['', this.helper.getDefaultEmptyString()].includes(from.default.toString());
    }

    // eslint-disable-next-line eqeqeq
    return from.default == to.default; // == intentionally
  }

  private mapColumnToProperty(column: Column): EntityProperty {
    const length = column.type.match(/\w+\((\d+)\)/);
    const match = column.type.match(/\w+\((\d+), ?(\d+)\)/);

    return {
      fieldNames: [column.name],
      columnTypes: [column.type],
      items: column.enumItems,
      ...column as Dictionary,
      length: length ? +length[1] : column.length,
      precision: match ? +match[1] : column.precision,
      scale: match ? +match[2] : column.scale,
    } as EntityProperty;
  }

  private log(message: string, params?: Dictionary): void {
    if (params) {
      message += ' ' + inspect(params);
    }

    this.logger.log('schema', message);
  }

}
