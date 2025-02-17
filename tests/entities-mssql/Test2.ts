import { Collection, Entity, OneToMany, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Book2 } from './Book2.js';
import { Configuration2 } from './Configuration2.js';

@Entity()
export class Test2 {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToOne({ entity: () => Book2, cascade: [], deleteRule: 'no action', nullable: true })
  book?: Book2;

  @OneToMany(() => Configuration2, config => config.test)
  config = new Collection<Configuration2>(this);

  @Property({ version: true })
  version!: number;

  constructor(props: Partial<Test2> = {}) {
    this.id = props.id!;
    this.name = props.name!;
  }

  static create(name: string) {
    const t = new Test2();
    t.name = name;

    return t;
  }

}
