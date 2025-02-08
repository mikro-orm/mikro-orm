import { Collection, Entity, LoadStrategy, ManyToMany, MikroORM, PrimaryKey } from '@mikro-orm/sqlite';

@Entity()
class Group {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: 'Participant',
    mappedBy: 'groups',
  })
  participants = new Collection<Participant>(this);

}

@Entity()
class Participant {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: () => Group,
    inversedBy: 'participants',
  })
  groups = new Collection<Group>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Participant],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('removing items from m:n (GH 3287)', async () => {
  const group1 = new Group();
  group1.participants.add(new Participant());
  await orm.em.fork().persistAndFlush(group1);

  const group = await orm.em.findOneOrFail(Group, group1, {
    populate: ['participants'],
  });

  orm.em.remove(group);

  await orm.em.flush();
});

test('lazy loading M:N takes snapshot (GH 3323)', async () => {
  const group = new Group();
  const participant = new Participant();
  group.participants.add(participant);
  await orm.em.fork().persistAndFlush(group);

  const g1 = await orm.em.findOneOrFail(Group, group, { populate: ['participants'] });
  const p1 = await orm.em.findOneOrFail(Participant, participant);
  g1.participants.add(participant);
  await orm.em.flush();
  orm.em.clear();

  const g2 = await orm.em.findOneOrFail(Group, group);
  await orm.em.populate(g2, ['participants']);
  const p2 = await orm.em.findOneOrFail(Participant, participant);
  g2.participants.add(participant);
  await orm.em.flush();
  orm.em.clear();

  const g3 = await orm.em.findOneOrFail(Group, group);
  const p3 = await orm.em.findOneOrFail(Participant, participant);
  await g3.participants.init();
  g3.participants.add(participant);
  await orm.em.flush();
});

test('removing items from m:n loaded via joined strategy (GH 3287)', async () => {
  const group1 = new Group();
  group1.participants.add(new Participant());
  await orm.em.fork().persistAndFlush(group1);

  const group = await orm.em.findOneOrFail(Group, group1, {
    populate: ['participants'],
    strategy: LoadStrategy.JOINED,
  });

  orm.em.remove(group);

  await orm.em.flush();
});
