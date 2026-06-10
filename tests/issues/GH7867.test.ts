import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

enum DatabaseType {
  REFERENCE = 'reference',
  CUSTOM = 'custom',
}

@Entity({ tableName: 'database', discriminatorColumn: 'type', abstract: true })
abstract class Database {
  @PrimaryKey()
  id!: number;

  @Enum(() => DatabaseType)
  type!: DatabaseType;

  @Property()
  name!: string;

  @OneToMany(() => DatabaseVersion, v => v.database)
  readonly versions = new Collection<DatabaseVersion>(this);

  @ManyToMany(() => DatabaseVersion, v => v.tags)
  readonly tagged = new Collection<DatabaseVersion>(this);
}

@Entity({ tableName: 'database_version', discriminatorColumn: 'type', abstract: true })
abstract class DatabaseVersion {
  @PrimaryKey()
  id!: number;

  @Enum(() => DatabaseType)
  type!: DatabaseType;

  @ManyToOne(() => Database)
  database!: Database;

  @ManyToMany(() => Database, db => db.tagged, { owner: true })
  readonly tags = new Collection<Database>(this);
}

@Entity({ discriminatorValue: DatabaseType.REFERENCE })
class ReferenceDatabaseVersion extends DatabaseVersion {}

@Entity({ discriminatorValue: DatabaseType.CUSTOM })
class CustomDatabaseVersion extends DatabaseVersion {}

@Entity({ discriminatorValue: DatabaseType.REFERENCE })
class ReferenceDatabase extends Database {
  @OneToMany(() => ReferenceDatabaseVersion, v => v.database)
  override readonly versions = new Collection<ReferenceDatabaseVersion>(this);

  @ManyToMany(() => ReferenceDatabaseVersion, v => v.tags)
  override readonly tagged = new Collection<ReferenceDatabaseVersion>(this);
}

@Entity({ discriminatorValue: DatabaseType.CUSTOM })
class CustomDatabase extends Database {
  @OneToMany(() => CustomDatabaseVersion, v => v.database)
  override readonly versions = new Collection<CustomDatabaseVersion>(this);

  @ManyToMany(() => CustomDatabaseVersion, v => v.tags)
  override readonly tagged = new Collection<CustomDatabaseVersion>(this);
}

test('GH7867 STI subclass narrowing an inverse collection does not crash discovery', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
    entities: [
      Database,
      ReferenceDatabase,
      CustomDatabase,
      DatabaseVersion,
      ReferenceDatabaseVersion,
      CustomDatabaseVersion,
    ],
  });

  const meta = orm.getMetadata();

  expect(meta.get(Database).properties.versions.type).toBe('DatabaseVersion');
  expect(meta.get(Database).properties.versions.fieldNames).toBeUndefined();
  expect(meta.get(Database).properties.tagged.fieldNames).toBeUndefined();

  await orm.schema.refresh();
  await orm.close(true);
});
