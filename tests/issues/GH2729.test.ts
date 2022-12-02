import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({
  tableName: 'person',
})
export class PersonEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => TaskEntity, task => task.person)
  tasks = new Collection<TaskEntity>(this);

}

@Entity({
  tableName: 'task',
})
export class TaskEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  @ManyToOne(() => PersonEntity)
  person!: PersonEntity;

}

describe('GH #2729', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [PersonEntity, TaskEntity],
    });
    await orm.schema.createSchema();

    await orm.em.nativeInsert(TaskEntity, {
      description: 'person zero task',
      person: await orm.em.nativeInsert(PersonEntity, {
        id: 0,
        name: 'zero',
      }),
    });
    await orm.em.nativeInsert(TaskEntity, {
      description: 'person one task',
      person: await orm.em.nativeInsert(PersonEntity, {
        id: 1,
        name: 'one',
      }),
    });
    await orm.em.nativeInsert(TaskEntity, {
      description: 'person two task',
      person: await orm.em.nativeInsert(PersonEntity, {
        id: 2,
        name: 'two',
      }),
    });
  });

  afterAll(async () => {
    await orm.close();
  });

  it('relations with PK 0', async () => {
    const persons = await orm.em.fork().find(PersonEntity, {});
    expect(persons).toHaveLength(3);

    const tasks = await orm.em.fork().find(TaskEntity, {}, { orderBy: { id: 'asc' } });
    expect(tasks).toHaveLength(3);
    expect(tasks[0].person.id).toBe(0);
    expect(tasks[1].person.id).toBe(1);
    expect(tasks[2].person.id).toBe(2);

    const tasks2 = await orm.em.fork().find(TaskEntity, {}, { populate: ['person'], orderBy: { id: 'asc' } });

    expect(tasks2[1].person.id).toBe(1);
    expect(tasks2[1].person.name).toBe('one');
    expect(tasks2[2].person.id).toBe(2);
    expect(tasks2[2].person.name).toBe('two');
    expect(tasks2[0].person.id).toBe(0);
    expect(tasks2[0].person.name).toBe('zero');
  });

});
