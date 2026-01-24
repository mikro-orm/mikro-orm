import { Entity, MikroORM, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

// Simple encryption simulation - in reality this would be actual crypto
// The key behavior: encrypt('foo') -> 'enc:foo', decrypt('enc:foo') -> 'foo'
function encrypt(value: string): string {
  return `enc:${value}`;
}

function decrypt(value: string): string {
  if (!value.startsWith('enc:')) {
    throw new Error(`Cannot decrypt value that is not encrypted: ${value}`);
  }
  return value.slice(4);
}

class EncryptedType extends Type<string, string> {

  convertToDatabaseValue(value: string): string {
    return encrypt(value);
  }

  convertToJSValue(value: string): string {
    return decrypt(value);
  }

  getColumnType(): string {
    return 'text';
  }

}

@Entity()
class EntityWithEncryptedProp {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string = 'test';

  @Property({ type: EncryptedType })
  secret!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [EntityWithEncryptedProp],
    dbName: ':memory:',
    driver: BetterSqliteDriver,
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));

describe('result cache with custom types (GH 7112)', () => {

  test('custom type with encrypt/decrypt should work with cache', async () => {
    const entity = new EntityWithEncryptedProp();
    entity.secret = 'my-secret-value';
    await orm.em.persistAndFlush(entity);
    orm.em.clear();

    const mockLog = mockLogger(orm, ['query']);

    // First query - from database
    const res1 = await orm.em.findOneOrFail(EntityWithEncryptedProp, 1, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1);
    expect(res1.secret).toBe('my-secret-value'); // decrypted
    orm.em.clear();

    // Second query - should hit cache and still return decrypted value
    const res2 = await orm.em.findOneOrFail(EntityWithEncryptedProp, 1, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res2.secret).toBe('my-secret-value'); // should still be decrypted
  });

  test('custom type with find should work with cache', async () => {
    const entity1 = new EntityWithEncryptedProp();
    entity1.secret = 'secret-1';
    const entity2 = new EntityWithEncryptedProp();
    entity2.secret = 'secret-2';
    await orm.em.persistAndFlush([entity1, entity2]);
    orm.em.clear();

    const mockLog = mockLogger(orm, ['query']);

    // First query - from database
    const res1 = await orm.em.find(EntityWithEncryptedProp, {}, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1);
    expect(res1.map(e => e.secret)).toEqual(['secret-1', 'secret-2']);
    orm.em.clear();

    // Second query - should hit cache
    const res2 = await orm.em.find(EntityWithEncryptedProp, {}, { cache: 50 });
    expect(mockLog.mock.calls).toHaveLength(1); // cache hit, no new query fired
    expect(res2.map(e => e.secret)).toEqual(['secret-1', 'secret-2']);
  });

});
