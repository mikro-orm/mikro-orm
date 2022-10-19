import { Entity, IdentifiedReference, MikroORM, OneToOne, PrimaryKey, Property, Reference } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => User, u => u.project, {
    eager: true,
    orphanRemoval: true,
  })
  public owner?: IdentifiedReference<User>;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToOne(() => User, u => u.project, {
    eager: true,
  })
  public secondaryOwner?: IdentifiedReference<User>;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Project, p => p.owner, { nullable: true, owner: true })
  public project?: IdentifiedReference<Project>;

}

describe('GH3614', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    process.env.NO_COLOR = '1';
    orm = await MikroORM.init({
      entities: [Project, User],
      dbName: ':memory:',
      type: 'sqlite',

    });
    await orm.schema.createSchema();

    orm.em.create(Project, {
      name: 'project name',
      owner: {
        name: 'Peter',
      },
      secondaryOwner: {
        name: 'Mary',
      },
    });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('change a 1:1 relation with a new entity and delete the old one', async () => {
    const project = await orm.em.findOneOrFail(Project, 1);
    const newOwner = orm.em.create(User, { name: 'Johnny', project: 1 });
    project.owner = Reference.create(newOwner);
    const mock = mockLogger(orm, ['query']);
    try {
      await orm.em.flush();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    orm.em.clear();
    const queries = mock.mock.calls.map(q => q[0]);

    expect(queries[1]).toMatch('delete from `user` where id = ?');
    expect(queries[2]).toMatch('insert into `user` (`name`, `project_id`) values (?, ?)');

    const oldOwner = await orm.em.findOne(User, project.owner.id);
    expect(oldOwner).toBeUndefined();

  });

  test('change a 1:1 relation with a new entity and not delete the old one', async () => {
    const project = await orm.em.findOneOrFail(Project, 1);
    const newSecondOwner = orm.em.create(User, { name: 'Johnny', project: 1 });
    project.secondaryOwner = Reference.create(newSecondOwner);
    const mock = mockLogger(orm, ['query']);
    try {
      await orm.em.flush();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    orm.em.clear();
    const queries = mock.mock.calls.map(q => q[0]);

    expect(queries[1]).toMatch('update `user` set project_id = null where id = ?');
    expect(queries[2]).toMatch('insert into `user` (`name`, `project_id`) values (?, ?)');

    const oldOwner = await orm.em.findOne(User, project.secondaryOwner.id);
    expect(oldOwner).toBeDefined();

  });
});
