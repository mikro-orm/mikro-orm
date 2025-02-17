import {
  Embedded,
  Enum,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Embeddable,
  helper,
  SimpleLogger,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

enum ChangeType {
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
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

  @Property({ type: 'boolean', nullable: true })
  oldValue: boolean | null;

  @Property({ type: 'boolean', nullable: true })
  newValue: boolean | null;

  constructor(args: { oldValue: boolean | null; newValue: boolean | null }) {
    super(ChangeType.BOOLEAN);
    this.oldValue = args.oldValue;
    this.newValue = args.newValue;
  }

}

@Embeddable({ discriminatorValue: ChangeType.STRING })
class ChangeStringValue extends AbstractChangeType {

  @Property({ type: 'string', nullable: true })
  oldValue: string | null;

  @Property({ type: 'string', nullable: true })
  newValue: string | null;

  constructor(args: { oldValue: string | null; newValue: string | null }) {
    super(ChangeType.STRING);
    this.oldValue = args.oldValue;
    this.newValue = args.newValue;
  }

}

@Entity()
class Change {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @Embedded(() => [ChangeBooleanValue, ChangeStringValue], { object: true })
  value: ChangeBooleanValue | ChangeStringValue;

  constructor(
    id: number,
    name: string,
    value: ChangeBooleanValue | ChangeStringValue,
  ) {
    this.id = id;
    this.name = name;
    this.value = value;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Change, ChangeBooleanValue, ChangeStringValue],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6510', async () => {
  const mock = mockLogger(orm);
  const change = new Change(
    0,
    'fullName',
    new ChangeStringValue({
      oldValue: 'John',
      newValue: 'John Doe',
    }),
  );
  await orm.em.persistAndFlush(change);
  orm.em.clear();

  const c1 = await orm.em.findOneOrFail(Change, { id: 0 });
  expect(c1.value).toEqual({
    oldValue: 'John',
    newValue: 'John Doe',
    type: ChangeType.STRING,
  });
  expect(helper(c1).__originalEntityData!.value).toEqual({
    oldValue: 'John',
    newValue: 'John Doe',
    type: ChangeType.STRING,
  });

  c1.value = new ChangeBooleanValue({ oldValue: true, newValue: false });
  await orm.em.flush();
  orm.em.clear();

  const c2 = await orm.em.findOneOrFail(Change, { id: 0 });
  expect(c2.value).toEqual({
    oldValue: true,
    newValue: false,
    type: ChangeType.BOOLEAN,
  });
  expect(helper(c2).__originalEntityData!.value).toEqual({
    oldValue: true,
    newValue: false,
    type: ChangeType.BOOLEAN,
  });
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `change` (`id`, `name`, `value`) values (0, \'fullName\', \'{"type":"STRING","old_value":"John","new_value":"John Doe"}\')'],
    ['[query] commit'],
    ['[query] select `c0`.* from `change` as `c0` where `c0`.`id` = 0 limit 1'],
    ['[query] begin'],
    ['[query] update `change` set `value` = \'{"type":"BOOLEAN","old_value":true,"new_value":false}\' where `id` = 0'],
    ['[query] commit'],
    ['[query] select `c0`.* from `change` as `c0` where `c0`.`id` = 0 limit 1'],
  ]);
});
