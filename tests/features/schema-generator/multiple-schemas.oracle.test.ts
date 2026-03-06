import { DatabaseSchema, MikroORM } from '@mikro-orm/oracledb';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'author', schema: 's1' })
class Author0 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Author0, undefined, { nullable: true })
  mentor?: Author0;
}

@Entity({ tableName: 'book', schema: 's2' })
class Book0 {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0)
  author!: Author0;

  @ManyToOne(() => Book0, { nullable: true })
  basedOn?: Book0;
}

@Entity({ tableName: 'book', schema: 's2' })
class Book1 {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author0, { nullable: true })
  author?: Author0;

  @ManyToOne(() => Book1)
  basedOn!: Book1;
}

describe('multiple connected schemas in oracle', () => {
  let orm: MikroORM;
  const schemas = ['mikro_orm_test_schemas', 's1', 's2'];

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author0, Book0],
      dbName: `mikro_orm_test_schemas`,
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
    });

    // Drop all tables in both schemas in a single operation (avoids separate introspections)
    await orm.em.execute(
      `begin for rec in (select owner, table_name from all_tables where owner in ('s1', 's2')) loop execute immediate 'drop table "' || rec.owner || '"."' || rec.table_name || '" cascade constraints'; end loop; end;`,
    );
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema generator allows creating FKs across different schemas', async () => {
    // Introspect once and share between getUpdateSchemaSQL and update (avoids double introspection)
    const fromSchema0 = await DatabaseSchema.create(
      orm.em.getConnection(),
      orm.em.getPlatform(),
      orm.config,
      undefined,
      schemas,
    );
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false, fromSchema: fromSchema0 });
    expect(diff0).toMatchSnapshot();
    await orm.schema.update({ fromSchema: fromSchema0 });

    orm.discoverEntity(Book1, Book0);
    const fromSchema1 = await DatabaseSchema.create(
      orm.em.getConnection(),
      orm.em.getPlatform(),
      orm.config,
      undefined,
      schemas,
    );
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false, fromSchema: fromSchema1 });
    expect(diff1).toMatchSnapshot();
    await orm.schema.update({ fromSchema: fromSchema1 });

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });
});
