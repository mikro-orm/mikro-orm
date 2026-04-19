import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// GH #7570 - Cannot set TPT entity indexes (and unique indexes) on TPT leaf properties

@Entity({ inheritance: 'tpt' })
abstract class Person7570 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
@Index({ properties: ['department'] })
@Unique({ properties: ['employeeId'] })
class Employee7570 extends Person7570 {
  @Property()
  department!: string;

  @Property()
  employeeId!: string;
}

test('GH #7570 - TPT leaf entity indexes on own properties', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Person7570, Employee7570],
  });

  const diff = await orm.schema.getCreateSchemaSQL();
  expect(diff).toContain('index `employee7570_department_index`');
  expect(diff).toContain('unique index `employee7570_employee_id_unique`');

  await orm.close();
});
