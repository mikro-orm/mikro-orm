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
exports.Test = void 0;
const mongodb_1 = require("mongodb");
const core_1 = require("@mikro-orm/core");
let Test = class Test {
    constructor() {
        this.hiddenField = Date.now();
    }
};
__decorate([
    core_1.PrimaryKey(),
    __metadata("design:type", mongodb_1.ObjectId)
], Test.prototype, "_id", void 0);
__decorate([
    core_1.SerializedPrimaryKey(),
    __metadata("design:type", String)
], Test.prototype, "id", void 0);
__decorate([
    core_1.Property({ type: 'string' }),
    __metadata("design:type", String)
], Test.prototype, "name", void 0);
__decorate([
    core_1.Property({ hidden: true }),
    __metadata("design:type", Object)
], Test.prototype, "hiddenField", void 0);
Test = __decorate([
    core_1.Entity()
], Test);
exports.Test = Test;
