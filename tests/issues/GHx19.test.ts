import { BaseEntity, Entity, LoadStrategy, LockMode, ManyToOne, MikroORM, OneToMany, PopulateHint, PrimaryKey, Property, Ref } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Client extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => AccountNotes, note => note.client)
  note!: Ref<AccountNotes>;

}

@Entity()
class AccountNotes extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  noteText!: string;

  @ManyToOne(() => Client)
  client!: Ref<Client>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'ghx19',
    entities: [Client, AccountNotes],
    forceUndefined: true,
    populateWhere: PopulateHint.INFER,
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.refreshDatabase();
  orm.em.create(Client, {
    id: 123,
    note: {
      id: 1,
      noteText: 'test note',
    },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('pagination and "for update" lock', async () => {
  const mock = mockLogger(orm);
  const res = await orm.em.transactional(async () => {
    return await orm.em.find(
      Client,
      {
        id: 123,
        note: {
          $every: {
            id: 1,
          },
        },
      },
      {
        populate: ['note'],
        lockMode: LockMode.PESSIMISTIC_WRITE,
        lockTableAliases: ['c0'],
        limit: 1,
      },
    );
  });
  expect(res).toHaveLength(1);
  expect(res[0].note).toHaveLength(1);
  expect(mock.mock.calls).toHaveLength(3);
  expect(mock.mock.calls[1][0]).toMatch('for update of "c0"');
});
