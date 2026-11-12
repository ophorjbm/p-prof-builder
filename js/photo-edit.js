(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfilePhotoEdit = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var DEFAULTS = {
    blur: 0,
    softEdge: 12,
    brightness: 0,
    contrast: 0,
    warmth: 0,
    ellipse: null
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampByte(value) {
    return clamp(Math.round(value), 0, 255);
  }

  function defaultEllipse(width, height) {
    var w = Math.max(1, Number(width) || 1);
    var h = Math.max(1, Number(height) || 1);
    return {
      cx: w / 2,
      cy: h * 0.42,
      rx: w * 0.28,
      ry: h * 0.36
    };
  }

  function normalizeEllipse(ellipse, width, height) {
    var base = defaultEllipse(width, height);
    var src = ellipse && typeof ellipse === 'object' ? ellipse : base;
    var w = Math.max(1, Number(width) || 1);
    var h = Math.max(1, Number(height) || 1);
    var rx = clamp(Number(src.rx) || base.rx, 8, w);
    var ry = clamp(Number(src.ry) || base.ry, 8, h);
    return {
      cx: clamp(Number(src.cx) || base.cx, 0, w),
      cy: clamp(Number(src.cy) || base.cy, 0, h),
      rx: rx,
      ry: ry
    };
  }

  function normalizeSettings(settings, width, height) {
    var src = settings && typeof settings === 'object' ? settings : {};
    return {
      blur: clamp(Number(src.blur) || 0, 0, 20),
      softEdge: clamp(Number(src.softEdge) || 0, 0, 80),
      brightness: clamp(Number(src.brightness) || 0, -100, 100),
      contrast: clamp(Number(src.contrast) || 0, -100, 100),
      warmth: clamp(Number(src.warmth) || 0, -100, 100),
      ellipse: normalizeEllipse(src.ellipse, width, height)
    };
  }

  function ellipseWeight(x, y, ellipse, softEdge) {
    var cx = Number(ellipse && ellipse.cx) || 0;
    var cy = Number(ellipse && ellipse.cy) || 0;
    var rx = Math.max(1e-6, Number(ellipse && ellipse.rx) || 1);
    var ry = Math.max(1e-6, Number(ellipse && ellipse.ry) || 1);
    var soft = Math.max(0, Number(softEdge) || 0);
    var dx = (x + 0.5 - cx) / rx;
    var dy = (y + 0.5 - cy) / ry;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (soft <= 0) return d <= 1 ? 1 : 0;
    var edgeScale = (rx + ry) / 2;
    var outsidePx = (d - 1) * edgeScale;
    if (outsidePx <= 0) return 1;
    if (outsidePx >= soft) return 0;
    return 1 - outsidePx / soft;
  }

  function applyColorFilters(r, g, b, filters) {
    var brightness = Number(filters && filters.brightness) || 0;
    var contrast = Number(filters && filters.contrast) || 0;
    var warmth = Number(filters && filters.warmth) || 0;
    var br = brightness * 2.55;
    var rr = r + br;
    var gg = g + br;
    var bb = b + br;
    var c = contrast * 2.55;
    var factor = (259 * (c + 255)) / (255 * (259 - c));
    rr = factor * (rr - 128) + 128;
    gg = factor * (gg - 128) + 128;
    bb = factor * (bb - 128) + 128;
    rr += warmth * 1.5;
    bb -= warmth * 1.5;
    return [clampByte(rr), clampByte(gg), clampByte(bb)];
  }

  function copyRgba(src) {
    var out = new Uint8ClampedArray(src.length);
    out.set(src);
    return out;
  }

  function applyFiltersToBuffer(src, filters) {
    var out = new Uint8ClampedArray(src.length);
    for (var i = 0; i < src.length; i += 4) {
      var rgb = applyColorFilters(src[i], src[i + 1], src[i + 2], filters);
      out[i] = rgb[0];
      out[i + 1] = rgb[1];
      out[i + 2] = rgb[2];
      out[i + 3] = src[i + 3];
    }
    return out;
  }

  function blurAxis(src, width, height, radius, horizontal) {
    var out = new Uint8ClampedArray(src.length);
    var r = Math.max(0, Math.floor(Number(radius) || 0));
    if (r <= 0) {
      out.set(src);
      return out;
    }
    var x;
    var y;
    var i;
    var sumR;
    var sumG;
    var sumB;
    var sumA;
    var count;
    var px;
    var py;
    var idx;
    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        sumR = 0;
        sumG = 0;
        sumB = 0;
        sumA = 0;
        count = 0;
        for (i = -r; i <= r; i += 1) {
          if (horizontal) {
            px = clamp(x + i, 0, width - 1);
            py = y;
          } else {
            px = x;
            py = clamp(y + i, 0, height - 1);
          }
          idx = (py * width + px) * 4;
          sumR += src[idx];
          sumG += src[idx + 1];
          sumB += src[idx + 2];
          sumA += src[idx + 3];
          count += 1;
        }
        idx = (y * width + x) * 4;
        out[idx] = Math.round(sumR / count);
        out[idx + 1] = Math.round(sumG / count);
        out[idx + 2] = Math.round(sumB / count);
        out[idx + 3] = Math.round(sumA / count);
      }
    }
    return out;
  }

  function boxBlurRgba(src, width, height, radius) {
    var r = clamp(Math.floor(Number(radius) || 0), 0, 20);
    if (r <= 0) return copyRgba(src);
    var tmp = blurAxis(src, width, height, r, true);
    return blurAxis(tmp, width, height, r, false);
  }

  function compositeEllipseBlur(sharp, blurred, width, height, ellipse, softEdge) {
    var out = new Uint8ClampedArray(sharp.length);
    var x;
    var y;
    var idx;
    var w;
    var inv;
    for (y = 0; y < height; y += 1) {
      for (x = 0; x < width; x += 1) {
        w = ellipseWeight(x, y, ellipse, softEdge);
        inv = 1 - w;
        idx = (y * width + x) * 4;
        out[idx] = Math.round(sharp[idx] * w + blurred[idx] * inv);
        out[idx + 1] = Math.round(sharp[idx + 1] * w + blurred[idx + 1] * inv);
        out[idx + 2] = Math.round(sharp[idx + 2] * w + blurred[idx + 2] * inv);
        out[idx + 3] = Math.round(sharp[idx + 3] * w + blurred[idx + 3] * inv);
      }
    }
    return out;
  }

  function renderEditBuffer(src, width, height, settings) {
    var w = Math.max(1, Number(width) || 1);
    var h = Math.max(1, Number(height) || 1);
    var conf = normalizeSettings(settings, w, h);
    var filtered = applyFiltersToBuffer(src, conf);
    if (conf.blur <= 0) return filtered;
    var blurred = boxBlurRgba(filtered, w, h, conf.blur);
    return compositeEllipseBlur(filtered, blurred, w, h, conf.ellipse, conf.softEdge);
  }

  function putBuffer(context, buffer, width, height) {
    var imageData = context.createImageData(width, height);
    imageData.data.set(buffer);
    context.putImageData(imageData, 0, 0);
  }

  function drawEllipseOverlay(context, ellipse, width, height) {
    context.save();
    context.strokeStyle = 'rgba(255,255,255,0.9)';
    context.lineWidth = Math.max(2, Math.min(width, height) * 0.004);
    context.setLineDash([6, 4]);
    context.beginPath();
    context.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = 'rgba(255,255,255,0.95)';
    var handleR = Math.max(5, Math.min(width, height) * 0.012);
    var points = [
      { x: ellipse.cx, y: ellipse.cy - ellipse.ry },
      { x: ellipse.cx, y: ellipse.cy + ellipse.ry },
      { x: ellipse.cx - ellipse.rx, y: ellipse.cy },
      { x: ellipse.cx + ellipse.rx, y: ellipse.cy }
    ];
    points.forEach(function (point) {
      context.beginPath();
      context.arc(point.x, point.y, handleR, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function hitEllipse(x, y, ellipse, width, height) {
    var handleR = Math.max(10, Math.min(width, height) * 0.03);
    var handles = [
      { mode: 'resize-n', x: ellipse.cx, y: ellipse.cy - ellipse.ry },
      { mode: 'resize-s', x: ellipse.cx, y: ellipse.cy + ellipse.ry },
      { mode: 'resize-w', x: ellipse.cx - ellipse.rx, y: ellipse.cy },
      { mode: 'resize-e', x: ellipse.cx + ellipse.rx, y: ellipse.cy }
    ];
    var i;
    for (i = 0; i < handles.length; i += 1) {
      var dx = x - handles[i].x;
      var dy = y - handles[i].y;
      if (dx * dx + dy * dy <= handleR * handleR) return handles[i].mode;
    }
    var weight = ellipseWeight(x, y, ellipse, 0);
    if (weight >= 1) return 'move';
    return null;
  }

  function editImage(dataUrl, width, height, done, fail, options) {
    var opts = options || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      if (typeof fail === 'function') fail(new Error('no image'));
      return;
    }
    var encodeCanvas = typeof opts.encodeCanvas === 'function' ? opts.encodeCanvas : null;
    var image = new Image();
    image.onload = function () {
      var w = Math.max(1, Number(width) || image.naturalWidth || 1);
      var h = Math.max(1, Number(height) || image.naturalHeight || 1);
      var settings = normalizeSettings({
        blur: 0,
        softEdge: 12,
        brightness: 0,
        contrast: 0,
        warmth: 0,
        ellipse: defaultEllipse(w, h)
      }, w, h);
      var sourceBuffer = null;
      var showingOriginal = false;
      var drag = null;
      var frame = null;
      var canvas = null;
      var context = null;
      var previewBusy = false;
      var previewQueued = false;

      var dialog = document.createElement('div');
      dialog.className = 'image-crop image-edit';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');

      var title = document.createElement('h3');
      title.className = 'image-crop-title';
      title.textContent = 'עריכה';

      var help = document.createElement('p');
      help.className = 'hint';
      help.textContent = 'גרור את האליפסה מעל הפנים והכתפיים. מחוץ לאליפסה יטושטש הרקע. החזק "לפני/אחרי" לתצוגת המקור.';

      var stage = document.createElement('div');
      stage.className = 'image-crop-stage image-edit-stage';
      canvas = document.createElement('canvas');
      canvas.className = 'image-crop-canvas image-edit-canvas';
      canvas.width = w;
      canvas.height = h;
      canvas.setAttribute('aria-label', 'תצוגה מקדימה חיה של עריכת התמונה');
      stage.appendChild(canvas);
      context = canvas.getContext('2d');

      function makeSlider(labelText, min, max, step, value, key) {
        var label = document.createElement('label');
        label.className = 'image-crop-zoom-label image-edit-slider';
        var caption = document.createElement('span');
        caption.textContent = labelText;
        var input = document.createElement('input');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.setAttribute('data-edit-key', key);
        label.appendChild(caption);
        label.appendChild(input);
        input.addEventListener('input', function () {
          settings[key] = Number(input.value);
          queuePreview();
        });
        return { label: label, input: input };
      }

      var blurSlider = makeSlider('טשטוש רקע', 0, 20, 1, settings.blur, 'blur');
      var softSlider = makeSlider('קצה רך', 0, 80, 1, settings.softEdge, 'softEdge');
      var brightSlider = makeSlider('בהירות', -100, 100, 1, settings.brightness, 'brightness');
      var contrastSlider = makeSlider('ניגודיות', -100, 100, 1, settings.contrast, 'contrast');
      var warmthSlider = makeSlider('חמימות', -100, 100, 1, settings.warmth, 'warmth');

      var controls = document.createElement('div');
      controls.className = 'image-crop-controls image-edit-controls';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'button';
      cancel.textContent = 'ביטול';
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'button ghost';
      reset.textContent = 'איפוס';
      var compare = document.createElement('button');
      compare.type = 'button';
      compare.className = 'button ghost';
      compare.textContent = 'לפני/אחרי';
      var save = document.createElement('button');
      save.type = 'button';
      save.className = 'button';
      save.textContent = 'שמירה';
      controls.appendChild(cancel);
      controls.appendChild(reset);
      controls.appendChild(compare);
      controls.appendChild(save);

      dialog.appendChild(title);
      dialog.appendChild(help);
      dialog.appendChild(stage);
      dialog.appendChild(blurSlider.label);
      dialog.appendChild(softSlider.label);
      dialog.appendChild(brightSlider.label);
      dialog.appendChild(contrastSlider.label);
      dialog.appendChild(warmthSlider.label);
      dialog.appendChild(controls);
      document.body.appendChild(dialog);

      function close() {
        if (dialog.parentNode) dialog.parentNode.removeChild(dialog);
      }

      function pointerPosition(event) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * (w / Math.max(1, rect.width)),
          y: (event.clientY - rect.top) * (h / Math.max(1, rect.height))
        };
      }

      function paint() {
        if (!sourceBuffer) return;
        var buffer = showingOriginal ? sourceBuffer : renderEditBuffer(sourceBuffer, w, h, settings);
        putBuffer(context, buffer, w, h);
        if (!showingOriginal) drawEllipseOverlay(context, settings.ellipse, w, h);
      }

      function queuePreview() {
        previewQueued = true;
        if (previewBusy) return;
        previewBusy = true;
        previewQueued = false;
        requestAnimationFrame(function () {
          paint();
          previewBusy = false;
          if (previewQueued) queuePreview();
        });
      }

      function captureSource() {
        context.clearRect(0, 0, w, h);
        context.drawImage(image, 0, 0, w, h);
        sourceBuffer = context.getImageData(0, 0, w, h).data.slice(0);
        queuePreview();
      }

      canvas.addEventListener('pointerdown', function (event) {
        if (showingOriginal) return;
        var point = pointerPosition(event);
        var mode = hitEllipse(point.x, point.y, settings.ellipse, w, h);
        if (!mode) return;
        drag = {
          mode: mode,
          x: point.x,
          y: point.y,
          ellipse: {
            cx: settings.ellipse.cx,
            cy: settings.ellipse.cy,
            rx: settings.ellipse.rx,
            ry: settings.ellipse.ry
          }
        };
        canvas.setPointerCapture(event.pointerId);
      });

      canvas.addEventListener('pointermove', function (event) {
        if (!drag) return;
        var point = pointerPosition(event);
        var dx = point.x - drag.x;
        var dy = point.y - drag.y;
        var next = {
          cx: drag.ellipse.cx,
          cy: drag.ellipse.cy,
          rx: drag.ellipse.rx,
          ry: drag.ellipse.ry
        };
        if (drag.mode === 'move') {
          next.cx = drag.ellipse.cx + dx;
          next.cy = drag.ellipse.cy + dy;
        } else if (drag.mode === 'resize-e' || drag.mode === 'resize-w') {
          next.rx = Math.abs(drag.ellipse.rx + (drag.mode === 'resize-e' ? dx : -dx));
        } else if (drag.mode === 'resize-n' || drag.mode === 'resize-s') {
          next.ry = Math.abs(drag.ellipse.ry + (drag.mode === 'resize-s' ? dy : -dy));
        }
        settings.ellipse = normalizeEllipse(next, w, h);
        queuePreview();
      });

      function endDrag() { drag = null; }
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);

      function setCompare(on) {
        showingOriginal = !!on;
        queuePreview();
      }
      compare.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        setCompare(true);
      });
      compare.addEventListener('pointerup', function () { setCompare(false); });
      compare.addEventListener('pointerleave', function () { setCompare(false); });
      compare.addEventListener('pointercancel', function () { setCompare(false); });

      reset.addEventListener('click', function () {
        settings = normalizeSettings({
          blur: 0,
          softEdge: 12,
          brightness: 0,
          contrast: 0,
          warmth: 0,
          ellipse: defaultEllipse(w, h)
        }, w, h);
        blurSlider.input.value = String(settings.blur);
        softSlider.input.value = String(settings.softEdge);
        brightSlider.input.value = String(settings.brightness);
        contrastSlider.input.value = String(settings.contrast);
        warmthSlider.input.value = String(settings.warmth);
        showingOriginal = false;
        queuePreview();
      });

      cancel.addEventListener('click', function () {
        close();
      });

      save.addEventListener('click', function () {
        try {
          showingOriginal = false;
          var buffer = renderEditBuffer(sourceBuffer, w, h, settings);
          putBuffer(context, buffer, w, h);
          var result;
          if (encodeCanvas) result = encodeCanvas(canvas);
          else {
            result = canvas.toDataURL('image/jpeg', 0.85);
          }
          close();
          if (typeof done === 'function') done(result);
        } catch (error) {
          close();
          if (typeof fail === 'function') fail(error);
        }
      });

      captureSource();
      blurSlider.input.focus();
    };
    image.onerror = function () {
      if (typeof fail === 'function') fail(new Error('image load failed'));
    };
    image.src = dataUrl;
  }

  return {
    DEFAULTS: DEFAULTS,
    defaultEllipse: defaultEllipse,
    normalizeEllipse: normalizeEllipse,
    normalizeSettings: normalizeSettings,
    ellipseWeight: ellipseWeight,
    applyColorFilters: applyColorFilters,
    boxBlurRgba: boxBlurRgba,
    compositeEllipseBlur: compositeEllipseBlur,
    renderEditBuffer: renderEditBuffer,
    editImage: editImage
  };
});
