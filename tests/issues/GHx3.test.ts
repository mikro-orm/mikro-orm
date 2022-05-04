import type { ChangeSet, EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

}

@Entity()
class Project {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @ManyToMany({
    entity: () => User,
    nullable: true,
    fixedOrder: true,
  })
  users?: Collection<User>;

}

export class ChangesSubscriber implements EventSubscriber {

  public changeSets?: ChangeSet[];

  async afterFlush(args: FlushEventArgs): Promise<void> {
    this.changeSets = args.uow.getChangeSets();
  }

}

describe('GH issue x3', () => {
  let orm: MikroORM<SqliteDriver>;
  const subscriber = new ChangesSubscriber();
  const afterFlush = jest.spyOn(subscriber, 'afterFlush');

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Project],
      dbName: ':memory:',
      type: 'postgresql',
      subscribers: [subscriber],
      debug: true,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterEach(() => {
    afterFlush.mockClear();
    subscriber.changeSets = undefined;
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
  });

  it(`notifies m to n collection flush`, async () => {

    await orm.em.transactional(em => {
      const user1 = em.create(User, { id: 1, name: 'User 1' });
      const user2 = em.create(User, { id: 2, name: 'User 2' });
      const project = em.create(Project, { id: 1, name: 'Project 1', users: [user1, user2] });
      em.persist(user1);
      em.persist(user2);
      em.persist(project);
    });

    expect(subscriber.afterFlush).toHaveBeenCalledTimes(1);
    expect(subscriber.changeSets).toEqual(expect.arrayContaining([
      expect.objectContaining({ payload: expect.objectContaining({ id: 1, name: 'User 1' }) }),
      expect.objectContaining({ payload: expect.objectContaining({ id: 2, name: 'User 2' }) }),
      expect.objectContaining({ payload: expect.objectContaining({ id: 1, name: 'Project 1', users: expect.anything() }) }),
    ]));
  });
});
