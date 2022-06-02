"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSS = exports.Framework = exports.Platform = void 0;
var Platform;
(function (Platform) {
    Platform["csr"] = "csr";
    Platform["ssr"] = "ssr";
    Platform["taro"] = "taro";
    Platform["micro"] = "micro";
    Platform["rn"] = "rn";
})(Platform = exports.Platform || (exports.Platform = {}));
var Framework;
(function (Framework) {
    Framework["react"] = "react";
    Framework["vue"] = "vue";
})(Framework = exports.Framework || (exports.Framework = {}));
var CSS;
(function (CSS) {
    CSS["less"] = "less";
    CSS["sass"] = "sass";
})(CSS = exports.CSS || (exports.CSS = {}));
