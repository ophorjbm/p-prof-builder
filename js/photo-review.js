(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfilePhotoReview = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var endpoint = '';
  var PROMPT_HE = [
    'סקור את התמונה בעברית עבור פרופיל LinkedIn מקצועי של מהנדס/ת או מפתח/ת.',
    'התייחס במפורש ל: מראה מקצועי, רקע, תאורה, מסגור (framing),',
    'והתאמה לפרופיל LinkedIn הנדסי.',
    'תן המלצות מעשיות קצרות. זו עצה ולא קביעה.'
  ].join(' ');
  var CRITERIA = ['professional_look', 'background', 'lighting', 'framing', 'engineer_linkedin_fit'];
  var MSG = {
    notConnected: 'סקירת תמונה חיצונית עדיין לא מחוברת.',
    confirm: 'התמונה תישלח לשירות חיצוני לסקירה. האם להמשיך?',
    declined: 'הסקירה בוטלה. התמונה לא נשלחה.',
    noImage: 'אין תמונה לסקירה.',
    failed: 'הסקירה החיצונית נכשלה.',
    serverError: 'השרת לא ענה. בדוק שהדשבורד רץ.'
  };
  var TIMEOUT_MS = 90000;

  function getEndpoint() { return endpoint || ''; }
  function setEndpoint(value) { endpoint = value == null ? '' : String(value).trim(); return getEndpoint(); }

  function buildRequest(image, options) {
    var opts = options || {};
    var payload = {
      language: 'he',
      kind: opts.kind === 'banner' ? 'banner' : 'profile',
      prompt: PROMPT_HE,
      criteria: CRITERIA.slice(),
      image: null
    };
    if (image == null || image === '') return payload;
    if (typeof image === 'string') {
      payload.image = { type: image.indexOf('data:') === 0 ? 'data_url' : 'text', data: image };
    } else if (typeof image === 'object') {
      payload.image = {
        type: image.type || (image.dataUrl ? 'data_url' : 'object'),
        data: image.dataUrl || image.data || null,
        name: image.name || null,
        mime: image.mime || image.mediaType || null
      };
    }
    return payload;
  }

  function defaultConfirm(message) {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') return window.confirm(message);
    return false;
  }

  function defaultFetch() {
    if (typeof fetch === 'function') return fetch;
    return null;
  }

  function formatResponse(payload) {
    if (!payload) return MSG.failed;
    if (typeof payload === 'string') return payload;
    if (payload.text) return String(payload.text);
    if (payload.report) return String(payload.report);
    if (payload.message) return String(payload.message);
    try { return JSON.stringify(payload, null, 2); } catch (error) { return MSG.failed; }
  }

  function reviewPhoto(image, options) {
    var opts = options || {};
    var target = opts.endpoint != null ? String(opts.endpoint).trim() : getEndpoint();
    var confirmFn = typeof opts.confirm === 'function' ? opts.confirm : defaultConfirm;
    var fetchFn = typeof opts.fetch === 'function' ? opts.fetch : defaultFetch();
    var request = buildRequest(image, opts);

    if (!image && !(request.image && request.image.data)) {
      return Promise.resolve({ sent: false, reason: 'no_image', text: MSG.noImage, request: request });
    }
    if (!target) {
      return Promise.resolve({ sent: false, reason: 'not_connected', text: MSG.notConnected, request: request });
    }
    if (!confirmFn(MSG.confirm)) {
      return Promise.resolve({ sent: false, reason: 'declined', text: MSG.declined, request: request });
    }
    if (typeof fetchFn !== 'function') {
      return Promise.resolve({ sent: false, reason: 'no_fetch', text: MSG.notConnected, request: request });
    }

    var AbortControllerCtor = opts.AbortController || (typeof AbortController === 'function' ? AbortController : null);
    var controller = AbortControllerCtor ? new AbortControllerCtor() : null;
    var setTimer = typeof opts.setTimeout === 'function' ? opts.setTimeout : setTimeout;
    var clearTimer = typeof opts.clearTimeout === 'function' ? opts.clearTimeout : clearTimeout;
    var timeoutId;
    var timedOut = false;
    var fetchPromise;
    try {
      fetchPromise = Promise.resolve(fetchFn(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' },
        body: JSON.stringify(request),
        signal: controller ? controller.signal : undefined
      }));
    } catch (error) {
      fetchPromise = Promise.reject(error);
    }
    var timeoutPromise = new Promise(function (_, reject) {
      timeoutId = setTimer(function () {
        timedOut = true;
        if (controller) controller.abort();
        var error = new Error('photo review timeout');
        error.name = 'TimeoutError';
        reject(error);
      }, TIMEOUT_MS);
    });

    return Promise.race([fetchPromise, timeoutPromise]).then(function (response) {
      if (timeoutId !== undefined) clearTimer(timeoutId);
      if (!response) return { sent: true, reason: 'ok', text: MSG.failed, request: request, response: null };
      var parse = typeof response.json === 'function'
        ? response.json().catch(function () { return typeof response.text === 'function' ? response.text() : null; })
        : Promise.resolve(typeof response.text === 'function' ? response.text() : response);
      return parse.then(function (body) {
        return {
          sent: true,
          reason: response.ok === false ? 'http_error' : 'ok',
          text: response.ok === false ? MSG.serverError : formatResponse(body),
          request: request,
          response: body,
          status: response.status
        };
      });
    }).catch(function () {
      if (timeoutId !== undefined) clearTimer(timeoutId);
      return {
        sent: true,
        reason: timedOut ? 'timeout' : 'network_error',
        text: MSG.serverError,
        request: request
      };
    });
  }

  return {
    PROMPT_HE: PROMPT_HE,
    CRITERIA: CRITERIA,
    MSG: MSG,
    TIMEOUT_MS: TIMEOUT_MS,
    getEndpoint: getEndpoint,
    setEndpoint: setEndpoint,
    buildRequest: buildRequest,
    reviewPhoto: reviewPhoto
  };
});
