(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.ProfileGithubFeatured = factory(root);
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var WIDTH = 1200;
  var HEIGHT = 627;
  var BACKGROUND = '#0d1117';
  var AVATAR_CENTER_X = WIDTH / 2;
  var AVATAR_CENTER_Y = 205;
  var AVATAR_RADIUS = 122;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function imagePlacement(image, crop) {
    if (!image || !(image.naturalWidth || image.width) || !(image.naturalHeight || image.height)) return null;
    var imageWidth = image.naturalWidth || image.width;
    var imageHeight = image.naturalHeight || image.height;
    var side = AVATAR_RADIUS * 2;
    var zoom = clamp(Number(crop && crop.zoom) || 1, 1, 3);
    var scale = Math.max(side / imageWidth, side / imageHeight) * zoom;
    var width = imageWidth * scale;
    var height = imageHeight * scale;
    var maxOffsetX = Math.max(0, (width - side) / 2);
    var maxOffsetY = Math.max(0, (height - side) / 2);
    var x = clamp(Number(crop && crop.x) || 0, -1, 1);
    var y = clamp(Number(crop && crop.y) || 0, -1, 1);
    return {
      x: AVATAR_CENTER_X - width / 2 + x * maxOffsetX,
      y: AVATAR_CENTER_Y - height / 2 + y * maxOffsetY,
      width: width,
      height: height,
      maxOffsetX: maxOffsetX,
      maxOffsetY: maxOffsetY
    };
  }

  function avatarUrl(username) {
    var value = String(username || '').trim().replace(/^@/, '');
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value)) {
      throw new Error('Enter a valid GitHub username.');
    }
    return 'https://github.com/' + encodeURIComponent(value) + '.png?size=512';
  }

  function draw(canvas, image, title, subtitle, crop) {
    if (!canvas || typeof canvas.getContext !== 'function') throw new Error('Canvas is unavailable.');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    var context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas drawing is unavailable.');

    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = '#8b949e';
    context.font = '600 20px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('LINKEDIN FEATURED', WIDTH / 2, 48);

    var centerX = AVATAR_CENTER_X;
    var centerY = AVATAR_CENTER_Y;
    var radius = AVATAR_RADIUS;
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.clip();
    if (image && (image.naturalWidth || image.width) && (image.naturalHeight || image.height)) {
      var placement = imagePlacement(image, crop);
      context.drawImage(image, placement.x, placement.y, placement.width, placement.height);
    } else {
      context.fillStyle = '#161b22';
      context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }
    context.restore();

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.strokeStyle = '#30363d';
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = '#f0f6fc';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '700 64px Arial, sans-serif';
    context.fillText(String(title || '').slice(0, 48), centerX, 405, 1040);
    context.fillStyle = '#8b949e';
    context.font = '400 34px Arial, sans-serif';
    context.fillText(String(subtitle || '').slice(0, 80), centerX, 475, 1040);
  }

  function initialize() {
    if (!root.document) return;
    var canvas = root.document.getElementById('featured-canvas');
    var fileInput = root.document.getElementById('featured-image');
    var usernameInput = root.document.getElementById('featured-username');
    var fetchButton = root.document.getElementById('featured-avatar-btn');
    var titleInput = root.document.getElementById('featured-title');
    var subtitleInput = root.document.getElementById('featured-subtitle');
    var downloadButton = root.document.getElementById('featured-download');
    var status = root.document.getElementById('featured-status');
    var zoomInput = root.document.getElementById('featured-crop-zoom');
    var horizontalInput = root.document.getElementById('featured-crop-x');
    var verticalInput = root.document.getElementById('featured-crop-y');
    var resetCropButton = root.document.getElementById('featured-crop-reset');
    if (!canvas || !fileInput || !usernameInput || !fetchButton || !titleInput || !subtitleInput || !downloadButton || !status) return;

    var selectedImage = null;
    var crop = { zoom: 1, x: 0, y: 0 };
    var drag = null;
    function isEnglish() { return root.document.documentElement.lang === 'en'; }
    function setStatus(messageHe, messageEn, isError) {
      status.textContent = isEnglish() ? messageEn : messageHe;
      status.classList.toggle('is-error', !!isError);
    }
    function refresh() {
      try {
        draw(canvas, selectedImage, titleInput.value, subtitleInput.value, crop);
        setStatus('התצוגה מוכנה להורדה.', 'Preview is ready to download.', false);
      } catch (error) {
        setStatus('לא ניתן ליצור את התצוגה בדפדפן הזה.', 'Could not create the preview in this browser.', true);
      }
    }
    function updateCropControls() {
      if (zoomInput) {
        zoomInput.value = String(crop.zoom);
        zoomInput.disabled = !selectedImage;
      }
      if (horizontalInput) {
        horizontalInput.value = String(crop.x);
        horizontalInput.disabled = !selectedImage;
      }
      if (verticalInput) {
        verticalInput.value = String(crop.y);
        verticalInput.disabled = !selectedImage;
      }
      if (resetCropButton) resetCropButton.disabled = !selectedImage;
    }
    function canvasPoint(event) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: (event.clientX - rect.left) * WIDTH / rect.width,
        y: (event.clientY - rect.top) * HEIGHT / rect.height
      };
    }
    function beginCrop(event) {
      if (!selectedImage) return;
      var point = canvasPoint(event);
      if (!point) return;
      var dx = point.x - AVATAR_CENTER_X;
      var dy = point.y - AVATAR_CENTER_Y;
      if (dx * dx + dy * dy > AVATAR_RADIUS * AVATAR_RADIUS) return;
      drag = { pointerId: event.pointerId, x: point.x, y: point.y };
      if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
    function moveCrop(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var point = canvasPoint(event);
      if (!point) return;
      var placement = imagePlacement(selectedImage, crop);
      if (placement.maxOffsetX) crop.x = clamp(crop.x + (point.x - drag.x) / placement.maxOffsetX, -1, 1);
      if (placement.maxOffsetY) crop.y = clamp(crop.y + (point.y - drag.y) / placement.maxOffsetY, -1, 1);
      drag.x = point.x;
      drag.y = point.y;
      updateCropControls();
      refresh();
    }
    function endCrop(event) {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      if (typeof canvas.releasePointerCapture === 'function' &&
          typeof canvas.hasPointerCapture === 'function' && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      drag = null;
    }
    function loadImage(source, crossOrigin) {
      return new Promise(function (resolve, reject) {
        var image = new root.Image();
        if (crossOrigin) image.crossOrigin = 'anonymous';
        image.onload = function () { resolve(image); };
        image.onerror = function () { reject(new Error('Could not load the image.')); };
        image.src = source;
      });
    }

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        setStatus('בחרי קובץ PNG, JPEG או WebP.', 'Choose a PNG, JPEG, or WebP image.', true);
        fileInput.value = '';
        return;
      }
      var reader = new root.FileReader();
      reader.onload = function () {
        loadImage(reader.result, false).then(function (image) {
          selectedImage = image;
          crop = { zoom: 1, x: 0, y: 0 };
          updateCropControls();
          refresh();
        }).catch(function () {
          setStatus('לא ניתן לפתוח את קובץ התמונה.', 'Could not open that image file.', true);
        }).then(function () { fileInput.value = ''; });
      };
      reader.onerror = function () {
        setStatus('לא ניתן לקרוא את קובץ התמונה.', 'Could not read that image file.', true);
        fileInput.value = '';
      };
      reader.readAsDataURL(file);
    });

    fetchButton.addEventListener('click', function () {
      var url;
      try {
        url = avatarUrl(usernameInput.value);
      } catch (error) {
        setStatus('הזיני שם משתמש תקין ב-GitHub.', 'Enter a valid GitHub username.', true);
        usernameInput.focus();
        return;
      }
      fetchButton.disabled = true;
      setStatus('טוען את תמונת GitHub...', 'Loading the GitHub avatar...', false);
      loadImage(url, true).then(function (image) {
        selectedImage = image;
        crop = { zoom: 1, x: 0, y: 0 };
        updateCropControls();
        refresh();
      }).catch(function () {
        setStatus('לא ניתן לטעון את האווטאר. בדקי את שם המשתמש ואת החיבור לאינטרנט.', 'Could not load the avatar. Check the username and internet connection.', true);
      }).then(function () { fetchButton.disabled = false; });
    });

    titleInput.addEventListener('input', refresh);
    subtitleInput.addEventListener('input', refresh);
    if (zoomInput) zoomInput.addEventListener('input', function () {
      crop.zoom = clamp(Number(zoomInput.value) || 1, 1, 3);
      updateCropControls();
      refresh();
    });
    if (horizontalInput) horizontalInput.addEventListener('input', function () {
      crop.x = clamp(Number(horizontalInput.value) || 0, -1, 1);
      refresh();
    });
    if (verticalInput) verticalInput.addEventListener('input', function () {
      crop.y = clamp(Number(verticalInput.value) || 0, -1, 1);
      refresh();
    });
    if (resetCropButton) resetCropButton.addEventListener('click', function () {
      crop = { zoom: 1, x: 0, y: 0 };
      updateCropControls();
      refresh();
    });
    canvas.addEventListener('pointerdown', beginCrop);
    canvas.addEventListener('pointermove', moveCrop);
    canvas.addEventListener('pointerup', endCrop);
    canvas.addEventListener('pointercancel', endCrop);
    downloadButton.addEventListener('click', function () {
      try {
        var link = root.document.createElement('a');
        link.download = 'linkedin-featured-1200x627.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        setStatus('התמונה הורדה למחשב.', 'Image downloaded to your computer.', false);
      } catch (error) {
        setStatus('ההורדה נכשלה. נסי לטעון מחדש את התמונה.', 'Download failed. Try loading the image again.', true);
      }
    });

    updateCropControls();
    refresh();
  }

  if (root.document) initialize();
  return {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    BACKGROUND: BACKGROUND,
    avatarUrl: avatarUrl,
    imagePlacement: imagePlacement,
    draw: draw
  };
});
