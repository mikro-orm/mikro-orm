import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

}

@Entity()
class B {

  @PrimaryKey()
  id!: string;

}

let orm: MikroORM;
const types: string[][] = [];

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A, B],
    dbName: `:memory:`,
    subscribers: [{
      onFlush: args => {
        const changeSets = args.uow.getChangeSets();
        types.push(changeSets.map(cs => cs.type));
      },
    }],
  });

  await orm.schema.ensureDatabase();
});

beforeEach(async () => {
  await orm.schema.dropSchema();
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('GH #4895', async () => {
  await orm.em.transactional(async em => {
    em.create(A, { id: '1a' });
    em.remove(em.getReference(B, '1a'));
  });

  await orm.em.transactional(async em => {
    em.create(A, { id: '2a' });
    em.remove(em.getReference(B, '2b'));
  });

  expect(types).toEqual([
    ['create', 'delete'],
    ['create', 'delete'],
  ]);
});
