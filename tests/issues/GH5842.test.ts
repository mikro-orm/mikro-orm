import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, Index, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Record {

  @PrimaryKey()
  createdAt: Date;

  @ManyToOne(() => User)
  createdByUser: User;

  @Index()
  @Property({ nullable: true })
  unlockedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  unlockedByUser: User | null;

  constructor(
    createdAt: Date,
    createdByUser: User,
    unlockedAt: Date | null,
    unlockedByUser: User | null,
  ) {
    this.createdAt = createdAt;
    this.createdByUser = createdByUser;
    this.unlockedAt = unlockedAt;
    this.unlockedByUser = unlockedByUser;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Record],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  orm.em.create(User, { name: 'Foo' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { name: 'Foo' });
  orm.em.create(Record, {
    createdAt: new Date('2024-07-18T10:00:00.838Z'),
    createdByUser: user,
    unlockedAt: new Date(),
    unlockedByUser: user,
  });
  orm.em.create(Record, {
    createdAt: new Date('2024-07-18T10:00:00.514Z'),
    createdByUser: user,
    unlockedAt: null,
    unlockedByUser: null,
  });
  await orm.em.flush();
  orm.em.clear();

  const records = await orm.em.find(
    Record,
    {},
    {
      fields: [
        'createdAt',
        'createdByUser.name',
        'unlockedAt',
        'unlockedByUser.name',
      ],
      orderBy: [{ createdAt: -1 }],
    },
  );
  expect(records.length).toBe(2);
  orm.em.remove(user);
  orm.em.remove(records);
  await orm.em.flush();
});
