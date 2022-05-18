import { FeatChoices, ITemplate } from './base';
declare function build({ projectName, projectDir, repository, templateDir, template, featChoices, }: {
    projectName: string;
    projectDir: string;
    repository: string;
    templateDir: string;
    template: ITemplate;
    featChoices: FeatChoices;
}): void;
export = build;
