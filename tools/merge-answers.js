'use strict';

const fs = require('fs');
const path = require('path');

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return value === false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === 'object') {
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;
    if (aIsArray) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i += 1) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

function unwrapAnswers(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('answers file must contain a JSON object');
  }
  if (
    parsed.answers &&
    typeof parsed.answers === 'object' &&
    !Array.isArray(parsed.answers)
  ) {
    return parsed.answers;
  }
  return parsed;
}

function mergeAnswers(inputs) {
  const list = Array.isArray(inputs) ? inputs : [];
  const chosen = new Map();
  const source = new Map();
  const conflicts = [];

  for (let i = 0; i < list.length; i += 1) {
    const input = list[i] || {};
    const name = input.name == null ? 'input-' + (i + 1) : String(input.name);
    const data =
      input.data && typeof input.data === 'object' && !Array.isArray(input.data)
        ? input.data
        : {};

    for (const key of Object.keys(data)) {
      const value = data[key];

      if (!chosen.has(key)) {
        chosen.set(key, value);
        source.set(key, name);
        continue;
      }

      const current = chosen.get(key);
      const currentEmpty = isEmptyValue(current);
      const newEmpty = isEmptyValue(value);

      if (currentEmpty && !newEmpty) {
        chosen.set(key, value);
        source.set(key, name);
      } else if (!currentEmpty && !newEmpty && !deepEqual(current, value)) {
        conflicts.push({
          key: key,
          firstValue: current,
          secondValue: value,
          firstFile: source.get(key),
          secondFile: name
        });
      }
    }
  }

  return { answers: Object.fromEntries(chosen), conflicts: conflicts };
}

function formatValue(value) {
  const encoded = JSON.stringify(value);
  return encoded === undefined ? String(value) : encoded;
}

function buildConflictReport(conflicts, meta) {
  const info = meta || {};
  const list = Array.isArray(conflicts) ? conflicts : [];
  const lines = [];

  lines.push('# התנגשויות מיזוג תשובות');
  lines.push('');

  if (info.outPath) lines.push('- קובץ פלט: `' + info.outPath + '`');
  if (Array.isArray(info.inputs) && info.inputs.length > 0) {
    lines.push('- קבצים שמוזגו: ' + info.inputs.map((name) => '`' + name + '`').join(', '));
  }
  if (typeof info.keyCount === 'number') {
    lines.push('- מספר מפתחות בפלט: ' + info.keyCount);
  }
  lines.push('- מספר התנגשויות: ' + list.length);
  lines.push('');

  if (list.length === 0) {
    lines.push('אין התנגשויות. כל הערכים הלא-ריקים היו זהים או שלא היו כפילויות.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## התנגשויות');
  lines.push('');
  lines.push(
    '> הערה: אם בקובץ מוקדם הערך היה ריק, "הערך הראשון" שלמטה מגיע מהקובץ הראשון שבו הופיע ערך לא-ריק.'
  );
  lines.push('');

  list.forEach((conflict, index) => {
    lines.push('### ' + (index + 1) + '. `' + conflict.key + '`');
    lines.push('');
    lines.push('- קובץ ראשון (הערך נשמר): `' + conflict.firstFile + '`');
    lines.push('- ערך ראשון: `' + formatValue(conflict.firstValue) + '`');
    lines.push('- קובץ שני: `' + conflict.secondFile + '`');
    lines.push('- ערך שני (לא נשמר): `' + formatValue(conflict.secondValue) + '`');
    lines.push('');
  });

  return lines.join('\n');
}

function runCli(argv, options) {
  const opts = options || {};
  const args = Array.isArray(argv) ? argv.slice() : [];

  if (args.length < 2) {
    throw new Error(
      'usage: node tools/merge-answers.js out.json in1.json [in2.json ...]'
    );
  }

  const outPath = args[0];
  const inputPaths = args.slice(1);

  const inputs = inputPaths.map((name) => {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(name, 'utf8'));
    } catch (err) {
      throw new Error('failed to read ' + name + ': ' + err.message);
    }
    return { name: name, data: unwrapAnswers(parsed) };
  });

  const result = mergeAnswers(inputs);

  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result.answers, null, 2) + '\n');

  const reportPath =
    opts.reportPath ||
    path.join(__dirname, '..', 'drafts', 'MERGE_CONFLICTS.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const report = buildConflictReport(result.conflicts, {
    outPath: outPath,
    inputs: inputPaths,
    keyCount: Object.keys(result.answers).length
  });
  fs.writeFileSync(reportPath, report);

  return {
    answers: result.answers,
    conflicts: result.conflicts,
    outPath: outPath,
    reportPath: reportPath,
    report: report
  };
}

if (require.main === module) {
  try {
    const result = runCli(process.argv.slice(2));
    process.stdout.write(result.report);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

module.exports = {
  isEmptyValue: isEmptyValue,
  deepEqual: deepEqual,
  unwrapAnswers: unwrapAnswers,
  mergeAnswers: mergeAnswers,
  buildConflictReport: buildConflictReport,
  runCli: runCli
};
