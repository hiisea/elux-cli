import type { TemplateResources } from './libs/base';
export default function main(args: {
    title: string[];
    templateResources: TemplateResources[];
    projectName: string;
    projectDir: string;
    cliVersion: string;
}): Promise<void>;
