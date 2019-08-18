import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Book3 {

    @PrimaryKey()
    id: number;

    @Property()
    title: string;

    @Property({ nullable: true })
    authorId: number;

    @Property({ nullable: true })
    publisherId: number;

}
