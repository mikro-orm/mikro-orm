import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';

class RemappingType extends Type<string | null | undefined> {
  override convertToDatabaseValue(value: string | null | undefined): string | null | undefined {
    if (typeof value !== 'string') {
      return value;
    }

    if (!value.startsWith('js-')) {
      throw new Error(`Unexpected value for RemappingType.convertToDatabaseValue: ${value}.`);
    }

    return value.replace(/^js-/, 'db-');
  }

  override convertToJSValue(value: string | null | undefined): string | null | undefined {
    if (typeof value !== 'string') {
      return value;
    }

    if (!value.startsWith('db-')) {
      throw new Error(`Unexpected value for RemappingType.convertToJSValue: ${value}.`);
    }

    return value.replace(/^db-/, 'js-');
  }

  override compareAsType(): string {
    return 'string';
  }
}

const TagSchema = defineEntity({
  name: 'Tag',
  properties: {
    id: p.type(RemappingType).primary(),
  },
});

class Tag extends TagSchema.class {}
TagSchema.setClass(Tag);

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.type(RemappingType).primary(),
    tags: () => p.manyToMany(Tag),
  },
});

class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

const ItemSchema = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
    tag: () => p.manyToOne(Tag),
    label: p.string().nullable(),
  },
});

class Item extends ItemSchema.class {
  constructor(tag: Tag) {
    super();
    this.tag = tag;
  }
}
ItemSchema.setClass(Item);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Tag, Item],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8020: em.map does not convert database-form custom primary key again', () => {
  const em = orm.em.fork();
  const author = em.map(Author, { id: 'db-1' });
  const authorAgain = em.map(Author, { id: 'db-1' });

  expect(author.id).toBe('js-1');
  expect(authorAgain).toBe(author);
});

test('GH #8020: em.assign does not convert database-form custom primary key again', () => {
  const em = orm.em.fork();
  const tag = em.map(Tag, { id: 'db-1' });
  const author = em.create(Author, { id: 'js-1' });
  em.assign(author, { tags: [{ id: 'db-1' }] }, { convertCustomTypes: true });

  expect(author.tags[0]).toBe(tag);
});

test('GH #8020: entity constructor params reuse the managed relation target', () => {
  const em = orm.em.fork();
  const tag = em.map(Tag, { id: 'db-2' });
  const item = em.create(Item, { id: 2, tag: 'js-2' });

  expect(item.tag).toBe(tag);
});

test('GH #8020: merging a transactional fork back matches entities by their database-form key', async () => {
  const setup = orm.em.fork();
  setup.create(Item, { id: 3, tag: setup.create(Tag, { id: 'js-3' }), label: 'foo' });
  await setup.flush();

  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Tag, 'js-3');

  await em.transactional(async fork => {
    // after clearing, hydrating the item yields a *managed but uninitialized* tag reference in the fork
    fork.clear();
    const item = await fork.findOneOrFail(Item, 3);
    expect(item.tag).not.toBe(loaded);
  });

  // the uninitialized fork reference must not replace the loaded entity in the parent context
  expect(em.map(Tag, { id: 'db-3' })).toBe(loaded);
});
