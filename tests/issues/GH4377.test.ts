import { Cascade, Entity, OneToOne, PrimaryKey, PrimaryKeyType, Property, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { randomUUID } from 'crypto';

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

  [PrimaryKeyType]?: [string, string];

}

@Entity()
class Root {

  @PrimaryKey()
  id!: string;

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
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
