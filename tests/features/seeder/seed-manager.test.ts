import { readFile, rm } from 'node:fs/promises';
import { MikroORM, Utils } from '@mikro-orm/core';
import { SeedManager } from '@mikro-orm/seeder';
import { SchemaGenerator } from '@mikro-orm/sqlite';
import { initORMSqlite } from '../../bootstrap.js';
import { Book3Seeder } from '../../database/seeder/book3.seeder.js';
import { Author3Seeder } from '../../database/seeder/author3.seeder.js';

describe('Seeder', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(MikroORM, 'init');
    getORMMock.mockResolvedValue(orm);
    const createSchema = vi.spyOn(SchemaGenerator.prototype, 'createSchema');
    createSchema.mockImplementation(async o => void 0);
    const dropSchema = vi.spyOn(SchemaGenerator.prototype, 'dropSchema');
    dropSchema.mockImplementation(async o => void 0);
  });

  beforeEach(() => orm.config.resetServiceCache());

  afterAll(async () => {
    await orm.close(true);
    vi.restoreAllMocks();
  });

  test('seed', async () => {
    const bookRunMock = vi.spyOn(Book3Seeder.prototype, 'run');
    bookRunMock.mockImplementation(async () => void 0);
    const authorRunMock = vi.spyOn(Author3Seeder.prototype, 'run');
    authorRunMock.mockImplementation(async () => void 0);

    await orm.seeder.seed(Book3Seeder);
    expect(bookRunMock).toHaveBeenCalledTimes(1);
    await orm.seeder.seed(Book3Seeder, Author3Seeder);
    expect(bookRunMock).toHaveBeenCalledTimes(2);
    expect(authorRunMock).toHaveBeenCalledTimes(1);
  });

  test('seedString', async () => {
    const options = orm.config.get('seeder');
    options.path = './database/seeder';
    options.defaultSeeder = 'DatabaseSeeder';
    orm.config.set('seeder', options);
    const seedMock = vi.spyOn(SeedManager.prototype, 'seed');

    await orm.seeder.seedString('Book3Seeder');
    expect(seedMock).toHaveBeenCalledTimes(1);
    await orm.seeder.seedString('Book3Seeder', 'Author3Seeder');
    expect(seedMock).toHaveBeenCalledTimes(3);

    const re = 'Seeder class Unknown not found in ./tests/database/seeder/!(*.d).{js,ts}';
    await expect(orm.seeder.seedString('Unknown')).rejects.toThrow(re);
  });

  test('createSeeder (TS)', async () => {
    const options = orm.config.get('seeder');
    options.path = Utils.normalizePath(process.cwd()) + '/temp/seeders';
    options.defaultSeeder = 'DatabaseSeeder';
    orm.config.set('seeder', options);
    const seederFile = await orm.seeder.createSeeder('Publisher3Seeder');
    expect(seederFile).toBe(Utils.normalizePath(process.cwd()) + `/temp/seeders/Publisher3Seeder.ts`);
    const fileContents = await readFile(seederFile, 'utf8');
    expect(fileContents).toContain('export class Publisher3Seeder extends Seeder {');
    await rm(seederFile);
  });

  test('createSeeder (JS)', async () => {
    const options = orm.config.get('seeder');
    options.path = Utils.normalizePath(process.cwd()) + '/temp/seeders';
    options.emit = 'js';
    options.defaultSeeder = 'DatabaseSeeder';
    orm.config.set('seeder', options);
    const seederFile = await orm.seeder.createSeeder('Publisher3Seeder');
    expect(seederFile).toBe(Utils.normalizePath(process.cwd()) + `/temp/seeders/Publisher3Seeder.js`);
    const fileContents = await readFile(seederFile, 'utf8');
    expect(fileContents).toContain('exports.Publisher3Seeder = Publisher3Seeder;');
    await rm(seederFile);
  });

});
