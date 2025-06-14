import { Entity, MikroORM, OneToOne, PrimaryKey, ref, Ref, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => Pet, pet => pet.owner, { ref: true, nullable: true })
  pet!: Ref<Pet> | null;

}

@Entity()
class Pet {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => User, person => person.pet, {
    owner: true,
    ref: true,
    nullable: true,
  })
  owner!: Ref<User> | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Pet],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('can re-assign to owning side of OneToOne relationship', async () => {
  orm.em.create(Pet, {
    id: 'pet-0',
    owner: orm.em.create(User, { id: 'user-0' }),
  });
  await orm.em.flush();
  orm.em.clear();

  const pet = await orm.em.findOneOrFail(Pet, { id: 'pet-0' });
  pet.owner = ref(orm.em.create(User, { id: 'user-1' }));

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into `user` (`id`) values ('user-1')"],
    ["[query] update `pet` set `owner_id` = 'user-1' where `id` = 'pet-0'"],
    ['[query] commit'],
  ]);
});

test('can re-assign to non-owning side of OneToOne relationship', async () => {
  orm.em.create(User, {
    id: 'user-0',
    pet: orm.em.create(Pet, { id: 'pet-0' }),
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { id: 'user-0' });
  user.pet = ref(orm.em.create(Pet, { id: 'pet-1' }));

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] update `pet` set `owner_id` = NULL where `id` = 'pet-0'"],
    ["[query] insert into `pet` (`id`, `owner_id`) values ('pet-1', 'user-0')"],
    ['[query] commit'],
  ]);
});
