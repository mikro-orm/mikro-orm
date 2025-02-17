var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
let FooBar = class FooBar {
    _id;
    id;
    name;
    baz;
    fooBar;
};
__decorate([
    PrimaryKey()
], FooBar.prototype, "_id", void 0);
__decorate([
    SerializedPrimaryKey()
], FooBar.prototype, "id", void 0);
__decorate([
    Property()
], FooBar.prototype, "name", void 0);
__decorate([
    OneToOne({ eager: true, orphanRemoval: true })
], FooBar.prototype, "baz", void 0);
__decorate([
    OneToOne()
], FooBar.prototype, "fooBar", void 0);
FooBar = __decorate([
    Entity()
], FooBar);
export default FooBar;
