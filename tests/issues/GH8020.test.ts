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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Tag],
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
