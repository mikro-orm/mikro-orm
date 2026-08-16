import { Collection, MikroORM, type Options } from '@mikro-orm/postgresql';
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

  @ManyToMany({ entity: () => User, index: true })
  users = new Collection<User>(this);
}

@Entity()
class Playlist {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => User, index: true, fixedOrder: true })
  users = new Collection<User>(this);
}

@Entity()
class Project {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => User)
  users = new Collection<User>(this);
}

@Entity()
class Group {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => User, index: 'custom_pivot_index' })
  users = new Collection<User>(this);
}

@Entity()
class Wiki {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => User, index: 'wiki_users_custom', fixedOrder: true })
  users = new Collection<User>(this);
}

describe('indexing implicit pivot table join columns (GH 8156)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Team, Playlist, Project, Group, Wiki],
      dbName: 'mikro_orm_test_pivot_fk_indexes',
      connect: false,
    } as Options);
  });

  afterAll(() => orm.close(true));

  test('`index: true` indexes the join columns not covered by the composite PK prefix', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    // owner column `team_id` is the leading column of the composite PK, so only the inverse side gets an index
    expect(sql).not.toContain('create index "team_users_team_id_index"');
    expect(sql).toContain('create index "team_users_user_id_index" on "team_users" ("user_id");');
  });

  test('`index: true` with `fixedOrder` indexes both join columns', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('create index "playlist_users_playlist_id_index" on "playlist_users" ("playlist_id");');
    expect(sql).toContain('create index "playlist_users_user_id_index" on "playlist_users" ("user_id");');
  });

  test('platform default is kept without the `index` option', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).not.toContain('create index "project_users_project_id_index"');
    expect(sql).not.toContain('create index "project_users_user_id_index"');
  });

  test('`index` accepts a custom index name', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('create index "custom_pivot_index" on "group_users" ("user_id");');
  });

  test('custom index name with `fixedOrder` names the inverse index, owner index gets a generated name', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toContain('create index "wiki_users_wiki_id_index" on "wiki_users" ("wiki_id");');
    expect(sql).toContain('create index "wiki_users_custom" on "wiki_users" ("user_id");');
  });

  test('schema diffing sees the pivot indexes as up to date', async () => {
    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Team, Playlist, Project, Group, Wiki],
      dbName: 'mikro_orm_test_pivot_fk_indexes',
    });

    try {
      await orm2.schema.refresh();
      const diff = await orm2.schema.getUpdateSchemaSQL();
      expect(diff).toBe('');
    } finally {
      await orm2.close(true);
    }
  });
});
