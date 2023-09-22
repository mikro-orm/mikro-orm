import { Cascade, Collection, Entity, LoadStrategy, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Category, { nullable: true })
  parent!: Category | null;

  @OneToMany({
    entity: () => Category,
    mappedBy: category => category.parent,
    cascade: [Cascade.ALL],
    orphanRemoval: true,
    eager: true,
  })
  children = new Collection<Category>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Category],
    dbName: `mikro_orm_4061`,
    port: 3308,
    loadStrategy: LoadStrategy.JOINED,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('4061', async () => {
  const firstCategory1 = new Category();
  firstCategory1.name = 'TEST1';
  firstCategory1.parent = null;
  const secondCategory = new Category();
  secondCategory.name = 'TEST2';
  secondCategory.parent = firstCategory1;
  const thirdCategory = new Category();
  thirdCategory.name = 'TEST3';
  thirdCategory.parent = secondCategory;
  await orm.em.persistAndFlush([firstCategory1, secondCategory, thirdCategory]);
  orm.em.clear();

  const firstCategory = await orm.em.findOneOrFail(Category, { parent: null });
  expect(firstCategory.children.isInitialized()).toBe(true);
  expect(firstCategory.children[0].children.isInitialized()).toBe(true);
  expect(firstCategory.children[0].children[0].children.isInitialized()).toBe(true);
});
