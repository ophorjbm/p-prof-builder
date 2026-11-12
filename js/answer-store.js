(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileAnswerStore = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  function isObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
  function parseAnswersPayload(payload) { var parsed = typeof payload === 'string' ? JSON.parse(payload) : payload; var answers = isObject(parsed) && isObject(parsed.answers) ? parsed.answers : parsed; if (!isObject(answers)) throw new Error('invalid answers'); return answers; }
  function load(storage, key) { try { var raw = storage.getItem(key); return raw ? parseAnswersPayload(raw) : {}; } catch (error) { return {}; } }
  function save(storage, key, answers) { try { storage.setItem(key, JSON.stringify(answers)); return true; } catch (error) { return false; } }
  return { parseAnswersPayload: parseAnswersPayload, load: load, save: save };
});
