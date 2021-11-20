import { Entity, PrimaryKey, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { TaskUser } from './TaskUser';
export enum TaskPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}

@Entity()
export class Task {

    @PrimaryKey()
    id!: number;

    @Enum({
        items: () => TaskPriority,
        customOrder: [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High],
    })
    priority!: TaskPriority;

    @Property({ customOrder: ['pending', 'progress', 'done'] })
    state!: string;

    @ManyToOne(() => TaskUser)
    owner!: TaskUser;

}
