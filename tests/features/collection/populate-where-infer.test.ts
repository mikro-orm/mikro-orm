import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
  wrap,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Location, { ref: true })
  location!: Ref<Location>;

  @OneToMany(() => Server, x => x.user)
  servers = new Collection<Server>(this);

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  data: any;

}

@Entity()
class Server {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;

  @ManyToOne(() => Location, { ref: true })
  location!: Ref<Location>;

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

@Entity()
class ServerProvisioning {

  @PrimaryKey()
  readonly id!: number;

  @ManyToOne(() => ServerOrder, { ref: true })
  serverOrder!: Ref<ServerOrder>;

}

@Entity()
class ServerOrder {

  @PrimaryKey()
  readonly id!: number;

  @ManyToOne(() => Server, { ref: true })
  server!: Ref<Server>;

  @OneToMany(() => ServerProvisioning, x => x.serverOrder)
  serverProvisionings = new Collection<ServerProvisioning>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'coll-operators-1',
    entities: [User, ServerProvisioning],
  });
  await orm.schema.refreshDatabase();

  const location = orm.em.create(Location, {
    location: 'loc name',
  });
  const u1 = orm.em.create(User, {
    id: 1,
    location,
    servers: [
      { id: 2, name: 's2', location },
      { id: 3, name: 'test', location },
    ],
    name: 'u1',
    data: { foo: 'bar' },
  });
  const server = orm.em.create(Server, {
    id: 1,
    name: 's1',
    location,
    user: u1,
  });
  orm.em.create(ServerProvisioning, {
    serverOrder: { server },
  });
  orm.em.create(User, {
    id: 2,
    location: {
      location: 'test',
    },
    servers: [
      { id: 4, name: 'test', location },
    ],
    name: 'u2',
    data: { foo: 'baz' },
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
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".*, "s1"."id" as "s1__id", "s1"."name" as "s1__name", "s1"."user_id" as "s1__user_id", "s1"."location_id" as "s1__location_id" from "user" as "u0" left join "server" as "s1" on "u0"."id" = "s1"."user_id" where "u0"."id" not in (select "u0"."id" from "user" as "u0" inner join "server" as "s1" on "u0"."id" = "s1"."user_id" where not ("s1"."name" != 'test'))`);
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
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".*, "s1"."id" as "s1__id", "s1"."name" as "s1__name", "s1"."user_id" as "s1__user_id", "s1"."location_id" as "s1__location_id" from "user" as "u0" left join "server" as "s1" on "u0"."id" = "s1"."user_id" where "u0"."id" not in (select "u0"."id" from "user" as "u0" inner join "server" as "s1" on "u0"."id" = "s1"."user_id" where not ("s1"."name" != 'test'))`);
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
  expect(res[1]).toBe(2);
});

test('invalid query 2', async () => {
  const query = orm.em.createQueryBuilder(User, 'user')
    .clone()
    .where({
      location: {
        location: 'loc name',
      },
    });

  expect(query.getFormattedQuery()).toBe(`select "user".* from "user" as "user" left join "location" as "l1" on "user"."location_id" = "l1"."id" where "l1"."location" = 'loc name'`);
  const res = await query.getResult();
  expect(res).toHaveLength(1);
});

test('invalid query 3', async () => {
  const mock = mockLogger(orm);
  const [users, count] = await orm.em.fork()
    .createQueryBuilder(User)
    .select('*')
    .where({ data: { foo: { $ne: null } } })
    .leftJoinAndSelect('servers', 's')
    .limit(1)
    .getResultAndCount();

  expect(users).toHaveLength(1);
  expect(users[0].servers).toHaveLength(3);
  expect(count).toBe(2);
  expect(mock.mock.calls[0][0]).toMatch(`select "u0".*, "s"."id" as "s__id", "s"."name" as "s__name", "s"."user_id" as "s__user_id", "s"."location_id" as "s__location_id" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."id" in (select "u0"."id" from (select "u0"."id" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."data"->>'foo' is not null group by "u0"."id" limit 1) as "u0")`);
  expect(mock.mock.calls[1][0]).toMatch(`select count(distinct "u0"."id") as "count" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."data"->>'foo' is not null`);

  const [users2, count2] = await orm.em.fork()
    .createQueryBuilder(User)
    .select('*')
    .where({ data: { foo: { $ne: null } } })
    .leftJoinAndSelect('servers', 's')
    .limit(3)
    .getResultAndCount();

  expect(users2).toHaveLength(2);
  expect(users2[0].servers).toHaveLength(3);
  expect(users2[1].servers).toHaveLength(1);
  expect(count2).toBe(2);
  expect(mock.mock.calls[2][0]).toMatch(`select "u0".*, "s"."id" as "s__id", "s"."name" as "s__name", "s"."user_id" as "s__user_id", "s"."location_id" as "s__location_id" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."id" in (select "u0"."id" from (select "u0"."id" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."data"->>'foo' is not null group by "u0"."id" limit 3) as "u0")`);
  expect(mock.mock.calls[3][0]).toMatch(`select count(distinct "u0"."id") as "count" from "user" as "u0" left join "server" as "s" on "u0"."id" = "s"."user_id" where "u0"."data"->>'foo' is not null`);
});

test('invalid query 4', async () => {
  const mock = mockLogger(orm);
  const results = await orm.em.fork().find(
    Server,
    {
      user: {
        $or: [
          {
            name: 'u1',
          },
          {
            id: null,
          },
        ],
      },
    },
    {
      populate: ['user'],
      populateWhere: 'infer',
      logging: { enabled: true },
    },
  );
  expect(results[3].user).toBeNull();
  expect(mock.mock.calls).toHaveLength(1);
  expect(mock.mock.calls[0][0]).toMatch(`select "s0".*, "u1"."id" as "u1__id", "u1"."location_id" as "u1__location_id", "u1"."name" as "u1__name", "u1"."data" as "u1__data" from "server" as "s0" left join "user" as "u1" on "s0"."user_id" = "u1"."id" and ("u1"."name" = 'u1' or "u1"."id" is null) where ("u1"."name" = 'u1' or "u1"."id" is null)`);
});

test('invalid query 5/1', async () => {
  const results = await orm.em
    .fork()
    .createQueryBuilder(ServerProvisioning, 'serverProvisioning')
    .leftJoinAndSelect('serverProvisioning.serverOrder', 'serverOrder')
    .leftJoinAndSelect('serverOrder.server', 'server')
    .leftJoinAndSelect('server.location', 'location')
    .getResult();

  expect(wrap(results[0]).toObject()).toEqual({
    id: 1,
    serverOrder: {
      id: 1,
      server: {
        id: 1,
        name: 's1',
        user: 1,
        location: {
          id: 1,
          location: 'loc name',
        },
      },
    },
  });
});

test('invalid query 5/2', async () => {
  const results = await orm.em
    .fork()
    .find(ServerProvisioning, {}, {
      populate: ['serverOrder.server.location'],
    });

  expect(wrap(results[0]).toObject()).toEqual({
    id: 1,
    serverOrder: {
      id: 1,
      server: {
        id: 1,
        name: 's1',
        user: 1,
        location: {
          id: 1,
          location: 'loc name',
        },
      },
    },
  });
});
