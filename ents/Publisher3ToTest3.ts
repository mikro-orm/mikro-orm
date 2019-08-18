import { Entity, PrimaryKey, Property } from 'mikro-orm';

@Entity()
export class Publisher3ToTest3 {

    @PrimaryKey()
    id: number;

    @Property({ fieldName: 'publisher3_id', nullable: true })
    publisher3Id: number;

    @Property({ fieldName: 'test3_id', nullable: true })
    test3Id: number;

}
