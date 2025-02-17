import {
  Entity,
  MikroORM,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Unique,
} from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers.js';

@Entity({ tableName: 'TestEntityTable' })
@Unique({
  name: 'Unique_TestEntityTable_RevisionID_UserID',
  properties: ['RevisionID', 'UserID'],
})
export class TestEntity {

  [PrimaryKeyProp]?: 'DeliveryID';

  @PrimaryKey({
    fieldName: 'DeliveryID',
    type: 'uuid',
    defaultRaw: `newid()`,
  })
  DeliveryID!: string;

  @Property({
    fieldName: 'RevisionID',
    type: 'string',
  })
  RevisionID!: string;

  @Property({
    fieldName: 'UserID',
    type: 'string',
  })
  UserID!: string;

  @Property({ fieldName: 'Title' })
  Title!: string;

  @Property({ fieldName: 'StartDate', type: 'date' })
  StartDate!: string;

  @Property({ fieldName: 'EndDate', type: 'date' })
  EndDate!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TestEntity],
    dbName: '6390',
    password: 'Root.Root',
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6390', async () => {
  const mock = mockLogger(orm);
  const upsert1 = await orm.em.upsertMany(TestEntity, [
    {
      EndDate: '2022-01-01',
      StartDate: '2022-01-01',
      Title: 'Test',
      UserID: 'Test',
      RevisionID: 'Test',
    },
    {
      EndDate: '2022-01-01',
      StartDate: '2022-01-01',
      Title: 'Test',
      UserID: 'User 2',
      RevisionID: 'Test',
    },
  ]);

  const upsert2 = await orm.em.upsertMany(TestEntity, [
    {
      EndDate: '2022-01-01',
      StartDate: '2022-01-01',
      Title: 'Test',
      UserID: 'Test',
      RevisionID: 'Test',
    },
    {
      EndDate: '2022-01-01',
      StartDate: '2022-01-01',
      Title: 'Test',
      UserID: 'User 2',
      RevisionID: 'Test',
    },
  ]);

  expect(upsert1).toHaveLength(2);
  expect(upsert2).toHaveLength(2);

  expect(mock.mock.calls[0][0]).toMatch(`merge into [TestEntityTable] using (values ('2022-01-01', '2022-01-01', N'Test', N'Test', N'Test'), ('2022-01-01', '2022-01-01', N'Test', N'User 2', N'Test')) as tsource([EndDate], [StartDate], [Title], [UserID], [RevisionID]) on [TestEntityTable].[RevisionID] = tsource.[RevisionID] and [TestEntityTable].[UserID] = tsource.[UserID] when not matched then insert ([EndDate], [StartDate], [Title], [UserID], [RevisionID]) values (tsource.[EndDate], tsource.[StartDate], tsource.[Title], tsource.[UserID], tsource.[RevisionID]) when matched then update set [EndDate] = tsource.[EndDate], [StartDate] = tsource.[StartDate], [Title] = tsource.[Title] output inserted.[DeliveryID];`);
  expect(mock.mock.calls[1][0]).toMatch(`merge into [TestEntityTable] using (values ('2022-01-01', '2022-01-01', N'Test', N'Test', N'Test'), ('2022-01-01', '2022-01-01', N'Test', N'User 2', N'Test')) as tsource([EndDate], [StartDate], [Title], [UserID], [RevisionID]) on [TestEntityTable].[RevisionID] = tsource.[RevisionID] and [TestEntityTable].[UserID] = tsource.[UserID] when not matched then insert ([EndDate], [StartDate], [Title], [UserID], [RevisionID]) values (tsource.[EndDate], tsource.[StartDate], tsource.[Title], tsource.[UserID], tsource.[RevisionID]) when matched then update set [EndDate] = tsource.[EndDate], [StartDate] = tsource.[StartDate], [Title] = tsource.[Title] output inserted.[DeliveryID];`);
});
