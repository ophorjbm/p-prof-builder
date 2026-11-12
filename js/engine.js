(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProfileEngine = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var KEY_PATTERN = /\[([A-Z0-9_]+)\]/g;
  var KNOWN_TARGETS = ['linkedin', 'cv', 'interview'];
  var OPTIONAL_OUTPUT_KEYS = [
    'FULL_NAME', 'CITY', 'EMAIL', 'PHONE', 'LINKEDIN_URL', 'GITHUB_URL',
    'PORTFOLIO_URL', 'TARGET_JOB_TITLE', 'HEADLINE', 'SUMMARY', 'ABOUT',
    'EXPERIENCE', 'EMPLOYER_TITLE', 'EMPLOYER_ORGANIZATION',
    'EMPLOYER_START_DATE', 'EMPLOYER_END_DATE', 'EMPLOYER_BULLET_1',
    'EMPLOYER_BULLET_2', 'EDUCATION_DEGREE', 'EDUCATION_INSTITUTION',
    'EDUCATION_DATES', 'EDUCATION_HONORS', 'SKILLS', 'PROJECTS',
    'CERTIFICATIONS', 'ACHIEVEMENTS', 'VOLUNTEERING', 'LANGUAGES', 'CV_LINK'
  ];
  var CONDITIONAL_OUTPUT_KEYS = [];

  function isEmpty(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  }

  function isFilled(value) {
    if (value === undefined || value === null || value === false) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  function mergePrefill(answers, prefill) {
    var merged = {};
    var keys = [];
    var current = answers && typeof answers === 'object' ? answers : {};
    var suggested = prefill && typeof prefill === 'object' ? prefill : {};
    Object.keys(current).forEach(function (key) {
      merged[key] = current[key];
    });
    Object.keys(suggested).forEach(function (key) {
      var value = merged[key];
      var empty = value === undefined || value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);
      var suggestedValue = suggested[key];
      var suggestedEmpty = suggestedValue === undefined || suggestedValue === null ||
        (typeof suggestedValue === 'string' && suggestedValue.trim() === '') ||
        (Array.isArray(suggestedValue) && suggestedValue.length === 0);
      if (empty && !suggestedEmpty) {
        merged[key] = suggestedValue;
        keys.push(key);
      }
    });
    return { answers: merged, keys: keys };
  }

  // Report every optional or conditional key that is still empty. When a
  // template is given, only keys that appear in that template are reported so
  // the UI warning and fillTemplate agree on the same set.
  function listEmptyOptionalKeys(answers, templateText) {
    var data = answers || {};
    return OPTIONAL_OUTPUT_KEYS.filter(function (key) {
      var empty = !isFilled(data[key]);
      if (!empty) return false;
      if (typeof templateText === 'string') {
        return templateText.indexOf('[' + key + ']') !== -1;
      }
      return true;
    });
  }

  // For Hebrew output, a filled KEY_HE answer replaces KEY (free-text answers are written in English).
  function localizeAnswers(answers, lang) {
    var out = {};
    var src = answers || {};
    Object.keys(src).forEach(function (k) { out[k] = src[k]; });
    if (lang === 'he') {
      Object.keys(src).forEach(function (k) {
        if (/_HE$/.test(k) && isFilled(src[k])) out[k.slice(0, -3)] = src[k];
      });
    }
    return out;
  }

  function fillTemplate(templateText, answers) {
    if (typeof templateText !== 'string') return '';
    var data = answers || {};
    // Optional keys drop the whole line that contains them when empty.
    var emptyOptional = listEmptyOptionalKeys(data, templateText);
    var filteredText = templateText.split('\n').filter(function (line) {
      return !emptyOptional.some(function (key) {
        return line.indexOf('[' + key + ']') !== -1;
      });
    }).map(function (line) { return line.replace(/[ \t]+$/, ''); }).join('\n');
    return filteredText.replace(KEY_PATTERN, function (match, key) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) return match;
      var value = data[key];
      if (isEmpty(value)) return match;
      return String(value);
    });
  }

  function listMissing(templateText, answers) {
    if (typeof templateText !== 'string') return [];
    var data = answers || {};
    var seen = {};
    var missing = [];
    var match;
    KEY_PATTERN.lastIndex = 0;
    while ((match = KEY_PATTERN.exec(templateText)) !== null) {
      var key = match[1];
      if (seen[key]) continue;
      seen[key] = true;
      if (!Object.prototype.hasOwnProperty.call(data, key) || isEmpty(data[key])) {
        missing.push(key);
      }
    }
    KEY_PATTERN.lastIndex = 0;
    return missing;
  }

  function isAnswered(question, answers) {
    var value = answers ? answers[question.key] : undefined;
    if (question.type === 'checkbox') return value === true;
    return !isEmpty(value);
  }

  function progress(questions, answers) {
    var list = Array.isArray(questions) ? questions : [];
    var total = list.length;
    var done = 0;
    for (var i = 0; i < list.length; i += 1) {
      if (isAnswered(list[i], answers)) done += 1;
    }
    return { done: done, total: total };
  }

  // Return the questions that belong to a target. Unknown targets and 'all'
  // return every question so the form never silently hides data.
  function filterByTarget(questions, target) {
    var list = Array.isArray(questions) ? questions : [];
    if (KNOWN_TARGETS.indexOf(target) === -1) return list.slice();
    var filtered = [];
    for (var i = 0; i < list.length; i += 1) {
      var usedFor = list[i] && list[i].used_for;
      if (Array.isArray(usedFor) && usedFor.indexOf(target) !== -1) {
        filtered.push(list[i]);
      }
    }
    return filtered;
  }

  function progressByTarget(questions, answers, target) {
    return progress(filterByTarget(questions, target), answers);
  }

  return {
    fillTemplate: fillTemplate,
    localizeAnswers: localizeAnswers,
    listEmptyOptionalKeys: listEmptyOptionalKeys,
    listMissing: listMissing,
    progress: progress,
    filterByTarget: filterByTarget,
    progressByTarget: progressByTarget,
    mergePrefill: mergePrefill,
    OPTIONAL_OUTPUT_KEYS: OPTIONAL_OUTPUT_KEYS,
    CONDITIONAL_OUTPUT_KEYS: CONDITIONAL_OUTPUT_KEYS
  };
});
