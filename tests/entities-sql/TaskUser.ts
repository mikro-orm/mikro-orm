import { Entity, Property, OneToOne, PrimaryKey, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { Task } from './Task';
@Entity()
export class TaskUser {

    @PrimaryKey()
    id!: number;

    @Property()
    label!: string;

    @OneToMany(() => Task, o => o.owner)
    tasks = new Collection<Task>(this);

}
