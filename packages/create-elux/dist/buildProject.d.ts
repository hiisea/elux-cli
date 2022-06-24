import { ITemplate, TPLOptions } from './libs/base';
export default function main({ projectName, projectDir, repository, templateDir, template, tplOptions, }: {
    projectName: string;
    projectDir: string;
    repository: string;
    templateDir: string;
    template: ITemplate;
    tplOptions: TPLOptions;
}): void;
