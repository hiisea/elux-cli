import { CommandOptions, ITemplate } from './base';
declare class Creator {
    private projectName;
    private projectDir;
    private templateDir;
    private options;
    private templates;
    private title;
    constructor(projectName: string, projectDir: string, templateDir: string, options: CommandOptions, templates: ITemplate[], title: string);
    askPlatform(templates: ITemplate[]): Promise<{
        feat: string;
        templates: ITemplate[];
    }>;
    askFramework(templates: ITemplate[]): Promise<{
        feat: string;
        templates: ITemplate[];
    }>;
    askCss(templates: ITemplate[]): Promise<{
        feat: string;
        templates: ITemplate[];
    }>;
    askTemplate(templates: ITemplate[]): Promise<ITemplate>;
    parseTemplates(floder: string): void;
    askEnsure(): Promise<boolean>;
    create(): Promise<void>;
}
export = Creator;
