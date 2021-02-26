"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const core_1 = require("@mikro-orm/core");
let FooBar = class FooBar {
};
__decorate([
    core_1.PrimaryKey(),
    __metadata("design:type", mongodb_1.ObjectId)
], FooBar.prototype, "_id", void 0);
__decorate([
    core_1.SerializedPrimaryKey(),
    __metadata("design:type", String)
], FooBar.prototype, "id", void 0);
__decorate([
    core_1.Property(),
    __metadata("design:type", String)
], FooBar.prototype, "name", void 0);
__decorate([
    core_1.OneToOne({ eager: true, orphanRemoval: true }),
    __metadata("design:type", Object)
], FooBar.prototype, "baz", void 0);
__decorate([
    core_1.OneToOne(),
    __metadata("design:type", FooBar)
], FooBar.prototype, "fooBar", void 0);
FooBar = __decorate([
    core_1.Entity()
], FooBar);
exports.default = FooBar;
