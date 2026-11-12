(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileAIAssistant = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var PROVIDERS = {
    openai: {
      endpoint: 'https://api.openai.com/v1/responses',
      placeholder: 'gpt-4.1-mini'
    },
    anthropic: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      placeholder: 'claude-3-5-haiku-latest'
    },
    gemini: {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
      placeholder: 'gemini-2.0-flash'
    }
  };

  function parseJson(text) {
    var value = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    var start = value.indexOf('{');
    var end = value.lastIndexOf('}');
    if (start < 0 || end < start) throw new Error('The AI response did not contain a JSON object.');
    try {
      return JSON.parse(value.slice(start, end + 1));
    } catch (error) {
      throw new Error('The AI returned invalid JSON.');
    }
  }

  function responseText(provider, data) {
    if (provider === 'openai') {
      if (typeof data.output_text === 'string') return data.output_text;
      var output = Array.isArray(data.output) ? data.output : [];
      return output.reduce(function (texts, item) {
        return texts.concat((item.content || []).filter(function (part) {
          return part.type === 'output_text' && typeof part.text === 'string';
        }).map(function (part) { return part.text; }));
      }, []).join('\n');
    }
    if (provider === 'anthropic') {
      return (data.content || []).filter(function (part) {
        return part.type === 'text' && typeof part.text === 'string';
      }).map(function (part) { return part.text; }).join('\n');
    }
    var candidate = data.candidates && data.candidates[0];
    return candidate && candidate.content && Array.isArray(candidate.content.parts)
      ? candidate.content.parts.map(function (part) { return part.text || ''; }).join('\n')
      : '';
  }

  function pdfData(provider, pdf) {
    var data = String(pdf.data || '').replace(/^data:application\/pdf;base64,/i, '');
    if (provider === 'openai') {
      return { type: 'input_file', filename: pdf.name || 'material.pdf', file_data: 'data:application/pdf;base64,' + data };
    }
    if (provider === 'anthropic') {
      return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: data } };
    }
    return { inline_data: { mime_type: 'application/pdf', data: data } };
  }

  function requestOptions(provider, model, apiKey, prompt, pdfs) {
    var documents = (pdfs || []).map(function (pdf) { return pdfData(provider, pdf); });
    if (provider === 'openai') {
      return {
        url: PROVIDERS.openai.endpoint,
        headers: { Authorization: 'Bearer ' + apiKey },
        body: {
          model: model,
          input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }].concat(documents) }],
          text: { format: { type: 'json_object' } }
        }
      };
    }
    if (provider === 'anthropic') {
      return {
        url: PROVIDERS.anthropic.endpoint,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: {
          model: model,
          max_tokens: 8192,
          system: prompt,
          messages: [{ role: 'user', content: documents.concat([{ type: 'text', text: 'Analyze the supplied materials and return only the requested JSON.' }]) }]
        }
      };
    }
    if (provider === 'gemini') {
      return {
        url: PROVIDERS.gemini.endpoint + encodeURIComponent(model) + ':generateContent',
        headers: { 'x-goog-api-key': apiKey },
        body: {
          contents: [{ parts: [{ text: prompt }].concat(documents) }],
          generationConfig: { responseMimeType: 'application/json' }
        }
      };
    }
    throw new Error('Choose a supported AI provider.');
  }

  async function analyze(options) {
    var settings = options || {};
    var provider = settings.provider;
    var model = String(settings.model || '').trim();
    var apiKey = String(settings.apiKey || '').trim();
    if (!PROVIDERS[provider]) throw new Error('Choose a supported AI provider.');
    if (!model) throw new Error('Enter a model name from your AI provider.');
    if (!apiKey) throw new Error('Enter your AI API key.');
    if (typeof settings.prompt !== 'string' || !settings.prompt.trim()) throw new Error('Add materials before starting the analysis.');
    var request = requestOptions(provider, model, apiKey, settings.prompt, settings.pdfs);
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = controller ? setTimeout(function () { controller.abort(); }, 90000) : null;
    try {
      var response = await (settings.fetch || fetch)(request.url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, request.headers),
        body: JSON.stringify(request.body),
        signal: controller ? controller.signal : undefined,
        referrerPolicy: 'no-referrer'
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var message = data.error && (data.error.message || data.error.status) || data.message;
        throw new Error(message || 'AI provider request failed (HTTP ' + response.status + ').');
      }
      var text = responseText(provider, data);
      if (!text) throw new Error('The AI provider returned an empty response.');
      return parseJson(text);
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('AI analysis timed out. Try fewer or smaller materials.');
      if (error instanceof TypeError) {
        throw new Error('Could not reach this AI provider from the browser. Check the provider, API key, and browser network access.');
      }
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  return {
    PROVIDERS: PROVIDERS,
    parseJson: parseJson,
    requestOptions: requestOptions,
    analyze: analyze
  };
});
