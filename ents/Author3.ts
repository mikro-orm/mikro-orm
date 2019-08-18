import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Author3 {

    @PrimaryKey()
    id: number;

    @Property({ nullable: true })
    createdAt: Date;

    @Property({ nullable: true })
    updatedAt: Date;

    @Property()
    name: string;

    @Property()
    email: string;

    @Property({ nullable: true })
    age: number;

    @Property()
    termsAccepted: number;

    @Property({ nullable: true })
    identities: string;

    @Property({ nullable: true })
    born: Date;

    @Property({ nullable: true })
    favouriteBookId: number;

}
