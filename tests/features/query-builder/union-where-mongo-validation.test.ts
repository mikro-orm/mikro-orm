import { MikroORM } from '@mikro-orm/mongodb';
import { Author } from '../../entities/index.js';
import { initORMMongo } from '../../bootstrap.js';

describe('unionWhere - MongoDB validation', () => {
  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  afterAll(async () => orm.close(true));

  test('find with unionWhere throws on MongoDB', async () => {
    await expect(orm.em.find(Author, {}, {
      unionWhere: [{ name: 'test' }],
    })).rejects.toThrow(/unionWhere is only supported on SQL drivers/);
  });

  test('findOne with unionWhere throws on MongoDB', async () => {
    await expect(orm.em.findOne(Author, { name: 'test' }, {
      unionWhere: [{ name: 'test' }],
    })).rejects.toThrow(/unionWhere is only supported on SQL drivers/);
  });

  test('count with unionWhere throws on MongoDB', async () => {
    await expect(orm.em.count(Author, {}, {
      unionWhere: [{ name: 'test' }],
    })).rejects.toThrow(/unionWhere is only supported on SQL drivers/);
  });

  test('nativeUpdate with unionWhere throws on MongoDB', async () => {
    await expect(orm.em.nativeUpdate(Author, {}, { name: 'x' }, {
      unionWhere: [{ name: 'test' }],
    })).rejects.toThrow(/unionWhere is only supported on SQL drivers/);
  });

  test('nativeDelete with unionWhere throws on MongoDB', async () => {
    await expect(orm.em.nativeDelete(Author, {}, {
      unionWhere: [{ name: 'test' }],
    })).rejects.toThrow(/unionWhere is only supported on SQL drivers/);
  });
});
