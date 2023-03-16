import { Entity, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

class RailsArrayType extends Type<string[], string> {

  convertToDatabaseValue(values: string[]): string {
    if (!values) {
      return null!;
    }

    // Convert to Set and back to Array to remove duplicates
    return ['---', ...[...new Set(values)].map(value => `- ${value}`)].join('\n');
  }

  convertToJSValue(value: string): string[] {
    if (!value) {
      return [];
    }

    return [...value.matchAll(/\n- (.*)/g)].map(matches => matches[1]);
  }

  getColumnType(): string {
    return 'text';
  }

}

@Entity()
class LegacyUser {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property({
    type: RailsArrayType,
    nullable: true,
  })
  teams?: string[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [LegacyUser],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('GH #4133', async () => {
  const u1 = new LegacyUser();
  u1.username = 'test';
  u1.teams = ['engineering', 'product'];

  const u2 = new LegacyUser();
  u2.username = 'test';
  u2.teams = ['engineering', 'product'];

  await orm.em.persistAndFlush([u1, u2]);
  orm.em.clear();

  const [user1, user2] = await orm.em.find(LegacyUser, {});
  expect(user1.username).toEqual('test');
  expect(user2.username).toEqual('test');
});
