/// <reference types="node" />
import _execa from 'execa';
import _fse from 'fs-extra';
import _ora from 'ora';
export declare function getLocalIP(): string;
export declare function getCssScopedName(srcPath: string, localName: string, mfileName: string): string;
export declare function checkPort(port: number): Promise<Boolean>;
export declare function slash(path: string): string;
export declare function clearConsole(title: string): void;
export declare function testHttpUrl(url: string): boolean;
export declare function readDirSync(floder: string): {
    name: string;
    isDirectory: boolean;
    isFile: boolean;
}[];
export declare function isEmptyObject(obj: any): boolean;
export declare const platform: {
    isWindows: boolean;
    isMacintosh: boolean;
};
export declare function loadPackageFields(packageName: string, fields: string): any;
export declare function loadPackageVesrion(packageName: string): string;
export declare function loadPackageVesrion(packageName: string, installedVersion: string): [string, string];
export declare function getCmdVersion(cmd: string): string;
export declare function getGlobalDir(): string[];
export declare function getEluxConfig(env: string): {
    config: Record<string, any>;
    envPath: string;
};
export declare function checkVersion(bundleName: string, bundleVer: string, platformName: string, wantedVer?: string, curVer?: string): void;
export declare const chalk: {
    bold: import("chalk").Chalk;
    cyan: import("chalk").Chalk;
    gray: import("chalk").Chalk;
    green: import("chalk").Chalk;
    magentaBright: import("chalk").Chalk;
    redBright: import("chalk").Chalk;
    underline: import("chalk").Chalk;
    yellow: import("chalk").Chalk;
    bright: import("chalk").Chalk;
};
export declare const deepExtend: (...args: any[]) => any;
export declare const fse: typeof _fse;
export declare const ora: {
    (options?: string | _ora.Options | undefined): _ora.Ora;
    promise(action: PromiseLike<unknown>, options?: string | _ora.Options | undefined): _ora.Ora;
};
export declare const semver: any;
export declare const packageNameValidate: any;
export declare const execa: {
    (file: string, arguments?: readonly string[] | undefined, options?: _execa.Options<string> | undefined): _execa.ExecaChildProcess<string>;
    (file: string, arguments?: readonly string[] | undefined, options?: _execa.Options<null> | undefined): _execa.ExecaChildProcess<Buffer>;
    (file: string, options?: _execa.Options<string> | undefined): _execa.ExecaChildProcess<string>;
    (file: string, options?: _execa.Options<null> | undefined): _execa.ExecaChildProcess<Buffer>;
    sync(file: string, arguments?: readonly string[] | undefined, options?: _execa.SyncOptions<string> | undefined): _execa.ExecaSyncReturnValue<string>;
    sync(file: string, arguments?: readonly string[] | undefined, options?: _execa.SyncOptions<null> | undefined): _execa.ExecaSyncReturnValue<Buffer>;
    sync(file: string, options?: _execa.SyncOptions<string> | undefined): _execa.ExecaSyncReturnValue<string>;
    sync(file: string, options?: _execa.SyncOptions<null> | undefined): _execa.ExecaSyncReturnValue<Buffer>;
    command(command: string, options?: _execa.Options<string> | undefined): _execa.ExecaChildProcess<string>;
    command(command: string, options?: _execa.Options<null> | undefined): _execa.ExecaChildProcess<Buffer>;
    commandSync(command: string, options?: _execa.SyncOptions<string> | undefined): _execa.ExecaSyncReturnValue<string>;
    commandSync(command: string, options?: _execa.SyncOptions<null> | undefined): _execa.ExecaSyncReturnValue<Buffer>;
    node(scriptPath: string, arguments?: readonly string[] | undefined, options?: _execa.NodeOptions<string> | undefined): _execa.ExecaChildProcess<string>;
    node(scriptPath: string, arguments?: readonly string[] | undefined, options?: _execa.Options<null> | undefined): _execa.ExecaChildProcess<Buffer>;
    node(scriptPath: string, options?: _execa.Options<string> | undefined): _execa.ExecaChildProcess<string>;
    node(scriptPath: string, options?: _execa.Options<null> | undefined): _execa.ExecaChildProcess<Buffer>;
};
export { validate as schemaValidate } from 'schema-utils';
