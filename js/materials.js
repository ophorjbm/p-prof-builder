(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileMaterials = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var ANSWER_KEYS = new Set([
    'EMPLOYER_TITLE', 'EMPLOYER_ORGANIZATION', 'EMPLOYER_EMPLOYMENT_TYPE',
    'EMPLOYER_START_DATE', 'EMPLOYER_END_DATE',
    'EMPLOYER_BULLET_1', 'EMPLOYER_BULLET_2', 'EDUCATION_DEGREE', 'EDUCATION_INSTITUTION',
    'EDUCATION_DATES', 'EDUCATION_HONORS', 'CERTIFICATIONS', 'SKILLS', 'ACHIEVEMENTS',
    'VOLUNTEERING'
  ]);
  var QUESTION_PROPERTIES = ['key', 'he', 'en', 'section', 'type', 'required'];
  var ALLOWED_TYPES = new Set(['text', 'textarea', 'checkbox']);

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var value = '';
    var quoted = false;
    var input = String(text || '').replace(/^\uFEFF/, '');
    for (var i = 0; i < input.length; i += 1) {
      var char = input[i];
      if (quoted) {
        if (char === '"' && input[i + 1] === '"') {
          value += '"';
          i += 1;
        } else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"' && value === '') quoted = true;
      else if (char === ',') {
        row.push(value);
        value = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && input[i + 1] === '\n') i += 1;
        row.push(value);
        if (row.some(function (cell) { return cell.trim() !== ''; })) rows.push(row);
        row = [];
        value = '';
      } else value += char;
    }
    if (quoted) throw new Error('CSV contains an unterminated quoted value.');
    row.push(value);
    if (row.some(function (cell) { return cell.trim() !== ''; })) rows.push(row);
    if (!rows.length) return [];
    var headers = rows.shift().map(function (header) { return header.trim().toLowerCase(); });
    return rows.map(function (cells) {
      var item = {};
      headers.forEach(function (header, index) {
        if (header) item[header] = (cells[index] || '').trim();
      });
      return item;
    });
  }

  function firstValue(row, aliases) {
    for (var i = 0; i < aliases.length; i += 1) {
      var value = row[aliases[i].toLowerCase()];
      if (value) return value;
    }
    return '';
  }

  function mappedText(row, aliases) {
    var values = aliases.map(function (item) { return firstValue(row, item.columns); }).filter(Boolean);
    return values.length ? values.join('\n') : '';
  }

  function mapLinkedInFiles(files) {
    var answers = {};
    var unmappedRows = 0;
    var mappedRows = 0;
    var positionsSeen = 0;
    var appendValues = {};
    var supported = {
      'education.csv': true,
      'skills.csv': true,
      'certifications.csv': true,
      'honors.csv': true,
      'volunteering.csv': true,
      'positions.csv': true
    };

    (files || []).forEach(function (file) {
      var name = String(file.name || '').split('/').pop().toLowerCase();
      if (!supported[name]) return;
      var rows = parseCsv(file.text);
      rows.forEach(function (row) {
        var keys = [];
        var value;
        if (name === 'positions.csv') {
          positionsSeen += 1;
          if (positionsSeen > 1) {
            unmappedRows += 1;
            return;
          }
          [
            ['EMPLOYER_TITLE', ['title']],
            ['EMPLOYER_ORGANIZATION', ['company name', 'company']],
            ['EMPLOYER_EMPLOYMENT_TYPE', ['employment type']],
            ['EMPLOYER_START_DATE', ['started on', 'start date']],
            ['EMPLOYER_END_DATE', ['finished on', 'end date']],
            ['EMPLOYER_BULLET_1', ['description']]
          ].forEach(function (mapping) {
            value = firstValue(row, mapping[1]);
            if (value) {
              answers[mapping[0]] = value;
              keys.push(mapping[0]);
            }
          });
        } else if (name === 'education.csv') {
          [
            ['EDUCATION_DEGREE', ['degree name', 'degree']],
            ['EDUCATION_INSTITUTION', ['school name', 'school']],
            ['EDUCATION_DATES', ['start date', 'end date']],
            ['EDUCATION_HONORS', ['notes']]
          ].forEach(function (mapping) {
            value = mappedText(row, mapping[1].map(function (column) { return { columns: [column] }; }));
            if (value) {
              appendValues[mapping[0]] = appendValues[mapping[0]] || [];
              appendValues[mapping[0]].push(value);
              keys.push(mapping[0]);
            }
          });
        } else if (name === 'skills.csv') {
          value = firstValue(row, ['name', 'skill']);
          if (value) {
            appendValues.SKILLS = appendValues.SKILLS || [];
            appendValues.SKILLS.push(value);
            keys.push('SKILLS');
          }
        } else if (name === 'certifications.csv') {
          value = mappedText(row, [{ columns: ['name', 'certification name'] }, { columns: ['authority', 'issuing organization'] }]);
          if (value) {
            appendValues.CERTIFICATIONS = appendValues.CERTIFICATIONS || [];
            appendValues.CERTIFICATIONS.push(value);
            keys.push('CERTIFICATIONS');
          }
        } else if (name === 'honors.csv') {
          value = mappedText(row, [{ columns: ['title', 'name'] }, { columns: ['description'] }]);
          if (value) {
            appendValues.ACHIEVEMENTS = appendValues.ACHIEVEMENTS || [];
            appendValues.ACHIEVEMENTS.push(value);
            keys.push('ACHIEVEMENTS');
          }
        } else if (name === 'volunteering.csv') {
          value = mappedText(row, [
            { columns: ['role'] }, { columns: ['organization'] },
            { columns: ['cause'] }, { columns: ['description'] }
          ]);
          if (value) {
            appendValues.VOLUNTEERING = appendValues.VOLUNTEERING || [];
            appendValues.VOLUNTEERING.push(value);
            keys.push('VOLUNTEERING');
          }
        }
        if (keys.length) mappedRows += 1;
        else unmappedRows += 1;
      });
    });

    Object.keys(appendValues).forEach(function (key) {
      var values = appendValues[key].filter(function (value, index, list) { return list.indexOf(value) === index; });
      if (values.length) answers[key] = values.join('\n');
    });
    Object.keys(answers).forEach(function (key) {
      if (!ANSWER_KEYS.has(key)) delete answers[key];
    });
    return { answers: answers, mappedRows: mappedRows, unmappedRows: unmappedRows };
  }

  async function extractZipEntries(input) {
    var bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var start = Math.max(0, bytes.length - 65557);
    var endRecord = -1;
    for (var i = bytes.length - 22; i >= start; i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) {
        endRecord = i;
        break;
      }
    }
    if (endRecord < 0) throw new Error('ZIP directory was not found.');
    var count = view.getUint16(endRecord + 10, true);
    var offset = view.getUint32(endRecord + 16, true);
    var decoder = new TextDecoder('utf-8');
    var files = [];
    for (var entry = 0; entry < count; entry += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('ZIP directory is invalid.');
      var method = view.getUint16(offset + 10, true);
      var compressedSize = view.getUint32(offset + 20, true);
      var nameLength = view.getUint16(offset + 28, true);
      var extraLength = view.getUint16(offset + 30, true);
      var commentLength = view.getUint16(offset + 32, true);
      var localOffset = view.getUint32(offset + 42, true);
      var name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      var localNameLength = view.getUint16(localOffset + 26, true);
      var localExtraLength = view.getUint16(localOffset + 28, true);
      var dataStart = localOffset + 30 + localNameLength + localExtraLength;
      var compressed = bytes.subarray(dataStart, dataStart + compressedSize);
      var content;
      if (method === 0) content = compressed;
      else if (method === 8 && typeof DecompressionStream === 'function') {
        var stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        content = new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw new Error('ZIP compression method is not supported locally.');
      files.push({ name: name, text: decoder.decode(content) });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  function validateQuestionImport(payload, knownKeys) {
    var error = function (message) { throw new Error('שגיאת קובץ JSON: ' + message); };
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) error('נדרשים questions ו-answers.');
    Object.keys(payload).forEach(function (key) {
      if (key !== 'questions' && key !== 'answers') error('שדה לא מוכר: ' + key);
    });
    if (!Array.isArray(payload.questions) || !payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)) {
      error('נדרשים questions כמערך ו-answers כאובייקט.');
    }
    var seen = new Set();
    var validQuestions = payload.questions.map(function (question, index) {
      if (!question || typeof question !== 'object' || Array.isArray(question)) error('שאלה ' + (index + 1) + ' אינה אובייקט.');
      Object.keys(question).forEach(function (key) {
        if (QUESTION_PROPERTIES.indexOf(key) < 0) error('שאלה ' + (index + 1) + ' מכילה שדה לא מוכר: ' + key);
      });
      if (typeof question.key !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(question.key)) error('מפתח שאלה לא תקין בשאלה ' + (index + 1) + '.');
      if (seen.has(question.key)) error('מפתח שאלה כפול: ' + question.key);
      seen.add(question.key);
      if (typeof question.he !== 'string' || !question.he.trim() || typeof question.en !== 'string' || !question.en.trim()) error('נדרש טקסט בעברית ובאנגלית בשאלה ' + question.key + '.');
      if (typeof question.section !== 'string' || !question.section.trim()) error('חסר section בשאלה ' + question.key + '.');
      if (!ALLOWED_TYPES.has(question.type)) error('type לא נתמך בשאלה ' + question.key + '.');
      if (typeof question.required !== 'boolean') error('required חייב להיות true או false בשאלה ' + question.key + '.');
      var target = question.key.match(/^(LINKEDIN|CV|INTERVIEW)_/);
      return {
        id: 'imported_' + question.key.toLowerCase(),
        key: question.key,
        section: question.section.trim(),
        label_he: question.he.trim(),
        label_en: question.en.trim(),
        type: question.type,
        required: question.required,
        used_for: target ? [target[1].toLowerCase()] : ['linkedin', 'cv', 'interview']
      };
    });
    var allowedAnswers = new Set((knownKeys || []).concat(validQuestions.map(function (question) { return question.key; })));
    var answers = {};
    Object.keys(payload.answers).forEach(function (key) {
      if (!allowedAnswers.has(key)) error('מפתח תשובה לא מוכר: ' + key);
      var value = payload.answers[key];
      if (typeof value !== 'string' && typeof value !== 'boolean') error('ערך תשובה לא תקין: ' + key);
      answers[key] = value;
    });
    return { questions: validQuestions, answers: answers };
  }

  function readStored(storage, key, fallback) {
    var raw = storage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  }

  function writeStored(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function hasValue(value) {
    return value !== undefined && value !== null && value !== '' && value !== false &&
      !(Array.isArray(value) && value.length === 0);
  }

  function diffAnswers(previous, next) {
    var before = previous || {};
    var after = next || {};
    var keys = Array.from(new Set(Object.keys(before).concat(Object.keys(after))));
    var diff = { addedKeys: [], changedKeys: [], missingKeys: [] };
    keys.forEach(function (key) {
      var had = hasValue(before[key]);
      var has = hasValue(after[key]);
      if (!had && has) diff.addedKeys.push(key);
      else if (had && !has) diff.missingKeys.push(key);
      else if (had && has && JSON.stringify(before[key]) !== JSON.stringify(after[key])) diff.changedKeys.push(key);
    });
    return diff;
  }

  function versionEntry(material, diff) {
    return {
      at: material.updatedAt || material.addedAt,
      addedKeys: diff.addedKeys,
      changedKeys: diff.changedKeys,
      missingKeys: diff.missingKeys,
      answers: Object.assign({}, material.answers || {}),
      sourceAnswers: Object.assign({}, material.sourceAnswers || material.answers || {}),
      unmappedRows: material.unmappedRows || 0
    };
  }

  function upsertMaterial(materials, incoming) {
    var list = Array.isArray(materials) ? materials : [];
    var index = list.findIndex(function (item) { return item.type === incoming.type && item.name === incoming.name; });
    if (index < 0) {
      var identical = list.find(function (item) { return item.type === incoming.type && item.content === incoming.content; });
      if (identical) return { materials: list, material: identical, duplicate: true, diff: { addedKeys: [], changedKeys: [], missingKeys: [] } };
      var initialDiff = diffAnswers({}, incoming.answers);
      var first = Object.assign({}, incoming, {
        answers: Object.keys(incoming.answers || {}).reduce(function (result, key) {
          if (hasValue(incoming.answers[key])) result[key] = incoming.answers[key];
          return result;
        }, {}),
        sourceAnswers: Object.assign({}, incoming.answers || {}),
        revisions: [versionEntry(incoming, initialDiff)],
        changeSummary: initialDiff,
        pendingUpdateKeys: []
      });
      first.answerKeys = Object.keys(first.answers);
      first.revisions[0] = versionEntry(first, initialDiff);
      return { materials: list.concat([first]), material: first, duplicate: false, diff: initialDiff };
    }

    var current = list[index];
    if (current.content === incoming.content &&
      JSON.stringify(current.sourceAnswers || current.answers || {}) === JSON.stringify(incoming.answers || {}) &&
      current.unmappedRows === incoming.unmappedRows && current.status === incoming.status) {
      return { materials: list, material: current, duplicate: true, diff: { addedKeys: [], changedKeys: [], missingKeys: [] } };
    }
    var diff = diffAnswers(current.answers, incoming.answers);
    var effectiveAnswers = Object.assign({}, current.answers || {});
    Object.keys(incoming.answers || {}).forEach(function (key) {
      if (hasValue(incoming.answers[key])) effectiveAnswers[key] = incoming.answers[key];
    });
    var revisions = Array.isArray(current.revisions) ? current.revisions.slice() : [
      versionEntry(current, diffAnswers({}, current.answers))
    ];
    var updated = Object.assign({}, current, incoming, {
      id: current.id,
      addedAt: current.addedAt,
      updatedAt: incoming.addedAt,
      answers: effectiveAnswers,
      sourceAnswers: Object.assign({}, incoming.answers || {}),
      answerKeys: Object.keys(effectiveAnswers),
      revisions: revisions.concat([versionEntry(incoming, diff)]),
      changeSummary: diff,
      pendingUpdateKeys: (current.pendingUpdateKeys || []).concat(diff.changedKeys)
        .filter(function (key, pendingIndex, pendingKeys) { return pendingKeys.indexOf(key) === pendingIndex; })
    });
    updated.revisions[updated.revisions.length - 1] = versionEntry(updated, diff);
    var next = list.slice();
    next[index] = updated;
    return { materials: next, material: updated, duplicate: false, diff: diff };
  }

  function mergeIntoEmpty(currentAnswers, incomingAnswers) {
    var answers = Object.assign({}, currentAnswers || {});
    var mergedKeys = [];
    var conflicts = [];
    Object.keys(incomingAnswers || {}).forEach(function (key) {
      var value = incomingAnswers[key];
      var incomingEmpty = !hasValue(value);
      var current = answers[key];
      var currentEmpty = !hasValue(current);
      if (!incomingEmpty && currentEmpty) {
        answers[key] = value;
        mergedKeys.push(key);
      } else if (!incomingEmpty && JSON.stringify(current) !== JSON.stringify(value)) conflicts.push(key);
    });
    return { answers: answers, keys: mergedKeys, conflicts: conflicts };
  }

  return {
    parseCsv: parseCsv,
    mapLinkedInFiles: mapLinkedInFiles,
    extractZipEntries: extractZipEntries,
    validateQuestionImport: validateQuestionImport,
    readStored: readStored,
    writeStored: writeStored,
    mergeIntoEmpty: mergeIntoEmpty,
    diffAnswers: diffAnswers,
    upsertMaterial: upsertMaterial
  };
});
