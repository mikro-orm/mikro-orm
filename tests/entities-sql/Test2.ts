import { Collection, Entity, OneToMany, OneToOne, PrimaryKey, Property } from '../../lib';
import { Book2 } from './Book2';
import { Configuration2 } from './Configuration2';

@Entity()
export class Test2 {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToOne({ entity: () => Book2, cascade: [], nullable: true })
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

  getConfiguration(): Record<string, string> {
    return this.config.getItems().reduce((c, v) => { c[v.property] = v.value; return c; }, {});
  }

}
