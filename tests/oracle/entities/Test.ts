import { Collection, Entity, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Book } from './Book';
import { Configuration } from './Configuration';

@Entity()
export class Test {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToOne({ entity: () => Book, cascade: [], nullable: true })
  book?: Book;

  @OneToMany(() => Configuration, config => config.test)
  config = new Collection<Configuration>(this);

  @Property({ version: true })
  version!: number;

  constructor(props: Partial<Test> = {}) {
    this.id = props.id!;
    this.name = props.name!;
  }

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }

  getConfiguration(): Record<string, string> {
    return this.config.getItems().reduce((c, v) => { c[v.property] = v.value; return c; }, {});
  }

}
