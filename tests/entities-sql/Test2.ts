import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Book2 } from './Book2';
import { Configuration2 } from './Configuration2';
import { FooBar2 } from './FooBar2';

@Entity()
export class Test2 {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToOne({ entity: () => Book2, cascade: [], nullable: true })
  book?: Book2;

  @ManyToOne({ entity: () => Test2, mapToPk: true, nullable: true })
  parent?: number;

  @OneToMany(() => Configuration2, config => config.test)
  config = new Collection<Configuration2>(this);

  @Property({ version: true })
  version!: number;

  @ManyToMany(() => FooBar2)
  bars = new Collection<FooBar2>(this);

  constructor(props: Partial<Test2> = {}) {
    this.id = props.id!;
    this.name = props.name!;
  }

  static create(name: string) {
    const t = new Test2();
    t.name = name;

    return t;
  }

  getConfiguration(): Record<string, string> {
    return this.config.getItems().reduce((c, v) => { c[v.property] = v.value; return c; }, {});
  }

}
