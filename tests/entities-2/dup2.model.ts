import { ObjectId } from 'bson';
import { Entity, OneToOne, PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';
import { Dup1 } from './dup1.model';

@Entity()
export class Dup2 {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey({ type: 'string' })
  id!: string;

  @OneToOne({ type: 'Dup1', owner: true })
  dup12?: Dup1;

}
