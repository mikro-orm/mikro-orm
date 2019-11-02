import { Entity, IdEntity, OneToOne, PrimaryKey, Property } from '../../lib';
import { Book2 } from './Book2';

@Entity()
export class Test2 implements IdEntity<Test2> {

  @PrimaryKey()
  id!: number;

  @Property()
  name?: string;

  @OneToOne({ cascade: [] })
  book?: Book2;

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
