import { Dictionary } from '../typings';

export class DatabaseTable {

  private columns!: Dictionary<Column>;
  private indexes!: Dictionary<Index[]>;
  private foreignKeys!: Dictionary<ForeignKey>;

  constructor(readonly name: string,
              readonly schema?: string) { }

  getColumns(): Column[] {
    return Object.values(this.columns);
  }

  getColumn(name: string): Column | undefined {
    return this.columns[name];
  }

  init(cols: Column[], indexes: Dictionary<Index[]>, pks: string[], fks: Dictionary<ForeignKey>): void {
    this.indexes = indexes;
    this.foreignKeys = fks;
    this.columns = cols.reduce((o, v) => {
      const index = indexes[v.name] || [];
      v.primary = pks.includes(v.name);
      v.unique = index.some(i => i.unique && !i.primary);
      v.fk = fks[v.name];
      v.indexes = index.filter(i => !i.primary);
      v.defaultValue = v.defaultValue && v.defaultValue.toString().startsWith('nextval(') ? null : v.defaultValue;
      o[v.name] = v;

      return o;
    }, {} as any);
  }

}

export interface Column {
  name: string;
  type: string;
  fk: ForeignKey;
  indexes: Index[];
  primary: boolean;
  unique: boolean;
  nullable: boolean;
  maxLength: number;
  defaultValue: string | null;
}

export interface ForeignKey {
  columnName: string;
  constraintName: string;
  referencedTableName: string;
  referencedColumnName: string;
  updateRule: string;
  deleteRule: string;
}

export interface Index {
  columnName: string;
  keyName: string;
  unique: boolean;
  primary: boolean;
}
