import { Entity, Property, OneToOne } from '../../lib';
import { Author2 } from './Author2';

@Entity()
export class Address2 {

  @OneToOne({ entity: () => Author2, primary: true })
  author: Author2;

  @Property()
  value: string;

  constructor(author: Author2, value: string) {
    this.author = author;
    this.value = value;
  }

}
