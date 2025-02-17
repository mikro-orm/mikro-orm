import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name?: string;

  @OneToMany({
      entity: () => Tag,
    mappedBy: t => t.book,
    strategy: LoadStrategy.JOINED,
  })
  tags = new Collection<Tag>(this);

}

@Entity()
export class Tag {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Book)
  book!: Book;

}

describe('GH issue 2803', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Book, Tag],
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`load strategy defined on property level is respected`, async () => {
    const b = orm.em.create(Book, {
      name: 'b',
      tags: [{}, {}, {}],
    });
    await orm.em.fork().persist(b).flush();

    const mock = mockLogger(orm, ['query']);
    const ret = await orm.em.find(Book, {}, { populate: ['tags'] });
    expect(ret[0].tags).toHaveLength(3);
    expect(mock).toHaveBeenCalledTimes(1);
  });

});
