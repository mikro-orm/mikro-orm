import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

// GH #6522 reproduction: TsMorph + no entity callback on @Embedded
// This should NOT cause MetadataError about abstract entity

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
  // No entity callback - type inferred by TsMorph
  @Embedded()
  entries: BooleanChangeEntry[];

  constructor({ entries }: { entries: BooleanChangeEntry[] }) {
    super(ChangeType.BOOLEAN);
    this.entries = entries.map(entry => new BooleanChangeEntry(entry));
  }
}

@Embeddable({ discriminatorValue: ChangeType.STRING })
class ChangeStringValue extends AbstractChangeType {
  // No entity callback - type inferred by TsMorph
  @Embedded()
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

test('GH #6522 with TsMorph - no MetadataError on init', async () => {
  const changeOwner = new ChangeOwner(1, [
    new ChangeBooleanValue({ entries: [{ value: true }] }),
    new ChangeStringValue({ entries: [{ value: 'hello' }] }),
  ]);

  orm.em.create(ChangeOwner, changeOwner);
  await orm.em.flush();
  orm.em.clear();

  const loaded = await orm.em.findOneOrFail(ChangeOwner, 1);
  expect(loaded.fields).toHaveLength(2);
  expect(loaded.fields[0]).toBeInstanceOf(ChangeBooleanValue);
  expect((loaded.fields[0] as ChangeBooleanValue).entries).toHaveLength(1);
  expect((loaded.fields[0] as ChangeBooleanValue).entries[0].value).toBe(true);
  expect(loaded.fields[1]).toBeInstanceOf(ChangeStringValue);
  expect((loaded.fields[1] as ChangeStringValue).entries).toHaveLength(1);
  expect((loaded.fields[1] as ChangeStringValue).entries[0].value).toBe('hello');
});
