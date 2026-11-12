'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const questions = require('../js/questions.js');
const engine = require('../js/engine.js');
const knowledgeBase = require('../js/kb.js');
const generate = require('../js/generate.js');
const cv = require('../js/cv.js');
const linkedIn = require('../js/linkedin.js');
const materials = require('../js/materials.js');

function fact(key, category, section, text, options) {
  const settings = options || {};
  return {
    id: 'F-' + key.replace(/_/g, '-'),
    questionKey: key,
    category,
    section,
    tags: settings.tags || ['cv', 'linkedin', 'interview'],
    text: { en: text, he: text },
    question: { en: 'Describe ' + key.toLowerCase(), he: 'תיאור ' + key },
    status: 'confirmed',
    sensitivity: settings.sensitivity || 'public',
    fields: settings.fields || {}
  };
}

test('built-in question JSON and browser catalog stay in sync', () => {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data/questions.json'), 'utf8'));
  const keys = source.map((question) => question.key);

  assert.deepEqual(questions, source);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes('FULL_NAME'));
  assert.ok(keys.includes('EMPLOYER_TITLE'));
  assert.ok(keys.includes('PROJECTS'));
  assert.ok(source.every((question) =>
    Array.isArray(question.used_for) &&
    question.used_for.every((target) => ['linkedin', 'cv', 'interview'].includes(target))
  ));
});

test('CV and LinkedIn generators use generic facts and omit private facts', () => {
  const facts = [
    fact('FULL_NAME', 'contact', 'contact', 'Alex Morgan'),
    fact('TARGET_JOB_TITLE', 'summary', 'summary', 'Project coordinator', { tags: ['cv', 'interview'] }),
    fact('SUMMARY', 'summary', 'summary', 'Organizes complex work into clear, useful outcomes.'),
    fact('EXPERIENCE', 'experience', 'experience', 'Project coordinator | Example Group | 2021-2024'),
    fact('EDUCATION_DEGREE', 'education', 'education', 'Bachelor of Arts'),
    fact('SKILLS', 'skill', 'skills', 'Project planning, communication'),
    fact('PROJECTS', 'project', 'projects', 'Community resource guide'),
    fact('PRIVATE_NOTE', 'other', 'other', 'Private note', { sensitivity: 'private' })
  ];

  assert.equal(knowledgeBase.validate(facts).valid, true);

  const cvText = cv.generate(facts, 'en').text;
  const linkedInResult = linkedIn.generate(facts, { lang: 'en' });
  const interview = generate.generateInterview(facts, { lang: 'en' });

  assert.match(cvText, /Project coordinator/);
  assert.match(cvText, /Community resource guide/);
  assert.doesNotMatch(cvText, /Private note/);
  assert.equal(linkedInResult.headline, 'Project coordinator');
  assert.equal(linkedInResult.projects, 'Community resource guide');
  assert.doesNotMatch(JSON.stringify(linkedInResult), /Private note/);
  assert.equal(interview.coverage.covered, facts.length);
});

test('LinkedIn CSV import maps supported fields to generic answers', () => {
  const result = materials.mapLinkedInFiles([
    {
      name: 'Positions.csv',
      text: 'Title,Company Name,Employment Type,Started On,Finished On,Description\nAnalyst,Example Group,Full-time,2021,2024,Improved reporting'
    },
    { name: 'Skills.csv', text: 'Name\nResearch' }
  ]);

  assert.equal(result.answers.EMPLOYER_TITLE, 'Analyst');
  assert.equal(result.answers.EMPLOYER_ORGANIZATION, 'Example Group');
  assert.equal(result.answers.EMPLOYER_EMPLOYMENT_TYPE, 'Full-time');
  assert.equal(result.answers.SKILLS, 'Research');
  assert.equal(result.unmappedRows, 0);

  const generated = linkedIn.generate(
    [fact('FULL_NAME', 'contact', 'contact', 'Alex Morgan')],
    { lang: 'en', answers: result.answers }
  );
  assert.match(generated.experience, /Analyst \(Full-time\), Example Group/);
});

test('optional empty template fields do not leak bracket placeholders', () => {
  const text = engine.fillTemplate('Name: [FULL_NAME]\nEmail: [EMAIL]\n[SUMMARY]', {
    FULL_NAME: 'Alex Morgan'
  });

  assert.equal(text, 'Name: Alex Morgan');
});

test('profile answers are not synchronized to an application server', () => {
  const appSource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.doesNotMatch(appSource, /\/api\/answers/);
  assert.doesNotMatch(appSource, /\/api\//);
  assert.doesNotMatch(appSource, /answers_DRAFT\.json/);
  assert.doesNotMatch(indexSource, /coach\.js/);
});
