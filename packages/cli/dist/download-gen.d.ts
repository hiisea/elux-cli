interface Task {
    url: string;
    dist: string;
    timeout?: number;
    override?: boolean;
    replace?: (code: string) => string;
}
interface Config {
    timeout?: number;
    override?: boolean;
    replace?: (code: string) => string;
    onComplete?: (skipItems: Record<string, string>, errorItems: Record<string, string>, successItems: number) => void;
    entries: Array<(envName: string) => Task[]>;
}
interface EluxConfig {
    gen: Config;
}
declare const _default: (rootPath: string, eluxConfig: EluxConfig, envName: string) => Promise<void>;
export = _default;