import { ITemplate } from './libs/base';
export default function main(args: {
    title: string[];
    templates: ITemplate[];
    projectName: string;
    projectDir: string;
    repository: string;
    templateDir: string;
}): Promise<void>;
