/**
 * Template Index - Export all templates
 */
import { modernTemplate } from './modern.template';
import { smartGlassTemplate } from './smartglass.template';
import { oceanBreezeTemplate } from './oceanbreeze.template';
import { sunsetGlowTemplate } from './sunsetglow.template';
import { festiveTemplate } from './festive.template';

export const templates = {
    modern: modernTemplate,
    smartglass: smartGlassTemplate,
    oceanbreeze: oceanBreezeTemplate,
    sunsetglow: sunsetGlowTemplate,
    festive: festiveTemplate
};

export const templateList = [
    modernTemplate,
    smartGlassTemplate,
    oceanBreezeTemplate,
    sunsetGlowTemplate,
    festiveTemplate
];

export const getTemplate = (id) => {
    return templates[id] || modernTemplate;
};

export default templates;

