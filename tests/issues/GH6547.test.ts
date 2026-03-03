import { Collection, JoinType, MikroORM, sql } from '@mikro-orm/mssql';
import {
  Entity,
  Formula,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  username!: string;

  @Property()
  email!: string;

  @Property({ default: 'default.png' })
  image!: string;

  @Property({ default: sql.now(), nullable: true })
  created_at?: Date;

  @OneToMany(() => Tag, t => t.user, { orphanRemoval: true })
  tag = new Collection<Tag>(this);

  @Formula('(select 22)')
  user_sql?: string;
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  tag!: string;

  @ManyToOne(() => User)
  user!: User;

  @Formula('(select 23)')
  tag_query?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Tag],
    dbName: '6547',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
  const user = orm.em.create(User, {
    id: 1,
    tag: [{ tag: 't1' }, { tag: 't2' }],
    image: 'img',
    username: 'username',
    email: 'email',
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('6547', async () => {
  const qb = orm.em
    .createQueryBuilder(User, 'user')
    .select(['id', 'username', 'email', 'image', 'created_at', 'user_sql'])
    .joinAndSelect('user.tag', 'tag', {}, JoinType.innerJoin, undefined, ['id', 'tag', 'tag_query']);

  const result = await qb.execute();
  const sql = qb.toQuery().sql;
  expect(result).toEqual([
    {
      id: 1,
      username: 'username',
      email: 'email',
      image: 'img',
      created_at: expect.any(Date),
      user_sql: 22,
      tag: [
        { id: 1, tag: 't1', tag_query: 23 },
        { id: 2, tag: 't2', tag_query: 23 },
      ],
    },
  ]);
  expect(sql).toBe(
    'select [user].[id], [user].[username], [user].[email], [user].[image], [user].[created_at], (select 22) as [user_sql], [tag].[id] as [tag__id], [tag].[tag] as [tag__tag], (select 23) as [tag__tag_query] from [user] as [user] inner join [tag] as [tag] on [user].[id] = [tag].[user_id]',
  );
});
