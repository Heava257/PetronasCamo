/**
 * Template Index - Export all templates
 */
import { classicTemplate } from './classic.template';
import { modernTemplate } from './modern.template';
import { compactTemplate } from './compact.template';
import { smartGlassTemplate } from './smartglass.template';
import { darkDynamicTemplate } from './darkdynamic.template';
import { oceanBreezeTemplate } from './oceanbreeze.template';
import { sunsetGlowTemplate } from './sunsetglow.template';
import { festiveTemplate } from './festive.template';

export const templates = {
    classic: classicTemplate,
    modern: modernTemplate,
    compact: compactTemplate,
    smartglass: smartGlassTemplate,
    darkdynamic: darkDynamicTemplate,
    oceanbreeze: oceanBreezeTemplate,
    sunsetglow: sunsetGlowTemplate,
    festive: festiveTemplate
};

export const templateList = [
    classicTemplate,
    modernTemplate,
    compactTemplate,
    smartGlassTemplate,
    darkDynamicTemplate,
    oceanBreezeTemplate,
    sunsetGlowTemplate,
    festiveTemplate
];

export const getTemplate = (id) => {
    return templates[id] || modernTemplate;
};

export default templates;

