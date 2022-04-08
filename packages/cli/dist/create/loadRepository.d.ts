export interface ITemplates {
    name: string;
    platforms?: string | string[];
    desc?: string;
}
export declare function loadRepository(url: string, proxy: string): Promise<string | Error>;
