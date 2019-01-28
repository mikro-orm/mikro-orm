# Naming strategy

When mapping your entities to database tables and columns, their names will be defined by naming 
strategy. There are 2 basic naming strategies you can choose from:

- `UnderscoreNamingStrategy` - default of `MySqlDriver` and `SqliteDriver`
- `MongoNamingStrategy` - default of `MongoDriver`

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

## Naming strategy in mongo driver

`MongoNamingStrategy` will simply use all field names as they are defined. Collection names will
be translated into lower-cased dashed form:

`MyCoolEntity` will be translated into `my-cool-entity` collection name.

## Naming strategy in SQL drivers

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

[&larr; Back to table of contents](https://b4nan.github.io/mikro-orm/#table-of-contents)
