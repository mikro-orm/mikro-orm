import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class BookTag3 {

    @PrimaryKey()
    id: number;

    @Property()
    name: string;

    @Property({ default: `current_timestamp` })
    version: Date;

}
