---
title: Creating Custom Driver
---

If you want to use database that is not currently supported, you can implement your own driver. To do so, you will need to design 4 classes:

## Platform

Platform is a class that provides information about available features of given driver:

```ts
import { Platform } from '@mikro-orm/core';

export class MyCustomPlatform extends Platform {

  protected abstract schemaHelper: MyCustomSchemaHelper;

  // here you can override default settings
  usesPivotTable(): boolean;
  supportsTransactions(): boolean;
  supportsSavePoints(): boolean;
  getNamingStrategy(): { new (): NamingStrategy; };
  getIdentifierQuoteCharacter(): string;
  getParameterPlaceholder(index?: number): string;
  usesReturningStatement(): boolean;
  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T;
  denormalizePrimaryKey(data: IPrimaryKey): IPrimaryKey;
  getSerializedPrimaryKeyField(field: string): string;

}
```

## SchemaHelper

Part of platform is a `SchemaHelper`, that provides information about how to build schema.

```ts
import { SchemaHelper } from '@mikro-orm/core';

export class MyCustomSchemaHelper extends SchemaHelper {

  // here you can override default settings
  getIdentifierQuoteCharacter(): string;
  getSchemaBeginning(): string;
  getSchemaEnd(): string;
  getSchemaTableEnd(): string;
  getAutoIncrementStatement(meta: EntityMetadata): string;
  getPrimaryKeySubtype(meta: EntityMetadata): string;
  getTypeDefinition(prop: EntityProperty, types?: Record<string, string>, lengths?: Record<string, number>): string;
  getUnsignedSuffix(prop: EntityProperty): string;
  supportsSchemaConstraints(): boolean;
  supportsSchemaMultiAlter(): boolean;
  supportsSequences(): boolean;
  quoteIdentifier(field: string): string;
  dropTable(meta: EntityMetadata): string;
  indexForeignKeys(): boolean;

}
```

## Connection

Next part is connection wrapper, that will be responsible for querying the database:

```ts
import { Connection } from '@mikro-orm/core';

export class MyCustomConnection extends Connection {

  // implement abstract methods
  connect(): Promise<void>;
  isConnected(): Promise<boolean>;
  close(force?: boolean): Promise<void>;
  getDefaultClientUrl(): string;
  execute(query: string, params?: any[], method?: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]>;

}
```

## Driver

Last part is driver, that is responsible for using the connection to persist changes to database. If you are building SQL driver, it might be handy to extend `AbstractSqlDriver`, if not, extend `DatabaseDriver` abstract class.

If you want to have absolute control, you can implement the whole driver yourself via `IDatabaseDriver` interface.

```ts
import { DatabaseDriver } from '@mikro-orm/core';

export class MyCustomDriver extends DatabaseDriver {

  // initialize connection and platform
  protected readonly connection = new MyCustomConnection(this.config);
  protected readonly platform = new MyCustomPlatform;

  // and implement abstract methods
  find<T extends AnyEntity>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]>;
  findOne<T extends AnyEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T | null>;
  nativeInsert<T extends AnyEntityType<T>>(entityName: string, data: EntityData<T>): Promise<QueryResult>;
  nativeUpdate<T extends AnyEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, data: EntityData<T>): Promise<QueryResult>;
  nativeDelete<T extends AnyEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey): Promise<QueryResult>;
  count<T extends AnyEntity>(entityName: string, where: FilterQuery<T>): Promise<number>;

}
```
