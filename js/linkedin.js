(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./kb.js'), require('./generate.js'), require('./product-name.js'));
  else root.ProfileLinkedIn = factory(root.ProfileKB, root.ProfileGenerate, root.PROFILE_PRODUCT_NAME);
})(typeof window !== 'undefined' ? window : this, function (KB, GENERATE, PRODUCT_NAME) {
  'use strict';
  var HEADLINE_MAX = 220;
  var ABOUT_MAX = 2600;
  function skillFactsFrom(facts) {
    var list = facts && typeof facts.all === 'function' ? facts.all() : (facts && facts.facts ? facts.facts : facts) || [];
    return GENERATE.orderLinkedInSkillFacts(list.filter(function (fact) {
      return fact && GENERATE.isPublicFact(fact, 'linkedin') && fact.category === 'skill' && fact.section === 'skills';
    }));
  }
  function skillsText(facts, lang) {
    var language = lang === 'he' ? 'he' : 'en';
    return skillFactsFrom(facts).map(function (fact) {
      var text = KB.textFor(fact, language, 'linkedin');
      return GENERATE.isRenderableText(text) ? text.trim() : '';
    }).filter(Boolean).join('\n');
  }
  function generate(input, options) {
    var settings = options || {};
    var facts = input && typeof input.all === 'function' ? input.all() : (input && input.facts ? input.facts : input);
    var language = settings.lang === 'he' ? 'he' : 'en';
    var cvLink = settings.cvLink == null ? settings.cv_link : settings.cvLink;
    var output = GENERATE.generateLinkedIn(facts, { lang: language, cvLink: cvLink, answers: settings.answers });
    var orderedSkills = skillFactsFrom(facts);
    var skills = skillsText(facts, language) || output.skills;
    var keys = KB.createStore(facts).byTag('linkedin').map(function (fact) { return fact.questionKey || fact.id; });
    return {
      language: language,
      product_name: PRODUCT_NAME[language],
      headline: output.headline,
      about: output.about,
      experience: output.experience,
      projects: output.projects,
      skills: skills,
      skill_keys: orderedSkills.map(function (fact) { return fact.questionKey || fact.id; }),
      contact: [],
      cv_link: output.cvLink,
      fact_keys: keys,
      reachable_keys: keys,
      warnings: output.warnings,
      omission_report: output.omission_report || []
    };
  }
  return {
    generate: generate,
    skillFactsFrom: skillFactsFrom,
    skillsText: skillsText,
    HEADLINE_MAX: HEADLINE_MAX,
    ABOUT_MAX: ABOUT_MAX
  };
});
