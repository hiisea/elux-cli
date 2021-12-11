/// <reference types="node" />
import chalk from 'chalk';
import minimist from 'minimist';
import fs from 'fs-extra';
import execa from 'execa';
import ora from 'ora';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { Listr } from 'listr2';
declare function slash(path: string): string;
declare function log(message: string): void;
declare function err(message: string): void;
declare function getCmdVersion(cmd: string): string;
declare function loadPackageVesrion(packageName: string): string;
declare function isEmptyObject(obj: any): boolean;
declare function checkNodeVersion(wanted: string, id: string): void;
declare function readDirSync(floder: string): {
    name: string;
    isDirectory: boolean;
    isFile: boolean;
}[];
declare function clearConsole(title: string): void;
declare function createProxyAgent(url: string, proxyUrl: string): {
    http?: HttpAgent;
    https?: HttpsAgent;
} | undefined;
declare function testHttpUrl(url: string): boolean;
declare function checkPort(port: number): Promise<Boolean>;
declare const _default: {
    chalk: chalk.Chalk & chalk.ChalkFunction & {
        supportsColor: false | chalk.ColorSupport;
        Level: chalk.Level;
        Color: ("black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | "grey" | "blackBright" | "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright") | ("bgBlack" | "bgRed" | "bgGreen" | "bgYellow" | "bgBlue" | "bgMagenta" | "bgCyan" | "bgWhite" | "bgGray" | "bgGrey" | "bgBlackBright" | "bgRedBright" | "bgGreenBright" | "bgYellowBright" | "bgBlueBright" | "bgMagentaBright" | "bgCyanBright" | "bgWhiteBright");
        ForegroundColor: "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray" | "grey" | "blackBright" | "redBright" | "greenBright" | "yellowBright" | "blueBright" | "magentaBright" | "cyanBright" | "whiteBright";
        BackgroundColor: "bgBlack" | "bgRed" | "bgGreen" | "bgYellow" | "bgBlue" | "bgMagenta" | "bgCyan" | "bgWhite" | "bgGray" | "bgGrey" | "bgBlackBright" | "bgRedBright" | "bgGreenBright" | "bgYellowBright" | "bgBlueBright" | "bgMagentaBright" | "bgCyanBright" | "bgWhiteBright";
        Modifiers: "reset" | "bold" | "dim" | "italic" | "underline" | "inverse" | "hidden" | "strikethrough" | "visible";
        stderr: chalk.Chalk & {
            supportsColor: false | chalk.ColorSupport;
        };
    };
    semver: any;
    deepExtend: (...args: any[]) => any;
    slash: typeof slash;
    minimist: typeof minimist;
    fs: typeof fs;
    ora: {
        (options?: string | ora.Options | undefined): ora.Ora;
        promise(action: PromiseLike<unknown>, options?: string | ora.Options | undefined): ora.Ora;
    };
    Listr: typeof Listr;
    localIP: string;
    log: typeof log;
    err: typeof err;
    execa: {
        (file: string, arguments?: readonly string[] | undefined, options?: execa.Options<string> | undefined): execa.ExecaChildProcess<string>;
        (file: string, arguments?: readonly string[] | undefined, options?: execa.Options<null> | undefined): execa.ExecaChildProcess<Buffer>;
        (file: string, options?: execa.Options<string> | undefined): execa.ExecaChildProcess<string>;
        (file: string, options?: execa.Options<null> | undefined): execa.ExecaChildProcess<Buffer>;
        sync(file: string, arguments?: readonly string[] | undefined, options?: execa.SyncOptions<string> | undefined): execa.ExecaSyncReturnValue<string>;
        sync(file: string, arguments?: readonly string[] | undefined, options?: execa.SyncOptions<null> | undefined): execa.ExecaSyncReturnValue<Buffer>;
        sync(file: string, options?: execa.SyncOptions<string> | undefined): execa.ExecaSyncReturnValue<string>;
        sync(file: string, options?: execa.SyncOptions<null> | undefined): execa.ExecaSyncReturnValue<Buffer>;
        command(command: string, options?: execa.Options<string> | undefined): execa.ExecaChildProcess<string>;
        command(command: string, options?: execa.Options<null> | undefined): execa.ExecaChildProcess<Buffer>;
        commandSync(command: string, options?: execa.SyncOptions<string> | undefined): execa.ExecaSyncReturnValue<string>;
        commandSync(command: string, options?: execa.SyncOptions<null> | undefined): execa.ExecaSyncReturnValue<Buffer>;
        node(scriptPath: string, arguments?: readonly string[] | undefined, options?: execa.NodeOptions<string> | undefined): execa.ExecaChildProcess<string>;
        node(scriptPath: string, arguments?: readonly string[] | undefined, options?: execa.Options<null> | undefined): execa.ExecaChildProcess<Buffer>;
        node(scriptPath: string, options?: execa.Options<string> | undefined): execa.ExecaChildProcess<string>;
        node(scriptPath: string, options?: execa.Options<null> | undefined): execa.ExecaChildProcess<Buffer>;
    };
    getCmdVersion: typeof getCmdVersion;
    isEmptyObject: typeof isEmptyObject;
    platform: {
        npmVersion: string;
        yarnVersion: string;
        cnpmVersion: string;
        isWindows: boolean;
        isMacintosh: boolean;
        isLinux: boolean;
    };
    readDirSync: typeof readDirSync;
    checkNodeVersion: typeof checkNodeVersion;
    loadPackageVesrion: typeof loadPackageVesrion;
    clearConsole: typeof clearConsole;
    got: import("got").Got;
    getProxy: () => string | null;
    createProxyAgent: typeof createProxyAgent;
    testHttpUrl: typeof testHttpUrl;
    checkPort: typeof checkPort;
};
export = _default;
