import { BaseEntity, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Group extends BaseEntity<Group, 'id'> {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Group, { nullable: true })
  parent?: Group;


  @OneToMany(() => Group, group => group.parent)
  subGroups = new Collection<Group>(this);

}

let orm: MikroORM<SqliteDriver>;

beforeEach(async () => {
  orm = await MikroORM.init({
    entities: [Group],
    dbName: ':memory:',
    type: 'sqlite',
  });
  await orm.schema.createSchema();
});

afterEach(async () => {
  await orm.close(true);
});

test(`using Array.from on uninitialized collection should throw exception`, async () => {
  const group = orm.em.create(Group, {
    id: 1,
    name: 'Parent Group',
    subGroups: [],
  });

  await orm.em.persistAndFlush(group);
  orm.em.clear();

  const refreshed = await orm.em.findOneOrFail(Group, group.id);

  refreshed.subGroups[0];

  try {
    Array.from(refreshed.subGroups);

    throw new Error('should not be invoked.');
  } catch (ex) {
    expect((ex as Error).message).toBe('Collection<Group> of entity Group[1] not initialized');
  }
});

test(`using for on uninitialized collection should throw exception`, async () => {
  const group = orm.em.create(Group, {
    id: 1,
    name: 'Parent Group',
    subGroups: [],
  });

  await orm.em.persistAndFlush(group);
  orm.em.clear();

  const refreshed = await orm.em.findOneOrFail(Group, group.id);

  try {
    for (const group of refreshed.subGroups) {
      throw new Error('should not be invoked.');
    }
  } catch (ex) {
    expect((ex as Error).message).toBe('Collection<Group> of entity Group[1] not initialized');
  }
});
