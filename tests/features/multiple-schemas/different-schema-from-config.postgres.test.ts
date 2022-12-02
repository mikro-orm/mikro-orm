import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class BookTag {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  constructor(name: string) {
    this.name = name;
  }

}

describe('different schema from config', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      entities: [Book, BookTag],
      dbName: 'mikro_orm_test_gh_2740',
      schema: 'privateschema',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete('book_tags', {});
    await orm.em.nativeDelete(BookTag, {});
    await orm.em.nativeDelete(Book, {});
    orm.em.clear();
  });

  it('should respect the global schema config', async () => {
    const entity = new Book('n');
    entity.tags.add(new BookTag('t'));
    await orm.em.persistAndFlush(entity);
    expect(entity.id).toBeDefined();
    orm.em.clear();

    const e = await orm.em.findOne(Book, entity);
    expect(e).not.toBeNull();
    expect(wrap(e).getSchema()).toBe('privateschema');
    e!.tags.set([new BookTag('t2')]);
    await orm.em.flush();
  });

  it('should respect the global schema config (multi insert)', async () => {
    const books = [new Book('n1'), new Book('n2'), new Book('n3')];
    books[0].tags.add(new BookTag('t1'));
    books[1].tags.add(new BookTag('t2'));
    books[2].tags.add(new BookTag('t3'));
    await orm.em.fork().persistAndFlush(books);

    const res = await orm.em.find(Book, {}, { populate: ['tags'] });
    expect(res).toHaveLength(3);
    expect(wrap(res[0]).getSchema()).toBe('privateschema');
    expect(wrap(res[1]).getSchema()).toBe('privateschema');
    expect(wrap(res[2]).getSchema()).toBe('privateschema');

    res.forEach(row => row.name = `name ${row.id}`);
    res[0].tags.set([new BookTag('t21')]);
    res[1].tags.set([new BookTag('t22')]);
    res[2].tags.set([new BookTag('t23')]);
    await orm.em.flush();
  });

});
