var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
let Test = class Test {
    _id;
    id;
    name;
    hiddenField = Date.now();
};
__decorate([
    PrimaryKey()
], Test.prototype, "_id", void 0);
__decorate([
    SerializedPrimaryKey()
], Test.prototype, "id", void 0);
__decorate([
    Property({ type: 'string' })
], Test.prototype, "name", void 0);
__decorate([
    Property({ hidden: true })
], Test.prototype, "hiddenField", void 0);
Test = __decorate([
    Entity()
], Test);
export { Test };
