var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
export class BaseEntity {
    _id;
    id;
    createdAt = new Date();
    updatedAt = new Date();
    foo;
    hookTest = false;
}
__decorate([
    PrimaryKey()
], BaseEntity.prototype, "_id", void 0);
__decorate([
    SerializedPrimaryKey()
], BaseEntity.prototype, "id", void 0);
__decorate([
    Property()
], BaseEntity.prototype, "createdAt", void 0);
__decorate([
    Property({ onUpdate: () => new Date() })
], BaseEntity.prototype, "updatedAt", void 0);
__decorate([
    Property()
], BaseEntity.prototype, "foo", void 0);
__decorate([
    Property({ persist: false })
], BaseEntity.prototype, "hookTest", void 0);
