import { BigIntType, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Foo {

  @PrimaryKey()
  textField: string;

  @Property({ type: new BigIntType('bigint') })
  bigIntField: bigint;

  constructor(textField: string, bigIntField: bigint) {
    this.textField = textField;
    this.bigIntField = bigIntField;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Foo],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 5737', async () => {
  const bigIntStored = new Foo('', 999999999999999000n);
  await orm.em.persist(bigIntStored).flush();

  const bigIntQueried = await orm.em.findOneOrFail(Foo, { bigIntField: 999999999999999000n });
  expect(bigIntQueried.bigIntField).toBe(999999999999999000n);
});
