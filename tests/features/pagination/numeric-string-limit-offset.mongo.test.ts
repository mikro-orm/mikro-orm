import { MikroORM, ValidationError } from '@mikro-orm/mongodb';
import { Author } from '../../entities/index.js';
import { initORMMongo } from '../../bootstrap.js';

// values typically coming untyped from an HTTP query string
const str = (v: unknown) => v as number;

describe('numeric string limit and offset (mongo)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMongo();
    const em = orm.em.fork();

    for (let i = 1; i <= 5; i++) {
      em.create(Author, { name: `a${i}`, email: `a${i}@test.com` });
    }

    await em.flush();
  });

  afterAll(() => orm.close(true));

  test('numeric strings are converted to numbers', async () => {
    const em = orm.em.fork();
    const authors = await em.find(Author, {}, { limit: str('2'), offset: str('1'), orderBy: { name: 'asc' } });
    expect(authors.map(a => a.name)).toEqual(['a2', 'a3']);

    const cursor = await em.findByCursor(Author, { first: str('2'), orderBy: { name: 'asc' } });
    expect(cursor.items.map(a => a.name)).toEqual(['a1', 'a2']);
    expect(cursor.hasNextPage).toBe(true);
  });

  test('invalid values are rejected', async () => {
    const em = orm.em.fork();
    await expect(em.find(Author, {}, { limit: str('abc') })).rejects.toThrow(ValidationError);
    await expect(em.find(Author, {}, { offset: str('-1') })).rejects.toThrow(
      /expected a number or a string with a non-negative integer/,
    );
  });
});
