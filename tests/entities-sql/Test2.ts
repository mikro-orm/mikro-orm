import { Entity, IEntity, OneToOne, PrimaryKey, Property } from '../../lib';
import { Book2 } from './Book2';

@Entity()
export class Test2 {

  @PrimaryKey()
  id: number;

  @Property({ nullable: true })
  name: string;

  @OneToOne({ cascade: [], inversedBy: 'test' })
  book: Book2;

  static create(name: string) {
    const t = new Test2();
    t.name = name;

    return t;
  }

}

export interface Test2 extends IEntity<number> { }
