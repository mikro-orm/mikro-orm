import { MikroORM, ArrayType, Entity, JsonType, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

type Child = {
  email: string;
};

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, type: JsonType })
  children?: Child[];

  @Property({ type: ArrayType, nullable: true, persist: true, hydrate: true })
  get childEmails(): string[] | undefined {
    return this.children?.map(c => c.email.toLowerCase()).filter(e => !!e);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6723',
    entities: [User],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(User, {
    children: [{
      email: 'test@example.com',
    }],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('should not try to persist persisted getter if its value has not changed', async () => {
  const r = await orm.em.findAll(User);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
