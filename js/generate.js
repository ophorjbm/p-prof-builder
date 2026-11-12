(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./kb.js'));
  else root.ProfileGenerate = factory(root.ProfileKB);
})(typeof window !== 'undefined' ? window : this, function (kb) {
  'use strict';

  if (!kb) throw new Error('ProfileKB is required');

  var EMPLOYER_KEYS = ['EMPLOYER_TITLE', 'EMPLOYER_ORGANIZATION', 'EMPLOYER_EMPLOYMENT_TYPE', 'EMPLOYER_START_DATE', 'EMPLOYER_END_DATE', 'EMPLOYER_CURRENT', 'EMPLOYER_BULLET_1', 'EMPLOYER_BULLET_2'];

  var CV_SECTION_ORDER = [
    'contact', 'summary', 'experience', 'education', 'skills',
    'languages', 'certifications', 'projects', 'volunteering'
  ];

  var SKILL_GROUP_ORDER = [];
  var SKILL_GROUP_LABELS = { en: {}, he: {} };

  var SECTION_LABELS = {
    en: {
      contact: 'Contact',
      summary: 'Summary',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      certifications: 'Certifications',
      projects: 'Projects',
      volunteering: 'Volunteering'
    },
    he: {
      contact: 'פרטי קשר',
      summary: 'תקציר',
      experience: 'ניסיון',
      education: 'השכלה',
      skills: 'כישורים',
      languages: 'שפות',
      certifications: 'הסמכות',
      projects: 'פרויקטים',
      volunteering: 'התנדבות'
    }
  };

  var LINKEDIN_LABELS = {
    en: { headline: 'Headline', about: 'About', experience: 'Experience', projects: 'Projects', skills: 'Skills', cv: 'CV' },
    he: { headline: 'כותרת', about: 'אודות', experience: 'ניסיון', projects: 'פרויקטים', skills: 'כישורים', cv: 'קורות חיים' }
  };

  var SECTION_FOR_CATEGORY = {
    contact: 'contact',
    summary: 'summary',
    experience: 'experience',
    education: 'education',
    skill: 'skills',
    language: 'languages',
    certification: 'certifications',
    project: 'projects',
    volunteering: 'volunteering',
    achievement: 'projects',
    'personal-value': 'summary',
    other: null
  };

  var PROMPT_TEMPLATES = {
    contact: { he: 'ספר/י בקצרה: {q}', en: 'Tell me briefly: {q}' },
    summary: { he: 'סכם/י: {q}', en: 'Summarize: {q}' },
    experience: { he: 'ספר/י סיפור STAR על: {q}', en: 'Tell a STAR story about: {q}' },
    education: { he: 'ספר/י על: {q}', en: 'Tell me about: {q}' },
    skill: { he: 'תן/י דוגמה שבה השתמשת ב: {q}', en: 'Give an example of using: {q}' },
    language: { he: 'מה רמת: {q}', en: 'What is your level in: {q}' },
    certification: { he: 'ספר/י על ההסמכה: {q}', en: 'Tell me about the certification: {q}' },
    project: { he: 'ספר/י על הפרויקט: {q}', en: 'Tell me about the project: {q}' },
    volunteering: { he: 'ספר/י על ההתנדבות: {q}', en: 'Tell me about the volunteering: {q}' },
    achievement: { he: 'ספר/י על ההישג: {q}', en: 'Tell me about the achievement: {q}' },
    'personal-value': { he: 'מה הערך החשוב לך: {q}', en: 'Which value matters to you: {q}' },
    other: { he: 'הסבר/י: {q}', en: 'Explain: {q}' }
  };

  function keyFor(fact) {
    return String((fact && (fact.questionKey || fact.id)) || '').toUpperCase();
  }

  function isPlaceholder(value) {
    var text = String(value == null ? '' : value).trim();
    if (!text) return false;
    if (/^\[[A-Z0-9_-]+\]$/.test(text)) return true;
    return /^(tbd|n\/a|na|todo|placeholder)$/i.test(text);
  }

  function isInfrastructureFact(fact) {
    var key = keyFor(fact);
    return Boolean(fact && (fact.section === 'interview' || /^STAR_/.test(key)));
  }

  function isRenderableText(value) {
    var text = String(value == null ? '' : value).trim();
    return Boolean(text) && !isPlaceholder(text);
  }

  function isPublicFact(fact, tag) {
    return fact && fact.sensitivity !== 'private' && (!tag || fact.tags.indexOf(tag) !== -1) && !isInfrastructureFact(fact);
  }

  function langOf(options) {
    return options && options.lang === 'he' ? 'he' : 'en';
  }

  function fieldText(value, lang) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return value[lang] || value.en || value.he || '';
    return '';
  }

  function factText(fact, lang, output) {
    return kb.textFor(fact, lang, output);
  }

  function placeholderFor(fact) {
    return '[' + (fact.questionKey || fact.id.replace(/-/g, '')) + ']';
  }

  function valueOrPlaceholder(fact, lang, output, includeMissing) {
    var text = factText(fact, lang, output);
    return isRenderableText(text) ? text.trim() : '';
  }

  function isValidUrl(value) {
    var text = value == null ? '' : String(value).trim();
    if (!text) return true;
    if (!/^https?:\/\/[^\s]+$/i.test(text)) return false;
    if (typeof URL === 'function') {
      try {
        new URL(text);
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  function renderCvFact(fact, text, lang) {
    var kind = fact.fields && fact.fields.kind;
    if (fact.section === 'contact') {
      if (kind === 'github') return 'GitHub: ' + text;
      if (kind === 'linkedin') return 'LinkedIn: ' + text;
      if (kind === 'portfolio') return 'Portfolio: ' + text;
      if (kind === 'cv_link') return 'CV: ' + text;
      return text;
    }
    if (fact.category === 'language') {
      var name = fieldText(fact.fields && fact.fields.name, lang);
      return (name ? name + ': ' : '') + text;
    }
    if (['experience', 'education', 'skill', 'certification', 'project', 'volunteering', 'achievement'].indexOf(fact.category) !== -1) {
      return '- ' + text;
    }
    return text;
  }

  function isNoiseExperienceText(text) {
    return /^(?:yes|no|not used|n\/a|none|unknown|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{4}|\d{4}(?:[-/]\d{1,2})?(?:\s*[-/]\s*(?:\d{4}|present))?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\s*[-/]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?\d{4})$/i.test(String(text).trim());
  }

  function isProjectFact(fact) {
    return fact && (fact.category === 'project' || fact.section === 'projects');
  }

  function parsedRole(text) {
    var parts = String(text).trim().split(/\s*\|\s*/);
    var role = parts[0] && parts[0].match(/^(.+?),\s+(.+)$/);
    var date = /^(?:\d{1,2}\/\d{4}|\d{4}(?:[-/]\d{1,2})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})(?:\s*[-/]\s*(?:present|\d{1,2}\/\d{4}|\d{4}(?:[-/]\d{1,2})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}))?$/i;
    return parts.length === 2 && role && date.test(parts[1]) ? role[1].trim() + ', ' + role[2].trim() + ' | ' + parts[1].trim() : '';
  }

  function employerAnswerText(value, lang) {
    if (typeof value === 'object' && value) return String(value[lang] || value.en || value.he || '').trim();
    return String(value == null ? '' : value).trim();
  }

  function employerHasAnyAnswer(answers) {
    var data = answers || {};
    return EMPLOYER_KEYS.some(function (key) {
      var value = data[key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });
  }

  function isFounderRole(fields, title) {
    if (fields && fields.founder === true) return true;
    return /founder|מייסד/i.test(String(title == null ? '' : title));
  }

  function employerOmissionNote(answers, lang) {
    if (!employerHasAnyAnswer(answers)) return null;
    var data = answers || {};
    var language = lang === 'he' ? 'he' : 'en';
    var title = employerAnswerText(data.EMPLOYER_TITLE, language);
    var organization = employerAnswerText(data.EMPLOYER_ORGANIZATION, language);
    if (!isRenderableText(title) || !isRenderableText(organization)) {
      return 'experience employer: omitted because title or organization is empty.';
    }
    return null;
  }

  function employerFact(facts, answers, lang) {
    var data = answers || {};
    var values = {};
    EMPLOYER_KEYS.forEach(function (key) {
      var value = data[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') values[key] = value;
    });
    if (!Object.keys(values).length) return null;
    var title = employerAnswerText(values.EMPLOYER_TITLE, lang);
    var organization = employerAnswerText(values.EMPLOYER_ORGANIZATION, lang);
    if (!isRenderableText(title) || !isRenderableText(organization)) return { missing: true, values: values };
    var employmentType = employerAnswerText(values.EMPLOYER_EMPLOYMENT_TYPE, lang);
    var start = employerAnswerText(values.EMPLOYER_START_DATE, lang);
    var end = values.EMPLOYER_CURRENT === true || String(values.EMPLOYER_CURRENT).toLowerCase() === 'true'
      ? (lang === 'he' ? 'היום' : 'Present')
      : employerAnswerText(values.EMPLOYER_END_DATE, lang);
    var dates = [start, end].filter(isRenderableText).join(' - ');
    var displayTitle = title + (isRenderableText(employmentType) ? ' (' + employmentType + ')' : '');
    return {
      id: 'F-EMPLOYER-EXPERIENCE', questionKey: 'EMPLOYER_TITLE', category: 'experience', section: 'experience',
      tags: ['cv', 'linkedin', 'interview'], text: { he: displayTitle, en: displayTitle }, status: 'confirmed', sensitivity: 'public',
      fields: {
        title: displayTitle,
        organization: organization,
        dates: dates,
        employer: true,
        bullets: [employerAnswerText(values.EMPLOYER_BULLET_1, lang), employerAnswerText(values.EMPLOYER_BULLET_2, lang)].filter(isRenderableText)
      }
    };
  }

  function renderExperienceLines(factsIn, lang) {
    var structured = [];
    var plain = [];
    factsIn.forEach(function (fact) {
      var text = valueOrPlaceholder(fact, lang, 'cv', false);
      var fields = fact.fields || {};
      if (fields.title || fields.organization || fields.dates) {
        var title = fieldText(fields.title, lang);
        var organization = fieldText(fields.organization, lang);
        var dates = fieldText(fields.dates, lang);
        var isEmployer = fields.employer === true;
        if (isEmployer) {
          if (!isRenderableText(title) || !isRenderableText(organization)) return;
          var employerRole = String(title).trim() + ', ' + String(organization).trim();
          var employerHeader = isRenderableText(dates) ? employerRole + ' | ' + String(dates).trim() : employerRole;
          structured.push({
            employer: true,
            founder: false,
            lines: ['- ' + employerHeader].concat((fields.bullets || []).map(function (bullet) {
              return isRenderableText(bullet) ? '- ' + String(bullet).trim() : '';
            }).filter(Boolean))
          });
          return;
        }
        var role = [title, organization].filter(isRenderableText).join(', ');
        if (!(role && isRenderableText(dates))) return;
        structured.push({
          employer: false,
          founder: isFounderRole(fields, title),
          lines: ['- ' + role + ' | ' + String(dates).trim()].concat((fields.bullets || []).map(function (bullet) {
            return isRenderableText(bullet) ? '- ' + String(bullet).trim() : '';
          }).filter(Boolean))
        });
        return;
      }
      if (!text || isNoiseExperienceText(text)) return;
      var roleLine = parsedRole(text);
      if (roleLine) {
        structured.push({
          employer: false,
          founder: isFounderRole(fields, roleLine),
          lines: ['- ' + roleLine]
        });
      } else if (isProjectFact(fact)) plain.push('- ' + text);
    });
    var employer = structured.filter(function (entry) { return entry.employer; });
    var other = structured.filter(function (entry) { return !entry.employer; });
    var founderIndex = -1;
    for (var i = 0; i < other.length; i += 1) {
      if (other[i].founder) {
        founderIndex = i;
        break;
      }
    }
    var ordered;
    if (!other.length) {
      ordered = employer;
    } else if (founderIndex >= 0) {
      var founder = other[founderIndex];
      var rest = other.slice(0, founderIndex).concat(other.slice(founderIndex + 1));
      ordered = [founder].concat(employer, rest);
    } else {
      ordered = [other[0]].concat(employer, other.slice(1));
    }
    return ordered.reduce(function (lines, entry) { return lines.concat(entry.lines); }, []).concat(plain);
  }

  function withEmployerFact(facts, answers, lang) {
    var list = kb.hydrate(facts, answers || {});
    var employer = employerFact(list, answers, lang);
    if (employer && !employer.missing) list.push(employer);
    return { facts: list, employer: employer, omission: employerOmissionNote(answers, lang) };
  }

  function renderEducationLine(factsIn, lang) {
    var parts = [];
    var order = ['EDUCATION_DEGREE', 'EDUCATION_INSTITUTION', 'EDUCATION_DATES', 'EDUCATION_HONORS'];
    order.forEach(function (key) {
      factsIn.forEach(function (fact) {
        if (keyFor(fact) !== key) return;
        var text = valueOrPlaceholder(fact, lang, 'cv', false);
        if (text && parts.indexOf(text) === -1) parts.push(text);
      });
    });
    if (!parts.length) {
      factsIn.forEach(function (fact) {
        var text = valueOrPlaceholder(fact, lang, 'cv', false);
        if (text && parts.indexOf(text) === -1) parts.push(text);
      });
    }
    return parts.length ? ['- ' + parts.join(', ')] : [];
  }

  function renderSkillsSectionLines(factsIn, lang, includeMissing) {
    var byGroup = {};
    var ungrouped = [];
    factsIn.forEach(function (fact) {
      var text = valueOrPlaceholder(fact, lang, 'cv', includeMissing);
      if (!text) return;
      var line = renderCvFact(fact, text, lang);
      var group = fact.fields && fact.fields.group;
      if (group && SKILL_GROUP_ORDER.indexOf(group) !== -1) {
        if (!byGroup[group]) byGroup[group] = [];
        byGroup[group].push(line);
      } else {
        ungrouped.push(line);
      }
    });
    var sectionLines = [];
    var hasGroups = SKILL_GROUP_ORDER.some(function (group) {
      return byGroup[group] && byGroup[group].length;
    });
    if (hasGroups) {
      SKILL_GROUP_ORDER.forEach(function (group) {
        var items = byGroup[group];
        if (!items || !items.length) return;
        sectionLines.push('### ' + SKILL_GROUP_LABELS[lang][group]);
        sectionLines = sectionLines.concat(items);
      });
    }
    return sectionLines.concat(ungrouped);
  }

  function generateCV(facts, options) {
    var opts = options || {};
    var lang = langOf(opts);
    var prepared = withEmployerFact(facts, opts.answers, lang);
    var hydrated = prepared.facts;
    var publicFacts = hydrated.filter(function (fact) { return isPublicFact(fact, 'cv'); });
    var sections = {};
    CV_SECTION_ORDER.forEach(function (section) { sections[section] = []; });
    publicFacts.forEach(function (fact) {
      var section = fact.section && sections[fact.section] ? fact.section : SECTION_FOR_CATEGORY[fact.category];
      if (section && sections[section]) sections[section].push(fact);
    });

    var lines = [];
    CV_SECTION_ORDER.forEach(function (section) {
      var factsIn = sections[section];
      if (!factsIn.length) return;
       var sectionLines;
       if (section === 'skills') sectionLines = renderSkillsSectionLines(factsIn, lang, false);
       else if (section === 'experience') sectionLines = renderExperienceLines(factsIn, lang);
       else if (section === 'education') sectionLines = renderEducationLine(factsIn, lang);
       else if (section === 'contact') {
         sectionLines = [factsIn.map(function (fact) {
           var text = valueOrPlaceholder(fact, lang, 'cv', false);
           return text ? renderCvFact(fact, text, lang) : '';
         }).filter(Boolean).join(' | ')].filter(Boolean);
       } else {
         sectionLines = factsIn.map(function (fact) {
           var text = valueOrPlaceholder(fact, lang, 'cv', false);
           return text ? renderCvFact(fact, text, lang) : '';
         }).filter(Boolean);
       }
      if (!sectionLines.length) return;
      lines.push('## ' + SECTION_LABELS[lang][section]);
      lines = lines.concat(sectionLines);
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  function validateLinkedIn(input) {
    var warnings = [];
    if (input.headline && input.headline.length > 220) {
      warnings.push('Headline is longer than 220 characters.');
    }
    if (input.about && input.about.length > 2600) {
      warnings.push('About is longer than 2600 characters.');
    }
    if (input.skillFacts && input.skillFacts.length > 50) {
      warnings.push('More than 50 skills; keep the first 10 pinned.');
    }
    if (input.cvLink && !input.cvLinkValid) {
      warnings.push('CV link is not a valid http(s) URL and was not rendered.');
    }
    return warnings;
  }

  function orderLinkedInSkillFacts(skillFacts) {
    var pinned = [];
    var rest = [];
    var seen = {};
    (skillFacts || []).forEach(function (fact) {
      var key = fact.id || fact.questionKey || (fact.text && (fact.text.en || fact.text.he)) || '';
      if (key && seen[key]) return;
      if (key) seen[key] = true;
      var pin = fact.fields && fact.fields.pinOrder;
      if (typeof pin === 'number' && pin >= 1 && pin <= 10) pinned.push(fact);
      else rest.push(fact);
    });
    pinned.sort(function (a, b) {
      return a.fields.pinOrder - b.fields.pinOrder;
    });
    return pinned.concat(rest);
  }

  function generateLinkedIn(facts, options) {
    var opts = options || {};
    var lang = langOf(opts);
    var prepared = withEmployerFact(facts, opts.answers, lang);
    var hydrated = prepared.facts;
    var publicFacts = hydrated.filter(function (fact) { return isPublicFact(fact); });
    var byKey = {};
    publicFacts.forEach(function (fact) {
      if (fact.questionKey && !byKey[fact.questionKey]) byKey[fact.questionKey] = fact;
    });

    function value(key) {
      var fact = byKey[key];
      return fact ? valueOrPlaceholder(fact, lang, 'linkedin', false) : '';
    }

    var headline = value('HEADLINE') || value('TARGET_JOB_TITLE');
    var about = value('ABOUT') || value('SUMMARY');
    if (!about) {
      about = publicFacts.filter(function (fact) {
        return fact.tags.indexOf('linkedin') !== -1 && fact.section === 'summary';
      }).map(function (fact) {
          return valueOrPlaceholder(fact, lang, 'linkedin', false);
      }).filter(Boolean).join('\n\n');
    }
    var experienceFacts = publicFacts.filter(function (fact) {
      return fact.tags.indexOf('linkedin') !== -1 && fact.section === 'experience';
    });
    var skillFacts = orderLinkedInSkillFacts(publicFacts.filter(function (fact) {
      return fact.tags.indexOf('linkedin') !== -1 && fact.section === 'skills' && fact.category === 'skill';
    }));
    var projectFacts = publicFacts.filter(function (fact) {
      return fact.tags.indexOf('linkedin') !== -1 && fact.category === 'project';
    });
    var cvLink = opts.cvLink == null ? value('CV_LINK') : String(opts.cvLink).trim();
    var cvLinkValid = isValidUrl(cvLink);

    var experience = renderExperienceLines(experienceFacts, lang).join('\n');
    var skills = skillFacts.map(function (fact) {
      return valueOrPlaceholder(fact, lang, 'linkedin', false);
    }).filter(Boolean).join('\n');
    var projects = projectFacts.map(function (fact) {
      return valueOrPlaceholder(fact, lang, 'linkedin', false);
    }).filter(Boolean).join('\n');

    var warnings = validateLinkedIn({
      headline: headline,
      about: about,
      skillFacts: skillFacts,
      cvLink: cvLink,
      cvLinkValid: cvLinkValid
    });

    var lines = [];
    if (headline) lines.push('## ' + LINKEDIN_LABELS[lang].headline + '\n' + headline);
    if (about) lines.push('## ' + LINKEDIN_LABELS[lang].about + '\n' + about);
    if (experience) lines.push('## ' + LINKEDIN_LABELS[lang].experience + '\n' + experience);
    if (projects) lines.push('## ' + LINKEDIN_LABELS[lang].projects + '\n' + projects);
    if (skills) lines.push('## ' + LINKEDIN_LABELS[lang].skills + '\n' + skills);
    if (cvLink && cvLinkValid) lines.push('## ' + LINKEDIN_LABELS[lang].cv + '\n' + cvLink);

    var missing = publicFacts.filter(function (fact) {
      return !isRenderableText(factText(fact, lang, 'linkedin')) && (fact.questionKey === 'HEADLINE' || fact.questionKey === 'ABOUT' || fact.questionKey === 'CV_LINK' || fact.tags.indexOf('linkedin') !== -1);
    }).map(function (fact) { return fact.id; });

    var omissionReportLines = prepared.omission ? [prepared.omission] : [];

    return {
      headline: headline,
      about: about,
      experience: experience,
      projects: projects,
      skills: skills,
      cvLink: cvLink,
      cvLinkValid: cvLinkValid,
      warnings: warnings,
      missing: missing,
      omission_report: omissionReportLines,
      text: lines.join('\n\n')
    };
  }

  function interviewPrompt(fact, lang) {
    var templates = PROMPT_TEMPLATES[fact.category] || PROMPT_TEMPLATES.other;
    var question = fact.question && (fact.question[lang] || fact.question.en || fact.question.he);
    if (!question && fact.category === 'skill') {
      question = factText(fact, lang) || fact.questionKey || fact.id;
    }
    if (!question) question = fact.questionKey || fact.id;
    return templates[lang].replace('{q}', question);
  }

  function generateInterview(facts, options) {
    var opts = options || {};
    var lang = langOf(opts);
    var hydrated = kb.hydrate(facts, opts.answers || {});
    var prompts = hydrated.map(function (fact) {
      return {
        id: fact.id,
        questionKey: fact.questionKey || null,
        answerKey: fact.questionKey || ('KB_' + fact.id.replace(/-/g, '')),
        category: fact.category,
        tags: fact.tags.slice(),
        prompt: interviewPrompt(fact, lang),
        question: fact.question || { he: '', en: '' },
        answer: factText(fact, lang)
      };
    });
    var coverage = kb.interviewCoverage(hydrated, prompts.map(function (prompt) { return prompt.id; }));
    return { facts: prompts, coverage: coverage };
  }

  function omissionReport(facts, options) {
    var opts = options || {};
    var hydrated = kb.hydrate(facts, opts.answers || {});
    var included = [];
    var omitted = [];
    var needsInput = [];
    hydrated.forEach(function (fact) {
       var text = factText(fact, langOf(opts), 'cv');
       if (!kb.hasText(fact)) {
         needsInput.push(fact);
         return;
       }
       if (!isRenderableText(text)) {
         omitted.push({ id: fact.id, reason: 'Placeholder value; excluded from CV and LinkedIn output.' });
         return;
       }
       if (!isPublicFact(fact)) {
         omitted.push({ id: fact.id, reason: fact.sensitivity === 'private' ? 'Marked private; excluded from public CV and LinkedIn output.' : 'Not a public-output fact; excluded from CV and LinkedIn output.' });
         return;
       }
      included.push(fact.id);
    });

    var lines = ['# Omission report', '', 'Included facts: ' + included.length, '', 'Omitted facts:'];
    if (!omitted.length) lines.push('- None.');
    omitted.forEach(function (item) { lines.push('- ' + item.id + ': ' + item.reason); });
    lines.push('', 'Facts still waiting for a user answer:');
    if (!needsInput.length) lines.push('- None.');
    needsInput.forEach(function (fact) { lines.push('- ' + fact.id + ' (' + (fact.questionKey || fact.id) + ')'); });

    return {
      included: included,
      omitted: omitted,
      needsInput: needsInput.map(function (fact) { return fact.id; }),
      markdown: lines.join('\n')
    };
  }

  function missingQuestionsMarkdown(facts) {
    var lines = kb.missingQuestionLines(facts);
    return [
      '## Facts that need a user answer',
      '',
      '| Key | Hebrew question | Why | Where seen |',
      '|---|---|---|---|'
    ].concat(lines).join('\n');
  }

  return {
    CV_SECTION_ORDER: CV_SECTION_ORDER,
    SKILL_GROUP_ORDER: SKILL_GROUP_ORDER,
    SKILL_GROUP_LABELS: SKILL_GROUP_LABELS,
    SECTION_LABELS: SECTION_LABELS,
    LINKEDIN_LABELS: LINKEDIN_LABELS,
    PROMPT_TEMPLATES: PROMPT_TEMPLATES,
    generateCV: generateCV,
    generateLinkedIn: generateLinkedIn,
    orderLinkedInSkillFacts: orderLinkedInSkillFacts,
    generateInterview: generateInterview,
    omissionReport: omissionReport,
    missingQuestionsMarkdown: missingQuestionsMarkdown,
    isValidUrl: isValidUrl,
    validateLinkedIn: validateLinkedIn,
    factText: factText
    ,isPlaceholder: isPlaceholder
    ,isInfrastructureFact: isInfrastructureFact
    ,isRenderableText: isRenderableText
    ,isPublicFact: isPublicFact
    ,renderExperienceLines: renderExperienceLines
    ,employerOmissionNote: employerOmissionNote
  };
});
