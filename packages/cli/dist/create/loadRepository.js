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
function loadRepository(repository, clone, proxy) {
    const tmpdir = path_1.default.join(os_1.default.tmpdir(), 'elux-cli-tpl');
    return new Promise((resolve, reject) => {
        try {
            if (cli_utils_1.fs.existsSync(tmpdir)) {
                cli_utils_1.fs.removeSync(tmpdir);
            }
            download_git_repo_1.default(repository, tmpdir, { clone, headers: { 'user-agent': 'PostmanRuntime/7.28.1' } }, (e) => {
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
