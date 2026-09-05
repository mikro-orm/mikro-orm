import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/decorators/legacy';
import { QueryOrder } from '@mikro-orm/core';
import { Collection, MikroORM, ObjectId } from '@mikro-orm/mongodb';

@Entity()
class Team {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToMany(() => User, user => user.team)
  users = new Collection<User>(this);
}

@Entity()
class User {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ nullable: true })
  age?: number;

  @ManyToOne(() => Team)
  team!: Team;
}

describe('orderBy with nulls ordering (mongo)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Team],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-order-by-nulls',
    });
    await orm.schema.clear();

    const team = orm.em.create(Team, { name: 't1' });
    orm.em.create(User, { name: 'a', age: 10, team });
    orm.em.create(User, { name: 'b', age: 20, team });
    orm.em.create(User, { name: 'c', age: 30, team });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  beforeEach(() => orm.em.clear());

  test.each([
    QueryOrder.ASC_NULLS_FIRST,
    QueryOrder.ASC_NULLS_LAST,
    QueryOrder.asc_nulls_first,
    QueryOrder.asc_nulls_last,
  ])('find() with %s sorts ascending', async direction => {
    const users = await orm.em.find(User, {}, { orderBy: { age: direction } });
    expect(users.map(u => u.age)).toEqual([10, 20, 30]);
  });

  test.each([
    QueryOrder.DESC_NULLS_FIRST,
    QueryOrder.DESC_NULLS_LAST,
    QueryOrder.desc_nulls_first,
    QueryOrder.desc_nulls_last,
  ])('find() with %s sorts descending', async direction => {
    const users = await orm.em.find(User, {}, { orderBy: { age: direction } });
    expect(users.map(u => u.age)).toEqual([30, 20, 10]);
  });

  test('aggregate $sort path (populate with limit) respects the nulls qualifier direction', async () => {
    const teams = await orm.em.find(
      Team,
      {},
      {
        populate: ['users'],
        populateHints: {
          users: { limit: 2, orderBy: { age: QueryOrder.ASC_NULLS_FIRST } },
        },
      },
    );

    expect(teams[0].users.getItems().map(u => u.age)).toEqual([10, 20]);
  });
});
