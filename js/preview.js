(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfilePreview = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var HEADLINE_MAX = 220;
  var ABOUT_MAX = 2600;
  var ABOUT_COLLAPSE_LINES = 3;

  var SAMPLE_ANSWERS = {
    FULL_NAME: 'אדם לדוגמה',
    HEADLINE: 'מפתח/ת תוכנה | בניית מוצרים אמינים',
    SUMMARY: 'מפתח/ת סקרן/ית שאוהב/ת להפוך רעיונות למוצרים ברורים, שימושיים ויציבים.',
    ABOUT: 'אני אוהב/ת לחבר בין חשיבה מערכתית, עבודה בצוות ולמידה מתמשכת.\n\nבדוגמה הזו אפשר לראות איך כותרת, אודות, ניסיון וכישורים נראים יחד בפרופיל.\n\nהטקסט נועד להמחיש את התצוגה המקדימה בלבד ואינו מייצג אדם אמיתי.',
    EXPERIENCE: 'Project coordinator | Example organization | 2022-2025',
    EDUCATION_DEGREE: 'Bachelor of Arts',
    EDUCATION_INSTITUTION: 'Example University',
    EDUCATION_DATES: '2020-2023',
    SKILLS: 'Communication, project planning, data analysis',
    PROJECTS: 'Community resource guide | Coordinated research and publication',
    TARGET_JOB_TITLE: 'Project coordinator'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function hasAnswers(answers) {
    return Object.keys(answers || {}).some(function (key) {
      if (/^(DRAFT_KEYS|CONFIRMED_KEYS|LINKEDIN_.*IMAGE|CV_PROFILE_IMAGE)$/.test(key)) return false;
      return answers[key] !== null && answers[key] !== undefined && String(answers[key]).trim() !== '';
    });
  }

  function emptyDocument(language) {
    var dir = language === 'he' ? 'rtl' : 'ltr';
    var message = language === 'he'
      ? 'עדיין אין מספיק תשובות להצגת קורות החיים. מלא/י כמה שדות וחזור/י לתצוגה המקדימה.'
      : 'There are not enough answers to show a CV yet. Fill in a few fields and return to the preview.';
    return '<!doctype html><html lang="' + language + '" dir="' + dir + '"><head><meta charset="utf-8"><style>body{font-family:system-ui,Segoe UI,sans-serif;padding:3rem;background:#f7f8f6;color:#263238}main{max-width:600px;margin:auto;padding:2rem;background:#fff;border:1px solid #d8dfdc;border-radius:12px}</style></head><body><main>' + message + '</main></body></html>';
  }

  function cvDocument(cv, facts, answers, language, showPhoto) {
    if (!hasAnswers(answers)) return emptyDocument(language);
    return cv.renderHtml(facts, { lang: language, answers: answers, showPhoto: showPhoto !== false });
  }

  function safeImageUrl(value) {
    var image = String(value || '').trim();
    if (/^data:image\//i.test(image)) return image;
    return '';
  }

  function addText(parent, tag, className, text) {
    var element = parent.ownerDocument.createElement(tag);
    if (className) element.className = className;
    element.textContent = text == null ? '' : String(text);
    parent.appendChild(element);
    return element;
  }

  function clear(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function splitExperienceEntries(value) {
    return String(value || '')
      .split(/\n+/)
      .map(function (line) { return line.replace(/^\s*[-•]\s*/, '').trim(); })
      .filter(Boolean);
  }

  function splitSkills(value) {
    return String(value || '')
      .split(/\n+|,|;/)
      .map(function (item) { return item.replace(/^\s*[-•]\s*/, '').trim(); })
      .filter(Boolean);
  }

  function counterClass(length, limit) {
    return length >= limit ? 'linkedin-preview-counter warning' : 'linkedin-preview-counter';
  }

  function renderCopyHeading(parent, title, value, onCopy, limit) {
    var doc = parent.ownerDocument;
    var heading = doc.createElement('div');
    heading.className = 'linkedin-preview-heading';
    addText(heading, 'h3', '', title);
    if (limit) {
      var counter = addText(heading, 'span', counterClass((value || '').length, limit), String((value || '').length) + '/' + limit);
      counter.setAttribute('data-counter-limit', String(limit));
    }
    var copy = doc.createElement('button');
    copy.type = 'button';
    copy.className = 'button';
    copy.textContent = 'העתק';
    copy.addEventListener('click', function () {
      if (typeof onCopy === 'function') onCopy(String(value || ''));
    });
    heading.appendChild(copy);
    parent.appendChild(heading);
    return heading;
  }

  function renderTextBlock(parent, title, value, onCopy, limit, options) {
    var opts = options || {};
    var doc = parent.ownerDocument;
    var block = doc.createElement('section');
    block.className = 'linkedin-preview-block';
    renderCopyHeading(block, title, value, onCopy, limit);
    var text = addText(block, 'p', 'linkedin-preview-text' + (opts.about ? ' linkedin-preview-about' : ''), value || '');
    if (opts.about && value) {
      text.classList.add('is-collapsed');
      text.style.maxHeight = (ABOUT_COLLAPSE_LINES * 1.55) + 'em';
      var more = addText(block, 'button', 'linkedin-preview-more', opts.moreLabel || 'ראה עוד');
      more.type = 'button';
      more.addEventListener('click', function () {
        var open = text.classList.toggle('is-expanded');
        text.classList.toggle('is-collapsed', !open);
        if (open) text.style.maxHeight = '';
        else text.style.maxHeight = (ABOUT_COLLAPSE_LINES * 1.55) + 'em';
        more.textContent = open ? (opts.lessLabel || 'הצג פחות') : (opts.moreLabel || 'ראה עוד');
      });
    }
    parent.appendChild(block);
    return block;
  }

  function renderExperienceBlock(parent, title, value, onCopy) {
    var doc = parent.ownerDocument;
    var block = doc.createElement('section');
    block.className = 'linkedin-preview-block';
    renderCopyHeading(block, title, value, onCopy);
    var list = doc.createElement('div');
    list.className = 'linkedin-preview-experience-list';
    var entries = splitExperienceEntries(value);
    if (!entries.length) {
      addText(list, 'p', 'linkedin-preview-text', '');
    } else {
      entries.forEach(function (entry) {
        var item = doc.createElement('article');
        item.className = 'linkedin-preview-experience-item';
        addText(item, 'p', 'linkedin-preview-text', entry);
        list.appendChild(item);
      });
    }
    block.appendChild(list);
    parent.appendChild(block);
    return block;
  }

  function renderSkillsBlock(parent, title, value, onCopy) {
    var doc = parent.ownerDocument;
    var block = doc.createElement('section');
    block.className = 'linkedin-preview-block';
    renderCopyHeading(block, title, value, onCopy);
    var list = doc.createElement('ul');
    list.className = 'linkedin-preview-skills';
    var skills = splitSkills(value);
    if (!skills.length) {
      addText(block, 'p', 'linkedin-preview-text', '');
    } else {
      skills.forEach(function (skill) {
        var item = doc.createElement('li');
        item.className = 'linkedin-preview-skill';
        item.textContent = skill;
        list.appendChild(item);
      });
      block.appendChild(list);
    }
    parent.appendChild(block);
    return block;
  }

  function emptyLinkedInMessage(language) {
    return language === 'he'
      ? 'עדיין אין מספיק תשובות להצגת פרופיל LinkedIn. מלא/י כמה שדות או טען/י דוגמה.'
      : 'There are not enough answers to show a LinkedIn profile yet. Fill in a few fields or load the sample.';
  }

  function hasLinkedInContent(linkedIn, answers) {
    if (hasAnswers(answers)) return true;
    if (!linkedIn) return false;
    return Boolean(
      (linkedIn.headline && String(linkedIn.headline).trim()) ||
      (linkedIn.about && String(linkedIn.about).trim()) ||
      (linkedIn.experience && String(linkedIn.experience).trim()) ||
      (linkedIn.projects && String(linkedIn.projects).trim()) ||
      (linkedIn.skills && String(linkedIn.skills).trim())
    );
  }

  function renderLinkedIn(container, linkedIn, facts, answers, language, onCopy) {
    clear(container);
    var doc = container.ownerDocument;
    var lang = language === 'he' ? 'he' : 'en';
    var data = answers || {};
    var payload = linkedIn || {};

    if (!hasLinkedInContent(payload, data)) {
      var empty = doc.createElement('div');
      empty.className = 'linkedin-preview-empty';
      empty.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
      empty.textContent = emptyLinkedInMessage(lang);
      container.appendChild(empty);
      return empty;
    }

    var card = doc.createElement('article');
    card.className = 'linkedin-preview-card';
    card.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    card.setAttribute('lang', lang);

    var banner = doc.createElement('div');
    banner.className = 'linkedin-preview-banner';
    var bannerImage = safeImageUrl(data.LINKEDIN_BANNER_IMAGE);
    if (bannerImage) banner.style.backgroundImage = 'url("' + bannerImage.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    card.appendChild(banner);

    var avatar = doc.createElement('div');
    avatar.className = 'linkedin-preview-avatar';
    var image = safeImageUrl(data.LINKEDIN_PROFILE_IMAGE);
    if (image) {
      var img = doc.createElement('img');
      img.src = image;
      img.alt = '';
      avatar.appendChild(img);
    } else {
      avatar.textContent = '◌';
    }
    card.appendChild(avatar);

    addText(card, 'h2', 'linkedin-preview-name', data.FULL_NAME || (lang === 'he' ? 'פרופיל לדוגמה' : 'Sample profile'));
    addText(card, 'p', 'linkedin-preview-label', 'תצוגה מקדימה בקירוב');

    var labels = lang === 'he'
      ? { headline: 'כותרת', about: 'אודות', experience: 'ניסיון', projects: 'פרויקטים', skills: 'כישורים', more: 'ראה עוד', less: 'הצג פחות' }
      : { headline: 'Headline', about: 'About', experience: 'Experience', projects: 'Projects', skills: 'Skills', more: 'see more', less: 'show less' };

    renderTextBlock(card, labels.headline, payload.headline || '', onCopy, HEADLINE_MAX);
    renderTextBlock(card, labels.about, payload.about || '', onCopy, ABOUT_MAX, {
      about: true,
      moreLabel: labels.more,
      lessLabel: labels.less
    });
    renderExperienceBlock(card, labels.experience, payload.experience || '', onCopy);
    renderExperienceBlock(card, labels.projects, payload.projects || '', onCopy);
    renderSkillsBlock(card, labels.skills, payload.skills || '', onCopy);

    container.appendChild(card);
    return card;
  }

  return {
    SAMPLE_ANSWERS: SAMPLE_ANSWERS,
    HEADLINE_MAX: HEADLINE_MAX,
    ABOUT_MAX: ABOUT_MAX,
    clone: clone,
    hasAnswers: hasAnswers,
    emptyDocument: emptyDocument,
    emptyLinkedInMessage: emptyLinkedInMessage,
    cvDocument: cvDocument,
    safeImageUrl: safeImageUrl,
    splitExperienceEntries: splitExperienceEntries,
    splitSkills: splitSkills,
    renderLinkedIn: renderLinkedIn
  };
});
