---
title: Naming Strategy
---

When mapping your entities to database tables and columns, their names will be defined by naming strategy. There are 3 basic naming strategies you can choose from:

- `UnderscoreNamingStrategy` - default of all SQL drivers
- `MongoNamingStrategy` - default of `MongoDriver`
- `EntityCaseNamingStrategy` - uses unchanged entity and property names

You can override this when initializing ORM. You can also provide your own naming strategy, just implement `NamingStrategy` interface and provide your implementation when bootstrapping ORM:

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

> You can also extend `AbstractNamingStrategy` which implements one method for you - `getClassName()` that is used to map entity file name to class name.

## Naming Strategy in mongo driver

`MongoNamingStrategy` will simply use all field names as they are defined. Collection names will be translated into lower-cased dashed form:

`MyCoolEntity` will be translated into `my-cool-entity` collection name.

## Naming Strategy in SQL drivers

`MySqlDriver` defaults to `UnderscoreNamingStrategy`, which means all your database tables and columns will be lower-cased and words divided by underscored:

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

#### `NamingStrategy.getEnumTypeName(columnName: string, tableName: string, schemaName?: string): string`

Get an enum type name. Used with `enumType: 'dictionary'` and `enumType: 'union-type'` entity generator option.

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

Returns alias name for given entity. The alias needs to be unique across the query, which is by default ensured via appended index parameter. It is optional to use it as long as you ensure it will be unique.

---

#### `NamingStrategy.inverseSideName(entityName: string, propertyName: string, kind: ReferenceKind): string`

Returns the name of the inverse side property. Used in the `EntityGenerator` with `bidirectionalRelations` option. The default implementation will vary based on the property kind:

- M:N relations will be named as `${propertyName}Inverse` (the property name is inferred from pivot table name).
- Other relation kinds will use the target entity name, with first character lowercased, and `Collection` appended in case it's a 1:M collection.

> This behavior changed in v6.3, before that, all the properties were named with the `Inverse` suffix as the M:N relations are now.

---

#### `NamingStrategy.manyToManyPropertyName(ownerEntityName: string, targetEntityName: string, pivotTableName: string, ownerTableName: string, schemaName?: string): string`

Returns the property name for a many-to-many relation. Used in the `EntityGenerator` when generating M:N relations from pivot tables. The default implementation strips the owner table name prefix from the pivot table name and converts it to a property name using `columnNameToProperty`.

For example, with a pivot table `author_books` and owner table `author`, the default implementation returns `books`.

---

#### `NamingStrategy.discriminatorColumnName(baseName: string): string`

Returns the discriminator column name for polymorphic relations. The `baseName` is the discriminator property base name (e.g., `likeable`), and the default implementation appends `Type` and converts to column format (e.g., `likeable_type`).

---
