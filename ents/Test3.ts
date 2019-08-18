import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Test3 {

    @PrimaryKey()
    id: number;

    @Property({ nullable: true })
    name: string;

    @Property()
    version: number = 1;

}
