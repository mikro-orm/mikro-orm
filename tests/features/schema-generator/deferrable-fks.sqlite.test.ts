import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Unique,
} from '@mikro-orm/sqlite';

let i = 0;

@Entity()
class RepoModel {

  @PrimaryKey()
  id: number = i++;

  @OneToMany(() => CommitModel, c => c.repo, { orphanRemoval: true })
  commits = new Collection<CommitModel>(this);

}

@Entity()
@Unique({ properties: ['repo', 'sha'] })
class CommitModel {

  @PrimaryKey()
  id: number = i++;

  @Property()
  sha!: string;

  @ManyToOne(() => RepoModel)
  repo!: RepoModel;

  @ManyToOne(() => TreeModel)
  tree!: Rel<TreeModel>;

  constructor(x: Partial<CommitModel> & Pick<CommitModel, 'sha' | 'repo'>) {
    if (x.id != null) {
      this.id = x.id;
    }

    this.sha = x.sha;
    this.repo = x.repo;

    if (x.tree) {
      this.tree = x.tree;
    }
  }

}

@Entity()
@Unique({ properties: ['repo', 'sha'] })
class TreeModel {

  @PrimaryKey()
  id: number = i++;

  @Property()
  sha!: string;

  @ManyToOne(() => RepoModel)
  repo!: RepoModel;

  @ManyToOne(() => CommitModel, { deferMode: 'deferred' })
  commit!: CommitModel;

  constructor(x: Partial<TreeModel> & Pick<TreeModel, 'sha' | 'repo'>) {
    if (x.id != null) {
      this.id = x.id;
    }

    this.sha = x.sha;
    this.repo = x.repo;

    if (x.commit) {
      this.commit = x.commit;
    }
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [RepoModel, CommitModel, TreeModel],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('deferrable FKs', async () => {
  const repo = orm.em.create(RepoModel, {});
  const commit = new CommitModel({ sha: 'repoSha', repo });
  const tree = new TreeModel({ sha: 'treeSha', repo, commit });
  commit.tree = tree;
  orm.em.persist([commit, commit.tree]);
  expect(tree.commit.id).toBe(commit.id);
  await orm.em.flush();
  orm.em.clear();

  const repo1 = await orm.em.findOneOrFail(RepoModel, { id: repo.id });
  expect(repo1.id).toBe(repo.id);

  const tree1 = await orm.em.findOneOrFail(TreeModel, { repo, sha: 'treeSha' });
  expect(tree1.sha).toBe('treeSha');
  expect(tree1.commit.id).toBe(commit.id);

  const count = await orm.em.count(RepoModel, { id: repo.id });
  expect(count).toBe(1);
});
