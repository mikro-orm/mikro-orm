import { MikroORM, Opt, Type } from '@mikro-orm/sqlite';
import { Entity, Formula, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

class UpperType extends Type<string, string> {
  override convertToJSValueSQL(key: string): string {
    return `upper(${key})`;
  }
}

@Entity({ inheritance: 'tpt' })
abstract class Item {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;
}

@Entity()
class Widget extends Item {
  // the SQL conversion routes the select through the driver's formula path
  @Property({ type: UpperType })
  code!: string;

  @Formula(cols => `(SELECT length(${cols.label}))`)
  labelLength!: Opt<number>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Item, Widget],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #8492: TPT child formula resolves an inherited column to the parent table alias', async () => {
  orm.em.create(Widget, { label: 'Gadget', code: 'xyz' });
  await orm.em.flush();
  orm.em.clear();

  const widget = await orm.em.findOneOrFail(Widget, { code: 'XYZ' });
  expect(widget.labelLength).toBe(6);
});
