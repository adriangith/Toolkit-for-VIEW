import { TemplateSheetRecord } from './types';

export function selectTemplatesForOption(expectedLetters: string[], templates: TemplateSheetRecord[]): TemplateSheetRecord[] {
    const selectedTemplates = templates.filter(template => expectedLetters.includes(template.Correspondence));
    const foundLetters = new Set(selectedTemplates.map(template => template.Correspondence));
    const missingLetters = expectedLetters.filter(letter => !foundLetters.has(letter));

    if (missingLetters.length > 0) {
        throw new Error(`No template row configured for: ${missingLetters.join(', ')}`);
    }

    return selectedTemplates;
}
