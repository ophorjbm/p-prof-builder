(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileImageFields = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var MAX_BYTES = 1.5 * 1024 * 1024;
  var ACCEPT = 'image/png,image/jpeg,image/webp';
  function estimateBytes(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    var comma = dataUrl.indexOf(',');
    return Math.floor((comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl).length * 0.75);
  }
  function computeDrawRect(imageSize, frameSize, zoom, offset) {
    var imageWidth = Math.max(1, Number(imageSize && imageSize.width) || 1);
    var imageHeight = Math.max(1, Number(imageSize && imageSize.height) || 1);
    var frameWidth = Math.max(1, Number(frameSize && frameSize.width) || 1);
    var frameHeight = Math.max(1, Number(frameSize && frameSize.height) || 1);
    var scale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight) * Math.max(1, Number(zoom) || 1);
    var width = imageWidth * scale;
    var height = imageHeight * scale;
    var requestedX = (frameWidth - width) / 2 + (Number(offset && offset.x) || 0);
    var requestedY = (frameHeight - height) / 2 + (Number(offset && offset.y) || 0);
    return {
      x: Math.min(0, Math.max(frameWidth - width, requestedX)),
      y: Math.min(0, Math.max(frameHeight - height, requestedY)),
      width: width,
      height: height
    };
  }
  function encodeCanvas(canvas, fail) {
    var quality = 0.85;
    var result = canvas.toDataURL('image/jpeg', quality);
    while (estimateBytes(result) > MAX_BYTES && quality > 0.1) {
      quality = Math.max(0.1, quality - 0.05);
      result = canvas.toDataURL('image/jpeg', quality);
    }
    if (estimateBytes(result) > MAX_BYTES) throw new Error('image exceeds storage limit');
    return result;
  }
  function resizeImage(dataUrl, width, height, done, fail) {
    if (!dataUrl || typeof dataUrl !== 'string') { if (typeof fail === 'function') fail(new Error('no image')); return; }
    var image = new Image();
    image.onload = function () {
      try {
        var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        drawCanvas(canvas, image, { width: width, height: height }, 1, { x: 0, y: 0 });
        done(encodeCanvas(canvas));
      } catch (error) { if (typeof fail === 'function') fail(error); }
    };
    image.onerror = function () { if (typeof fail === 'function') fail(new Error('image load failed')); };
    image.src = dataUrl;
  }
  function drawCanvas(canvas, image, frameSize, zoom, offset) {
    var context = canvas.getContext('2d');
    var rect = computeDrawRect({ width: image.naturalWidth, height: image.naturalHeight }, frameSize, zoom, offset);
    context.clearRect(0, 0, frameSize.width, frameSize.height);
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }
  function readImage(file, width, height, done, fail) {
    if (!file) { if (typeof fail === 'function') fail(new Error('no file')); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        try {
          var canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
          drawCanvas(canvas, image, { width: width, height: height }, 1, { x: 0, y: 0 });
          done(encodeCanvas(canvas));
        } catch (error) { if (typeof fail === 'function') fail(error); }
      };
      image.onerror = function () { if (typeof fail === 'function') fail(new Error('image load failed')); };
      image.src = reader.result;
    };
    reader.onerror = function () { if (typeof fail === 'function') fail(new Error('file read failed')); };
    reader.readAsDataURL(file);
  }
  function cropImage(file, width, height, isProfile, done, fail) {
    if (!file) { if (typeof fail === 'function') fail(new Error('no file')); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        var crop = document.createElement('div'); crop.className = 'image-crop'; crop.setAttribute('role', 'dialog'); crop.setAttribute('aria-modal', 'true');
        var title = document.createElement('h3'); title.className = 'image-crop-title'; title.textContent = 'התאמת התמונה';
        var help = document.createElement('p'); help.className = 'hint'; help.textContent = 'גרור את התמונה כדי למקם אותה, והשתמש במחוון כדי להגדיל.';
        var stage = document.createElement('div'); stage.className = 'image-crop-stage';
        var canvas = document.createElement('canvas'); canvas.className = 'image-crop-canvas'; canvas.width = width; canvas.height = height; canvas.setAttribute('aria-label', 'תצוגה מקדימה של חיתוך התמונה');
        var guide = document.createElement('div'); guide.className = isProfile ? 'image-crop-guide profile-guide' : 'image-crop-guide'; guide.setAttribute('aria-hidden', 'true');
        stage.appendChild(canvas); stage.appendChild(guide);
        var zoomLabel = document.createElement('label'); zoomLabel.className = 'image-crop-zoom-label'; zoomLabel.textContent = 'קנה מידה';
        var zoom = document.createElement('input'); zoom.type = 'range'; zoom.min = '1'; zoom.max = '3'; zoom.step = '0.01'; zoom.value = '1'; zoomLabel.appendChild(zoom);
        var controls = document.createElement('div'); controls.className = 'image-crop-controls';
        var cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'button'; cancel.textContent = 'ביטול';
        var confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'button'; confirm.textContent = 'אישור';
        controls.appendChild(cancel); controls.appendChild(confirm); crop.appendChild(title); crop.appendChild(help); crop.appendChild(stage); crop.appendChild(zoomLabel); crop.appendChild(controls); document.body.appendChild(crop);
        var offset = { x: 0, y: 0 }; var dragging = false; var last = null;
        function render() { drawCanvas(canvas, image, { width: width, height: height }, Number(zoom.value), offset); }
        function close() { if (crop.parentNode) crop.parentNode.removeChild(crop); }
        function openEdit(dataUrl) {
          var editor = null;
          if (typeof window !== 'undefined' && window.ProfilePhotoEdit) editor = window.ProfilePhotoEdit;
          else if (typeof globalThis !== 'undefined' && globalThis.ProfilePhotoEdit) editor = globalThis.ProfilePhotoEdit;
          if (!editor || typeof editor.editImage !== 'function') {
            done(dataUrl);
            return;
          }
          editor.editImage(dataUrl, width, height, done, fail, { encodeCanvas: encodeCanvas });
        }
        function finish() { try { render(); var result = encodeCanvas(canvas); close(); openEdit(result); } catch (error) { close(); if (typeof fail === 'function') fail(error); } }
        function pointerPosition(event) { var rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (width / rect.width), y: (event.clientY - rect.top) * (height / rect.height) }; }
        canvas.addEventListener('pointerdown', function (event) { dragging = true; last = pointerPosition(event); canvas.setPointerCapture(event.pointerId); });
        canvas.addEventListener('pointermove', function (event) { if (!dragging) return; var point = pointerPosition(event); offset.x += point.x - last.x; offset.y += point.y - last.y; last = point; render(); });
        canvas.addEventListener('pointerup', function () { dragging = false; last = null; });
        canvas.addEventListener('pointercancel', function () { dragging = false; last = null; });
        zoom.addEventListener('input', render); cancel.addEventListener('click', close); confirm.addEventListener('click', finish);
        render(); zoom.focus();
      };
      image.onerror = function () { if (typeof fail === 'function') fail(new Error('image load failed')); };
      image.src = reader.result;
    };
    reader.onerror = function () { if (typeof fail === 'function') fail(new Error('file read failed')); };
    reader.readAsDataURL(file);
  }
  function imageField(key, options) {
    var opts = options || {}; var width = opts.w || opts.width || 800; var height = opts.h || opts.height || 800;
    var getValue = typeof opts.getValue === 'function' ? opts.getValue : function () { return null; };
    var setValue = typeof opts.setValue === 'function' ? opts.setValue : function () {};
    var onChange = typeof opts.onChange === 'function' ? opts.onChange : function () {};
    var onError = typeof opts.onError === 'function' ? opts.onError : function () {};
    var wrapper = document.createElement('div'); wrapper.className = 'field image-field'; wrapper.setAttribute('data-image-key', key);
    var label = document.createElement('label'); label.className = 'field-label'; label.textContent = opts.label || key;
    var input = document.createElement('input'); input.type = 'file'; input.accept = ACCEPT; input.setAttribute('data-image-input', key);
    var checkInput = document.createElement('input'); checkInput.type = 'file'; checkInput.accept = ACCEPT; checkInput.multiple = true; checkInput.hidden = true;
    var preview = document.createElement('img'); preview.className = 'image-preview'; preview.alt = opts.label || key;
    var actions = document.createElement('div'); actions.className = 'image-actions';
    var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'button danger'; remove.textContent = opts.removeLabel || 'הסר תמונה';
      var download = document.createElement('a'); download.className = 'button'; download.textContent = opts.downloadLabel || 'הורד'; download.download = opts.filename || 'image.jpg'; download.setAttribute('role', 'button');
      var exportButton = null;
      if (opts.exportLabel) {
        exportButton = document.createElement('button'); exportButton.type = 'button'; exportButton.className = 'button'; exportButton.textContent = opts.exportLabel; exportButton.hidden = true;
      }
     var check = document.createElement('button'); check.type = 'button'; check.className = 'button'; check.textContent = opts.checkLabel || 'בדוק תמונה';
      var review = document.createElement('button'); review.type = 'button'; review.className = 'button ghost'; review.textContent = opts.reviewLabel || 'סקירה חיצונית';
      var checkReport = document.createElement('pre'); checkReport.className = 'photo-check-report'; checkReport.hidden = true; checkReport.setAttribute('aria-live', 'polite');
      var comparePanel = document.createElement('div'); comparePanel.className = 'photo-compare'; comparePanel.hidden = true; comparePanel.setAttribute('dir', 'rtl'); comparePanel.setAttribute('aria-live', 'polite');
      var reviewPanel = document.createElement('div'); reviewPanel.className = 'photo-review-panel'; reviewPanel.hidden = true; reviewPanel.setAttribute('aria-live', 'polite');
      var reviewText = document.createElement('p'); reviewText.className = 'photo-review-text'; reviewPanel.appendChild(reviewText);
      var copyReview = document.createElement('button'); copyReview.type = 'button'; copyReview.className = 'button'; copyReview.textContent = 'העתק'; copyReview.hidden = true; reviewPanel.appendChild(copyReview);
      var reviewCopyStatus = document.createElement('span'); reviewCopyStatus.className = 'photo-review-copy-status'; reviewCopyStatus.setAttribute('aria-live', 'polite'); reviewPanel.appendChild(reviewCopyStatus);
      var latestReviewText = '';
      var isProfileCrop = opts.cropKind === 'profile' || opts.checkKind === 'profile';
      var runCrop = typeof opts.cropImage === 'function' ? opts.cropImage : cropImage;
      function clearComparePanel() { while (comparePanel.firstChild) comparePanel.removeChild(comparePanel.firstChild); comparePanel.hidden = true; }
      function thumbUrl(file) {
        if (!file) return '';
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          try { return URL.createObjectURL(file); } catch (error) { /* ignore non-blob test doubles */ }
        }
        if (file && typeof file.dataUrl === 'string') return file.dataUrl;
        return '';
      }
      function showCompare(reports) {
        clearComparePanel();
        var items = opts.checkModule && typeof opts.checkModule.comparisonItems === 'function'
          ? opts.checkModule.comparisonItems(reports)
          : (reports || []).map(function (report, index) {
            return { file: report.file, name: (report.file && report.file.name) || ('תמונה ' + (index + 1)), scoreLabel: (report.score || 0) + '/100', score: report.score || 0 };
          });
        items.forEach(function (item) {
          var card = document.createElement('div'); card.className = 'photo-compare-item';
          var thumb = document.createElement('img'); thumb.className = 'photo-compare-thumb'; thumb.alt = item.name || 'תמונה';
          var src = thumbUrl(item.file); if (src) thumb.src = src;
          var name = document.createElement('p'); name.className = 'photo-compare-name'; name.textContent = item.name || 'תמונה';
          var score = document.createElement('p'); score.className = 'photo-compare-score'; score.textContent = item.scoreLabel || ((item.score || 0) + '/100');
          var select = document.createElement('button'); select.type = 'button'; select.className = 'button photo-compare-select'; select.textContent = 'בחר';
          select.addEventListener('click', function () {
            if (!item.file) return;
            runCrop(item.file, width, height, isProfileCrop, function (dataUrl) {
              setValue(key, dataUrl); refresh(); onChange(key, dataUrl);
            }, function (error) { onError(key, error); });
          });
          card.appendChild(thumb); card.appendChild(name); card.appendChild(score); card.appendChild(select); comparePanel.appendChild(card);
        });
        comparePanel.hidden = items.length === 0;
      }
      function refresh() { var value = getValue(key); var has = !!(value && typeof value === 'string'); preview.hidden = !has; remove.hidden = !has; download.hidden = !has; if (exportButton) exportButton.hidden = !has; if (has) { preview.src = value; download.href = value; } else { preview.removeAttribute('src'); download.removeAttribute('href'); } }
     input.addEventListener('change', function () { var file = input.files && input.files[0]; if (!file) return; runCrop(file, width, height, isProfileCrop, function (dataUrl) { setValue(key, dataUrl); refresh(); onChange(key, dataUrl); input.value = ''; }, function (error) { input.value = ''; onError(key, error); }); });
     check.addEventListener('click', function () { checkInput.click(); });
     checkInput.addEventListener('change', function () {
       if (!checkInput.files || !checkInput.files.length || !opts.checkModule) return;
       check.disabled = true;
       checkReport.hidden = false;
       checkReport.textContent = 'בודק תמונות מקומית...';
       clearComparePanel();
       opts.checkModule.rankFiles(checkInput.files, { kind: opts.checkKind }).then(function (reports) {
         checkReport.textContent = reports.map(function (report, index) {
           return (index + 1) + '. ' + ((report.file && report.file.name) || 'תמונה') + ' | ציון בדיקות: ' + report.score + '/100\n' + report.text;
         }).join('\n\n');
         showCompare(reports);
       }).catch(function () {
         checkReport.textContent = 'לא ניתן לבדוק את התמונות בדפדפן הזה.';
         clearComparePanel();
       }).then(function () { check.disabled = false; checkInput.value = ''; });
     });

      review.addEventListener('click', function () {
       if (!opts.reviewModule || typeof opts.reviewModule.reviewPhoto !== 'function') return;
       var value = getValue(key);
       reviewPanel.hidden = false;
       copyReview.hidden = true;
       reviewCopyStatus.textContent = '';
       if (!value) { reviewText.textContent = (opts.reviewModule.MSG && opts.reviewModule.MSG.noImage) || 'אין תמונה לסקירה.'; return; }
       review.disabled = true;
       reviewText.textContent = 'מכין סקירה חיצונית...';
       opts.reviewModule.reviewPhoto(value, { kind: opts.checkKind }).then(function (result) {
         latestReviewText = result && result.text ? String(result.text) : 'אין תוצאה.';
         reviewText.textContent = latestReviewText;
         copyReview.hidden = !latestReviewText;
       }).catch(function () {
         latestReviewText = (opts.reviewModule.MSG && opts.reviewModule.MSG.serverError) || 'השרת לא ענה. בדוק שהדשבורד רץ.';
         reviewText.textContent = latestReviewText;
       }).then(function () { review.disabled = false; });
      });
      if (exportButton) exportButton.addEventListener('click', function () {
        var value = getValue(key);
        if (!value || typeof value !== 'string') return;
        exportButton.disabled = true;
        resizeImage(value, opts.exportWidth || 400, opts.exportHeight || 400, function (dataUrl) {
          var link = document.createElement('a');
          link.href = dataUrl;
          link.download = opts.exportFilename || 'cv-profile-photo.jpg';
          link.setAttribute('role', 'button');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          exportButton.disabled = false;
        }, function (error) {
          exportButton.disabled = false;
          onError(key, error);
        });
      });
     copyReview.addEventListener('click', function () {
       if (!latestReviewText) return;
       var copied = function () { reviewCopyStatus.textContent = 'הועתק'; };
       var failed = function () { reviewCopyStatus.textContent = 'ההעתקה נכשלה'; };
       if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
         navigator.clipboard.writeText(latestReviewText).then(copied, failed);
         return;
       }
       try {
         var area = document.createElement('textarea'); area.value = latestReviewText; area.setAttribute('readonly', 'readonly'); area.style.position = 'fixed'; area.style.left = '-1000px'; document.body.appendChild(area); area.select();
         if (!document.execCommand('copy')) throw new Error('copy failed');
         document.body.removeChild(area); copied();
       } catch (error) { if (area && area.parentNode) area.parentNode.removeChild(area); failed(); }
     });
     remove.addEventListener('click', function () { setValue(key, null); input.value = ''; refresh(); onChange(key, null); });
       actions.appendChild(remove); actions.appendChild(download); if (exportButton) actions.appendChild(exportButton); actions.appendChild(check); actions.appendChild(review); wrapper.appendChild(label); wrapper.appendChild(input); wrapper.appendChild(checkInput); wrapper.appendChild(preview); wrapper.appendChild(actions); wrapper.appendChild(comparePanel); wrapper.appendChild(checkReport); wrapper.appendChild(reviewPanel);

    if (opts.note) { var hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = opts.note; wrapper.appendChild(hint); }
    refresh(); return { key: key, element: wrapper, refresh: refresh, input: input };
  }
   return { MAX_BYTES: MAX_BYTES, ACCEPT: ACCEPT, estimateBytes: estimateBytes, encodeCanvas: encodeCanvas, computeDrawRect: computeDrawRect, readImage: readImage, resizeImage: resizeImage, cropImage: cropImage, imageField: imageField };
});
