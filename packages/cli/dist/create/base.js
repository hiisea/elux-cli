"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_AGENT = exports.PACKAGE_INFO_GITHUB = exports.PACKAGE_INFO_GITEE = exports.CSS = exports.Framework = exports.Platform = void 0;
var Platform;
(function (Platform) {
    Platform["csr"] = "csr";
    Platform["ssr"] = "ssr";
    Platform["taro"] = "taro";
    Platform["micro"] = "micro";
})(Platform = exports.Platform || (exports.Platform = {}));
var Framework;
(function (Framework) {
    Framework["reactRedux"] = "reactRedux";
    Framework["vueVuex"] = "vueVuex";
})(Framework = exports.Framework || (exports.Framework = {}));
var CSS;
(function (CSS) {
    CSS["less"] = "less";
    CSS["sass"] = "sass";
})(CSS = exports.CSS || (exports.CSS = {}));
exports.PACKAGE_INFO_GITEE = 'https://gitee.com/hiisea/elux-cli/raw/master/packages/cli/package.json';
exports.PACKAGE_INFO_GITHUB = 'https://raw.githubusercontent.com/hiisea/elux-cli/main/packages/cli/package.json';
exports.USER_AGENT = 'elux-cli/1.0.0';
