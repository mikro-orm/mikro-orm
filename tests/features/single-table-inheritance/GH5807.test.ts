import { MikroORM, Entity, Opt, BaseEntity, Enum, PrimaryKey } from '@mikro-orm/sqlite';

enum Discriminator {
  B = 'b',
  C = 'c',
}

enum BType {
  TYPE_1 = 'type-1',
  TYPE_2 = 'type-2',
  TYPE_3 = 'type-3',
}

enum CType {
  TYPE_2 = 'type-2',
  TYPE_3 = 'type-3',
  TYPE_4 = 'type-4',
}

@Entity({ discriminatorColumn: 'discriminator', abstract: true })
class A extends BaseEntity {

  @PrimaryKey()
  readonly id!: number;

  @Enum(() => Discriminator)
  discriminator!: Opt<Discriminator>;

}

@Entity({ discriminatorValue: Discriminator.B })
class B extends A {

  @Enum(() => BType)
  type!: BType;

}

@Entity({ discriminatorValue: Discriminator.C })
class C extends A {

  @Enum(() => CType)
  type!: CType;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A, B, C],
    dbName: ':memory:',
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('correctly build migration for enum type', async () => {
  const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(diff.trim()).toEqual(
    'create table `a` (`id` integer not null primary key autoincrement, `discriminator` text check (`discriminator` in (\'b\', \'c\')) not null, `type` text check (`type` in (\'type-1\', \'type-2\', \'type-3\', \'type-4\')) null);\n' +
    'create index `a_discriminator_index` on `a` (`discriminator`);',
  );
});
