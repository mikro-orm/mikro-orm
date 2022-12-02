import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  length!: number;

  @Property()
  name!: string;

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  length?: number;

  @Property()
  name!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Book)
  template!: Book;

}

describe('GH issue 2829', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      driver: SqliteDriver,
      connect: false,
    });
  });

  test('entities with property `length` and type checking of `orderBy`', async () => {
    let fn: () => Promise<any>;

    fn = () => orm.em.find(Book, {}, { orderBy: { author: { name: 1 } } });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: { author: { name1: 1 } } });
    fn = () => orm.em.find(Book, {}, { orderBy: [{ author: { name: 1 } }] });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: [{ author: { name1: 1 } }] });

    fn = () => orm.em.find(Book, {}, { orderBy: { name: 1 } });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: { name1: 1 } });
    fn = () => orm.em.find(Book, {}, { orderBy: [{ name: 1 }] });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: [{ name1: 1 }] });

    fn = () => orm.em.find(Book, {}, { orderBy: { template: { name: 1 } } });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: { template: { name1: 1 } } });
    fn = () => orm.em.find(Book, {}, { orderBy: [{ template: { name: 1 } }] });
    // @ts-expect-error invalid property name
    fn = () => orm.em.find(Book, {}, { orderBy: [{ template: { name1: 1 } }] });
  });

});
