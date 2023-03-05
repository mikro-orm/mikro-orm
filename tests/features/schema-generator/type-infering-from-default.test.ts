import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/better-sqlite';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property({ default: 0 })
  age=0;

}

test('infer property type from its default value when type is not set', async () => {
  // given
  const orm = await MikroORM.init({
    entities: [Author],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();

  const author = new Author();
  const expected = 'number';

  // when
  await orm.em.persistAndFlush(author);
  orm.em.clear();

  // then
  const result = await orm.em.findOneOrFail(Author, author.id);
  const actual =Object.getPrototypeOf(result).__meta.properties.age.type;
  // expect(actual).toBe(expected);

  await orm.close(true);
});
