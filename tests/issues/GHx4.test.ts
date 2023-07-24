import { Entity, MikroORM, PrimaryKey, Property, raw } from '@mikro-orm/sqlite';

@Entity()
class Job {

  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'DateCompleted', nullable: true })
  dateCompleted?: Date | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [Job],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

it('raw fragments with findAndCount', async () => {
  await orm.em.findAndCount(Job, {
    dateCompleted: { $ne: null },
    [raw(alias => `${alias}.DateCompleted`)]: '2023-07-24',
  });
});
