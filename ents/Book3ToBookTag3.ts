import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Book3ToBookTag3 {

    @PrimaryKey()
    id: number;

    @Property({ fieldName: 'book3_id', nullable: true })
    book3Id: number;

    @Property({ fieldName: 'book_tag3_id', nullable: true })
    bookTag3Id: number;

}
