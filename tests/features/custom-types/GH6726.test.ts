import { Entity, MikroORM, OneToOne, PrimaryKey, Property, Ref, Type, wrap } from '@mikro-orm/sqlite';
import { parse, stringify } from 'uuid';

class ULIDType extends Type<string, Buffer> {

  convertToDatabaseValue(value: string): Buffer {
    return Buffer.from(parse(value));
  }

  convertToJSValue(value: Buffer): string {
    return stringify(value);
  }

  getColumnType() {
    return 'binary(16)';
  }

}

@Entity()
class ChecklistItemPart {

  @PrimaryKey()
  id!: string;

  @Property({ type: 'numeric' })
  quantity!: number;

  @OneToOne({
    ref: true,
    eager: true,
    entity: () => Part,
  })
  part!: Ref<Part>;

}

@Entity()
class Part {

  @PrimaryKey({ type: ULIDType })
  id!: string;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ChecklistItemPart, Part],
    dbName: ':memory:',
    loadStrategy: 'select-in',
  });
  await orm.schema.createSchema();

  orm.em.create(ChecklistItemPart, {
    id: '1',
    quantity: 2,
    part: { id: '1823e7b6-6520-416f-ac3c-4694a82cf5d2', name: 'Part 1' },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('custom type pk entity not being populated (GH #6726)', async () => {
  const [row] = await orm.em.findAll(ChecklistItemPart);
  expect(wrap(row).toObject()).toEqual({
    id: '1',
    quantity: 2,
    part: { id: '1823e7b6-6520-416f-ac3c-4694a82cf5d2', name: 'Part 1' },
  });
});
