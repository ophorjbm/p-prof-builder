(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PROFILE_PRODUCT_NAME = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  return { en: 'Profile Builder', he: 'בונה פרופיל' };
});
