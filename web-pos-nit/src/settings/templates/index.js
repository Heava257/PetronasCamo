/**
 * Template Index - Export all templates
 */
import { modernTemplate } from './modern.template';
import { smartGlassTemplate } from './smartglass.template';
import { oceanBreezeTemplate } from './oceanbreeze.template';
import { sunsetGlowTemplate } from './sunsetglow.template';
import { festiveTemplate } from './festive.template';
import { docuverseTemplate } from './docuverse.template';
import { careConciergeTemplate } from './careconcierge.template';
import { careConciergeV2Template } from './careconcierge_v2.template';
import { castleTemplate } from './castle.template';
import { royalAmethystTemplate } from './royalamethyst.template';
import { crimsonProTemplate } from './crimsonpro.template';
import { acledaGoldTemplate } from './acledagold.template';

export const templates = {
    modern: modernTemplate,
    smartglass: smartGlassTemplate,
    oceanbreeze: oceanBreezeTemplate,
    sunsetglow: sunsetGlowTemplate,
    festive: festiveTemplate,
    docuverse: docuverseTemplate,
    careconcierge: careConciergeTemplate,
    careconcierge_v2: careConciergeV2Template,
    castle: castleTemplate,
    royalamethyst: royalAmethystTemplate,
    crimsonpro: crimsonProTemplate,
    acledagold: acledaGoldTemplate
};

export const templateList = [
    modernTemplate,
    smartGlassTemplate,
    oceanBreezeTemplate,
    sunsetGlowTemplate,
    festiveTemplate,
    docuverseTemplate,
    careConciergeTemplate,
    careConciergeV2Template,
    castleTemplate,
    royalAmethystTemplate,
    crimsonProTemplate,
    acledaGoldTemplate
];

export const getTemplate = (id) => {
    return templates[id] || modernTemplate;
};

export default templates;

