import {
  Entity,
  MikroORM,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
  SimpleLogger,
  PrimaryKeyProp,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';
import { Mock } from 'vitest';

@Entity()
class Vendor {

  @PrimaryKey()
  id!: number;

  @Property()
  prop!: string;

}

@Entity()
class TechnicianManager {

  [PrimaryKeyProp]?: ['vendor', 'user'];

  @ManyToOne({ entity: () => Vendor, primary: true })
  vendor!: Vendor;

  @OneToOne({ entity: () => User, primary: true })
  user!: Rel<User>;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => TechnicianManager, tm => tm.user)
  technicianManager!: TechnicianManager;

}

describe('GH issue 3669', () => {

  let orm: MikroORM;
  let loggerMock: Mock;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TechnicianManager],
      dbName: 'mikro_orm_test_3669',
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.refreshDatabase();
    orm.em.create(User, {
      id: 1,
      technicianManager: {
        user: 1,
        vendor: { id: 2, prop: 'p' },
      },
    });
    await orm.em.flush();
    loggerMock = mockLogger(orm);
  });

  beforeEach(() => loggerMock.mockReset());

  afterAll(() => orm.close(true));

  test('$not operator on 1:1 inverse side', async () => {
    await expect(orm.em.find(User, { $not: { technicianManager: null } })).resolves.toHaveLength(1);
    expect(loggerMock.mock.calls).toEqual([[
      '[query] select "u0".*, "t1"."vendor_id" as "t1__vendor_id", "t1"."user_id" as "t1__user_id" from "user" as "u0" left join "technician_manager" as "t1" on "u0"."id" = "t1"."user_id" where not (("t1"."vendor_id", "t1"."user_id") is null)',
    ]]);
  });

  test('$ne operator on 1:1 inverse side', async () => {
    await expect(orm.em.find(User, { technicianManager: { $ne: null } })).resolves.toHaveLength(1);
    expect(loggerMock.mock.calls).toEqual([[
      '[query] select "u0".*, "t1"."vendor_id" as "t1__vendor_id", "t1"."user_id" as "t1__user_id" from "user" as "u0" left join "technician_manager" as "t1" on "u0"."id" = "t1"."user_id" where ("t1"."vendor_id", "t1"."user_id") is not null',
    ]]);
  });

  test('$eq operator on 1:1 inverse side', async () => {
    await expect(orm.em.find(User, { technicianManager: { $eq: null } })).resolves.toEqual([]);
    expect(loggerMock.mock.calls).toEqual([[
      '[query] select "u0".*, "t1"."vendor_id" as "t1__vendor_id", "t1"."user_id" as "t1__user_id" from "user" as "u0" left join "technician_manager" as "t1" on "u0"."id" = "t1"."user_id" where ("t1"."vendor_id", "t1"."user_id") is null',
    ]]);
  });

  test('compare null to 1:1 inverse side', async () => {
    await expect(orm.em.find(User, { technicianManager: null })).resolves.toEqual([]);
    expect(loggerMock.mock.calls).toEqual([[
      '[query] select "u0".*, "t1"."vendor_id" as "t1__vendor_id", "t1"."user_id" as "t1__user_id" from "user" as "u0" left join "technician_manager" as "t1" on "u0"."id" = "t1"."user_id" where ("t1"."vendor_id", "t1"."user_id") is null',
    ]]);
  });

  test('compare array PK to 1:1 inverse side', async () => {
    await expect(orm.em.find(User, { technicianManager: [2, 1] })).resolves.toHaveLength(1);
    expect(loggerMock.mock.calls).toEqual([[
      '[query] select "u0".*, "t1"."vendor_id" as "t1__vendor_id", "t1"."user_id" as "t1__user_id" from "user" as "u0" left join "technician_manager" as "t1" on "u0"."id" = "t1"."user_id" where ("t1"."vendor_id", "t1"."user_id") = (2, 1)',
    ]]);
  });

});
