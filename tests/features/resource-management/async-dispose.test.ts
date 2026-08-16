import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey({ type: 'number' })
  id!: number;
}

test('MikroORM instance implements Symbol.asyncDispose', async () => {
  const orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.connect();

  await expect(orm.isConnected()).resolves.toBe(true);

  // node 22 lacks native `await using` syntax, so we call the dispose method explicitly
  await orm[Symbol.asyncDispose]();

  await expect(orm.isConnected()).resolves.toBe(false);
});
