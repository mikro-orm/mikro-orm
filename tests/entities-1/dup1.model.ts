import { ObjectId } from 'bson';
import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

@Entity()
export class Dup1 {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name1?: string;

}
