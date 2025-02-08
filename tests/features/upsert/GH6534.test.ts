import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property()
  email!: string;

  @Property()
  created_at!: Date;

  @Property()
  image!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6534',
    password: 'Root.Root',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6534', async () => {
  const data = {
    username: 'john',
    email: 'johndoe@nowhere.com',
    image: 'https://test.com',
    created_at: new Date('2025-03-19 22:58:56.659'),
  };

  const mock = mockLogger(orm);
  const result = await orm.em.createQueryBuilder(User)
    .insert(data)
    .onConflict(['username', 'email'])
    .merge(['image', 'created_at'])
    .execute();

  expect(mock.mock.calls[0][0]).toMatch(`merge into [user] using (values (N'john', N'johndoe@nowhere.com', N'https://test.com', '2025-03-19 22:58:56.659')) as tsource([username], [email], [image], [created_at]) on [user].[username] = tsource.[username] and [user].[email] = tsource.[email] when not matched then insert ([username], [email], [image], [created_at]) values (tsource.[username], tsource.[email], tsource.[image], tsource.[created_at]) when matched then update set [image] = tsource.[image], [created_at] = tsource.[created_at] output inserted.[id]`);
});
