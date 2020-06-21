import { ObjectId } from 'mongodb';
export declare abstract class BaseEntity {
    _id: ObjectId;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    foo?: string;
    hookTest: boolean;
}
