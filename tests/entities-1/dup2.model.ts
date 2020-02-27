import { ObjectId } from 'mongodb';
import { Entity, OneToOne, PrimaryKey, Property } from '../../lib';
import { Dup1 } from './dup1.model';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Dup2 {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey({ type: 'string' })
  id!: string;

  @OneToOne({ type: 'Dup1', owner: true })
  dup1?: Dup1;

}
