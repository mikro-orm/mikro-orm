import { Collection, MikroORM, DateTimeType, Ref } from '@mikro-orm/sqlite';

import { Entity, Filter, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Filter({
  name: 'softDelete',
  cond: {
    deletedAt: null,
  },
  default: true,
})
abstract class BE {

  @PrimaryKey({ autoincrement: true })
  readonly id!: string;

  @Property({ type: DateTimeType, nullable: true })
  deletedAt?: Date;

}

@Entity()
class A extends BE {

  @Property()
  title!: string;

  @ManyToOne(() => B, { ref: true })
  b!: Ref<B>;

}

@Entity()
class B extends BE {

  @OneToMany(() => A, a => a.b)
  a = new Collection<A>(this);

  @OneToOne(() => C, c => c.b, {
    ref: true,
  })
  c?: Ref<C>;

}

@Entity()
class C extends BE {

  @OneToOne(() => B, { ref: true })
  b?: Ref<B>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [A, B, C],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('findAndCount: returned rows length and count should match', async () => {
  orm.em.create(A, { b: { c: {} }, title: 'test' });
  orm.em.create(A, { b: { c: {} }, title: 'test', deletedAt: new Date() });

  await orm.em.flush();
  orm.em.clear();

  const [rows, count] = await orm.em.findAndCount(C, { b: { a: { title: 'test' } } });
  expect(rows.length).toEqual(count);
  expect(rows.length).toEqual(1);
});
