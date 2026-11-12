(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfilePhotoChecklist = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var KEY = 'PROFILE_PHOTO_CHECKLIST';
  var ITEMS = [
    'מסגור ראש וכתפיים, כשהפנים תופסות בערך 60% מהמסגרת (המשתמש חותך את התמונה)',
    'מבט למצלמה וחיוך טבעי ועדין',
    'חולצה חלקה וללא הדפס גרפי (חולצה חלקה, מכופתרת או בלייזר)',
    'הידיים אינן משולבות והכתפיים פתוחות ומאוזנות',
    'רקע נקי וחלק; טשטוש עדין מתאים, ואין פריטים מסיחים בפינות',
    'תאורה רכה ואחידה, ללא צללים קשים'
  ];

  function normalize(value) {
    var result = {};
    for (var i = 0; i < ITEMS.length; i += 1) result[i] = Boolean(value && value[i]);
    return result;
  }

  function completedCount(value) {
    var state = normalize(value);
    var count = 0;
    for (var i = 0; i < ITEMS.length; i += 1) if (state[i]) count += 1;
    return count;
  }

  return { KEY: KEY, ITEMS: ITEMS.slice(), normalize: normalize, completedCount: completedCount };
});
