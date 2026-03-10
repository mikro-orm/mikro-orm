import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { mockLogger } from '../../helpers';
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

enum ChangeType {
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class AbstractChangeEntry {
  @Enum()
  type: ChangeType;

  constructor(type: ChangeType) {
    this.type = type;
  }
}

@Embeddable()
class BooleanChangeEntry extends AbstractChangeEntry {
  @Property()
  value: boolean | null;

  constructor({ value }: { value: boolean | null }) {
    super(ChangeType.BOOLEAN);
    this.value = value;
  }
}

@Embeddable()
class StringChangeEntry extends AbstractChangeEntry {
  @Property()
  value: string | null;

  constructor({ value }: { value: string | null }) {
    super(ChangeType.STRING);
    this.value = value;
  }
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class AbstractChangeType {
  @Enum()
  type: ChangeType;

  constructor(type: ChangeType) {
    this.type = type;
  }
}

@Embeddable({ discriminatorValue: ChangeType.BOOLEAN })
class ChangeBooleanValue extends AbstractChangeType {
  @Embedded()
  entries: BooleanChangeEntry[];

  constructor({ entries }: { entries: { value: boolean | null }[] }) {
    super(ChangeType.BOOLEAN);
    this.entries = entries.map(entry => new BooleanChangeEntry(entry));
  }
}

@Embeddable({ discriminatorValue: ChangeType.STRING })
class ChangeStringValue extends AbstractChangeType {
  @Embedded()
  entries: StringChangeEntry[];

  constructor({ entries }: { entries: { value: string | null }[] }) {
    super(ChangeType.STRING);
    this.entries = entries.map(entry => new StringChangeEntry(entry));
  }
}

@Entity()
class ChangeOwner {
  @PrimaryKey()
  id: number;

  @Embedded()
  fields: (ChangeBooleanValue | ChangeStringValue)[];

  constructor(id: number, fields: (ChangeBooleanValue | ChangeStringValue)[]) {
    this.id = id;
    this.fields = fields;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
    dbName: ':memory:',
    entities: [ChangeOwner, ChangeBooleanValue, ChangeStringValue, BooleanChangeEntry, StringChangeEntry],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6523 - boolean only', async () => {
  const changeOwner = new ChangeOwner(1, [new ChangeBooleanValue({ entries: [{ value: true }] })]);

  orm.em.create(ChangeOwner, changeOwner);
  await orm.em.flush();
  orm.em.clear();

  const loaded = await orm.em.findOneOrFail(ChangeOwner, 1);
  expect(loaded.fields).toHaveLength(1);
  expect(loaded.fields[0]).toBeInstanceOf(ChangeBooleanValue);
  expect((loaded.fields[0] as ChangeBooleanValue).entries).toHaveLength(1);
  expect((loaded.fields[0] as ChangeBooleanValue).entries[0].value).toBe(true);

  // Verify no spurious update on flush
  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});

test('GH #6523 - both types', async () => {
  orm.em.clear();
  const changeOwner = new ChangeOwner(2, [
    new ChangeBooleanValue({ entries: [{ value: true }] }),
    new ChangeStringValue({ entries: [{ value: 'hello' }] }),
  ]);

  orm.em.create(ChangeOwner, changeOwner);
  await orm.em.flush();
  orm.em.clear();

  const loaded = await orm.em.findOneOrFail(ChangeOwner, 2);
  expect(loaded.fields).toHaveLength(2);
  expect(loaded.fields[0]).toBeInstanceOf(ChangeBooleanValue);
  expect((loaded.fields[0] as ChangeBooleanValue).entries).toHaveLength(1);
  expect((loaded.fields[0] as ChangeBooleanValue).entries[0].value).toBe(true);
  expect(loaded.fields[1]).toBeInstanceOf(ChangeStringValue);
  expect((loaded.fields[1] as ChangeStringValue).entries).toHaveLength(1);
  expect((loaded.fields[1] as ChangeStringValue).entries[0].value).toBe('hello');

  // Verify no spurious update on flush
  const mock = mockLogger(orm, ['query']);
  await orm.em.flush();
  expect(mock.mock.calls).toHaveLength(0);
});
