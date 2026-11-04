import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, Enum, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Collection } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';

enum Kind {
  A = 'a',
  B = 'b',
}

@Entity()
class Country {
  @PrimaryKey({ length: 2, collation: 'NOCASE' })
  code!: string;

  @Property()
  name!: string;
}

@Entity()
class KindLookup {
  @Enum({ items: () => Kind, primary: true })
  kind!: Kind;

  @Property()
  label!: string;
}

@Entity()
class Group {
  @PrimaryKey()
  id!: number;
}

@Entity()
class User {
  @PrimaryKey({ length: 26, collation: 'NOCASE' })
  code!: string;

  @ManyToMany(() => Group)
  groups = new Collection<Group>(this);
}

// the first column of a `create table` statement is not preceded by a comma
describe('introspection of the first column [sqlite]', () => {
  test.each([
    { name: 'collated string PK', entities: [Country] },
    { name: 'enum PK', entities: [KindLookup] },
    { name: 'pivot table with a collated FK', entities: [User, Group] },
  ])('$name produces no diff once created', async ({ entities }) => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities,
      dbName: ':memory:',
    });
    await orm.schema.create();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    await orm.close(true);
  });

  test('entity generator reads collation and generated expression of the first column', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
      extensions: [EntityGenerator],
    });
    await orm.schema.execute(`
      create table "book" (
        "code" varchar(26) not null collate NOCASE primary key,
        "name" varchar not null
      );
      create table "tag" (
        "slug" text generated always as (lower("name")) virtual,
        "id" integer not null primary key autoincrement,
        "name" varchar not null
      );
    `);
    const dump = (await orm.entityGenerator.generate({ entityDefinition: 'decorators' })).join('\n');
    expect(dump).toContain("@PrimaryKey({ length: 26, collation: 'NOCASE' })");
    expect(dump).toContain('generated: \'lower("name") virtual\'');
    await orm.close(true);
  });
});
