"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRepository = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const download_git_repo_1 = __importDefault(require("download-git-repo"));
const cli_utils_1 = require("@elux/cli-utils");
const base_1 = require("./base");
function loadRepository(url, proxy) {
    const tmpdir = path_1.default.join(os_1.default.tmpdir(), 'elux-cli-tpl');
    const options = { clone: false, headers: { 'user-agent': base_1.USER_AGENT } };
    if (proxy) {
        options.proxy = proxy;
    }
    else {
        options.agent = false;
    }
    return new Promise((resolve, reject) => {
        try {
            if (cli_utils_1.fs.existsSync(tmpdir)) {
                cli_utils_1.fs.removeSync(tmpdir);
            }
            download_git_repo_1.default('direct:' + url, tmpdir, options, (e) => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve(tmpdir);
                }
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.loadRepository = loadRepository;
