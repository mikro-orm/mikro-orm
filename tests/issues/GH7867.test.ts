import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

// STI hierarchies where subclasses narrow an inverse collection by overriding it with a same-root
// subclass target. STI discovery wrongly entered the "column rename" branch for these overrides
// and crashed on `[...prop.fieldNames]` / `prop.fieldNames[0]` because inverse collections
// (ONE_TO_MANY / inverse MANY_TO_MANY) have no `fieldNames` in this table.

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

  // inverse collection — no column in this table
  @OneToMany(() => DatabaseVersion, v => v.database)
  readonly versions = new Collection<DatabaseVersion>(this);

  // inverse side of a M:N — also no column in this table
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

  // owning side of the M:N narrowed on the inverse (database) side
  @ManyToMany(() => Database, db => db.tagged, { owner: true })
  readonly tags = new Collection<Database>(this);

}

@Entity({ discriminatorValue: DatabaseType.REFERENCE })
class ReferenceDatabaseVersion extends DatabaseVersion {}

@Entity({ discriminatorValue: DatabaseType.CUSTOM })
class CustomDatabaseVersion extends DatabaseVersion {}

@Entity({ discriminatorValue: DatabaseType.REFERENCE })
class ReferenceDatabase extends Database {

  // narrow the collection targets to the matching same-root version subclass — no column change needed
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

test('STI subclass narrowing an inverse collection (@OneToMany/@ManyToMany) to a same-root subclass does not crash discovery', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
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

  // root declaration keeps the abstract target so populates from the root resolve all children
  expect(meta.get(Database).properties.versions.type).toBe('DatabaseVersion');
  // inverse collections must not be turned into renamed columns
  expect(meta.get(Database).properties.versions.fieldNames).toBeUndefined();
  expect(meta.get(Database).properties.tagged.fieldNames).toBeUndefined();

  await orm.schema.refreshDatabase();
  await orm.close(true);
});
