import { MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Workspace {
  [PrimaryKeyProp]?: 'sid';

  @PrimaryKey()
  sid!: number;
}

@Entity()
class Project {
  [PrimaryKeyProp]?: 'sid';

  @PrimaryKey()
  sid!: number;

  @ManyToOne(() => Workspace)
  workspace!: Workspace;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Project, Workspace],
  });
  await orm.schema.refresh();

  orm.em.create(Workspace, { sid: 1 });
  orm.em.create(Project, { sid: 1, workspace: 1 });
  orm.em.create(Project, { sid: 2, workspace: 1 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const projects = await orm.em.findAll(Project, {
    fields: ['workspace.sid'],
    orderBy: { workspace: 'ASC' },
  });

  expect(projects.map(it => it.workspace.sid)).toEqual([1, 1]);
});
