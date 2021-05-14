import SpyInstance = jest.SpyInstance;

(global as any).process.env.FORCE_COLOR = 0;
const { Author3, Book3 } = require('../../entities-js');

import { Configuration, EntityManager, MikroORM } from '@mikro-orm/core';
import { SeedManager, Seeder } from '@mikro-orm/seeder';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
// noinspection ES6PreferShortImport
import { initORMSqlite } from '../../bootstrap';
import { Book3Seeder } from '../../database/seeder/book3.seeder';
import { remove } from 'fs-extra';

const configuration = new Configuration({ type: 'mongo', dbName: 'test', entities: ['entities'], clientUrl: 'test' });
const close = jest.fn();
jest.spyOn(MikroORM.prototype, 'close').mockImplementation(close);
const createSchema = jest.spyOn(SchemaGenerator.prototype, 'createSchema');
createSchema.mockImplementation(async () => void 0);
const dropSchema = jest.spyOn(SchemaGenerator.prototype, 'dropSchema');
dropSchema.mockImplementation(async () => void 0);

class Author3Seeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return Promise.resolve(undefined);
  }

}

describe('MikroOrmSeeder', () => {

  let orm: MikroORM<SqliteDriver>;
  let getORMMock: SpyInstance;

  beforeAll(async () => {
    orm = await initORMSqlite();
    getORMMock = jest.spyOn(MikroORM, 'init');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('refreshDatabase', async () => {
    const seeder = orm.getSeeder();
    await seeder.refreshDatabase();
    expect(dropSchema).toHaveBeenCalledTimes(1);
    expect(createSchema).toHaveBeenCalledTimes(1);
  });

  test('seed', async () => {
    const seeder = orm.getSeeder();
    const bookRunMock = jest.spyOn(Book3Seeder.prototype, 'run');
    bookRunMock.mockImplementation(async () => void 0);
    const authorRunMock = jest.spyOn(Author3Seeder.prototype, 'run');
    authorRunMock.mockImplementation(async () => void 0);

    await seeder.seed(Book3Seeder);
    expect(bookRunMock).toHaveBeenCalledTimes(1);
    await seeder.seed(Book3Seeder, Author3Seeder);
    expect(bookRunMock).toHaveBeenCalledTimes(2);
    expect(authorRunMock).toHaveBeenCalledTimes(1);
  });

  test('seedString', async () => {
    orm.config.set('seeder', { path: 'database/seeder', defaultSeeder: 'DatabaseSeeder' });
    const seeder = orm.getSeeder();
    const seedMock = jest.spyOn(SeedManager.prototype, 'seed');
    seedMock.mockImplementation(async () => void 0);
    jest.mock(`${process.cwd()}/database/seeder/book3.seeder.ts`, () => {
      return Book3Seeder;
    }, { virtual: true });
    jest.mock(`${process.cwd()}/database/seeder/author3.seeder.ts`, () => {
      return Book3Seeder;
    }, { virtual: true });

    await seeder.seedString('Book3Seeder');
    expect(seedMock).toHaveBeenCalledTimes(1);
    await seeder.seedString('Book3Seeder', 'Author3Seeder');
    expect(seedMock).toHaveBeenCalledTimes(3);
  });

  test('createSeeder', async () => {
    orm.config.set('seeder', { path: './database/seeder', defaultSeeder: 'DatabaseSeeder' });
    const seeder = orm.getSeeder();

    const seederFile = await seeder.createSeeder('Book3Seeder');
    expect(seederFile).toBe(`./database/seeder/book3.seeder.ts`);
    await remove('./database');
  });
});
