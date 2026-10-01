import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { Migration, Migrator } from '@mikro-orm/migrations';
import { readdir, rm } from 'node:fs/promises';

const Item = defineEntity({
  name: 'BreakpointItem',
  tableName: 'breakpoint_item',
  properties: { id: p.integer().primary() },
});

class FirstMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('insert into breakpoint_item values (1)');
  }

  override async down(): Promise<void> {
    this.addSql('delete from breakpoint_item where id = 1');
  }
}

class SecondMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('insert into breakpoint_item values (2)');
  }

  override async down(): Promise<void> {
    this.addSql('delete from breakpoint_item where id = 2');
  }
}

class ThirdMigration extends Migration {
  override async up(): Promise<void> {
    this.addSql('insert into breakpoint_item values (3)');
  }

  override async down(): Promise<void> {
    this.addSql('delete from breakpoint_item where id = 3');
  }
}

describe('migration breakpoints (sqlite)', () => {
  let orm: MikroORM;
  // Names deliberately differ from execution order.
  const migrationsList = [
    { class: FirstMigration, name: 'ZFirst' },
    { class: SecondMigration, name: 'ASecond' },
    { class: ThirdMigration, name: 'MThird' },
  ];

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      dbName: ':memory:',
      extensions: [Migrator],
      migrations: { migrationsList, snapshot: false, silent: true },
    });
    await orm.schema.create();
  });

  afterEach(async () => orm.close(true));

  test('persists markers and allows reverting only migrations after the latest breakpoint', async () => {
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ASecond.ts');
    await orm.migrator.setBreakpoint('ASecond.js');

    const migrator = new Migrator(orm.em);
    expect((await migrator.getExecuted()).map(row => row.breakpoint)).toEqual([false, true, false]);
    expect((await migrator.down({ to: 'ASecond' })).map(row => row.name)).toEqual(['MThird']);
    await expect(migrator.down()).rejects.toThrow("breakpoint 'ASecond'");
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 1 },
      { id: 2 },
    ]);

    await migrator.setBreakpoint('ASecond', false);
    expect((await migrator.down({ to: 0 })).map(row => row.name)).toEqual(['ASecond', 'ZFirst']);
    expect(await migrator.getExecuted()).toEqual([]);
  });

  test.each([
    { to: 0 },
    { to: 'ZFirst' },
    { to: 'Unknown' },
    { migrations: ['MThird', 'ZFirst'] },
    { migrations: ['ASecond'] },
  ])('rejects the entire rollback before executing any migration: %j', async options => {
    orm.config.set('migrations', { ...orm.config.get('migrations'), transactional: false });
    orm.config.resetServiceCache();
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ASecond');
    const reverting = vi.fn();
    orm.migrator.on('reverting', reverting);

    await expect(orm.migrator.down(options)).rejects.toThrow("breakpoint 'ASecond'");
    expect(reverting).not.toHaveBeenCalled();
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
    expect(await orm.migrator.getExecuted()).toHaveLength(3);
  });

  test('removing the latest breakpoint leaves earlier breakpoints active', async () => {
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ZFirst');
    await orm.migrator.setBreakpoint('MThird');
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'MThird'");
    await orm.migrator.setBreakpoint('MThird', false);
    expect((await orm.migrator.down({ to: 'ZFirst' })).map(row => row.name)).toEqual(['MThird', 'ASecond']);
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'ZFirst'");
  });

  test('breakpoints remain effective when protected migration files are no longer available', async () => {
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ASecond');
    orm.config.set('migrations', { ...orm.config.get('migrations'), migrationsList: [migrationsList[2]] });
    const migrator = new Migrator(orm.em);

    await expect(migrator.down({ to: 0 })).rejects.toThrow("breakpoint 'ASecond'");
    await expect(migrator.down(['MThird', 'ZFirst'])).rejects.toThrow("breakpoint 'ASecond'");
    await migrator.down({ to: 'ASecond' });
    await expect(migrator.down()).rejects.toThrow("breakpoint 'ASecond'");
    await migrator.setBreakpoint('ASecond', false);
    expect((await migrator.getExecuted()).map(row => row.breakpoint)).toEqual([false, false]);
  });

  test('rejects pending or unknown migrations', async () => {
    await expect(orm.migrator.setBreakpoint('ASecond')).rejects.toThrow('has not been executed');
    await expect(orm.migrator.setBreakpoint('Unknown', false)).rejects.toThrow('has not been executed');
    expect(await orm.migrator.getExecuted()).toEqual([]);
  });

  test('resolves timestamp names and legacy entries with file extensions', async () => {
    await orm.migrator.getExecuted();
    await orm.em
      .getConnection()
      .execute('insert into mikro_orm_migrations (name) values (?), (?)', [
        'Migration20200101000000',
        'Migration20200101000000.ts',
      ]);
    await orm.migrator.setBreakpoint('20200101000000');
    expect((await orm.migrator.getExecuted()).map(row => row.breakpoint)).toEqual([true, true]);
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'Migration20200101000000'");
    await orm.migrator.setBreakpoint('Migration20200101000000.js', false);
    expect((await orm.migrator.getExecuted()).map(row => row.breakpoint)).toEqual([false, false]);
    await orm.migrator.unlogMigration('Migration20200101000000');
    expect(await orm.migrator.getExecuted()).toEqual([]);
  });

  test('upgrades legacy tracking tables only when explicitly setting a breakpoint', async () => {
    await orm.em
      .getConnection()
      .execute(
        'create table mikro_orm_migrations (id integer primary key autoincrement, name text not null, executed_at datetime default current_timestamp)',
      );
    await orm.migrator.up();
    const before = await orm.migrator.getExecuted();
    expect(before.every(row => !('breakpoint' in row))).toBe(true);
    await orm.migrator.down();
    await orm.migrator.up();

    await orm.migrator.setBreakpoint('ASecond');
    const after = await orm.migrator.getExecuted();
    expect(after.map(row => row.breakpoint)).toEqual([false, true, false]);
    expect(after.slice(0, 2).map(({ breakpoint, ...row }) => row)).toEqual(before.slice(0, 2));
    await expect(orm.migrator.down({ to: 0 })).rejects.toThrow("breakpoint 'ASecond'");
    await expect(orm.migrator.getStorage().setBreakpoint({ name: 'Unknown', breakpoint: true })).rejects.toThrow(
      'has not been executed',
    );
  });

  test('allows unlogging a faked migration before a breakpoint and reverting its later execution', async () => {
    await orm.migrator.logMigration('ZFirst');
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ASecond');

    await orm.migrator.unlogMigration('ZFirst.ts');
    expect((await orm.migrator.getExecuted()).map(row => [row.name, row.breakpoint])).toEqual([
      ['ASecond', true],
      ['MThird', false],
    ]);
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 2 },
      { id: 3 },
    ]);

    expect((await orm.migrator.up('ZFirst')).map(row => row.name)).toEqual(['ZFirst']);
    expect((await orm.migrator.getExecuted()).map(row => row.name)).toEqual(['ASecond', 'MThird', 'ZFirst']);
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
    expect((await orm.migrator.down()).map(row => row.name)).toEqual(['ZFirst']);
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 2 },
      { id: 3 },
    ]);
    expect((await orm.migrator.down()).map(row => row.name)).toEqual(['MThird']);
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'ASecond'");
  });

  test('unlogging a breakpoint removes its marker while preserving earlier breakpoints and data', async () => {
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('ZFirst');
    await orm.migrator.setBreakpoint('ASecond');

    await orm.migrator.unlogMigration('ASecond.ts');
    expect((await orm.migrator.getExecuted()).map(row => [row.name, row.breakpoint])).toEqual([
      ['ZFirst', true],
      ['MThird', false],
    ]);
    expect(await orm.em.getConnection().execute('select id from breakpoint_item order by id')).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
    expect((await orm.migrator.down()).map(row => row.name)).toEqual(['MThird']);
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'ZFirst'");
  });
});

describe('rollup with migration breakpoints (sqlite)', () => {
  let orm: MikroORM;
  const path = process.cwd() + '/temp/migration-breakpoints-rollup';

  beforeEach(async () => {
    await rm(path, { recursive: true, force: true });
    let counter = 0;
    orm = await MikroORM.init({
      entities: [Item],
      dbName: ':memory:',
      extensions: [Migrator],
      migrations: { path, fileName: () => `Migration${++counter}`, snapshot: false, silent: true },
    });
  });

  afterEach(async () => {
    await orm.close(true);
    await rm(path, { recursive: true, force: true });
  });

  test('rejects protected rollups without changing files or history, but permits later migrations', async () => {
    for (let i = 0; i < 3; i++) {
      await orm.migrator.create(path, true);
    }
    await orm.migrator.up();
    await orm.migrator.setBreakpoint('Migration2');
    const rows = await orm.migrator.getExecuted();
    const files = await readdir(path);
    await expect(orm.migrator.rollup()).rejects.toThrow("breakpoint 'Migration2'");
    await expect(orm.migrator.rollup(['Migration1', 'Migration3'])).rejects.toThrow("breakpoint 'Migration2'");
    expect(await orm.migrator.getExecuted()).toEqual(rows);
    expect(await readdir(path)).toEqual(files);

    await orm.migrator.setBreakpoint('Migration2', false);
    await orm.migrator.setBreakpoint('Migration1');
    const result = await orm.migrator.rollup(['Migration2', 'Migration3']);
    expect((await orm.migrator.getExecuted()).map(row => [row.name, row.breakpoint])).toEqual([
      ['Migration1', true],
      [result.fileName.replace('.ts', ''), false],
    ]);
    await orm.migrator.down();
    await expect(orm.migrator.down()).rejects.toThrow("breakpoint 'Migration1'");
  });
});
