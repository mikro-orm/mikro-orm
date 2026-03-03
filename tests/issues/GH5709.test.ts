import { MikroORM, Type, Ref, Collection, QueryOrder } from '@mikro-orm/postgresql';

import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
class IntervalType extends Type<number, number | null | undefined> {
  getColumnType() {
    return `interval`;
  }

  override get runtimeType(): string {
    return 'number';
  }

  compareAsType(): string {
    return 'number';
  }

  convertToJSValueSQL(key: string) {
    return `(extract (epoch from ${key}::interval) * 1000)::int`;
  }

  convertToDatabaseValueSQL(key: string) {
    return `(${key} || 'milliseconds')::interval`;
  }
}

@Entity()
class User {
  @PrimaryKey()
  readonly id!: bigint;

  @OneToMany(() => Note, m => m.user)
  notes = new Collection<Note>(this);
}

@Entity()
class Note {
  @PrimaryKey()
  readonly id!: bigint;

  @Property({ type: IntervalType })
  start!: number;

  @ManyToOne(() => User, { ref: true })
  user!: Ref<User>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: 'gh-5709',
  });
  await orm.schema.refresh();

  orm.em.create(User, { id: 1n });
  orm.em.create(Note, { user: 1n, start: 123459 });
  orm.em.create(Note, { user: 1n, start: 123458 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('correctly build where condition with custom type', async () => {
  const query = orm.em
    .createQueryBuilder(User, 'user')
    .leftJoinAndSelect('notes', 'uNotes')
    .where({ 'user.id': 1n })
    .orderBy({ 'uNotes.start': QueryOrder.ASC });

  const res = await query.getSingleResult();
  expect(res!.notes[0].start).toBe(123458);
  expect(res!.notes[1].start).toBe(123459);
});
