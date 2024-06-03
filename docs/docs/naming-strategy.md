---
title: Naming Strategy
---

When mapping our entities to database tables and columns, their names will be defined by naming strategy. There are 3 basic naming strategies we can choose from:

- `UnderscoreNamingStrategy` - default of all SQL drivers
- `MongoNamingStrategy` - default of `MongoDriver`
- `EntityCaseNamingStrategy` - uses unchanged entity and property names

You can override this when initializing ORM. You can also provide our own naming strategy, just implement `NamingStrategy` interface and provide our implementation when bootstrapping ORM:

```ts
class MyCustomNamingStrategy implements NamingStrategy {
  ...
}

const orm = await MikroORM.init({
  ...
  namingStrategy: MyCustomNamingStrategy,
  ...
});
```

> You can also extend `AbstractNamingStrategy` which implements one method for we - `getClassName()` that is used to map entity file name to class name.

## Naming Strategy in mongo driver

`MongoNamingStrategy` will simply use all field names as they are defined. Collection names will be translated into lower-cased dashed form:

`MyCoolEntity` will be translated into `my-cool-entity` collection name.

## Naming Strategy in SQL drivers

`MySqlDriver` defaults to `UnderscoreNamingStrategy`, which means our all our database tables and columns will be lower-cased and words divided by underscored:

```sql
CREATE TABLE `author` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `terms_accepted` tinyint(1) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `born` datetime DEFAULT NULL,
  `favourite_book_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## NamingStrategy API

#### `NamingStrategy.getClassName(file: string, separator?: string): string`

Return a name of the class based on its file name.

---

#### `NamingStrategy.classToTableName(entityName: string): string`

Return a table name for an entity class.

---

#### `NamingStrategy.getEntityName(tableName: string, schemaName?: string): string`

Return a name of the entity class based on database table name (used in `EntityGenerator`). 

Default implementation ignores the schema name, but when duplicates are detected, the name will be prefixed automatically.

---

#### `NamingStrategy.propertyToColumnName(propertyName: string): string`

Return a column name for a property (used in `EntityGenerator`).

---

#### `NamingStrategy.getEnumClassName(columnName: string, tableName: string, schemaName?: string): string`

Return an enum class name for a column (used in `EntityGenerator`).

---

#### `NamingStrategy.enumValueToEnumProperty(enumValue: string, columnName: string, tableName: string, schemaName?: string): string`

Return an enum property name for an enum value (used in `EntityGenerator`).

---

#### `NamingStrategy.referenceColumnName(): string`

Return the default reference column name.

---

#### `NamingStrategy.joinColumnName(propertyName: string): string`

Return a join column name for a property.

---

#### `NamingStrategy.joinTableName(sourceEntity: string, targetEntity: string, propertyName: string): string`

Return a join table name. This is used as default value for `pivotTable`.

---

#### `NamingStrategy.joinKeyColumnName(entityName: string, referencedColumnName?: string): string`

Return the foreign key column name for the given parameters.

---

#### `NamingStrategy.indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence'): string`

Returns key/constraint name for given type. Some drivers might not support all the types (e.g. mysql and sqlite enforce the PK name).

---

#### `NamingStrategy.aliasName(entityName: string, index: number): string`

Returns alias name for given entity. The alias needs to be unique across the query, which is by default ensured via appended index parameter. It is optional to use it as long as we ensure it will be unique.

---
