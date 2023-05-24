import { Embeddable, Embedded, Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/mysql';

@Embeddable()
class NestedTime {

  @Property({ defaultRaw: 'current_timestamp' })
  timestamp!: Date;

}

@Embeddable()
class Time {

  @Property({ defaultRaw: 'current_timestamp' })
  timestamp!: Date;

  @Embedded(() => NestedTime)
  nested!: NestedTime;

}

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Time)
  time!: Time;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test],
    dbName: '3887',
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('reloading database defaults from inlined embeddables', async () => {
  const test = new Test();
  test.time = {} as Time;
  test.time.nested = {} as Time;

  await orm.em.fork().persistAndFlush(test);
  expect(test.time.timestamp).toBeInstanceOf(Date);
  expect(test.time.nested.timestamp).toBeInstanceOf(Date);

  const fetched = await orm.em.fork().findOneOrFail(Test, test);
  expect(fetched.time.timestamp).toBeInstanceOf(Date);
  expect(fetched.time.nested.timestamp).toBeInstanceOf(Date);
});
