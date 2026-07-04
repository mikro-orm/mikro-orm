import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const AuthorSchema = defineEntity({
  name: 'AuthorEmptyWhere',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
  },
});
class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

describe('findOne empty where validation (SQLite)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Author],
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clear());

  test('findOne rejects empty object, null, and undefined where clauses', async () => {
    const message = `You cannot call 'EntityManager.findOne()' with empty 'where' parameter`;

    await expect(orm.em.findOne(Author, {})).rejects.toThrow(message);
    await expect(orm.em.findOne(Author, undefined!)).rejects.toThrow(message);
    await expect(orm.em.findOne(Author, null!)).rejects.toThrow(message);
  });

  test('findOneOrFail rejects empty where clauses', async () => {
    const message = `You cannot call 'EntityManager.findOne()' with empty 'where' parameter`;

    await expect(orm.em.findOneOrFail(Author, {})).rejects.toThrow(message);
  });

  test('findOne still works with primary key shorthand and non-empty filters', async () => {
    const author = orm.em.create(Author, { name: 'Jon Snow', email: 'snow@wall.st' });
    await orm.em.flush();
    orm.em.clear();

    const byPk = await orm.em.findOne(Author, author.id);
    expect(byPk?.name).toBe('Jon Snow');

    const byFilter = await orm.em.findOne(Author, { email: 'snow@wall.st' });
    expect(byFilter?.id).toBe(author.id);
  });
});
