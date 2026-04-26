import { MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

// docs/docs/defining-entities.md says:
// > The `fieldName` will be inferred based on the accessor name unless specified explicitly.
// This held for scalars/embeddeds but not for relations — the FK column was derived from
// the underscore-prefixed backing name (`_draft_id`) instead of the accessor (`draft_id`).

@Entity()
class Customization {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Course {
  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => Customization, accessor: 'draft', nullable: true })
  private _draft?: Customization;

  @ManyToOne({ entity: () => Customization, accessor: 'main', nullable: true })
  private _main?: Customization;

  get draft(): Customization | undefined {
    return this._draft;
  }

  get main(): Customization | undefined {
    return this._main;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Course, Customization],
    dbName: ':memory:',
  });
});

afterAll(() => orm.close(true));

test('relation FK column inferred from accessor name on a backing field', async () => {
  const meta = orm.getMetadata().get(Course);
  const props = meta.properties as any;
  const draft = props._draft;
  const main = props._main;

  expect(draft.fieldNames).toEqual(['draft_id']);
  expect(draft.joinColumns).toEqual(['draft_id']);
  expect(main.fieldNames).toEqual(['main_id']);
  expect(main.joinColumns).toEqual(['main_id']);

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('`draft_id`');
  expect(sql).toContain('`main_id`');
  expect(sql).not.toContain('`_draft_id`');
  expect(sql).not.toContain('`_main_id`');
});
