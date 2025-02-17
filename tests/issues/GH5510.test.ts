import { MikroORM, Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Other {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

}

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @OneToOne(() => Other, { nullable: true })
  other?: Other;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5510',
    entities: [Test],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('should merge all changes of one record into one sql update statement', async () => {
  const tid = await orm.em.insert(Test, { name: 'Foo' });
  const test = await orm.em.findOne(Test, { id: tid });

  const other = new Other();
  other.name = 'Foo';
  test!.other = other;

  const mock = mockLogger(orm);
  await orm.em.flush();

  expect(mock.mock.calls).toHaveLength(
    [['begin'], ['insert into other'], ['update test'], ['commit']].length,
  );
});
