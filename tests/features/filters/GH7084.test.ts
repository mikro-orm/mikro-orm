import { MikroORM } from '@mikro-orm/postgresql';
import {
  Embeddable,
  Embedded,
  Entity,
  Filter,
  ReflectMetadataProvider,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class ValidRange {
  @Property({ columnType: 'timestamptz' })
  validBegin: Date;

  @Property({ nullable: true, columnType: 'timestamptz' })
  validEnd: Date | null;

  constructor(validBegin: Date, validEnd: Date | null) {
    this.validBegin = validBegin;
    this.validEnd = validEnd;
  }
}

@Filter({
  name: 'validAt',
  cond: async ({ timestamp }) => {
    return {
      validRange: {
        validBegin: { $lte: timestamp },
      },
      $or: [{ validRange: { validEnd: { $exists: false } } }, { validRange: { validEnd: { $gt: timestamp } } }],
    };
  },
})
@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Embedded(() => ValidRange)
  validRange: ValidRange;

  constructor(name: string, email: string, validRange: { validBegin: Date; validEnd: Date | null }) {
    this.name = name;
    this.email = email;
    this.validRange = validRange;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7084',
    entities: [User, ValidRange],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('Lookup by id and filter - invalid results', async () => {
  const user = orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    validRange: {
      validBegin: new Date('2026-01-01T00:00:00Z'),
      validEnd: new Date('2026-02-01T00:00:00Z'),
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const invalidDate = new Date('2026-02-10T00:00:00Z');
  const validDate = new Date('2026-01-15T00:00:00Z');

  // returns nothing as filter does not match
  const userFoo1 = await orm.em.findOne(User, { id: user.id }, { filters: { validAt: { timestamp: invalidDate } } });
  expect(userFoo1).toBeNull();

  // returns something as filter matches
  const userFoo2 = await orm.em.findOne(
    User,
    { id: user.id },
    {
      filters: { validAt: { timestamp: validDate } },
    },
  );
  expect(userFoo2).not.toBeNull();

  // FAILS - should return nothing as filter does not match
  const userFoo3 = await orm.em.findOne(User, { id: user.id }, { filters: { validAt: { timestamp: invalidDate } } });
  expect(userFoo3).toBeNull();
});
