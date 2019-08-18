import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Publisher3 {

    @PrimaryKey()
    id: number;

    @Property()
    name: string;

    @Property()
    type: string;

}
