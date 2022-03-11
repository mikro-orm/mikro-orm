import { ObjectId } from 'bson';
import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

@Entity()
export class UpdateCreatePropAccess {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ onCreate: () => Math.random() })
  onCreatePropertyAccessTestSource?: number;

  @Property({ onCreate: (propAccess: UpdateCreatePropAccess) => propAccess.onCreatePropertyAccessTestSource })
  onCreatePropertyAccessTestReceive?: number;

  @Property({ onUpdate: () => Math.random() })
  onUpdatePropertyAccessTestSource = 0;

  @Property({ onUpdate: (propAccess: UpdateCreatePropAccess) => propAccess.onUpdatePropertyAccessTestSource })
  onUpdatePropertyAccessTestReceive = 1;

  static create(name: string) {
    const propAccess = new UpdateCreatePropAccess();
    propAccess.name = name;

    return propAccess;
  }

}

