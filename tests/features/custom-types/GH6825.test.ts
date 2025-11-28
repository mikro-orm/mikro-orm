import { Collection, MikroORM, Type, ValidationError } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
class MyDateType extends Type<Date, string> {

  convertToDatabaseValue(value: Date | string | undefined): string {
    if (value instanceof Date) {
      return value.toISOString().substring(0, 10);
    }

    if (!value || value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value as string;
    }

    throw ValidationError.invalidType(MyDateType, value, 'JS');
  }

  convertToJSValue(value: Date | string | undefined): Date {
    if (!value || value instanceof Date) {
      return value as Date;
    }

    const date = new Date(value);

    if (date.toString() === 'Invalid Date') {
      throw ValidationError.invalidType(MyDateType, value, 'database');
    }

    return date;
  }

  getColumnType() {
    return 'date(10)';
  }

}

@Entity()
class User {

  @PrimaryKey()
  name!: string;

  @OneToMany(() => Range, address => address.user)
  ranges = new Collection<Range>(this);

}

@Entity()
class Range {

  @PrimaryKey({ type: MyDateType })
  from!: Date;

  @PrimaryKey({ type: MyDateType })
  to!: Date;

  @ManyToOne(() => User)
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('implicit transaction', async () => {
  orm.em.create(Range, {
    user: orm.em.create(User, { name: 'Nik1' }),
    from: new Date('2023-01-01'),
    to: new Date('2023-01-02'),
  });
  await orm.em.flush();
  const count = await orm.em.count(Range, { from: new Date('2023-01-01') });
  expect(count).toBe(1);
});

test('explicit transaction', async () => {
  await orm.em.transactional(() => {
    orm.em.create(Range, {
      user: orm.em.create(User, { name: 'Nik2' }),
      from: new Date('2023-01-03'),
      to: new Date('2023-01-04'),
    });
  });
  const count = await orm.em.count(Range, { from: new Date('2023-01-03') });
  expect(count).toBe(1);
});
