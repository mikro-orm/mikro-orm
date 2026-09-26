import { defineEntity, EntitySchema, LoadStrategy, MikroORM, p } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ forceUndefined: true })
class DecoratorAuthor {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string | null;
}

@Entity({ forceUndefined: true })
class DecoratorBook {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => DecoratorAuthor, { nullable: true })
  author?: DecoratorAuthor | null;
}

// control entity without the option, keeps the global default (`null`)
@Entity()
class PlainAuthor {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string | null;
}

interface ISchemaAuthor {
  id: number;
  name?: string | null;
}

const SchemaAuthor = new EntitySchema<ISchemaAuthor>({
  name: 'SchemaAuthor',
  forceUndefined: true,
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string', nullable: true },
  },
});

const DefinedAuthor = defineEntity({
  name: 'DefinedAuthor',
  forceUndefined: true,
  properties: {
    id: p.integer().primary(),
    name: p.string().nullable(),
  },
});

// inherits the option from the base entity
const DefinedChild = defineEntity({
  name: 'DefinedChild',
  extends: DefinedAuthor,
  properties: {
    nick: p.string().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [DecoratorAuthor, DecoratorBook, PlainAuthor, SchemaAuthor, DefinedAuthor, DefinedChild],
    dbName: ':memory:',
    initNullableProperties: true,
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('`forceUndefined` entity option hydrates null as undefined for all definition styles', async () => {
  expect(orm.getMetadata(DecoratorAuthor).forceUndefined).toBe(true);
  expect(orm.getMetadata(SchemaAuthor).forceUndefined).toBe(true);
  expect(orm.getMetadata(DefinedAuthor).forceUndefined).toBe(true);
  expect(orm.getMetadata(DefinedChild).forceUndefined).toBe(true);
  expect(orm.getMetadata(PlainAuthor).forceUndefined).toBeUndefined();

  await orm.em.insert(DecoratorAuthor, { id: 1, name: null });
  await orm.em.insert(DecoratorBook, { id: 1, author: null });
  await orm.em.insert(PlainAuthor, { id: 1, name: null });
  await orm.em.insert(SchemaAuthor, { id: 1, name: null });
  await orm.em.insert(DefinedAuthor, { id: 1, name: null });
  await orm.em.insert(DefinedChild, { id: 2, name: null, nick: null });

  for (const strategy of [LoadStrategy.SELECT_IN, LoadStrategy.JOINED]) {
    const em = orm.em.fork();
    const decorator = await em.findOneOrFail(DecoratorAuthor, 1, { strategy });
    expect(decorator.name).toBeUndefined();
    expect('name' in decorator).toBe(true);

    const book = await em.findOneOrFail(DecoratorBook, 1, { strategy, populate: ['author'] });
    expect(book.author).toBeUndefined();

    const schema = await em.findOneOrFail(SchemaAuthor, 1, { strategy });
    expect(schema.name).toBeUndefined();

    const defined = await em.findOneOrFail(DefinedAuthor, 1, { strategy });
    expect(defined.name).toBeUndefined();

    const child = await em.findOneOrFail(DefinedChild, 2, { strategy });
    expect(child.name).toBeUndefined();
    expect(child.nick).toBeUndefined();

    const plain = await em.findOneOrFail(PlainAuthor, 1, { strategy });
    expect(plain.name).toBeNull();

    // no spurious change sets from the null/undefined normalization
    const uow = em.getUnitOfWork();
    uow.computeChangeSets();
    expect(uow.getChangeSets()).toHaveLength(0);
  }
});

test('`forceUndefined` entity option applies to orphaned references', async () => {
  await orm.em.insert(DecoratorAuthor, { id: 10, name: null });
  await orm.em.insert(DecoratorBook, { id: 10, author: 10 });
  await orm.em.execute('pragma foreign_keys = off');
  await orm.em.nativeDelete(DecoratorAuthor, 10);
  await orm.em.execute('pragma foreign_keys = on');

  const em = orm.em.fork();
  const book = await em.findOneOrFail(DecoratorBook, 10, { populate: ['author'], strategy: LoadStrategy.SELECT_IN });
  expect(book.author).toBeUndefined();
});

test('`forceUndefined` entity option applies when merging into a reference and to `initNullableProperties`', async () => {
  await orm.em.insert(DecoratorAuthor, { id: 2, name: null });
  const em = orm.em.fork();
  const ref = em.getReference(DecoratorAuthor, 2);
  const author = await em.findOneOrFail(DecoratorAuthor, 2);
  expect(author).toBe(ref);
  expect(author.name).toBeUndefined();
  expect('name' in author).toBe(true);
  const uow = em.getUnitOfWork();
  uow.computeChangeSets();
  expect(uow.getChangeSets()).toHaveLength(0);

  const created = em.create(DecoratorAuthor, { id: 3 });
  expect(created.name).toBeUndefined();
  expect('name' in created).toBe(true);
  const plain = em.create(PlainAuthor, { id: 3 });
  expect(plain.name).toBeNull();
});
