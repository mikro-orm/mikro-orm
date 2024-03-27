import {
  Collection,
  MikroORM,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Ref,
  Property,
  ref,
  wrap,
} from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class List {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

  @OneToMany(() => ListItem, listItem => listItem.list, {
    orderBy: [{ index: 'asc' }],
  })
  items = new Collection<ListItem>(this);

}

@Entity()
class ListItem {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

  @Property()
  index!: number;

  @ManyToOne(() => List, { ref: true, nullable: false })
  list!: Ref<List>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [List],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 5265', async () => {
  const list = new List();
  list.name = 'TestList';
  await orm.em.persistAndFlush(list);

  for (let i = 0; i < 10; i++) {
    const listItem = new ListItem();
    listItem.index = i;
    listItem.name = `ListItem ${i}`;
    listItem.list = ref(List, list.id);
    await orm.em.persistAndFlush(listItem);
  }

  const listFromDb = await orm.em.findOneOrFail(List, { id: list.id }, { populate: ['items'] });
  expect(wrap(listFromDb).toObject()).toMatchObject({
    name: 'TestList',
    items: [
      { name: 'ListItem 0', index: 0 },
      { name: 'ListItem 1', index: 1 },
      { name: 'ListItem 2', index: 2 },
      { name: 'ListItem 3', index: 3 },
      { name: 'ListItem 4', index: 4 },
      { name: 'ListItem 5', index: 5 },
      { name: 'ListItem 6', index: 6 },
      { name: 'ListItem 7', index: 7 },
      { name: 'ListItem 8', index: 8 },
      { name: 'ListItem 9', index: 9 },
    ],
  });
});
