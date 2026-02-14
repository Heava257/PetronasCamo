/**
 * Template Index - Export all templates
 */
import { modernTemplate } from './modern.template';
import { chineseNewYearTemplate } from './chinesenewyear.template';
import { fuelTemplate } from './fuel.template';

export const templates = {
    modern: modernTemplate,
    chinesenewyear: chineseNewYearTemplate,
    fuel: fuelTemplate
};

export const templateList = [
    modernTemplate,
    chineseNewYearTemplate,
    fuelTemplate
];

export const getTemplate = (id) => {
    return templates[id] || modernTemplate;
};

export default templates;
