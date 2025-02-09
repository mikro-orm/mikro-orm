import type { MikroORM } from '@mikro-orm/core';
import { MySqlDriver, wrap } from '@mikro-orm/mysql';
import { Author2, Book2, Publisher2 } from '../entities-sql/index.js';
import { initORMMySql, mockLogger } from '../bootstrap.js';
import { Author2Subscriber } from '../subscribers/Author2Subscriber.js';
import { EverythingSubscriber } from '../subscribers/EverythingSubscriber.js';
import { FlushSubscriber } from '../subscribers/FlushSubscriber.js';
import { Test2Subscriber } from '../subscribers/Test2Subscriber.js';

describe('read-replicas', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql());
  beforeEach(async () => orm.schema.clearDatabase());
  afterEach(() => {
    orm.config.set('debug', false);
    Author2Subscriber.log.length = 0;
    EverythingSubscriber.log.length = 0;
    FlushSubscriber.log.length = 0;
    Test2Subscriber.log.length = 0;
  });
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  describe('when preferReadReplicas is true (default behaviour)', () => {
    test('will prefer replicas for read operations outside a transaction', async () => {
      const mock = mockLogger(orm, ['query']);

      let author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);
      expect(mock.mock.calls[0][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[1][0]).toMatch(/insert into `author2`.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[2][0]).toMatch(/insert into `book2`.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[3][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

      orm.em.clear();
      author = (await orm.em.findOne(Author2, author))!;
      await orm.em.findOne(Author2, author, { refresh: true });
      await orm.em.findOne(Author2, author, { refresh: true });
      expect(mock.mock.calls[4][0]).toMatch(/select `a0`\.\*, `a1`\.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`\.`id` = `a1`\.`author_id` where `a0`.`id` = \? limit \?.*via read connection 'read-\d'/);
      expect(mock.mock.calls[5][0]).toMatch(/select `a0`\.\*, `a1`\.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`\.`id` = `a1`\.`author_id` where `a0`.`id` = \? limit \?.*via read connection 'read-\d'/);
      expect(mock.mock.calls[6][0]).toMatch(/select `a0`\.\*, `a1`\.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`\.`id` = `a1`\.`author_id` where `a0`.`id` = \? limit \?.*via read connection 'read-\d'/);

      author.name = 'Jon Blow';
      await orm.em.flush();
      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/update `author2` set `name` = \?, `updated_at` = \? where `id` = \?.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[9][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

      const qb = orm.em.createQueryBuilder(Author2, 'a', 'write');
      await qb.select('*').where({ name: /.*Blow/ }).execute();
      expect(mock.mock.calls[10][0]).toMatch(/select `a`.* from `author2` as `a` where `a`.`name` like \?.*via write connection '127\.0\.0\.1'/);

      await orm.em.transactional(async em => {
        const book = await em.findOne(Book2, { title: 'B' });
        author.name = 'Jon Flow';
        author.favouriteBook = book!;
        await em.flush();
      });

      expect(mock.mock.calls[11][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[12][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[13][0]).toMatch(/update.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[14][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);
    });

    test('can explicitly set connection type for find operations', async () => {
      const mock = mockLogger(orm, ['query']);
      const author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);

      // defaults to read
      await orm.em.findOne(Author2, author, { refresh: true });
      expect(mock.mock.calls[4][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to read
      await orm.em.findOne(Author2, author, { connectionType: 'read', refresh: true });
      expect(mock.mock.calls[5][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to write
      await orm.em.findOne(Author2, author, { connectionType: 'write', refresh: true });
      expect(mock.mock.calls[6][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // when running in a transaction will always use a write connection
      await orm.em.transactional(async em => {
        return em.findOne(Author2, author, { connectionType: 'read', refresh: true });
      });

      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
    });

    test('can explicitly set connection type for count operations', async () => {
      const mock = mockLogger(orm, ['query']);
      const author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);

      // defaults to read
      await orm.em.count(Author2, {});
      expect(mock.mock.calls[4][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to read
      await orm.em.count(Author2, {}, { connectionType: 'read' });
      expect(mock.mock.calls[5][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to write
      await orm.em.count(Author2, {}, { connectionType: 'write' });
      expect(mock.mock.calls[6][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // when running in a transaction will always use a write connection
      await orm.em.transactional(async em => {
        return em.count(Author2, {}, { connectionType: 'read' });
      });
      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
    });

    test('use write connection for fetching data after upsert/upsertMany', async () => {
      const mock = mockLogger(orm, ['query']);
      await orm.em.upsert(Author2, { name: 'Jon Snow', email: 'snow@wall.st', born: '1990-03-23' });
      expect(mock.mock.calls[0][0]).toMatch(/via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[1][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      await orm.em.upsertMany(Author2, [
        { name: 'Daenerys Stormborn', email: 'dany@dragonstone.ts', born: '1990-03-23' },
        { name: 'Jaime Lannister', email: 'jaime@casterlyrock.ts', born: '1980-03-23' },
      ]);
      expect(mock.mock.calls[2][0]).toMatch(/via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[3][0]).toMatch(/via write connection '127\.0\.0\.1'/);
    });
  });

  describe('when preferReadReplicas is false', () => {
    test('will always use write connections', async () => {
      orm.config.set('preferReadReplicas', false);

      const mock = mockLogger(orm, ['query']);

      let author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);
      expect(mock.mock.calls[0][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[1][0]).toMatch(/insert into `author2`.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[2][0]).toMatch(/insert into `book2`.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[3][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

      orm.em.clear();
      author = (await orm.em.findOne(Author2, author))!;
      await orm.em.findOne(Author2, author, { refresh: true });
      await orm.em.qb(Author2).where({ id: author.id }).limit(1).execute();
      expect(mock.mock.calls[4][0]).toMatch(/select `a0`\.\*, `a1`\.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`\.`id` = `a1`\.`author_id` where `a0`.`id` = \? limit \?.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[5][0]).toMatch(/select `a0`\.\*, `a1`\.`author_id` as `a1__author_id` from `author2` as `a0` left join `address2` as `a1` on `a0`\.`id` = `a1`\.`author_id` where `a0`.`id` = \? limit \?.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[6][0]).toMatch(/select `a0`\.\* from `author2` as `a0` where `a0`.`id` = \? limit \?.*via write connection '127\.0\.0\.1'/);

      author.name = 'Jon Blow';
      await orm.em.flush();
      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/update `author2` set `name` = \?, `updated_at` = \? where `id` = \?.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[9][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);

      const qb = orm.em.createQueryBuilder(Author2, 'a', 'write');
      await qb.select('*').where({ name: /.*Blow/ }).execute();
      expect(mock.mock.calls[10][0]).toMatch(/select `a`.* from `author2` as `a` where `a`.`name` like \?.*via write connection '127\.0\.0\.1'/);

      await orm.em.transactional(async em => {
        const book = await em.findOne(Book2, { title: 'B' });
        author.name = 'Jon Flow';
        author.favouriteBook = book!;
        await em.flush();
      });

      expect(mock.mock.calls[11][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[12][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[13][0]).toMatch(/update.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[14][0]).toMatch(/commit.*via write connection '127\.0\.0\.1'/);
    });

    test('can explicitly set connection type for find operations', async () => {
      orm.config.set('preferReadReplicas', false);

      const mock = mockLogger(orm, ['query']);
      const author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);

      // defaults to write
      await orm.em.findOne(Author2, author, { refresh: true });
      expect(mock.mock.calls[4][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // explicitly set to read
      await orm.em.findOne(Author2, author, { connectionType: 'read', refresh: true });
      expect(mock.mock.calls[5][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to write
      await orm.em.findOne(Author2, author, { connectionType: 'write', refresh: true });
      expect(mock.mock.calls[6][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // when running in a transaction will always use a write connection
      await orm.em.transactional(async em => {
        return em.findOne(Author2, author, { connectionType: 'read', refresh: true });
      });

      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
    });

    test('can explicitly set connection type for count operations', async () => {
      orm.config.set('preferReadReplicas', false);

      const mock = mockLogger(orm, ['query']);
      const author = new Author2('Jon Snow', 'snow@wall.st');
      author.born = '1990-03-23';
      author.books.add(new Book2('B', author));
      await orm.em.persistAndFlush(author);

      // defaults to write
      await orm.em.count(Author2, {});
      expect(mock.mock.calls[4][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // explicitly set to read
      await orm.em.count(Author2, {}, { connectionType: 'read' });
      expect(mock.mock.calls[5][0]).toMatch(/via read connection 'read-.*'/);

      // explicitly set to write
      await orm.em.count(Author2, {}, { connectionType: 'write' });
      expect(mock.mock.calls[6][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      // when running in a transaction will always use a write connection
      await orm.em.transactional(async em => {
        return em.count(Author2, {}, { connectionType: 'read' });
      });
      expect(mock.mock.calls[7][0]).toMatch(/begin.*via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[8][0]).toMatch(/select.*via write connection '127\.0\.0\.1'/);
    });

    test('use write connection for fetching data after upsert/upsertMany', async () => {
      const mock = mockLogger(orm, ['query']);
      await orm.em.upsert(Author2, { name: 'Jon Snow', email: 'snow@wall.st', born: '1990-03-23' });
      expect(mock.mock.calls[0][0]).toMatch(/via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[1][0]).toMatch(/via write connection '127\.0\.0\.1'/);

      await orm.em.upsertMany(Author2, [
        { name: 'Daenerys Stormborn', email: 'dany@dragonstone.ts', born: '1990-03-23' },
        { name: 'Jaime Lannister', email: 'jaime@casterlyrock.ts', born: '1980-03-23' },
      ]);
      expect(mock.mock.calls[2][0]).toMatch(/via write connection '127\.0\.0\.1'/);
      expect(mock.mock.calls[3][0]).toMatch(/via write connection '127\.0\.0\.1'/);
    });
  });

  test('find with different schema', async () => {
    const author = new Author2('n', 'e');
    const book1 = new Book2('b1', author);
    book1.publisher = wrap(new Publisher2('p')).toReference();
    const book2 = new Book2('b2', author);
    await orm.em.persistAndFlush([book1, book2]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const schema = `${orm.config.get('dbName')}_schema_2`;
    const res1 = await orm.em.find(Book2, { publisher: { $ne: null } }, { schema, populate: ['perex'] });
    const res2 = await orm.em.find(Book2, { publisher: { $ne: null } }, { populate: ['perex'] });
    expect(mock.mock.calls[0][0]).toMatch(`select \`b0\`.*, \`b0\`.price * 1.19 as \`price_taxed\`, \`t1\`.\`id\` as \`t1__id\` from \`${schema}\`.\`book2\` as \`b0\` left join \`${schema}\`.\`test2\` as \`t1\` on \`b0\`.\`uuid_pk\` = \`t1\`.\`book_uuid_pk\` where \`b0\`.\`author_id\` is not null and \`b0\`.\`publisher_id\` is not null`);
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.*, `b0`.price * 1.19 as `price_taxed`, `t1`.`id` as `t1__id` from `book2` as `b0` left join `test2` as `t1` on `b0`.`uuid_pk` = `t1`.`book_uuid_pk` where `b0`.`author_id` is not null and `b0`.`publisher_id` is not null');
    expect(res1.length).toBe(0);
    expect(res2.length).toBe(1);
  });

});
