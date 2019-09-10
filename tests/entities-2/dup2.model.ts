import { ObjectId } from 'mongodb';
import { Entity, IEntity, OneToOne, PrimaryKey } from '../../lib';
import { Dup1 } from './dup1.model';

@Entity()
export class Dup2 {

  @PrimaryKey()
  _id: ObjectId;

  @OneToOne({ owner: true })
  dup1: Dup1;

}

export interface Dup2 extends IEntity<string> { }
