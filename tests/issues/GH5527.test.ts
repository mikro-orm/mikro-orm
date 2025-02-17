import { MikroORM, BigIntType, Entity, type Opt, PrimaryKey, Property, wrap } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ length: 0, nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @Property({ type: new BigIntType('number'), defaultRaw: '1', version: true })
  version!: number & Opt;

  constructor(props?: Pick<Test, 'id' | 'name'>) {
    if (props) {
      this.id = props.id;
      this.name = props.name;
    }
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5527',
    entities: [Test],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('should always use optimistic locking query when version column is defined', async () => {
  const test = await orm.em.upsert(Test, { id: 1, name: 'Foo' });
  expect(test.version).toBe(1);
  test.name = 'Bar';

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(test.version).toBe(2);
  expect(wrap(test).toObject().version).toBe(2);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('where "id" = 1 and "version" = 1 returning "version"');
  expect(mock.mock.calls[2][0]).toMatch('commit');
});
