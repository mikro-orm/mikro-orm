import { Collection, MikroORM, type Options } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Team {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => User, index: false })
  users = new Collection<User>(this);
}

@Entity()
class Project {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => User)
  users = new Collection<User>(this);
}

describe('disabling implicit pivot table join column indexes (GH 8156)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Team, Project],
      dbName: ':memory:',
      connect: false,
    } as Options);
  });

  afterAll(() => orm.close(true));

  test('`index: false` disables the platform default indexes on both join columns', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).not.toContain('create index `team_users_team_id_index`');
    expect(sql).not.toContain('create index `team_users_user_id_index`');
  });

  test('platform default is kept without the `index` option', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('create index `project_users_project_id_index` on `project_users` (`project_id`);');
    expect(sql).toContain('create index `project_users_user_id_index` on `project_users` (`user_id`);');
  });
});
