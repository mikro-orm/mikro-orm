import { ObjectId } from 'bson';
export declare abstract class BaseEntity {
    _id: ObjectId;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    foo?: string;
    hookTest: boolean;
}
