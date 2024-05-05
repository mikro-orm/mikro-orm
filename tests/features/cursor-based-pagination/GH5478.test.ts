import { ObjectId, MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/mongodb';

@Entity()
class EntityForFindByCursorTest {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  myDate: Date;

  @Property()
  bar?: string;

  constructor(myDate: Date) {
    this.myDate = myDate;
    this.bar = 'bar';
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [EntityForFindByCursorTest],
    dbName: 'mikro-orm-test',
  });
  await orm.em.nativeDelete(EntityForFindByCursorTest, {});
});

afterAll(() => orm.close(true));

test('empty result with findByCursor and orderBy with Date', async () => {
  orm.em.create(EntityForFindByCursorTest, { myDate: new Date('2020-01-01T00:00:00.000Z') });
  orm.em.create(EntityForFindByCursorTest, { myDate: new Date('2020-01-02T00:00:00.000Z') });
  orm.em.create(EntityForFindByCursorTest, { myDate: new Date('2020-01-03T00:00:00.000Z') });
  orm.em.create(EntityForFindByCursorTest, { myDate: new Date('2020-01-04T00:00:00.000Z') });
  orm.em.create(EntityForFindByCursorTest, { myDate: new Date('2020-01-05T00:00:00.000Z') });
  await orm.em.flush();
  orm.em.clear();

  const all = await orm.em.findAll(EntityForFindByCursorTest);
  expect(all.length).toBe(5);

  const curOne = await orm.em.findByCursor(EntityForFindByCursorTest, {}, {
    first: 3,
    orderBy: { myDate: 'ASC' },
  });

  expect(curOne.length).toBe(3);

  orm.em.clear();

  const curTwo = await orm.em.findByCursor(EntityForFindByCursorTest, {}, {
    first: 3,
    after: curOne,
    orderBy: { myDate: 'ASC' },
  });

  expect(curTwo.length).toBe(2);

});
