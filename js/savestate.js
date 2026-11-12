(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileSaveState = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var DIRTY = 'יש שינויים שלא נשמרו'; var LOCAL_ONLY = 'שמור מקומית בלבד';
  function snapshot(value) { return JSON.stringify(value == null ? {} : value); }
  function formatTime(time) { var date = time instanceof Date ? time : new Date(time); return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0'); }
  function createSaveState(initial) { var state = { saved: snapshot(initial), dirty: false, error: null, status: '', fadeable: false }; function markChanged(value) { state.dirty = snapshot(value) !== state.saved; state.fadeable = false; if (state.dirty && !state.error) state.status = DIRTY; return state; } function startSave() { state.status = state.error || ''; state.fadeable = false; return state; } function clearError() { state.error = null; return state; } function markSaved(value, time, current) { state.saved = snapshot(value); state.dirty = arguments.length > 2 ? snapshot(current) !== state.saved : false; if (!state.error) { state.status = state.dirty ? DIRTY : 'נשמר ב-' + formatTime(time == null ? new Date() : time); state.fadeable = !state.dirty; } return state; } function markError(message) { if (!state.error) { state.error = message; state.status = message; state.fadeable = false; } return state; } function markLocalOnly(value, current) { state.saved = snapshot(value); state.dirty = arguments.length > 1 ? snapshot(current) !== state.saved : false; if (!state.error) { state.status = state.dirty ? DIRTY : LOCAL_ONLY; state.fadeable = false; } return state; } return { state: state, markChanged: markChanged, markDirty: markChanged, startSave: startSave, markSaved: markSaved, markError: markError, clearError: clearError, markLocalOnly: markLocalOnly, isDirty: function () { return state.dirty; }, status: function () { return state.status; } }; }
  return { DIRTY: DIRTY, LOCAL_ONLY: LOCAL_ONLY, snapshot: snapshot, formatTime: formatTime, createSaveState: createSaveState };
});
