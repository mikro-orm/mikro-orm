---
title: Naming Strategy
---

When mapping your entities to database tables and columns, their names will be defined by naming 
strategy. There are 3 basic naming strategies you can choose from:

- `UnderscoreNamingStrategy` - default of all SQL drivers
- `MongoNamingStrategy` - default of `MongoDriver`
- `EntityCaseNamingStrategy` - uses unchanged entity and property names

You can override this when initializing ORM. You can also provide your own naming strategy, just 
implement `NamingStrategy` interface and provide your implementation when bootstrapping ORM:

```typescript
class YourCustomNamingStrategy implements NamingStrategy {
  ...
}

const orm = await MikroORM.init({
  ...
  namingStrategy: YourCustomNamingStrategy,
  ...
});
```

> You can also extend `AbstractNamingStrategy` which implements one method for you - `getClassName()`
> that is used to map entity file name to class name.

## Naming Strategy in mongo driver

`MongoNamingStrategy` will simply use all field names as they are defined. Collection names will
be translated into lower-cased dashed form:

`MyCoolEntity` will be translated into `my-cool-entity` collection name.

## Naming Strategy in SQL drivers

`MySqlDriver` defaults to `UnderscoreNamingStrategy`, which means your all your database tables and
columns will be lower-cased and words divided by underscored:

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

#### `NamingStrategy.propertyToColumnName(propertyName: string): string`

Return a column name for a property.

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
