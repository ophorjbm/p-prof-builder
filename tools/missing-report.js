'use strict';

const fs = require('fs');
const path = require('path');
const engine = require('../js/engine.js');

const QUESTIONS_PATH = path.join(__dirname, '..', 'data', 'questions.json');
const TEMPLATES_PATH = path.join(__dirname, '..', 'js', 'templates.js');
const TARGETS = ['linkedin', 'cv', 'interview'];
const KEY_PATTERN = /\[([A-Z0-9_]+)\]/g;

function isEmptyValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return value === false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function isFilled(question, answers) {
  const value = answers ? answers[question.key] : undefined;
  if (question && question.type === 'checkbox') return value === true;
  return !isEmptyValue(value);
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

function uniqueTemplateKeys(templateText) {
  const keys = [];
  const seen = new Set();
  if (typeof templateText !== 'string') return keys;
  let match;
  KEY_PATTERN.lastIndex = 0;
  while ((match = KEY_PATTERN.exec(templateText)) !== null) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  KEY_PATTERN.lastIndex = 0;
  return keys;
}

function bulletKeys(keys) {
  if (!keys || keys.length === 0) return '- אין';
  return keys.map((key) => '- `' + key + '`').join('\n');
}

function templateTarget(name) {
  if (name.indexOf('linkedin') === 0) return 'linkedin';
  if (name.indexOf('cv') === 0) return 'cv';
  if (name.indexOf('interview') === 0) return 'interview';
  return 'other';
}

function buildMissingReport(questions, templates, answers, options) {
  const opts = options || {};
  const list = Array.isArray(questions) ? questions : [];
  const data = answers || {};
  const templateMap = templates || {};
  const targetList =
    Array.isArray(opts.targets) && opts.targets.length > 0
      ? opts.targets
      : TARGETS;

  const lines = [];
  lines.push('# דוח תשובות חסרות');
  lines.push('');

  if (opts.sourceName) lines.push('- מקור התשובות: `' + opts.sourceName + '`');
  lines.push('');

  const overall = engine.progress(list, data);
  let filledCount = 0;
  let missingCount = 0;
  for (const question of list) {
    if (isFilled(question, data)) filledCount += 1;
    else missingCount += 1;
  }
  const percent =
    overall.total === 0 ? 0 : Math.round((overall.done / overall.total) * 100);

  lines.push('## סיכום כללי');
  lines.push('');
  lines.push('- סך השאלות: ' + overall.total);
  lines.push('- שאלות מלאות: ' + filledCount);
  lines.push('- שאלות חסרות: ' + missingCount);
  lines.push('- אחוז השלמה: ' + percent + '%');
  lines.push('');

  lines.push('## לפי מפתח');
  lines.push('');
  lines.push('| מפתח | תווית | סטטוס |');
  lines.push('| --- | --- | --- |');
  for (const question of list) {
    const status = isFilled(question, data) ? 'מלא' : 'חסר';
    const label = question.label_he || question.label_en || question.id || '';
    lines.push('| `' + question.key + '` | ' + label + ' | ' + status + ' |');
  }
  lines.push('');

  lines.push('## לפי תבנית');
  lines.push('');
  for (const name of Object.keys(templateMap)) {
    const text = templateMap[name];
    const keys = uniqueTemplateKeys(text);
    const missing = engine.listMissing(text, data);
    const filled = keys.filter((key) => missing.indexOf(key) === -1);
    lines.push('### ' + name + ' (`' + templateTarget(name) + '`)');
    lines.push('');
    lines.push('- סך המפתחות בתבנית: ' + keys.length);
    lines.push('- מלאים: ' + filled.length);
    lines.push('- חסרים: ' + missing.length);
    lines.push('');
    lines.push('מפתחות מלאים:');
    lines.push('');
    lines.push(bulletKeys(filled));
    lines.push('');
    lines.push('מפתחות חסרים:');
    lines.push('');
    lines.push(bulletKeys(missing));
    lines.push('');
  }

  lines.push('## לפי יעד');
  lines.push('');
  for (const target of targetList) {
    const targetQuestions = engine.filterByTarget(list, target);
    const result = engine.progress(targetQuestions, data);
    const missing = targetQuestions
      .filter((question) => !isFilled(question, data))
      .map((question) => question.key);
    lines.push('### ' + target);
    lines.push('');
    lines.push('- סך השאלות ליעד: ' + result.total);
    lines.push('- מלאות: ' + result.done);
    lines.push('- חסרות: ' + missing.length);
    lines.push('');
    lines.push('מפתחות חסרים:');
    lines.push('');
    lines.push(bulletKeys(missing));
    lines.push('');
  }

  return lines.join('\n');
}

function runCli(argv, options) {
  const opts = options || {};
  const args = Array.isArray(argv) ? argv.slice() : [];
  const answersPath = args[0];

  if (!answersPath) {
    throw new Error('usage: node tools/missing-report.js answers.json');
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
  } catch (err) {
    throw new Error('failed to read ' + answersPath + ': ' + err.message);
  }
  const answers = unwrapAnswers(parsed);

  let questions = opts.questions;
  if (!questions) {
    questions = JSON.parse(
      fs.readFileSync(opts.questionsPath || QUESTIONS_PATH, 'utf8')
    );
  }

  const templates = opts.templates || require(opts.templatesPath || TEMPLATES_PATH);

  const report = buildMissingReport(questions, templates, answers, {
    sourceName: answersPath,
    targets: opts.targets
  });

  const reportPath =
    opts.reportPath ||
    path.join(__dirname, '..', 'drafts', 'MISSING_REPORT.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);

  return { report: report, reportPath: reportPath };
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
  isFilled: isFilled,
  unwrapAnswers: unwrapAnswers,
  uniqueTemplateKeys: uniqueTemplateKeys,
  templateTarget: templateTarget,
  buildMissingReport: buildMissingReport,
  runCli: runCli
};
