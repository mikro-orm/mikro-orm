import { EntityManager, MikroORM } from '../lib';
import { BookTag } from './entities/BookTag';
import { Publisher } from './entities/Publisher';
import { Test } from './entities/Test';
import { Book } from './entities/Book';
import { Author } from './entities/Author';

export async function initORM() {
  let hash = '';

  if (process.env.ORM_PARALLEL) {
    hash = '-' + Math.random().toString(36).substring(6);
  }

  return MikroORM.init({
    entitiesDirs: ['entities'],
    entitiesDirsTs: ['entities'], // just to raise coverage :]
    dbName: `mikro-orm-test${hash}`,
    baseDir: __dirname,
    debug: true,
  });
}

export async function wipeDatabase(em: EntityManager) {
  await em.getRepository<Author>(Author.name).remove({});
  await em.getRepository<Book>(Book.name).remove({});
  await em.getRepository<BookTag>(BookTag.name).remove({});
  await em.getRepository<Publisher>(Publisher.name).remove({});
  await em.getRepository<Test>(Test.name).remove({});
  em.clear();
}
