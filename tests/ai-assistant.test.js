'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const aiAssistant = require('../js/ai-assistant.js');
const materials = require('../js/materials.js');

test('provider requests keep the API key in headers and attach PDFs in provider format', () => {
  const openAi = aiAssistant.requestOptions('openai', 'test-model', 'secret-key', 'prompt', [
    { name: 'cv.pdf', data: 'cGRm' }
  ]);
  const anthropic = aiAssistant.requestOptions('anthropic', 'test-model', 'secret-key', 'prompt', [
    { name: 'cv.pdf', data: 'cGRm' }
  ]);
  const gemini = aiAssistant.requestOptions('gemini', 'test-model', 'secret-key', 'prompt', [
    { name: 'cv.pdf', data: 'cGRm' }
  ]);

  assert.equal(openAi.headers.Authorization, 'Bearer secret-key');
  assert.equal(openAi.body.input[0].content[1].file_data, 'data:application/pdf;base64,cGRm');
  assert.equal(anthropic.headers['x-api-key'], 'secret-key');
  assert.equal(anthropic.body.messages[0].content[0].source.data, 'cGRm');
  assert.equal(gemini.headers['x-goog-api-key'], 'secret-key');
  assert.equal(gemini.body.contents[0].parts[1].inline_data.data, 'cGRm');
  assert.doesNotMatch(openAi.url + JSON.stringify(openAi.body), /secret-key/);
  assert.doesNotMatch(anthropic.url + JSON.stringify(anthropic.body), /secret-key/);
  assert.doesNotMatch(gemini.url + JSON.stringify(gemini.body), /secret-key/);
});

test('provider responses are converted to JSON analysis results', async () => {
  const result = await aiAssistant.analyze({
    provider: 'openai',
    model: 'test-model',
    apiKey: 'secret-key',
    prompt: 'Analyze this material',
    fetch: async (url, options) => {
      assert.equal(url, aiAssistant.PROVIDERS.openai.endpoint);
      assert.equal(options.headers.Authorization, 'Bearer secret-key');
      return {
        ok: true,
        json: async () => ({ output_text: '{"answers":{"FULL_NAME":"Sam"},"questions":[]}' })
      };
    }
  });

  assert.deepEqual(result, { answers: { FULL_NAME: 'Sam' }, questions: [] });
});

test('provider errors are explicit and response JSON fences are accepted', async () => {
  assert.deepEqual(aiAssistant.parseJson('```json\n{"answers":{},"questions":[]}\n```'), {
    answers: {},
    questions: []
  });
  await assert.rejects(() => aiAssistant.analyze({
    provider: 'gemini',
    model: 'test-model',
    apiKey: 'secret-key',
    prompt: 'Analyze this material',
    fetch: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid key.' } }) })
  }), /Invalid key/);
});

test('AI questions are validated and suggested answers do not replace saved answers', () => {
  const parsed = materials.validateQuestionImport({
    answers: {
      FULL_NAME: 'Suggested name',
      CV_ALPHA_BULLET: 'Improved the project workflow'
    },
    questions: [{
      key: 'CV_ALPHA_BULLET',
      he: 'איזה הישג לתאר?',
      en: 'Which achievement should be described?',
      section: 'Project Alpha',
      type: 'textarea',
      required: false
    }]
  }, ['FULL_NAME']);
  const merged = materials.mergeIntoEmpty({
    FULL_NAME: 'Saved name',
    CV_ALPHA_BULLET: ''
  }, parsed.answers);

  assert.deepEqual(merged.answers, {
    FULL_NAME: 'Saved name',
    CV_ALPHA_BULLET: 'Improved the project workflow'
  });
  assert.deepEqual(merged.keys, ['CV_ALPHA_BULLET']);
  assert.deepEqual(merged.conflicts, ['FULL_NAME']);
  assert.throws(() => materials.validateQuestionImport({
    answers: { UNKNOWN_KEY: 'Unsupported answer' },
    questions: []
  }, ['FULL_NAME']), /מפתח תשובה לא מוכר/);
});
