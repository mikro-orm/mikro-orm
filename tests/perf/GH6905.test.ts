import { MikroORM, Collection } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Table {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => TableVersion, version => version.table)
  versions = new Collection<TableVersion>(this);

  @OneToMany(() => Column, column => column.table)
  columns = new Collection<Column>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Column {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Table)
  table: Table;

  @Property()
  name: string;

  constructor(table: Table, name: string) {
    this.table = table;
    this.name = name;
  }

}


@Entity()
class TableVersion {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Table)
  table: Table;

  @Property()
  versionNumber: number;

  @OneToMany(() => Row, row => row.tableVersion)
  rows = new Collection<Row>(this);

  constructor(table: Table, versionNumber: number) {
    this.table = table;
    this.versionNumber = versionNumber;
  }

}

@Entity()
class Row {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => TableVersion)
  tableVersion: TableVersion;

  @OneToMany(() => Cell, cell => cell.row, { orphanRemoval: true })
  cells = new Collection<Cell>(this);

  constructor(tableVersion: TableVersion) {
    this.tableVersion = tableVersion;
  }

}

@Entity()
class Cell {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Row)
  row: Row;

  @ManyToOne(() => Column)
  column: Column;

  @Property()
  value: string;

  constructor(row: Row, column: Column, value: string) {
    this.row = row;
    this.column = column;
    this.value = value;
  }

}

describe('MikroORM Performance Regression', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [
        Table,
        Column,
        TableVersion,
        Row,
        Cell,
      ],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  function generateRows(numberOfRows: number, version: TableVersion, columns: Column[]): Row[] {
    // Create rows with one cell per column
    const rows: Row[] = [];
    for (let i = 0; i < numberOfRows; i++) {
      const row = new Row(version);
      row.cells.set(columns.map((column, idx) => new Cell(
        row,
        column,
        `input_${i}_${idx}`,
      )));
      rows.push(row);
    }
    return rows;
  }

  it('bulk insert performance test', async () => {
    let explicitTrxTimeTotal = 0;
    let implicitTrxTimeTotal = 0;

    for (let i = 0; i <= 10; i++) {
      const em = orm.em.fork();
      const numberOfRows = 100;

      const table = new Table('Test Table');

      // Create 6 columns
      const columns: Column[] = ['1', '2', '3', '4', '5', '6'].map(
        i => new Column(table, `Column ${i}`),
      );

      // Create 2 versions
      const version1 = new TableVersion(table, 1);
      const version2 = new TableVersion(table, 2);
      await em.persistAndFlush([version1, version2]);

      // Insert rows with explicit transaction (slower)
      // This is where the performance regression occurs
      const explicitTrxTimer = performance.now();
      await em.transactional(trxEm => {
        trxEm.persist(generateRows(numberOfRows, version1, columns));
      });
      const explicitTrxTime = performance.now() - explicitTrxTimer;

      // Insert rows with implicit transaction (faster)
      const implicitTrxTimer = performance.now();
      em.persist(generateRows(numberOfRows, version2, columns));
      await em.flush();
      const implicitTrxTime = performance.now() - implicitTrxTimer;

      // would expect them to be somewhat similar
      if (i > 0) {
        explicitTrxTimeTotal += explicitTrxTime;
        implicitTrxTimeTotal += implicitTrxTime;
      }

      await orm.schema.clearDatabase();
    }

    // when warmed up and averaged, should be roughly similar (CI can be slow and noisy, so we use 2x margin)
    expect(explicitTrxTimeTotal).toBeLessThan(implicitTrxTimeTotal * 2);
    expect(implicitTrxTimeTotal).toBeLessThan(explicitTrxTimeTotal * 2);
  });
});
