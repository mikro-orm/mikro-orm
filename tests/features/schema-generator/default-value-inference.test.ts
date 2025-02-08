import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class Author1 {

  @PrimaryKey()
  id!: number;

  @Property()
  age: number = 0;

  @Property({ type: 'int', nullable: true })
  nullable: number | null = null;

  @Property()
  createdAt: Date = new Date();

  @Property()
  data: Buffer = Buffer.from([]);

}

@Entity()
class Author2 {

  @PrimaryKey()
  id!: number;

  @Property()
  age = 0;

  @Property({ type: 'int' })
  nullable: number | null = null;

  @Property()
  createdAt = new Date();

  @Property()
  data = Buffer.from([]);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author1, Author2],
    dbName: `mikro_orm_default_type_inference`,
  });
});

afterAll(() => orm.close(true));

test('infer property type from its default value when type is not set', async () => {
  const meta = orm.getMetadata().get(Author2.name);
  await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toBe(
    `create table "author1" ("id" serial primary key, "age" int not null default 0, "nullable" int null, "created_at" timestamptz not null, "data" bytea not null);\n\n` +
    `create table "author2" ("id" serial primary key, "age" int not null default 0, "nullable" int null, "created_at" timestamptz not null, "data" bytea not null);\n`,
  );
  expect(meta.properties.age.type).toBe('number');
  expect(meta.properties.createdAt.type).toBe('Date');
  expect(meta.properties.data.type).toBe('BlobType');
  expect(meta.properties.data.runtimeType).toBe('Buffer');
});
