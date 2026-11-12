(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfilePhotoCheck = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var MAX_BYTES = 8 * 1024 * 1024;
  var PROFILE_MIN = 400;
  function formatBytes(bytes) { return bytes < 1024 * 1024 ? Math.round(bytes / 1024) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB'; }
  function formatName(file) { var type = file && file.type ? file.type.toLowerCase() : ''; if (type === 'image/jpeg') return 'JPEG'; if (type === 'image/png') return 'PNG'; if (type === 'image/webp') return 'WebP'; if (type) return type.replace(/^image\//, '').toUpperCase(); var name = file && file.name ? file.name : ''; return (name.split('.').pop() || 'לא ידוע').toUpperCase(); }
  function averageBrightness(data) { if (!data || !data.length) return 0; var total = 0; var count = 0; for (var i = 0; i + 2 < data.length; i += 4) { total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; count += 1; } return count ? total / count : 0; }
  function analyzePixels(input) { var width = Number(input && input.width) || 0; var height = Number(input && input.height) || 0; var brightness = averageBrightness(input && input.data); var ratio = height ? width / height : 0; return { width: width, height: height, aspectRatio: ratio, brightness: brightness, square: width > 0 && height > 0 && Math.abs(ratio - 1) <= 0.05, tooDark: brightness < 45, tooBright: brightness > 220 }; }
  function reportFor(file, pixels, options) { var opts = options || {}; var metrics = analyzePixels(pixels); var isProfile = opts.kind !== 'banner'; var issues = []; var score = 100; if (!metrics.width || !metrics.height) { issues.push('לא ניתן לקרוא את ממדי התמונה'); score -= 50; } if (isProfile && (metrics.width < PROFILE_MIN || metrics.height < PROFILE_MIN)) { issues.push('לתמונת פרופיל LinkedIn מומלץ לפחות 400x400 פיקסלים'); score -= 30; } if (isProfile && !metrics.square) { issues.push('לתמונת פרופיל עדיף יחס ריבועי'); score -= 10; } if (file && file.size > MAX_BYTES) { issues.push('הקובץ גדול מהמגבלה של 8 MB'); score -= 30; } if (metrics.tooDark) { issues.push('התמונה כהה מדי'); score -= 15; } if (metrics.tooBright) { issues.push('התמונה בהירה מדי'); score -= 15; } var ratioText = metrics.aspectRatio ? metrics.aspectRatio.toFixed(2) : 'לא ידוע'; var lines = ['בדיקה מקומית בלבד: זו עצה ולא קביעה.', 'פורמט: ' + formatName(file) + (file && file.size != null ? ' | גודל: ' + formatBytes(file.size) : ''), 'ממדים: ' + metrics.width + 'x' + metrics.height + ' | יחס: ' + ratioText, 'בהירות ממוצעת: ' + Math.round(metrics.brightness) + '/255']; lines.push(issues.length ? 'המלצות: ' + issues.join('; ') : 'לא נמצאו בעיות בבדיקות המקומיות.'); return { file: file || null, metrics: metrics, format: formatName(file), issues: issues, score: Math.max(0, score), advice: true, text: lines.join('\n') }; }
  function analyzeFile(file, options) { if (!file) return Promise.reject(new Error('no file')); if (typeof createImageBitmap === 'function') return createImageBitmap(file).then(function (bitmap) { var size = Math.min(64, bitmap.width, bitmap.height) || 1; var canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; var context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0, size, size); var result = reportFor(file, { width: bitmap.width, height: bitmap.height, data: context.getImageData(0, 0, size, size).data }, options); if (typeof bitmap.close === 'function') bitmap.close(); return result; }); return new Promise(function (resolve, reject) { var url = URL.createObjectURL(file); var image = new Image(); image.onload = function () { try { var size = Math.min(64, image.naturalWidth, image.naturalHeight) || 1; var canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; var context = canvas.getContext('2d'); context.drawImage(image, 0, 0, size, size); resolve(reportFor(file, { width: image.naturalWidth, height: image.naturalHeight, data: context.getImageData(0, 0, size, size).data }, options)); } catch (error) { reject(error); } finally { URL.revokeObjectURL(url); } }; image.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image load failed')); }; image.src = url; }); }
  function rankFiles(files, options) { return Promise.all(Array.prototype.map.call(files || [], function (file, index) { return api.analyzeFile(file, options).then(function (report) { report.index = index; return report; }); })).then(function (reports) { return reports.sort(function (a, b) { return b.score - a.score || a.index - b.index; }); }); }
  function comparisonItems(reports) {
    return Array.prototype.map.call(reports || [], function (report, index) {
      var file = report && report.file ? report.file : null;
      var score = report && report.score != null ? Number(report.score) : 0;
      if (!isFinite(score)) score = 0;
      return {
        index: index,
        rank: index + 1,
        file: file,
        name: (file && file.name) || ('תמונה ' + (index + 1)),
        score: score,
        scoreLabel: score + '/100',
        text: (report && report.text) || '',
        report: report || null
      };
    });
  }
  var api = { MAX_BYTES: MAX_BYTES, PROFILE_MIN: PROFILE_MIN, averageBrightness: averageBrightness, analyzePixels: analyzePixels, reportFor: reportFor, analyzeFile: analyzeFile, rankFiles: rankFiles, comparisonItems: comparisonItems }; return api;
});
