import { Entity, Enum, MikroORM, PrimaryKey } from '@mikro-orm/postgresql';

enum UserType {
  Personal = 'personal',
  Organization = 'organization',
}

@Entity({ tableName: 'user' })
class User0 {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => UserType, default: UserType.Personal })
  type = UserType.Personal;

  @Enum({ items: () => UserType })
  type2!: UserType;

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => UserType, default: UserType.Personal, nativeEnumName: 'user_type' })
  type = UserType.Personal;

  @Enum({ items: () => UserType, nativeEnumName: 'user_type' })
  type2!: UserType;

}

@Entity({ tableName: 'user' })
class User2 {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => UserType, default: UserType.Personal, nativeEnumName: 'user_type' })
  type = UserType.Personal;

  @Enum({ items: () => UserType, nativeEnumName: 'user_type' })
  type2!: UserType;

  @Enum({ items: () => UserType, nativeEnumName: 'user_type' })
  type3!: UserType;

}

enum UserType2 {
  Personal = 'Personal',
  Org = 'org',
}

@Entity({ tableName: 'user' })
class User3 {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => UserType2, default: UserType2.Personal, nativeEnumName: 'user_type' })
  type = UserType2.Personal;

  @Enum({ items: () => UserType2, nativeEnumName: 'user_type' })
  type2!: UserType2;

  @Enum({ items: () => UserType2, nativeEnumName: 'user_type' })
  type3!: UserType2;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User0],
    dbName: `mikro_orm_native_enum2`,
  });

  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
});

afterAll(() => orm.close());

test('diffing native enums in postgres', async () => {
  const testMigration = async (e1: any, e2: any, snap: string) => {
    if (e2) {
      orm.getMetadata().reset(e1.name);
      await orm.discoverEntity(e2);
    }

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff).toMatchSnapshot(snap);
    await orm.schema.execute(diff.up);

    return diff.down;
  };

  const down: string[] = [];
  down.push(await testMigration(User0, undefined, '0. create schema with check enum'));
  down.push(await testMigration(User0, User1, '1. convert to native enum'));
  down.push(await testMigration(User1, User2, '2. add another enum of same type'));
  down.push(await testMigration(User2, User3, '3. change enum items'));

  for (const sql of down.reverse()) {
    await orm.schema.execute(sql);
  }
});
