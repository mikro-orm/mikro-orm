import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity({ inheritance: 'tpt' })
abstract class Parent {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class Child extends Parent {
  @Property({ type: 'string' })
  code!: string;
}

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child],
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_tpt_identity_insert',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});
beforeEach(() => orm.schema.clear({ truncate: false }));
afterAll(() => orm.close(true));

test.each([false, true])('only enables IDENTITY_INSERT for the table owning the identity (many=%s)', async many => {
  for (const revision of [1, 2]) {
    const em = orm.em.fork();
    const input = [1, 2].map(id => ({ id, name: `Parent ${revision}`, code: `Child ${revision}` }));
    const mock = mockLogger(orm);
    const children = many ? await em.upsertMany(Child, input) : [await em.upsert(Child, input[0])];
    expect(mock.mock.calls.some(([query]) => (query as string).includes('set identity_insert [parent] on'))).toBe(true);
    expect(mock.mock.calls.some(([query]) => (query as string).includes('set identity_insert [child] on'))).toBe(false);
    for (const child of children) {
      expect(child).toMatchObject(input.find(row => row.id === child.id)!);
      expect(await em.fork().findOneOrFail(Child, child.id)).toMatchObject(child);
    }
    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  }
});
