import { BigIntType, Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ abstract: true })
abstract class BaseEntity {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @Property({ onUpdate: () => new Date() })
  modifiedAt: Date = new Date();

}

@Entity()
class User extends BaseEntity {

  constructor(name: string) {
    super();
    this.name = name;
  }

  @Property()
  name: string;

}

@Entity()
class Position extends BaseEntity {

  constructor(name: string) {
    super();
    this.name = name;
  }

  @Property()
  name: string;

}

@Entity()
class PositionBookmark extends BaseEntity {

  constructor(user: User, position: Position) {
    super();
    this.user = user;
    this.position = position;
  }

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Position)
  position: Position;

}

describe('GH issue 1038', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BaseEntity, User, Position, PositionBookmark],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => await orm.close(true));

  test('If the PrimaryKey is BigIntType, user and Position will be updated unnecessarily', async () => {
    const user1 = new User('user1');
    const position1 = new Position('position1');
    await orm.em.persistAndFlush([user1, position1]);
    const originUserModifiedAt = user1.modifiedAt;

    const positionBookmark = new PositionBookmark(user1, position1);
    await orm.em.persistAndFlush([positionBookmark]);

    const user = await orm.em.findOneOrFail(User, { name: user1.name });
    expect(user.modifiedAt).toBe(originUserModifiedAt);
  });

});
