import { Entity, PrimaryKey, MikroORM, Enum, OneToOne, Rel } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Readable)
  readable!: Rel<Readable>;

}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
abstract class Readable {

  @PrimaryKey()
  id!: number;

  @Enum()
  type!: 'book' | 'magazine';

  @OneToOne(() => User, user => user.readable)
  user!: User;

}

@Entity({ discriminatorValue: 'book' })
class Book extends Readable {}

@Entity({ discriminatorValue: 'magazine' })
class Magazine extends Readable {}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Book, Magazine],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('should allow relation to STI', async () => {
  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toMatch("create table `readable` (`id` integer not null primary key autoincrement, `type` text check (`type` in ('book', 'magazine')) not null);");
});
