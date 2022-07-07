import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Group {

  @PrimaryKey()
  id!: number;

  @ManyToMany({
    entity: 'Participant',
    mappedBy: 'groups',
  })
  participants = new Collection<Participant>(this);

}

@Entity()
export class Participant {

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
    type: 'better-sqlite',
  });
  await orm.getSchemaGenerator().createSchema();
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
