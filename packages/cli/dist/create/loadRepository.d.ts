export interface ITemplates {
    name: string;
    platforms?: string | string[];
    desc?: string;
}
export declare function loadRepository(repository: string, clone?: boolean): Promise<string | Error>;
