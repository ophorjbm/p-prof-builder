(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileKB = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var TAGS = ['cv', 'linkedin', 'interview'];
  var CATEGORIES = [
    'contact', 'summary', 'experience', 'education', 'skill', 'language',
    'certification', 'project', 'volunteering', 'achievement',
    'personal-value', 'other'
  ];
  var STATUSES = ['confirmed', 'needs-input'];
  var SENSITIVITIES = ['public', 'private'];
  var ID_PATTERN = /^F-[A-Za-z0-9-]+$/;
  var AUDIT_PATTERN = /^A-\d{3}$/;

  var META_AUDIT_MAP = {};

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function hasText(fact) {
    return Boolean(fact && fact.text && (isNonEmptyString(fact.text.he) || isNonEmptyString(fact.text.en)));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function unique(list) {
    return list.filter(function (item, index) { return list.indexOf(item) === index; });
  }

  function validateFact(fact, index) {
    var errors = [];
    var where = 'facts[' + index + ']';
    if (!isObject(fact)) return [where + ' must be an object'];
    if (!isNonEmptyString(fact.id) || !ID_PATTERN.test(fact.id)) errors.push(where + '.id must match F-...');
    if (CATEGORIES.indexOf(fact.category) === -1) errors.push(where + '.category is invalid');
    if (!Array.isArray(fact.tags) || fact.tags.length === 0) {
      errors.push(where + '.tags must be a non-empty array');
    } else {
      if (unique(fact.tags).length !== fact.tags.length) errors.push(where + '.tags has duplicates');
      fact.tags.forEach(function (tag) {
        if (TAGS.indexOf(tag) === -1) errors.push(where + '.tags contains invalid tag ' + tag);
      });
    }
    if (!isObject(fact.text)) {
      errors.push(where + '.text must be an object');
    } else {
      if (typeof fact.text.he !== 'string') errors.push(where + '.text.he must be a string');
      if (typeof fact.text.en !== 'string') errors.push(where + '.text.en must be a string');
    }
    if (STATUSES.indexOf(fact.status) === -1) errors.push(where + '.status is invalid');
    if (SENSITIVITIES.indexOf(fact.sensitivity) === -1) errors.push(where + '.sensitivity is invalid');
    if (fact.questionKey !== undefined && !isNonEmptyString(fact.questionKey)) errors.push(where + '.questionKey must be a non-empty string');
    if (fact.section !== undefined && !isNonEmptyString(fact.section)) errors.push(where + '.section must be a non-empty string');
    if (fact.fields !== undefined && !isObject(fact.fields)) errors.push(where + '.fields must be an object');
    if (fact.overrides !== undefined && !isObject(fact.overrides)) errors.push(where + '.overrides must be an object');
    if (fact.question !== undefined) {
      if (!isObject(fact.question)) {
        errors.push(where + '.question must be an object');
      } else {
        if (typeof fact.question.he !== 'string') errors.push(where + '.question.he must be a string');
        if (typeof fact.question.en !== 'string') errors.push(where + '.question.en must be a string');
      }
    }
    if (fact.auditIds !== undefined) {
      if (!Array.isArray(fact.auditIds)) {
        errors.push(where + '.auditIds must be an array');
      } else {
        fact.auditIds.forEach(function (id) {
          if (!AUDIT_PATTERN.test(id)) errors.push(where + '.auditIds contains invalid id ' + id);
        });
      }
    }
    return errors;
  }

  function validate(facts) {
    var errors = [];
    if (!Array.isArray(facts)) return { valid: false, errors: ['knowledge base must be an array'] };
    var seen = {};
    facts.forEach(function (fact, index) {
      errors = errors.concat(validateFact(fact, index));
      if (fact && isNonEmptyString(fact.id)) {
        if (seen[fact.id]) errors.push('duplicate fact id ' + fact.id);
        seen[fact.id] = true;
      }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function textFor(fact, lang, output) {
    if (!fact) return '';
    var language = lang === 'he' ? 'he' : 'en';
    var override = output && fact.overrides && fact.overrides[output];
    if (override && typeof override === 'object') {
      var overrideText = override[language] || override.en || override.he;
      if (isNonEmptyString(overrideText)) return String(overrideText);
    }
    var text = fact.text || {};
    return text[language] || text.en || text.he || '';
  }

  function hydrateFact(fact, answers) {
    var next = clone(fact);
    var data = answers || {};
    if (next.questionKey && Object.prototype.hasOwnProperty.call(data, next.questionKey)) {
      var value = data[next.questionKey];
      if (value === true) {
        next.status = 'confirmed';
        if (!next.text.he && !next.text.en) {
          next.text.he = 'yes';
          next.text.en = 'yes';
        }
      } else if (value !== undefined && value !== null && String(value).trim() !== '') {
        var text = String(value);
        if (!next.text.he) next.text.he = text;
        if (!next.text.en) next.text.en = text;
        next.status = 'confirmed';
      }
    }
    return next;
  }

  function hydrate(facts, answers) {
    return (Array.isArray(facts) ? facts : []).map(function (fact) {
      return hydrateFact(fact, answers);
    });
  }

  function createStore(facts) {
    var items = (Array.isArray(facts) ? facts : []).map(clone);
    var result = validate(items);
    if (!result.valid) throw new Error('invalid knowledge base: ' + result.errors.join('; '));

    function all() {
      return items.map(clone);
    }

    function get(id) {
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].id === id) return clone(items[i]);
      }
      return null;
    }

    function query(options) {
      var opts = options || {};
      return items.filter(function (fact) {
        if (opts.tag && fact.tags.indexOf(opts.tag) === -1) return false;
        if (opts.category && fact.category !== opts.category) return false;
        return true;
      }).map(clone);
    }

    function upsert(fact) {
      var check = validateFact(fact, 0);
      if (check.length) throw new Error('invalid fact: ' + check.join('; '));
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].id === fact.id) {
          items[i] = clone(fact);
          return clone(items[i]);
        }
      }
      items.push(clone(fact));
      return clone(items[items.length - 1]);
    }

    function byTag(tag) {
      return query({ tag: tag });
    }

    function factIds() {
      return items.map(function (fact) { return fact.id; });
    }

    return {
      all: all,
      get: get,
      query: query,
      upsert: upsert,
      byTag: byTag,
      factIds: factIds
    };
  }

  function load(source) {
    if (Array.isArray(source)) {
      var inlineResult = validate(source);
      return inlineResult.valid
        ? Promise.resolve(source)
        : Promise.reject(new Error('invalid knowledge base: ' + inlineResult.errors.join('; ')));
    }
    var path = source || 'data/knowledge-base.json';
    var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    var isRemote = /^(https?:|file:)/i.test(String(path));
    if (isNode && !/^https?:/i.test(String(path))) {
      return Promise.resolve().then(function () {
        var fs = require('fs');
        var filePath = /^file:/i.test(String(path)) ? new URL(path) : path;
        var facts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        var result = validate(facts);
        if (!result.valid) throw new Error('invalid knowledge base: ' + result.errors.join('; '));
        return facts;
      });
    }
    if (typeof fetch === 'function' && (isRemote || !isNode)) {
      return fetch(path).then(function (response) {
        if (!response.ok) throw new Error('knowledge base unavailable');
        return response.json();
      }).then(function (facts) {
        var result = validate(facts);
        if (!result.valid) throw new Error('invalid knowledge base: ' + result.errors.join('; '));
        return facts;
      });
    }
    return Promise.reject(new Error('knowledge base loader unavailable'));
  }

  function coverage(facts, auditIds, metaMap) {
    var mapped = {};
    (Array.isArray(facts) ? facts : []).forEach(function (fact) {
      (fact.auditIds || []).forEach(function (id) {
        if (!mapped[id]) mapped[id] = fact.id;
      });
    });
    var meta = metaMap || META_AUDIT_MAP;
    Object.keys(meta).forEach(function (id) {
      if (!mapped[id]) mapped[id] = meta[id];
    });
    var ids = Array.isArray(auditIds) ? auditIds : [];
    return {
      mapped: mapped,
      missing: ids.filter(function (id) { return !mapped[id]; }),
      unmappedFacts: (Array.isArray(facts) ? facts : []).filter(function (fact) {
        return !(fact.auditIds && fact.auditIds.length);
      }).map(function (fact) { return fact.id; })
    };
  }

  function missingFacts(facts) {
    return (Array.isArray(facts) ? facts : []).filter(function (fact) {
      return fact.needsQuestion === true && !hasText(fact);
    });
  }

  function interviewCoverage(facts, reachableIds) {
    var allIds = (Array.isArray(facts) ? facts : []).map(function (fact) { return fact.id; });
    var reachable = Array.isArray(reachableIds) ? reachableIds : allIds;
    var missing = allIds.filter(function (id) { return reachable.indexOf(id) === -1; });
    return { total: allIds.length, covered: allIds.length - missing.length, missing: missing };
  }

  function missingQuestionLines(facts) {
    return missingFacts(facts).map(function (fact) {
      var key = fact.questionKey || fact.id.replace(/-/g, '');
      var question = fact.question && (fact.question.he || fact.question.en);
      if (!question) question = 'Please provide a value for ' + fact.id + '.';
      var why = 'The knowledge base has no value for ' + fact.id + ' (' + fact.category + ').';
      var where = 'data/knowledge-base.json ' + fact.id;
      return '| `' + key + '` | ' + question + ' | ' + why + ' | ' + where + ' |';
    });
  }

  return {
    TAGS: TAGS,
    CATEGORIES: CATEGORIES,
    STATUSES: STATUSES,
    SENSITIVITIES: SENSITIVITIES,
    META_AUDIT_MAP: META_AUDIT_MAP,
    validate: validate,
    createStore: createStore,
    load: load,
    hydrate: hydrate,
    textFor: textFor,
    coverage: coverage,
    missingFacts: missingFacts,
    interviewCoverage: interviewCoverage,
    missingQuestionLines: missingQuestionLines,
    hasText: hasText
  };
});
