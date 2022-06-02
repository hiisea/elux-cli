export declare function dev({ env, port }: {
    env: string;
    port: number;
}): Promise<void>;
export declare function build({ env, port, analyzerPort }: {
    env: string;
    port: number;
    analyzerPort: number;
}): void;
export declare function pack({ input, output, target, minimize }: {
    input: string;
    output: string;
    target: string;
    minimize: boolean;
}): void;
