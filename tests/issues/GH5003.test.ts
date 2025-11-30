import { Ref, Collection, t, MikroORM, ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Assignee {

  @PrimaryKey({ type: t.bigint })
  readonly id!: string;

  @ManyToOne(() => Slot, { ref: true })
  slot!: Ref<Slot>;

  @Property()
  email!: string;

}

@Entity()
class Slot {

  @PrimaryKey({ type: t.bigint })
  readonly id!: string;

  @OneToMany(() => Assignee, a => a.slot)
  assignees = new Collection<Assignee>(this);

  @OneToMany(() => Registration, r => r.slot)
  registrations = new Collection<Registration>(this);

  @Property()
  name!: string;

}

@Entity()
class Registration {

  @PrimaryKey({ type: t.bigint })
  readonly id!: string;

  @ManyToOne(() => Slot, { ref: true })
  slot!: Ref<Slot>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Assignee, Slot, Registration],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));
beforeEach(() => createEntities());

async function createEntities() {
  await orm.schema.clear();
  const slot1 = orm.em.create(Slot, { name: 'slot1' });
  const slot2 = orm.em.create(Slot, { name: 'slot2' });

  const assignee1 = orm.em.create(Assignee, { email: 'slot1@user.com', slot: slot1 });
  const assignee2 = orm.em.create(Assignee, { email: 'slot2@user.com', slot: slot2 });

  const registration = orm.em.create(Registration, { slot: slot1 });
  await orm.em.flush();
  orm.em.clear();
}

test('reschedule registration from slot1 to slot2 (lazy loading assignees)', async () => {
  expect.assertions(2);

  const registration = await orm.em.findOneOrFail(Registration, { slot: { name: 'slot1' } }, { populate: ['slot'] });
  const slot2 = await orm.em.findOneOrFail(Slot, { name: 'slot2' }, { populate: ['registrations'] });

  const slot1 = registration.slot.$;

  registration.slot = ref(slot2);
  await orm.em.persistAndFlush(registration);

  expect(registration.slot.id).toEqual(slot2.id);

  await orm.em.populate(registration, ['slot.assignees']);
  await orm.em.populate(slot1, ['assignees']);

  expect(registration.slot.id).toEqual(slot2.id);
});

test('reschedule registration from slot1 to slot2 (eager loading assignees)', async () => {
  const registration = await orm.em.findOneOrFail(Registration, { slot: { name: 'slot1' } }, { populate: ['slot.assignees'] });
  const slot2 = await orm.em.findOneOrFail(Slot, { name: 'slot2' }, { populate: ['registrations', 'assignees'] });

  const slot1 = registration.slot.$;

  registration.slot = ref(slot2);
  await orm.em.persistAndFlush(registration);

  expect.assertions(2);
  slot1.assignees.getItems().forEach(assignee => expect(assignee.slot.id).toEqual(slot1.id));
  slot2.assignees.getItems().forEach(assignee => expect(assignee.slot.id).toEqual(slot2.id));
});
