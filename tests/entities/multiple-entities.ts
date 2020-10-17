import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

// base without any property decorators need the `@Entity({ abstract: true })` to be known
@Entity({ abstract: true })
export abstract class BaseBase {

}

export abstract class BaseFoo extends BaseBase {

  @PrimaryKey()
  _id!: ObjectId;

}

@Entity()
export class Foo1 extends BaseFoo {

  @Property()
  name?: string;

}

@Entity()
export class Foo2 extends BaseFoo {

  @Property()
  name?: string;

}

@Entity()
export class Foo3 extends BaseFoo {

  @Property()
  name?: string;

}
