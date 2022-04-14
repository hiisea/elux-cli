import { FeatChoices, ITemplate } from './base';
declare function build({ projectName, projectDir, templateDir, template, featChoices, }: {
    projectName: string;
    projectDir: string;
    templateDir: string;
    template: ITemplate;
    featChoices: FeatChoices;
}): void;
export = build;
