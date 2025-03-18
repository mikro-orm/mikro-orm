import {
  Embeddable,
  Embedded,
  Entity,
  Enum,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

enum ChangeType {
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
}

@Embeddable()
class BooleanChangeEntry {

  @Property({ type: 'boolean', nullable: true })
  value: boolean | null;

  constructor({ value }: { value: boolean | null }) {
    this.value = value;
  }

}

@Embeddable()
class StringChangeEntry {

  @Property({ type: 'string', nullable: true })
  value: string | null;

  constructor({ value }: { value: string | null }) {
    this.value = value;
  }

}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class AbstractChangeType {

  @Enum(() => ChangeType)
  type: ChangeType;

  constructor(type: ChangeType) {
    this.type = type;
  }

}

@Embeddable({ discriminatorValue: ChangeType.BOOLEAN })
class ChangeBooleanValue extends AbstractChangeType {

  @Embedded(() => BooleanChangeEntry, { object: true, array: true })
  entries: BooleanChangeEntry[];

  constructor({ entries }: { entries: BooleanChangeEntry[] }) {
    super(ChangeType.BOOLEAN);
    this.entries = entries.map(entry => new BooleanChangeEntry(entry));
  }

}

@Embeddable({ discriminatorValue: ChangeType.STRING })
class ChangeStringValue extends AbstractChangeType {

  @Embedded(() => StringChangeEntry, { object: true, array: true })
  entries: StringChangeEntry[];

  constructor({ entries }: { entries: StringChangeEntry[] }) {
    super(ChangeType.STRING);
    this.entries = entries.map(entry => new StringChangeEntry(entry));
  }

}

@Entity()
class ChangeOwner {

  @PrimaryKey()
  id: number;

  @Embedded(() => [ChangeBooleanValue, ChangeStringValue], { object: true, array: true })
  fields: (ChangeBooleanValue | ChangeStringValue)[];

  constructor(id: number, fields: (ChangeBooleanValue | ChangeStringValue)[]) {
    this.id = id;
    this.fields = fields;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      ChangeOwner,
      ChangeBooleanValue,
      ChangeStringValue,
      BooleanChangeEntry,
      StringChangeEntry,
    ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6522', async () => {
  const changeOwner = new ChangeOwner(1, [
    new ChangeBooleanValue({ entries: [{ value: true }] }),
    new ChangeStringValue({ entries: [{ value: 'hello' }] }),
  ]);

  orm.em.create(ChangeOwner, changeOwner);
  await orm.em.flush();
});
