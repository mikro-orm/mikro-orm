import { MikroORM, ref, type Ref } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Meta {
  @Property()
  a!: string;

  @Property({ type: 'json' })
  b!: any;
}

@Entity({ inheritance: 'tpt' })
class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Dog extends Animal {
  @Embedded(() => Meta)
  meta!: Meta;
}

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Animal, { ref: true })
  pet!: Ref<Animal>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Owner, Animal, Dog, Meta],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
  const dog = orm.em.create(Dog, { id: 1, name: 'rex', meta: { a: 'x', b: { y: 1 } } });
  orm.em.create(Owner, { id: 1, pet: ref(dog) });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('embedded columns of a TPT child are selected once when populating the base relation', async () => {
  const mock = mockLogger(orm);
  const owners = await orm.em.fork().find(Owner, {}, { populate: ['pet'] });
  expect((owners[0].pet.$ as Dog).meta).toEqual({ a: 'x', b: { y: 1 } });
  expect(mock.mock.calls[0][0]).toMatch(
    "select `o0`.*, `d2`.`meta_a` as `d2__meta_a`, `d2`.`meta_b` as `d2__meta_b`, case when `d2`.`id` is not null then 'dog' else 'animal' end as `p1____tpt_type`, `p1`.`id` as `p1__id`, `p1`.`name` as `p1__name` from `owner` as `o0` inner join `animal` as `p1` on `o0`.`pet_id` = `p1`.`id` left join `dog` as `d2` on `p1`.`id` = `d2`.`id`",
  );
});
