import { Cascade, Entity, OneToOne, PrimaryKey, PrimaryKeyProp, Property, Ref, sql } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { randomUUID } from 'node:crypto';

@Entity()
class NonRoot {

  @PrimaryKey()
  id!: string;

  @OneToOne(() => Root, {
    owner: true,
    primary: true,
    ref: true,
  })
  root!: Ref<Root>;

  [PrimaryKeyProp]?: ['id', 'root'];

}

@Entity()
class Root {

  @PrimaryKey()
  id!: string;

  @Property({ default: sql.now() })
  createdAt?: Date;

  @OneToOne(() => NonRoot, nonRoot => nonRoot.root, {
    cascade: [Cascade.ALL],
  })
  nonRoot!: NonRoot;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'gh4377',
    port: 3308,
    entities: [Root, NonRoot],
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

it('persistAndFlush() should cascade-insert a Root entity and its related NonRoot entity', async () => {
  const nonRoot = new NonRoot();
  nonRoot.id = randomUUID();

  const root = new Root();
  root.id = randomUUID();
  root.nonRoot = nonRoot;

  await orm.em.persistAndFlush(root);
});
