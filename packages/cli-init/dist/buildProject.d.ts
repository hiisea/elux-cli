import { FeatChoices, ITemplate } from './libs/base';
export default function main({ projectName, projectDir, repository, templateDir, template, featChoices, }: {
    projectName: string;
    projectDir: string;
    repository: string;
    templateDir: string;
    template: ITemplate;
    featChoices: FeatChoices;
}): void;
