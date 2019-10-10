import { ObjectId } from 'mongodb';
import { Entity, MongoEntity, OneToOne, PrimaryKey } from '../../lib';
import { Dup1 } from './dup1.model';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Dup2 implements MongoEntity<Dup2> {

  @PrimaryKey()
  _id: ObjectId;

  @SerializedPrimaryKey()
  id: string;

  @OneToOne({ owner: true })
  dup1: Dup1;

}
