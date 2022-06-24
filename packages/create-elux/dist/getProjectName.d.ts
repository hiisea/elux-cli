import type { TemplateResources } from './libs/base';
export default function main(args: {
    title: string[];
    templateResources: TemplateResources[];
    cliVersion: string;
}): Promise<void>;
