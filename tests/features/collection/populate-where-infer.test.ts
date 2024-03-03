import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Location, { ref: true })
  location!: Ref<Location>;

  @OneToMany(() => Server, x => x.user)
  servers = new Collection<Server>(this);

}

@Entity()
class Server {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

}

@Entity()
class Location {

  @PrimaryKey()
  id!: number;

  @Property()
  location!: string;

  @OneToMany(() => User, x => x.location)
  users = new Collection<User>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'coll-operators-1',
    entities: [User],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(User, {
    id: 1,
    location: {
      location: 'loc name',
    },
    servers: [
      { name: 's1' },
      { name: 's2' },
      { name: 'test' },
    ],
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('$every without populateWhere', async () => {
  const mock = mockLogger(orm);

  const res = await orm.em.fork().find(
    User,
    {
      servers: {
        $every: {
          name: {
            $ne: 'test',
          },
        },
      },
    },
    {
      populate: ['servers'],
    },
  );
  expect(res).toHaveLength(0);
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".*, "s1"."id" as "s1__id", "s1"."name" as "s1__name", "s1"."user_id" as "s1__user_id" from "user" as "u0" left join "server" as "s1" on "u0"."id" = "s1"."user_id" where "u0"."id" not in (select "u0"."id" from "user" as "u0" inner join "server" as "s1" on "u0"."id" = "s1"."user_id" where not ("s1"."name" != 'test'))`);
});

test('$every with populateWhere: infer', async () => {
  const mock = mockLogger(orm);

  const res = await orm.em.fork().find(
    User,
    {
      servers: {
        $every: {
          name: {
            $ne: 'test',
          },
        },
      },
    },
    {
      populate: ['servers'],
      populateWhere: 'infer',
    },
  );
  expect(res).toHaveLength(0);
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".*, "s1"."id" as "s1__id", "s1"."name" as "s1__name", "s1"."user_id" as "s1__user_id" from "user" as "u0" left join "server" as "s1" on "u0"."id" = "s1"."user_id" where "u0"."id" not in (select "u0"."id" from "user" as "u0" inner join "server" as "s1" on "u0"."id" = "s1"."user_id" where not ("s1"."name" != 'test'))`);
});

test('disallow $every on top level', async () => {
  await expect(orm.em.fork().find(
    User,
    {
      $every: {
        servers: {
          name: {
            $ne: 'test',
          },
        },
      },
    },
    {
      populate: ['servers'],
      populateWhere: 'infer',
    },
  )).rejects.toThrow('Collection operators can be used only inside a collection property context, but it was used for User.id.');
});

test('invalid query', async () => {
  const res = await orm.em.fork()
    .createQueryBuilder(User, 'user')
    .leftJoinAndSelect('user.servers', 'test')
    .select('user.id')
    .orderBy({
      id: 'DESC',
    })
    .limit(1)
    .getResultAndCount();
  expect(res[0]).toHaveLength(1);
  expect(res[1]).toBe(1);
});
