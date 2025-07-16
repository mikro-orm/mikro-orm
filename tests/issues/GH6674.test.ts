import { Collection, MikroORM, Entity, ManyToOne, OneToMany, PrimaryKey, Property, JsonType } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
class ParentEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => TestEntity, test => test.parent, { eager: true })
  children = new Collection<TestEntity>(this);

}

@Entity()
class TestEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: JsonType })
  richTextDescription!: Record<string, any>;

  @ManyToOne(() => ParentEntity)
  parent!: ParentEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TestEntity],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 6674', async () => {
  const newChild = new TestEntity();
  newChild.title = 'child 1';
  newChild.richTextDescription = { json: { example: 1 } };
  const example = new ParentEntity();
  example.title = 'test parent';
  example.children.add(newChild);
  await orm.em.persistAndFlush(example);
  await orm.em.refresh(example);

  example.title = 'new title';
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(3);
});
