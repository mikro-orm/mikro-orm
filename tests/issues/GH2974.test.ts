import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, wrap } from '@mikro-orm/sqlite';

@Entity()
class SomeMany {

  @PrimaryKey()
  id!: number;

  @Property()
  arrVal!: string;

  @ManyToOne(() => Test)
  ref!: any;

}

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  savedValue!: string;

  @OneToMany(() => SomeMany, ent => ent.ref)
  coll = new Collection<SomeMany>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test, SomeMany],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 2974`, async () => {
  const test = new Test();
  test.savedValue = 'initial';
  const arrVal = new SomeMany();
  arrVal.arrVal = 'initialArr';
  test.coll.add(arrVal);

  await orm.em.persistAndFlush(test);
  const arrCopy = wrap(arrVal).toObject();
  arrCopy.arrVal = 'updatedarr';

  wrap(test).assign({ savedValue: 'after' });
  expect(test.savedValue).toBe('after');

  wrap(test).assign({ savedValue: 'after2', coll: [arrCopy] });
  expect(test.savedValue).toBe('after2');
  expect(test.coll[0].arrVal).toBe('updatedarr');
});
