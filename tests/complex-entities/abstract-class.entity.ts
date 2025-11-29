import { BaseEntity } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey } from '@mikro-orm/decorators/legacy';

export enum SomeEnum {
  CLASS_A = 'class-a',
  CLASS_B = 'class-b',
}

@Entity({ discriminatorColumn: 'type', abstract: true })
export class AbstractClass extends BaseEntity {

  @PrimaryKey()
  id!: string;

  @Enum(() => SomeEnum)
  type!: SomeEnum;

}

@Entity({ discriminatorValue: SomeEnum.CLASS_A })
export class ClassA extends AbstractClass {}

@Entity({ discriminatorValue: SomeEnum.CLASS_B })
export class ClassB extends AbstractClass {}
