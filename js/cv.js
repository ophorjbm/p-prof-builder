(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./kb.js'), require('./generate.js'), require('./product-name.js'));
  else root.ProfileCV = factory(root.ProfileKB, root.ProfileGenerate, root.PROFILE_PRODUCT_NAME);
})(typeof window !== 'undefined' ? window : this, function (KB, GENERATE, PRODUCT_NAME) {
  'use strict';
  function generate(input, lang, answers) {
    var facts = input && typeof input.all === 'function' ? input.all() : (input && input.facts ? input.facts : input);
    var language = lang === 'he' ? 'he' : 'en';
    var output = GENERATE.generateCV(facts, { lang: language, answers: answers || {} });
    var store = KB.createStore(facts);
    var renderedKeys = store.byTag('cv').filter(function (fact) {
      var text = KB.textFor(fact, language, 'cv');
      return text && output.indexOf(text) !== -1;
    }).map(function (fact) { return fact.questionKey || fact.id; });
    var omissions = {};
    store.byTag('cv').forEach(function (fact) {
      var key = fact.questionKey || fact.id;
      if (renderedKeys.indexOf(key) === -1) omissions[key] = KB.hasText(fact) ? 'Not rendered in this section; see the omission report.' : 'Empty value; not guessed.';
    });
    store.all().filter(function (fact) { return fact.tags.indexOf('cv') === -1; }).forEach(function (fact) {
      omissions[fact.questionKey || fact.id] = 'Not rendered in this section; the fact remains available through the shared interview adapter.';
    });
    var sectionOmissions = GENERATE.CV_SECTION_ORDER.filter(function (section) {
      return output.indexOf('## ' + GENERATE.SECTION_LABELS[language][section]) === -1;
    }).map(function (section) { return section + ': omitted because it has no renderable public facts.'; });
    var employerOmission = GENERATE.employerOmissionNote(answers || {}, language);
    if (employerOmission) sectionOmissions.push(employerOmission);
    return { language: language, product_name: PRODUCT_NAME[language], section_order: GENERATE.CV_SECTION_ORDER.slice(), text: output, rendered_keys: renderedKeys, reachable_keys: renderedKeys.slice(), omissions: omissions, omission_report: sectionOmissions };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function resolveName(facts, language) {
    var list = facts || [];
    for (var i = 0; i < list.length; i += 1) {
      if ((list[i].questionKey || '') !== 'FULL_NAME') continue;
      var name = KB.textFor(list[i], language, 'cv');
      if (name && GENERATE.isRenderableText(name)) return name.trim();
    }
    return '';
  }

  function contactLine(facts, language) {
    return (facts || []).filter(function (fact) {
      return fact.section === 'contact' && fact.questionKey !== 'FULL_NAME';
    }).map(function (fact) {
      var value = KB.textFor(fact, language, 'cv');
      return GENERATE.isRenderableText(value) ? String(value).trim() : '';
    }).filter(Boolean).join(' | ');
  }

  function safeImage(value) {
    var text = String(value == null ? '' : value).trim();
    return /^(data:image\/(?:png|jpeg|jpg|webp);base64,|https:\/\/)/i.test(text) ? text : '';
  }

  function htmlStyles() {
    return [
      'html,body{margin:0;padding:0;background:#f1f3f5;color:#17202a;font-family:Arial,Helvetica,sans-serif}',
      'main{box-sizing:border-box;width:210mm;min-height:297mm;margin:12mm auto;padding:14mm 16mm;background:#fff}',
      '.header{display:flex;align-items:center;gap:7mm;padding-bottom:5mm;border-bottom:3px solid #2f6f73}',
      '.header-photo{width:24mm;height:24mm;object-fit:cover;border-radius:50%;flex:0 0 auto}',
      '.header-copy{min-width:0;flex:1}',
      'h1{margin:0 0 1mm;color:#174a5b;font-size:24pt;font-weight:700}',
      'h2{margin:6mm 0 2mm;padding-bottom:1mm;border-bottom:1px solid #9ab8b7;color:#174a5b;font-size:11pt;letter-spacing:.04em;text-transform:uppercase}',
      'h3{margin:3mm 0 1mm;color:#174a5b;font-size:10pt;font-weight:600}',
      'p{margin:1.4mm 0;font-size:9.5pt;line-height:1.35}',
      '.contact{margin:0 0 3mm;font-size:9pt;line-height:1.4}',
      '.item{margin:1.2mm 0;padding-inline-start:0}',
      '.item:before{content:"• ";color:#174a5b}',
      '@page{size:A4;margin:12mm}',
       '@media print{html,body{background:#fff}main{width:auto;min-height:0;margin:0;padding:0;box-shadow:none;transform:none!important}.header-photo{print-color-adjust:exact;-webkit-print-color-adjust:exact}}'
    ].join('');
  }

  function bodyFromText(text, language) {
    var contactLabel = GENERATE.SECTION_LABELS[language].contact;
    var inContact = false;
    var body = [];
    String(text || '').split('\n').forEach(function (line) {
      if (!line.trim()) return;
      if (line.indexOf('## ') === 0) {
        var heading = line.slice(3).trim();
        inContact = heading === contactLabel;
        body.push('<h2>' + escapeHtml(heading) + '</h2>');
        return;
      }
      if (line.indexOf('### ') === 0) {
        inContact = false;
        body.push('<h3>' + escapeHtml(line.slice(4).trim()) + '</h3>');
        return;
      }
      if (line.indexOf('- ') === 0) {
        inContact = false;
        body.push('<p class="item">' + escapeHtml(line.slice(2).trim()) + '</p>');
        return;
      }
      if (inContact) {
        body.push('<p class="contact">' + escapeHtml(line.trim()) + '</p>');
        inContact = false;
        return;
      }
      body.push('<p>' + escapeHtml(line.trim()) + '</p>');
    });
    return body.join('');
  }

  function renderHtml(input, options) {
    var settings = options || {};
    var language = settings.lang === 'he' ? 'he' : 'en';
    var facts = input && typeof input.all === 'function' ? input.all() : (input && input.facts ? input.facts : input);
    var hydrated = KB.hydrate(facts || [], settings.answers || {});
    var text = GENERATE.generateCV(facts, { lang: language, answers: settings.answers || {} });
    var title = resolveName(hydrated, language) || (language === 'he' ? 'קורות חיים' : 'Curriculum Vitae');
    var contact = contactLine(hydrated, language);
    var photo = settings.showPhoto === false ? '' : safeImage((settings.answers || {}).CV_PROFILE_IMAGE || (settings.answers || {}).LINKEDIN_PROFILE_IMAGE);
    var dir = language === 'he' ? 'rtl' : 'ltr';
    return [
      '<!DOCTYPE html>',
      '<html lang="' + language + '" dir="' + dir + '">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + escapeHtml(title) + '</title>',
      '<style>' + htmlStyles() + '</style>',
      '</head>',
      '<body>',
      '<main>',
      '<header class="header">' + (photo ? '<img class="header-photo" src="' + escapeHtml(photo) + '" alt="">' : '') + '<div class="header-copy"><h1>' + escapeHtml(title) + '</h1>' + (contact ? '<p class="contact">' + escapeHtml(contact) + '</p>' : '') + '</div></header>',
      bodyFromText(text, language),
      '</main>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  return {
    SECTION_ORDER: GENERATE.CV_SECTION_ORDER,
    SKILL_GROUP_ORDER: GENERATE.SKILL_GROUP_ORDER,
    SKILL_GROUP_LABELS: GENERATE.SKILL_GROUP_LABELS,
    generate: generate,
    renderHtml: renderHtml
  };
});
