import { CommandOptions, FeatChoices, ITemplate } from './base';
declare class Creator {
    private projectName;
    private projectDir;
    private repository;
    private templateDir;
    private options;
    private templates;
    private title;
    constructor(projectName: string, projectDir: string, repository: string, templateDir: string, options: CommandOptions, templates: ITemplate[], title: string);
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
    askTemplate(templates: ITemplate[], featChoices: FeatChoices): Promise<ITemplate>;
    askEnsure(): Promise<boolean>;
    create(): Promise<void>;
}
export = Creator;
