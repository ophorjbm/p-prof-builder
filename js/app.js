(function () {
  'use strict';

  var builtInQuestions = window.PROFILE_QUESTIONS || [];
  var questions = builtInQuestions;
  var PRIORITY_KEYS = questions.PRIORITY_KEYS || [];
  var PRIORITY_HINTS = questions.PRIORITY_HINTS || {};
  var templates = window.PROFILE_TEMPLATES || {};
  var engine = window.ProfileEngine;
  var imageFields = window.ProfileImageFields;
  var photoCheck = window.ProfilePhotoCheck;
  var photoChecklist = window.ProfilePhotoChecklist;
  var answerStore = window.ProfileAnswerStore;
  var grouping = window.ProfileGrouping;
  var saveStateModule = window.ProfileSaveState;
  var topicModel = window.ProfileTopics;
  var generate = window.ProfileGenerate;
  var preview = window.ProfilePreview;
  var materialsModule = window.ProfileMaterials;

  var STORAGE_KEY = 'profile-builder.answers.v1';
  var LANG_KEY = 'profile-builder.lang.v1';
  var MATERIALS_KEY = 'profile-builder.materials.v1';
  var IMPORTED_QUESTIONS_KEY = 'profile-builder.imported-questions.v1';

  var I18N = {
    he: {
      title: 'בונה פרופיל',
      subtitle: 'ענה על השאלות וקבל טקסט מוכן ל-LinkedIn ולקורות חיים.',
      formHeading: 'השאלות',
      questionSourceLabel: 'מקור השאלות',
      builtinQuestions: 'השאלות המובנות',
      importedQuestions: 'השאלות שיובאו',
      importedQuestionsUnavailable: 'עדיין לא יובאו שאלות.',
      importedQuestionsCount: '{count} שאלות מיובאות',
      materialsHeading: 'החומרים שלי',
      materialsIntro: 'הקבצים והטקסט נשמרים בדפדפן הזה בלבד. קישורים אינם נפתחים.',
      addFileMaterial: 'הוספת ייצוא LinkedIn או PDF',
      pasteMaterialLabel: 'הדבקת קורות חיים, הערות או קישורים כטקסט',
      materialTextPlaceholder: 'הדבק/י כאן טקסט. קישורים יישמרו כטקסט בלבד.',
      addTextMaterial: 'הוספת טקסט',
      importQuestionsAnswers: 'יבוא שאלות ותשובות (קובץ JSON)',
      materialsListHeading: 'חומרים שנוספו',
      noMaterials: 'עדיין לא נוספו חומרים.',
      materialSelect: 'בחירה',
      materialApply: 'החלת תשובות',
      materialRemove: 'הסרת חומר',
      materialRemoveConfirm: 'להסיר את החומר מהרשימה בדפדפן? תשובות ושאלות שכבר נוספו לפרופיל יישארו.',
      materialRemoved: 'החומר הוסר מהרשימה. תשובות שכבר נוספו נשארו בפרופיל.',
      materialTypeLinkedin: 'ייצוא LinkedIn',
      materialTypePdf: 'PDF',
      materialTypeText: 'טקסט',
      materialTypeJson: 'שאלות ותשובות JSON',
      materialReceived: 'התקבל',
      materialMapped: 'מולא לשדות',
      materialWaitingAi: 'ממתין לבדיקה שלך',
      materialFieldsCount: '{count} שדות מולאו',
      materialAnswerKeys: 'שדות: {keys}',
      materialRevision: 'גרסה {count}',
      materialChangeSummary: '+{added} חדש · ~{changed} עודכן · {missing} חסר (נשמר)',
      materialUnchanged: 'לא זוהו שינויים; הגרסה הקיימת נשמרה.',
      materialConflict: 'המידע המעודכן נשמר כהצעה. שדות קיימים לא הוחלפו.',
      materialApplyChanges: 'החלת עדכונים',
      materialConfirmUpdate: 'להחליף {count} שדות מעודכנים בתשובות מהגרסה החדשה? שדות ריקים לא יימחקו.',
      materialUpdatesApplied: '{count} שדות עודכנו.',
      materialPendingUpdates: '{count} עדכונים לבדיקה',
      materialReview: 'השוואת גרסאות',
      materialReviewHeading: 'הבדלי גרסאות',
      materialReviewAdded: 'נוסף',
      materialReviewChanged: 'עודכן',
      materialReviewMissing: 'לא הופיע הפעם — הערך הקודם נשמר',
      materialReviewEmpty: 'לא נמצאו הבדלים בשדות שמופו.',
      close: 'סגירה',
      materialUnmappedCount: '{count} שורות לא מופו',
      materialStored: 'החומר נשמר בדפדפן.',
      materialStorageError: 'לא ניתן לשמור את החומר בדפדפן. ייתכן שהאחסון מלא.',
      materialFileError: 'לא ניתן לקרוא או לנתח את הקובץ.',
      materialTextRequired: 'יש להדביק טקסט לפני ההוספה.',
      materialSelected: 'נבחר חומר מהרשימה.',
      materialApplied: '{count} תשובות מוזגו; ערכים קיימים לא שונו.',
      materialLocalPdf: 'הטקסט חולץ מקומית. בדקו אותו והעתיקו ידנית את המידע הרלוונטי לשדות.',
      materialNoPdfTool: 'הקובץ נשמר בדפדפן, אך אין בגרסה הזו כלי לחילוץ טקסט מ-PDF.',
      materialZipError: 'לא ניתן לקרוא את קובץ ה-ZIP בדפדפן הזה.',
      questionImportSuccess: 'השאלות והתשובות נשמרו בדפדפן.',
      questionImportError: 'לא ניתן לייבא את קובץ השאלות.',
      importedSection: 'שאלות מיובאות',
      outputHeading: 'התוצאה',
      progress: 'התקדמות',
      export: 'הורד גיבוי לקובץ (לא חובה)',
      import: 'טען מגיבוי',
      reset: 'איפוס',
      copy: 'העתקה',
      downloadCvEn: 'הורד קורות חיים אנגלית',
      downloadCvHe: 'הורד קורות חיים עברית',
      copied: 'הועתק',
      copyFailed: 'ההעתקה נכשלה',
      emptyOptionalWarning: 'שדות רשות ריקים: ',
      missingHeading: 'שדות חסרים',
      missingEmpty: 'כל השדות מלאים.',
      footer: 'התשובות והחומרים נשמרים מקומית בדפדפן. אין צורך בחשבון או בשירות AI.',
      resetConfirm: 'לאפס את כל התשובות? הפעולה אינה ניתנת לביטול.',
      importError: 'לא ניתן לקרוא את קובץ התשובות.',
      saved: 'נשמר בדפדפן',
      selectPlaceholder: 'בחר...',
      tabLinkedinEn: 'LinkedIn אנגלית',
      tabLinkedinHe: 'LinkedIn עברית',
      tabCvEn: 'קורות חיים אנגלית',
      tabCvHe: 'קורות חיים עברית',
      tabInterview: 'תרגול ראיון',
       tabSkills: 'Skills והוכחות',
       tabCvPreview: 'תצוגה מקדימה לקורות חיים',
       tabLinkedinPreview: 'תצוגה מקדימה LinkedIn',
       featuredHeading: 'תמונת Featured ל-LinkedIn',
       featuredIntro: 'צרי תמונת Featured ל-LinkedIn בגודל 1200×627. אפשר להעלות תמונה או לטעון אווטאר ציבורי מ-GitHub.',
       featuredCropHint: 'גררי את התמונה בתוך העיגול וכווני את החיתוך בעזרת הפקדים.',
       featuredCropZoom: 'הגדלה',
       featuredCropHorizontal: 'מיקום אופקי',
       featuredCropVertical: 'מיקום אנכי',
       featuredCropReset: 'איפוס חיתוך',
       featuredUpload: 'העלאת תמונה',
       featuredUsername: 'שם משתמש ב-GitHub',
       featuredFetch: 'טען אווטאר',
       featuredTitle: 'כותרת',
       featuredSubtitle: 'טקסט משנה',
       featuredDownload: 'הורדת התמונה',
       featuredHint: 'התמונה נוצרת ונשמרת במחשב שלך בלבד.',
       linkedinImagesHeading: 'תמונות LinkedIn',
      targetFilterLabel: 'סינון לפי יעד',
      targetAll: 'הכל',
      targetLinkedin: 'LinkedIn',
      targetCv: 'קורות חיים',
      targetInterview: 'ראיון',
      interviewIntro: 'ענה/י על שאלות ה-STAR או התאמן/י בתיבה ריקה. התשובות נשמרות מקומית.',
      practicePlaceholder: 'כתוב/י כאן את התשובה...',
      topicNeeds: 'דורש תשובה שלך', topicDraft: 'טיוטה לבדיקה', topicConfirmed: 'מאושר',
      topicProgress: '{done} מתוך {total} נענו',
      topicPersonal: 'פרטים אישיים',
      topicSummary: 'תקציר מקצועי',
      topicExperience: 'ניסיון תעסוקתי',
      topicEducation: 'השכלה',
      topicSkills: 'כישורים',
      topicProjects: 'פרויקטים',
      topicAdditional: 'מידע נוסף',
      topicInterview: 'תרגול ראיון'
    },
    en: {
      title: 'Profile Builder',
      subtitle: 'Answer the questions and get ready-to-use LinkedIn and CV text.',
      formHeading: 'Questions',
      questionSourceLabel: 'Question source',
      builtinQuestions: 'Built-in questions',
      importedQuestions: 'Imported questions',
      importedQuestionsUnavailable: 'No questions have been imported yet.',
      importedQuestionsCount: '{count} imported questions',
      materialsHeading: 'My materials',
      materialsIntro: 'Files and text stay in this browser. Links are never opened.',
      addFileMaterial: 'Add LinkedIn export or PDF',
      pasteMaterialLabel: 'Paste a CV, notes, or links as text',
      materialTextPlaceholder: 'Paste text here. Links are stored as text only.',
      addTextMaterial: 'Add text',
      importQuestionsAnswers: 'Import questions and answers (JSON file)',
      materialsListHeading: 'Added materials',
      noMaterials: 'No materials have been added.',
      materialSelect: 'Select',
      materialApply: 'Apply answers',
      materialRemove: 'Remove material',
      materialRemoveConfirm: 'Remove this material from the browser list? Answers and questions already added to the profile will remain.',
      materialRemoved: 'The material was removed from the list. Answers already added remain in the profile.',
      materialTypeLinkedin: 'LinkedIn export',
      materialTypePdf: 'PDF',
      materialTypeText: 'Text',
      materialTypeJson: 'Questions and answers JSON',
      materialReceived: 'Received',
      materialMapped: 'Fields filled',
      materialWaitingAi: 'Ready for your review',
      materialFieldsCount: '{count} fields filled',
      materialAnswerKeys: 'Fields: {keys}',
      materialRevision: 'Version {count}',
      materialChangeSummary: '+{added} new · ~{changed} changed · {missing} absent (kept)',
      materialUnchanged: 'No changes found; the existing version was kept.',
      materialConflict: 'The update was saved as a proposal. Existing answers were not replaced.',
      materialApplyChanges: 'Apply updates',
      materialConfirmUpdate: 'Replace {count} changed fields with values from the new version? Empty values will not delete anything.',
      materialUpdatesApplied: '{count} fields updated.',
      materialPendingUpdates: '{count} updates to review',
      materialReview: 'Compare versions',
      materialReviewHeading: 'Version changes',
      materialReviewAdded: 'Added',
      materialReviewChanged: 'Changed',
      materialReviewMissing: 'Not present this time — previous value kept',
      materialReviewEmpty: 'No differences in mapped fields were found.',
      close: 'Close',
      materialUnmappedCount: '{count} unmapped rows',
      materialStored: 'Material saved in this browser.',
      materialStorageError: 'Could not save this material in the browser. Storage may be full.',
      materialFileError: 'Could not read or parse the file.',
      materialTextRequired: 'Paste text before adding it.',
      materialSelected: 'Material selected from the list.',
      materialApplied: '{count} answers merged; existing values were kept.',
      materialLocalPdf: 'Text was extracted locally. Review it and copy relevant details into the fields yourself.',
      materialNoPdfTool: 'The file was saved in this browser, but this version cannot extract text from PDFs.',
      materialZipError: 'This browser could not read the ZIP file.',
      questionImportSuccess: 'Questions and answers were saved in this browser.',
      questionImportError: 'Could not import the questions file.',
      importedSection: 'Imported questions',
      outputHeading: 'Result',
      progress: 'Progress',
      export: 'Download backup file (optional)',
      import: 'Load from backup',
      reset: 'Reset',
      copy: 'Copy',
      downloadCvEn: 'Download CV (English)',
      downloadCvHe: 'Download CV (Hebrew)',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      emptyOptionalWarning: 'Empty optional fields: ',
      missingHeading: 'Missing fields',
      missingEmpty: 'All fields are filled.',
      footer: 'Answers and materials are saved locally in your browser. No account or AI service is required.',
      resetConfirm: 'Reset all answers? This cannot be undone.',
      importError: 'Could not read the answers file.',
      saved: 'Saved in browser',
      selectPlaceholder: 'Select...',
      tabLinkedinEn: 'LinkedIn English',
      tabLinkedinHe: 'LinkedIn Hebrew',
      tabCvEn: 'CV English',
      tabCvHe: 'CV Hebrew',
      tabInterview: 'Interview practice',
       tabSkills: 'Skills proof',
       tabCvPreview: 'CV preview',
       tabLinkedinPreview: 'LinkedIn preview',
       featuredHeading: 'LinkedIn Featured image',
       featuredIntro: 'Create a 1200×627 LinkedIn Featured image. Upload a picture or optionally load a public GitHub avatar.',
       featuredCropHint: 'Drag the photo inside the circle and adjust the crop with the controls.',
       featuredCropZoom: 'Zoom',
       featuredCropHorizontal: 'Horizontal position',
       featuredCropVertical: 'Vertical position',
       featuredCropReset: 'Reset crop',
       featuredUpload: 'Upload an image',
       featuredUsername: 'GitHub username',
       featuredFetch: 'Load avatar',
       featuredTitle: 'Title',
       featuredSubtitle: 'Subtitle',
       featuredDownload: 'Download image',
       featuredHint: 'The image is generated locally and downloaded to your computer.',
       linkedinImagesHeading: 'LinkedIn images',
      targetFilterLabel: 'Filter by target',
      targetAll: 'All',
      targetLinkedin: 'LinkedIn',
      targetCv: 'CV',
      targetInterview: 'Interview',
      interviewIntro: 'Answer the STAR questions or practice in an empty box. Answers are saved locally.',
      practicePlaceholder: 'Write your answer here...',
      topicNeeds: 'Needs your answer', topicDraft: 'Draft to review', topicConfirmed: 'Confirmed',
      topicProgress: '{done} of {total} answered',
      topicPersonal: 'Personal details',
      topicSummary: 'Professional summary',
      topicExperience: 'Work experience',
      topicEducation: 'Education',
      topicSkills: 'Skills',
      topicProjects: 'Projects',
      topicAdditional: 'Additional information',
      topicInterview: 'Interview practice'
    }
  };

  var SECTIONS = {
    personal: { he: 'פרטים אישיים', en: 'Personal details' },
    summary: { he: 'תקציר מקצועי', en: 'Professional summary' },
    experience: { he: 'ניסיון תעסוקתי', en: 'Work experience' },
    education: { he: 'השכלה', en: 'Education' },
    skills: { he: 'כישורים', en: 'Skills' },
    projects: { he: 'פרויקטים', en: 'Projects' },
    additional: { he: 'מידע נוסף', en: 'Additional information' },
    interview: { he: 'תרגול ראיון', en: 'Interview practice' }
  };

  var TARGETS = [
    { id: 'all', label: 'targetAll' },
    { id: 'linkedin', label: 'targetLinkedin' },
    { id: 'cv', label: 'targetCv' },
    { id: 'interview', label: 'targetInterview' }
  ];

  var PROGRESS_TARGETS = ['linkedin', 'cv', 'interview'];

  var STAR_IDS = ['star_project', 'star_challenge', 'star_teamwork', 'star_learning', 'star_results'];

  var TABS = [
    { id: 'linkedin_en', template: 'linkedin_en', dir: 'ltr', label: 'tabLinkedinEn' },
    { id: 'linkedin_he', template: 'linkedin_he', dir: 'rtl', label: 'tabLinkedinHe' },
    { id: 'cv_en', template: 'cv_en', dir: 'ltr', label: 'tabCvEn' },
    { id: 'cv_he', template: 'cv_he', dir: 'rtl', label: 'tabCvHe' },
    { id: 'interview', type: 'interview', label: 'tabInterview' },
     { id: 'cv_preview', type: 'cv-preview', label: 'tabCvPreview' },
     { id: 'linkedin_preview', type: 'linkedin-preview', label: 'tabLinkedinPreview' }
  ];

  var questionByKey = {};
  var questionById = {};
  var importedQuestions = [];
  var activeQuestionSource = 'builtin';
  var materials = [];
  var selectedMaterialId = null;

  function rebuildQuestionIndexes() {
    questionByKey = {};
    questionById = {};
    var allQuestions = builtInQuestions.concat(importedQuestions);
    for (var qi = 0; qi < allQuestions.length; qi += 1) {
      questionByKey[allQuestions[qi].key] = allQuestions[qi];
      questionById[allQuestions[qi].id] = allQuestions[qi];
    }
    questions.forEach(function (question) {
      questionByKey[question.key] = question;
      questionById[question.id] = question;
    });
  }
  rebuildQuestionIndexes();

  var answers = loadAnswers();
  var saveState = saveStateModule.createSaveState(answers);
  var lang = loadLang();
  var activeTab = TABS[0].id;
  var activeTarget = 'all';

  var form = document.getElementById('questions-form');
  var progressText = document.getElementById('progress-text');
  var progressTrack = document.getElementById('progress-track');
  var progressBar = document.getElementById('progress-bar');
  var targetFilterEl = document.getElementById('target-filter');
  var targetProgressEl = document.getElementById('target-progress');
  var tabsEl = document.getElementById('tabs');
  var interviewPracticeEl = document.getElementById('interview-practice');
  var outputEl = document.getElementById('output');
  var emptyOptionalWarning = document.createElement('p');
  emptyOptionalWarning.className = 'empty-optional-warning';
  emptyOptionalWarning.setAttribute('role', 'status');
  emptyOptionalWarning.hidden = true;
  outputEl.parentNode.insertBefore(emptyOptionalWarning, outputEl);
  var missingBox = document.getElementById('missing-box');
  var missingList = document.getElementById('missing-list');
  var missingEmpty = document.getElementById('missing-empty');
  var saveStatus = document.getElementById('save-status');
  var saveButton = document.getElementById('save-btn');
  var remainingQuestions = document.getElementById('remaining-questions');
  var copyStatus = document.getElementById('copy-status');
  var importFile = document.getElementById('import-file');
  var materialFileInput = document.getElementById('material-file');
  var materialTextInput = document.getElementById('material-text');
  var addTextMaterialButton = document.getElementById('add-text-material');
  var materialsListEl = document.getElementById('materials-list');
  var materialsMessageEl = document.getElementById('materials-message');
  var questionsJsonInput = document.getElementById('questions-json-file');
  var questionSourceStatusEl = document.getElementById('question-source-status');
  var linkedinImageFieldsEl = document.getElementById('linkedin-image-fields');
  var priorityProgressEl = null;
  var previewAnswers = null;
  var previewLanguage = 'he';
  var previewShowPhoto = true;
  var previewRefreshTimer = null;
  var previewActions = document.getElementById('preview-actions');
  var cvPreviewFrame = document.getElementById('cv-preview-frame');
  var linkedinPreview = document.getElementById('linkedin-preview');
  var previewClear = document.getElementById('preview-clear');
  var previewPhotoToggle = document.getElementById('preview-show-photo');

  var autosaveTimer = null;
  var statusFadeTimer = null;
  var copyTimer = null;

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.he[key] || key;
  }

  function topicProgressLabel(done, total) {
    return t('topicProgress').replace('{done}', String(done)).replace('{total}', String(total));
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* storage can be unavailable on file:// in some browsers */
    }
  }

  function loadAnswers() {
    return answerStore ? answerStore.load(window.localStorage, STORAGE_KEY) : {};
  }

  function loadLang() {
    return safeGet(LANG_KEY) === 'en' ? 'en' : 'he';
  }

  function saveAnswers(options) {
    saveState.startSave();
    var saved = answerStore && answerStore.save(window.localStorage, STORAGE_KEY, answers);
    if (!saved) { saveState.markError('לא ניתן לשמור בדפדפן: האחסון מלא.'); showSaveState(); return Promise.resolve(false); }
    var current = JSON.parse(JSON.stringify(answers));
    saveState.clearError();
    saveState.markLocalOnly(current, JSON.parse(JSON.stringify(answers)));
    showSaveState();
    return Promise.resolve(true);
  }

  function profileFacts(sourceAnswers) {
    var data = sourceAnswers || answers;
    var facts = [];
    var categories = {
      FULL_NAME: ['contact', 'contact'],
      CITY: ['contact', 'contact'],
      EMAIL: ['contact', 'contact'],
      PHONE: ['contact', 'contact'],
      LINKEDIN_URL: ['contact', 'contact'],
      GITHUB_URL: ['contact', 'contact'],
      PORTFOLIO_URL: ['contact', 'contact'],
      TARGET_JOB_TITLE: ['summary', 'summary'],
      HEADLINE: ['summary', 'summary'],
      SUMMARY: ['summary', 'summary'],
      ABOUT: ['summary', 'summary'],
      EXPERIENCE: ['experience', 'experience'],
      EDUCATION_DEGREE: ['education', 'education'],
      EDUCATION_INSTITUTION: ['education', 'education'],
      EDUCATION_DATES: ['education', 'education'],
      EDUCATION_HONORS: ['education', 'education'],
      SKILLS: ['skill', 'skills'],
      PROJECTS: ['project', 'projects'],
      CERTIFICATIONS: ['certification', 'certifications'],
      ACHIEVEMENTS: ['achievement', 'projects'],
      VOLUNTEERING: ['volunteering', 'volunteering'],
      LANGUAGES: ['language', 'languages'],
      STAR_PROJECT: ['experience', 'interview'],
      STAR_CHALLENGE: ['experience', 'interview'],
      STAR_TEAMWORK: ['experience', 'interview'],
      STAR_LEARNING: ['experience', 'interview'],
      STAR_RESULTS: ['experience', 'interview']
    };

    function addFact(question, value, category, section, index, fields) {
      var text = String(value).trim();
      if (!text) return;
      var key = question.key;
      facts.push({
        id: 'F-' + key.replace(/_/g, '-') + '-' + index,
        questionKey: key,
        category: category,
        section: section,
        text: { he: text, en: text },
        question: { he: question.label_he, en: question.label_en },
        tags: question.used_for.slice(),
        status: 'confirmed',
        sensitivity: 'public',
        fields: fields || {}
      });
    }

    builtInQuestions.forEach(function (question) {
      var value = data[question.key];
      if (typeof value !== 'string' || !value.trim() || !categories[question.key]) return;
      var category = categories[question.key][0];
      var section = categories[question.key][1];
      var lines = value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);

      if (question.key === 'EXPERIENCE') {
        lines.forEach(function (line, index) {
          var parts = line.split('|').map(function (part) { return part.trim(); });
          var fields = {};
          if (parts.length >= 3) {
            fields = {
              title: parts[0],
              organization: parts[1],
              dates: parts[2],
              bullets: parts.slice(3).filter(Boolean)
            };
          }
          addFact(question, line, category, section, index + 1, fields);
        });
        return;
      }

      if (question.key === 'SKILLS') {
        value.split(/\r?\n|,|;/).map(function (item) { return item.trim(); }).filter(Boolean)
          .forEach(function (skill, index) { addFact(question, skill, category, section, index + 1); });
        return;
      }

      if (['PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'VOLUNTEERING', 'LANGUAGES'].indexOf(question.key) !== -1) {
        lines.forEach(function (line, index) {
          var fields = {};
          if (question.key === 'LANGUAGES') {
            var separator = line.indexOf(':');
            if (separator > 0) {
              fields.name = line.slice(0, separator).trim();
              line = line.slice(separator + 1).trim();
            }
          }
          addFact(question, line, category, section, index + 1, fields);
        });
        return;
      }

      var fields = {};
      if (question.key === 'GITHUB_URL') fields.kind = 'github';
      else if (question.key === 'LINKEDIN_URL') fields.kind = 'linkedin';
      else if (question.key === 'PORTFOLIO_URL') fields.kind = 'portfolio';
      addFact(question, value, category, section, 1, fields);
    });

    return facts;
  }

  /* Fill a template for a tab: Hebrew uses *_HE answers; the English LinkedIn headline uses HEADLINE when set. */
  function fillForTab(tab, template) {
    var lang = tab.dir === 'rtl' ? 'he' : 'en';
    var localizedAnswers = engine.localizeAnswers(answers, lang);
    if (!localizedAnswers.EXPERIENCE && localizedAnswers.EMPLOYER_TITLE && localizedAnswers.EMPLOYER_ORGANIZATION) {
      var endDate = localizedAnswers.EMPLOYER_CURRENT === true || String(localizedAnswers.EMPLOYER_CURRENT).toLowerCase() === 'true'
        ? (lang === 'he' ? 'היום' : 'Present')
        : localizedAnswers.EMPLOYER_END_DATE;
      var dates = [localizedAnswers.EMPLOYER_START_DATE, endDate].filter(Boolean).join(' - ');
      var bullets = [localizedAnswers.EMPLOYER_BULLET_1, localizedAnswers.EMPLOYER_BULLET_2].filter(Boolean);
      var title = localizedAnswers.EMPLOYER_TITLE +
        (localizedAnswers.EMPLOYER_EMPLOYMENT_TYPE ? ' (' + localizedAnswers.EMPLOYER_EMPLOYMENT_TYPE + ')' : '');
      localizedAnswers.EXPERIENCE = [
        title,
        localizedAnswers.EMPLOYER_ORGANIZATION,
        dates,
        bullets.join('; ')
      ].filter(Boolean).join(' | ');
    }
    var text = engine.fillTemplate(template, localizedAnswers);
    var headline = typeof answers.HEADLINE === 'string' ? answers.HEADLINE.trim() : '';
    if (tab.template === 'linkedin_en' && headline) text = text.replace(/(## Headline\n)[^\n]*/, function (m, h) { return h + headline; });
    var target = tab.template && tab.template.indexOf('linkedin') === 0 ? 'linkedin' : 'cv';
    text += importedProjectText(target, true, lang);
    return text;
  }

  function answerHasContent(value) {
    return value === true || (value != null && String(value).trim() !== '');
  }

  function importedProjectGroups(target) {
    var groups = [];
    importedQuestions.forEach(function (question) {
      if (!question.used_for || question.used_for.indexOf(target) === -1) return;
      var value = answers[question.key];
      if (!answerHasContent(value)) return;
      var section = question.section || t('importedSection');
      var group = groups.filter(function (item) { return item.section === section; })[0];
      if (!group) {
        group = { section: section, items: [] };
        groups.push(group);
      }
      group.items.push({ question: question, value: value });
    });
    return groups;
  }

  function importedProjectText(target, markdown, outputLang) {
    var language = outputLang === 'he' ? 'he' : 'en';
    var groups = importedProjectGroups(target);
    if (!groups.length) return '';
    var lines = [];
    groups.forEach(function (group) {
      lines.push('', markdown ? '## ' + group.section : group.section);
      group.items.forEach(function (item) {
        var value = item.value === true ? (language === 'he' ? 'כן' : 'Yes') : String(item.value);
        var label = item.question['label_' + language] || item.question.label_en || item.question.key;
        lines.push((markdown ? '- ' : '') + label + ': ' + value);
      });
    });
    return lines.join('\n');
  }

  function importedProjectHtml(target, outputLang) {
    var language = outputLang === 'he' ? 'he' : 'en';
    var groups = importedProjectGroups(target);
    if (!groups.length) return '';
    var html = '<section class="imported-project-data"><h2>' + escapeHtml(language === 'he' ? 'מידע נוסף על פרויקטים' : 'Additional project information') + '</h2>';
    groups.forEach(function (group) {
      html += '<h3>' + escapeHtml(group.section) + '</h3><ul>';
      group.items.forEach(function (item) {
        var value = item.value === true ? (language === 'he' ? 'כן' : 'Yes') : String(item.value);
        var label = item.question['label_' + language] || item.question.label_en || item.question.key;
        html += '<li><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(value) + '</li>';
      });
      html += '</ul>';
    });
    return html + '</section>';
  }

  function generatedOutputFor(tab) {
    if (!generate || !tab || !tab.template) return null;
    var facts = profileFacts(answers);
    if (!facts.length) return null;
    var outputLang = tab.dir === 'rtl' ? 'he' : 'en';
    if (outputLang === 'he' || tab.template === 'linkedin_en') return null;
    if (tab.template === 'cv_en' || tab.template === 'cv_he') {
      return generate.generateCV(facts, { lang: outputLang, answers: answers });
    }
    if (tab.template === 'linkedin_en' || tab.template === 'linkedin_he') {
      return generate.generateLinkedIn(facts, { lang: outputLang, answers: answers }).text;
    }
    return null;
  }

  function showSaveStatus(message) {
    saveState.markError(message); showSaveState();
  }

  function showSaveState() {
    var status = saveState.status();
    saveStatus.textContent = status === saveStateModule.LOCAL_ONLY ? t('saved') : status;
    saveStatus.classList.toggle('save-error', Boolean(saveState.state.error));
    if (statusFadeTimer) window.clearTimeout(statusFadeTimer);
    if (saveState.state.fadeable) statusFadeTimer = window.setTimeout(function () { saveStatus.textContent = ''; }, 3500);
  }

  function showCopyStatus(message) {
    copyStatus.textContent = message;
    if (copyTimer) window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () {
      copyStatus.textContent = '';
    }, 2000);
  }

  function showMaterialsMessage(message, isError) {
    materialsMessageEl.textContent = message || '';
    materialsMessageEl.classList.toggle('is-error', Boolean(isError));
  }

  function loadLocalCollections() {
    try {
      importedQuestions = materialsModule.readStored(window.localStorage, IMPORTED_QUESTIONS_KEY, []);
      materials = materialsModule.readStored(window.localStorage, MATERIALS_KEY, []);
      if (!Array.isArray(importedQuestions) || !Array.isArray(materials)) throw new Error('Stored data must be arrays.');
    } catch (error) {
      importedQuestions = [];
      materials = [];
      showMaterialsMessage(t('materialFileError') + ' ' + error.message, true);
    }
    rebuildQuestionIndexes();
  }

  function saveLocalCollection(key, value) {
    try {
      materialsModule.writeStored(window.localStorage, key, value);
      return true;
    } catch (error) {
      showMaterialsMessage(t('materialStorageError'), true);
      return false;
    }
  }

  function materialTypeLabel(type) {
    return t(type === 'pdf' ? 'materialTypePdf'
      : type === 'text' ? 'materialTypeText'
        : type === 'json' ? 'materialTypeJson' : 'materialTypeLinkedin');
  }

  function materialStatusLabel(material) {
    var status = t(material.status === 'mapped' ? 'materialMapped'
      : material.status === 'waiting' ? 'materialWaitingAi' : 'materialReceived');
    var details = [];
    if (material.answerKeys && material.answerKeys.length) {
      details.push(t('materialFieldsCount').replace('{count}', String(material.answerKeys.length)));
      details.push(t('materialAnswerKeys').replace('{keys}', material.answerKeys.join(', ')));
    }
    if (material.revisions && material.revisions.length) {
      details.push(t('materialRevision').replace('{count}', String(material.revisions.length)));
    }
    if (material.changeSummary) {
      var change = material.changeSummary;
      if (change.addedKeys.length || change.changedKeys.length || change.missingKeys.length) {
        details.push(t('materialChangeSummary')
          .replace('{added}', String(change.addedKeys.length))
          .replace('{changed}', String(change.changedKeys.length))
          .replace('{missing}', String(change.missingKeys.length)));
      }
    }
    if (material.pendingUpdateKeys && material.pendingUpdateKeys.length) {
      details.push(t('materialPendingUpdates').replace('{count}', String(material.pendingUpdateKeys.length)));
    }
    if (material.unmappedRows) {
      details.push(t('materialUnmappedCount').replace('{count}', String(material.unmappedRows)));
    }
    return status + (details.length ? ' · ' + details.join(' · ') : '');
  }

  function renderMaterials() {
    materialsListEl.innerHTML = '';
    if (!materials.length) {
      var empty = document.createElement('li');
      empty.className = 'material-meta';
      empty.textContent = t('noMaterials');
      materialsListEl.appendChild(empty);
      return;
    }
    materials.slice().reverse().forEach(function (material) {
      var item = document.createElement('li');
      item.className = 'material-item' + (material.id === selectedMaterialId ? ' selected' : '');
      var name = document.createElement('p');
      name.className = 'material-name';
      name.textContent = material.name;
      var meta = document.createElement('span');
      meta.className = 'material-meta';
      meta.textContent = materialTypeLabel(material.type) + ' · ' +
        new Date(material.addedAt).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US');
      var status = document.createElement('span');
      status.className = 'material-status';
      status.textContent = materialStatusLabel(material);
      item.appendChild(name);
      item.appendChild(meta);
      item.appendChild(status);

      var actions = document.createElement('div');
      actions.className = 'material-actions';
      var select = document.createElement('button');
      select.type = 'button';
      select.className = 'button';
      select.textContent = t('materialSelect');
      select.addEventListener('click', function () {
        selectedMaterialId = material.id;
        renderMaterials();
        showMaterialsMessage(t('materialSelected'));
      });
      actions.appendChild(select);
      if (material.revisions && material.revisions.length > 1) {
        var review = document.createElement('button');
        review.type = 'button';
        review.className = 'button';
        review.textContent = t('materialReview');
        review.addEventListener('click', function () { reviewMaterial(material); });
        actions.appendChild(review);
      }
      if (material.answerKeys && material.answerKeys.length) {
        var apply = document.createElement('button');
        apply.type = 'button';
        apply.className = 'button';
        apply.textContent = t('materialApply');
        apply.addEventListener('click', function () {
          var result = mergeMaterialAnswers(material.answers || {}, material.id);
          if (result.conflicts.length) showMaterialsMessage(t('materialConflict'));
          else showMaterialsMessage(t('materialApplied').replace('{count}', String(result.keys.length)));
        });
        actions.appendChild(apply);
      }
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button danger';
      remove.textContent = t('materialRemove');
      remove.addEventListener('click', function () {
        if (!window.confirm(t('materialRemoveConfirm'))) return;
        var next = materials.filter(function (item) { return item.id !== material.id; });
        if (!saveLocalCollection(MATERIALS_KEY, next)) return;
        materials = next;
        if (selectedMaterialId === material.id) selectedMaterialId = null;
        renderMaterials();
        showMaterialsMessage(t('materialRemoved'));
      });
      actions.appendChild(remove);
      var changedKeys = material.pendingUpdateKeys || [];
      if (changedKeys.length) {
        var update = document.createElement('button');
        update.type = 'button';
        update.className = 'button';
        update.textContent = t('materialApplyChanges');
        update.addEventListener('click', function () {
          var count = changedKeys.filter(function (key) {
            var value = material.answers[key];
            return value !== undefined && value !== null && value !== '' && value !== false &&
              JSON.stringify(answers[key]) !== JSON.stringify(value);
          }).length;
          if (!count) return;
          var confirmation = t('materialConfirmUpdate').replace('{count}', String(count));
          if (!window.confirm(confirmation)) return;
          var updates = {};
          changedKeys.forEach(function (key) {
            var value = material.answers[key];
            if (value !== undefined && value !== null && value !== '' && value !== false &&
              JSON.stringify(answers[key]) !== JSON.stringify(value)) updates[key] = value;
          });
          answers = Object.assign({}, answers, updates);
          saveAnswers({ immediate: true }).then(function (saved) {
            if (!saved) return;
            clearMaterialPendingUpdates(material.id);
            renderForm();
            updateProgress();
            renderOutput();
            showMaterialsMessage(t('materialUpdatesApplied').replace('{count}', String(Object.keys(updates).length)));
          });
        });
        actions.appendChild(update);
      }
      item.appendChild(actions);
      materialsListEl.appendChild(item);
    });
  }

  function mergeMaterialAnswers(source, materialId) {
    var merged = materialsModule.mergeIntoEmpty(answers, source);
    answers = merged.answers;
    if (merged.keys.length) {
      saveAnswers({ immediate: true });
      renderForm();
      updateProgress();
      renderOutput();
    }
    if (materialId) recordMaterialConflicts(materialId, merged.conflicts, source);
    return merged;
  }

  function recordMaterialConflicts(materialId, conflicts, source) {
    var next = materials.map(function (material) {
      if (material.id !== materialId) return material;
      var incoming = source || {};
      var resolved = Object.keys(incoming).filter(function (key) {
        var value = incoming[key];
        return value !== undefined && value !== null && value !== '' && value !== false &&
          JSON.stringify(answers[key]) === JSON.stringify(value);
      });
      var pending = (material.pendingUpdateKeys || []).filter(function (key) {
        return resolved.indexOf(key) === -1;
      }).concat(conflicts);
      return Object.assign({}, material, {
        pendingUpdateKeys: pending.filter(function (key, index, list) { return list.indexOf(key) === index; })
      });
    });
    if (saveLocalCollection(MATERIALS_KEY, next)) {
      materials = next;
      renderMaterials();
    }
  }

  function clearMaterialPendingUpdates(materialId) {
    var next = materials.map(function (material) {
      if (material.id !== materialId) return material;
      return Object.assign({}, material, { pendingUpdateKeys: [] });
    });
    if (saveLocalCollection(MATERIALS_KEY, next)) {
      materials = next;
      renderMaterials();
    }
  }

  function reviewMaterial(material) {
    var revisions = material.revisions || [];
    var previous = revisions[revisions.length - 2];
    var change = material.changeSummary || { addedKeys: [], changedKeys: [], missingKeys: [] };
    var lines = [];
    change.addedKeys.forEach(function (key) {
      lines.push(t('materialReviewAdded') + ' · ' + key + ': ' + material.answers[key]);
    });
    change.changedKeys.forEach(function (key) {
      lines.push(t('materialReviewChanged') + ' · ' + key);
      lines.push('  ' + String(previous && previous.answers[key] != null ? previous.answers[key] : ''));
      lines.push('→ ' + String(material.answers[key] == null ? '' : material.answers[key]));
    });
    change.missingKeys.forEach(function (key) {
      lines.push(t('materialReviewMissing') + ' · ' + key + ': ' + String(material.answers[key] == null ? '' : material.answers[key]));
    });
    var content = lines.length ? lines.join('\n') : t('materialReviewEmpty');
    var dialog = document.getElementById('material-review-dialog');
    document.getElementById('material-review-content').textContent = content;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.alert(content);
  }

  function persistMaterial(material) {
    var result = materialsModule.upsertMaterial(materials, material);
    if (result.duplicate) {
      selectedMaterialId = result.material.id;
      renderMaterials();
      return result;
    }
    if (!saveLocalCollection(MATERIALS_KEY, result.materials)) return null;
    materials = result.materials;
    selectedMaterialId = result.material.id;
    renderMaterials();
    return result;
  }

  function encodeBase64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
    }
    return window.btoa(binary);
  }

  function createMaterial(file, type, content, status, result) {
    return {
      id: 'material-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: file.name,
      type: type,
      addedAt: new Date().toISOString(),
      status: status,
      answerKeys: result && result.answers ? Object.keys(result.answers).filter(function (key) {
        var value = result.answers[key];
        return value !== undefined && value !== null && value !== '' && value !== false;
      }) : [],
      answers: result && result.answers ? result.answers : {},
      mappedRows: result && result.mappedRows || 0,
      unmappedRows: result && result.unmappedRows || 0,
      content: content
    };
  }

  async function extractPdfText(bytes) {
    var pdf = window.pdfjsLib;
    if (!pdf || typeof pdf.getDocument !== 'function') return null;
    var document = await pdf.getDocument({ data: bytes }).promise;
    var pages = [];
    for (var pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      var page = await document.getPage(pageNumber);
      var content = await page.getTextContent();
      pages.push(content.items.map(function (item) { return item.str; }).join(' '));
    }
    return pages.join('\n');
  }

  async function addMaterialFile(file) {
    var type = /\.pdf$/i.test(file.name) || file.type === 'application/pdf' ? 'pdf' : 'linkedin';
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var encoded = encodeBase64(bytes);
      if (type === 'pdf') {
        var extractedText = await extractPdfText(bytes);
        var pdfMaterial = createMaterial(file, type, encoded, 'waiting', null);
        if (extractedText) {
          pdfMaterial.extractedText = extractedText;
          showMaterialsMessage(t('materialLocalPdf'));
        } else showMaterialsMessage(t('materialNoPdfTool'));
        var savedPdf = persistMaterial(pdfMaterial);
        if (savedPdf) {
          showMaterialsMessage(savedPdf.duplicate
            ? t('materialUnchanged')
            : extractedText ? t('materialLocalPdf') : t('materialNoPdfTool'));
        }
        return;
      }
      var entries = await materialsModule.extractZipEntries(bytes);
      var mapped = materialsModule.mapLinkedInFiles(entries);
      var material = createMaterial(file, type, encoded, mapped.mappedRows ? 'mapped' : 'received', mapped);
      var saved = persistMaterial(material);
      if (!saved) return;
      if (saved.duplicate) {
        showMaterialsMessage(t('materialUnchanged'));
        return;
      }
      var mergeResult = mergeMaterialAnswers(mapped.answers, saved.material.id);
      showMaterialsMessage(mergeResult.conflicts.length ? t('materialConflict') : t('materialStored'));
    } catch (error) {
      showMaterialsMessage(t(type === 'linkedin' ? 'materialZipError' : 'materialFileError') + ' ' + error.message, true);
    }
  }

  function addTextMaterial() {
    var text = materialTextInput.value.trim();
    if (!text) {
      showMaterialsMessage(t('materialTextRequired'), true);
      return;
    }
    var material = createMaterial(
      { name: lang === 'he' ? 'טקסט שהודבק' : 'Pasted text' },
      'text',
      text,
      'waiting',
      null
    );
    var saved = persistMaterial(material);
    if (saved && !saved.duplicate) {
      materialTextInput.value = '';
      showMaterialsMessage(t('materialStored'));
    } else if (saved && saved.duplicate) showMaterialsMessage(t('materialUnchanged'));
  }

  function renderQuestionSourceControl() {
    var builtInButton = document.getElementById('builtin-questions-btn');
    var importedButton = document.getElementById('imported-questions-btn');
    builtInButton.classList.toggle('active', activeQuestionSource === 'builtin');
    importedButton.classList.toggle('active', activeQuestionSource === 'imported');
    builtInButton.setAttribute('aria-pressed', String(activeQuestionSource === 'builtin'));
    importedButton.setAttribute('aria-pressed', String(activeQuestionSource === 'imported'));
    importedButton.disabled = importedQuestions.length === 0;
    questionSourceStatusEl.textContent = importedQuestions.length
      ? t('importedQuestionsCount').replace('{count}', String(importedQuestions.length))
      : t('importedQuestionsUnavailable');
  }

  function setQuestionSource(source) {
    if (source === 'imported' && !importedQuestions.length) return;
    activeQuestionSource = source;
    questions = source === 'imported' ? importedQuestions : builtInQuestions;
    rebuildQuestionIndexes();
    renderQuestionSourceControl();
    renderForm();
    updateProgress();
    renderOutput();
  }

  function importQuestionsAndAnswers(file) {
    file.text().then(function (text) {
      var parsed = materialsModule.validateQuestionImport(JSON.parse(text), builtInQuestions.map(function (question) {
        return question.key;
      }).concat(importedQuestions.map(function (question) { return question.key; })));
      var mergedQuestions = importedQuestions.slice();
      parsed.questions.forEach(function (question) {
        var index = mergedQuestions.findIndex(function (existing) { return existing.key === question.key; });
        if (index < 0) mergedQuestions.push(question);
        else mergedQuestions[index] = question;
      });
      var material = createMaterial(
        file,
        'json',
        text,
        Object.keys(parsed.answers).length ? 'mapped' : 'received',
        { answers: parsed.answers }
      );
      if (!saveLocalCollection(IMPORTED_QUESTIONS_KEY, mergedQuestions)) return;
      var saved = persistMaterial(material);
      if (!saved) {
        saveLocalCollection(IMPORTED_QUESTIONS_KEY, importedQuestions);
        return;
      }
      importedQuestions = mergedQuestions;
      rebuildQuestionIndexes();
      var mergeResult = mergeMaterialAnswers(parsed.answers, saved.material.id);
      setQuestionSource('imported');
      renderQuestionSourceControl();
      showMaterialsMessage(mergeResult.conflicts.length ? t('materialConflict') : t('questionImportSuccess'));
    }).catch(function (error) {
      var detail = error && error.message ? ' ' + error.message : '';
      showMaterialsMessage(t('questionImportError') + detail, true);
    }).finally(function () {
      questionsJsonInput.value = '';
    });
  }

  function sectionLabel(section) {
    var entry = SECTIONS[section];
    return entry ? entry[lang] || entry.en || section : section;
  }

  function questionLabel(question) {
    return question['label_' + lang] || question.label_en || question.key;
  }

  function questionHint(question) {
    if (lang === 'he' && PRIORITY_HINTS[question.key]) return PRIORITY_HINTS[question.key];
    return question.hint || '';
  }

  function priorityQuestionHint(question) {
    return PRIORITY_HINTS[question.key] || questionHint(question);
  }

  function isPriorityKey(key) {
    return PRIORITY_KEYS.indexOf(key) !== -1;
  }

  function isAnswered(question) {
    var value = answers[question.key];
    return question.type === 'checkbox' ? value === true : value != null && String(value).trim() !== '';
  }

  function makeControl(question) {
    var control;
    if (question.type === 'textarea') {
      control = document.createElement('textarea');
      control.rows = 3;
    } else if (question.type === 'checkbox') {
      control = document.createElement('input');
      control.type = 'checkbox';
    } else if (question.type === 'select' && Array.isArray(question.options) && question.options.length) {
      control = document.createElement('select');
      var blank = document.createElement('option');
      blank.value = '';
      blank.textContent = t('selectPlaceholder');
      control.appendChild(blank);
      for (var i = 0; i < question.options.length; i += 1) {
        var option = question.options[i];
        var optionEl = document.createElement('option');
        if (typeof option === 'string') {
          optionEl.value = option;
          optionEl.textContent = option;
        } else {
          optionEl.value = option.value == null ? '' : option.value;
          optionEl.textContent = option['label_' + lang] || option.label_en || optionEl.value;
        }
        control.appendChild(optionEl);
      }
    } else {
      control = document.createElement('input');
      control.type = 'text';
    }
    control.id = 'q-' + question.id;
    control.name = question.key;
    control.setAttribute('data-focus-key', question.key);
    if (question.required) control.required = true;
    return control;
  }

  function markerStateFor(question) {
    var drafts = grouping.parseKeys(answers, grouping.DRAFT_KEYS);
    var confirmed = grouping.parseKeys(answers, grouping.CONFIRMED_KEYS);
    if (!isAnswered(question)) return 'needs-answer';
    if (drafts.indexOf(question.key) !== -1 && confirmed.indexOf(question.key) === -1) return 'draft';
    return 'confirmed';
  }

  function setMarker(marker, question) {
    var markerState = markerStateFor(question);
    marker.className = 'answer-marker ' + markerState;
    marker.textContent = markerState === 'needs-answer' ? '•' : markerState === 'draft' ? '~' : '✓';
    marker.setAttribute('aria-label', t(markerState === 'needs-answer' ? 'topicNeeds' : markerState === 'draft' ? 'topicDraft' : 'topicConfirmed'));
  }

  function updateRenderedMarkers() {
    var markers = form.querySelectorAll('[data-marker-key]');
    for (var i = 0; i < markers.length; i += 1) {
      var question = questionByKey[markers[i].getAttribute('data-marker-key')];
      if (question) setMarker(markers[i], question);
    }
    var sections = form.querySelectorAll('.topic-section');
    for (var s = 0; s < sections.length; s += 1) {
      var topicId = sections[s].getAttribute('data-topic');
      var topicQuestions = questions.filter(function (question) {
        var matchesSection = activeQuestionSource === 'imported'
          ? question.section === topicId
          : topicModel.topicFor(question) === topicId;
        return matchesSection && engine.filterByTarget([question], activeTarget).length;
      });
      var count = sections[s].querySelector('.topic-count');
      if (count) {
        var result = engine.progress(topicQuestions, answers);
        count.textContent = topicProgressLabel(result.done, result.total);
      }
    }
  }

  function renderField(question) {
    var wrapper = document.createElement('div');
    wrapper.className = 'field' + (question.type === 'checkbox' ? ' field-checkbox' : '');

    var marker = document.createElement('span');
    marker.setAttribute('data-marker-key', question.key);
    setMarker(marker, question);
    wrapper.appendChild(marker);

    var label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = 'q-' + question.id;
    label.textContent = questionLabel(question) + (question.required ? ' *' : '');

    var control = makeControl(question);
    var value = answers[question.key];

    if (question.type === 'checkbox') {
      control.checked = value === true;
      control.addEventListener('change', function () {
        answers[question.key] = control.checked;
        markTyped(question.key);
        afterEdit();
      });
    } else {
      control.value = value == null ? '' : String(value);
      control.addEventListener('input', function () {
        answers[question.key] = control.value;
        markTyped(question.key);
        afterEdit();
      });
      control.addEventListener('change', function () {
        answers[question.key] = control.value;
        markTyped(question.key);
        afterEdit();
      });
    }

    wrapper.appendChild(label);
    wrapper.appendChild(control);

    var hint = questionHint(question);
    if (hint) {
      var hintEl = document.createElement('p');
      hintEl.className = 'hint';
      hintEl.textContent = hint;
      wrapper.appendChild(hintEl);
    }

    if (grouping.parseKeys(answers, grouping.DRAFT_KEYS).indexOf(question.key) !== -1 && grouping.parseKeys(answers, grouping.CONFIRMED_KEYS).indexOf(question.key) === -1) {
      var confirmLabel = document.createElement('label');
      confirmLabel.className = 'draft-confirm';
      var confirm = document.createElement('input');
      confirm.type = 'checkbox';
      confirm.checked = grouping.parseKeys(answers, grouping.CONFIRMED_KEYS).indexOf(question.key) !== -1;
      confirm.addEventListener('change', function () {
        var keys = grouping.parseKeys(answers, grouping.CONFIRMED_KEYS);
        if (confirm.checked && keys.indexOf(question.key) === -1) keys.push(question.key);
        if (!confirm.checked) keys = keys.filter(function (key) { return key !== question.key; });
        answers[grouping.CONFIRMED_KEYS] = keys;
        afterEdit();
        renderForm();
      });
      confirmLabel.appendChild(confirm);
      confirmLabel.appendChild(document.createTextNode(lang === 'he' ? 'אישרתי' : 'Confirmed'));
      wrapper.appendChild(confirmLabel);
    }

    return wrapper;
  }

  function renderPriorityField(question) {
    var field = renderField(question);
    var hint = field.querySelector('.hint');
    if (hint) hint.textContent = priorityQuestionHint(question);
    return field;
  }

  function markTyped(key) {
    var drafts = grouping.parseKeys(answers, grouping.DRAFT_KEYS);
    if (drafts.indexOf(key) !== -1) answers[grouping.DRAFT_KEYS] = drafts.filter(function (item) { return item !== key; });
  }

  function renderImageSection() {
    var section = document.createElement('div');
    section.className = 'image-section';
    [{ key: 'LINKEDIN_BANNER_IMAGE', label: 'תמונת באנר ללינקדאין', w: 1584, h: 396, filename: 'linkedin-banner.jpg' }, { key: 'LINKEDIN_PROFILE_IMAGE', label: 'תמונת פרופיל ללינקדאין', w: 800, h: 800, filename: 'linkedin-profile.jpg' }].forEach(function (item) {
       var opts = { w: item.w, h: item.h, filename: item.filename, label: item.label, removeLabel: 'הסר תמונה', checkLabel: 'בדוק תמונה', checkModule: photoCheck, checkKind: item.key === 'LINKEDIN_PROFILE_IMAGE' ? 'profile' : 'banner', cropKind: item.key === 'LINKEDIN_PROFILE_IMAGE' ? 'profile' : 'banner', getValue: function (key) { return answers[key] || null; }, setValue: function (key, value) { if (value == null || value === '') delete answers[key]; else answers[key] = value; }, onChange: function () { afterEdit(); }, onError: function () { showSaveStatus('לא ניתן לעבד את התמונה.'); } };
       if (item.key === 'LINKEDIN_PROFILE_IMAGE') { opts.exportLabel = 'ייצוא לקורות חיים'; opts.exportWidth = 400; opts.exportHeight = 400; opts.exportFilename = 'cv-profile-photo.jpg'; }
       var field = imageFields.imageField(item.key, opts).element;
       section.appendChild(field);
       if (item.key === 'LINKEDIN_PROFILE_IMAGE') { section.appendChild(renderPhotoChecklist()); section.appendChild(renderPhotoSizeGuide()); }
    });
    return section;
  }

  function renderPhotoChecklist() {
    var details = document.createElement('details');
    details.className = 'photo-checklist';
    var summary = document.createElement('summary');
    summary.textContent = 'צ\'קליסט לתמונת פרופיל';
    details.appendChild(summary);
    var count = document.createElement('p');
    count.className = 'photo-checklist-count';
    count.setAttribute('aria-live', 'polite');
    details.appendChild(count);
    var state = photoChecklist.normalize(answers[photoChecklist.KEY]);
    function updateCount() {
      count.textContent = photoChecklist.completedCount(state) + '/6 הושלמו';
    }
    photoChecklist.ITEMS.forEach(function (text, index) {
      var label = document.createElement('label');
      label.className = 'photo-checklist-item';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state[index];
      checkbox.addEventListener('change', function () {
        state[index] = checkbox.checked;
        answers[photoChecklist.KEY] = photoChecklist.normalize(state);
        afterEdit();
        updateCount();
      });
      label.appendChild(checkbox);
      var itemText = document.createElement('span');
      itemText.textContent = text;
      label.appendChild(itemText);
      details.appendChild(label);
    });
    updateCount();
    return details;
  }

  function renderPhotoSizeGuide() {
    var wrapper = document.createElement('div');
    wrapper.className = 'photo-size-guide';
    var heading = document.createElement('h4');
    heading.textContent = 'גדלים מומלצים לתמונות';
    wrapper.appendChild(heading);
    var table = document.createElement('table');
    var head = document.createElement('tr');
    ['שימוש', 'גודל מומלץ', 'הערה'].forEach(function (text) {
      var cell = document.createElement('th'); cell.textContent = text; head.appendChild(cell);
    });
    var thead = document.createElement('thead'); thead.appendChild(head); table.appendChild(thead);
    var body = document.createElement('tbody');
    [['פרופיל LinkedIn', 'לפחות 400x400, עדיף 800x800', 'הפנים בערך 60% מהמסגרת'], ['באנר LinkedIn', '1584x396', 'צבע אחיד או צבעי המותג'], ['תמונה לקורות חיים', 'בערך 300x300 או 400x400', 'חיתוך הדוק על הפנים והכתפיים']].forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (text) { var cell = document.createElement('td'); cell.textContent = text; tr.appendChild(cell); });
      body.appendChild(tr);
    });
    table.appendChild(body); wrapper.appendChild(table);
    return wrapper;
  }

  function groupState() {
    var images = [{ key: 'LINKEDIN_BANNER_IMAGE', section: 'images', type: 'image' }, { key: 'LINKEDIN_PROFILE_IMAGE', section: 'images', type: 'image' }];
    return grouping.groupQuestions(engine.filterByTarget(questions, activeTarget).concat(images), answers, { templates: templates });
  }

  function updatePriorityProgress() {
    if (!priorityProgressEl) return;
    var done = 0;
    for (var i = 0; i < PRIORITY_KEYS.length; i += 1) {
      var question = questionByKey[PRIORITY_KEYS[i]];
      if (question && isAnswered(question)) done += 1;
    }
    priorityProgressEl.textContent = 'ענית ' + done + ' מתוך ' + PRIORITY_KEYS.length;
  }

  function renderTargetFilter() {
    targetFilterEl.innerHTML = '';
    for (var i = 0; i < TARGETS.length; i += 1) {
      (function (target) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'target-button' + (target.id === activeTarget ? ' active' : '');
        button.textContent = t(target.label);
        button.setAttribute('aria-pressed', target.id === activeTarget ? 'true' : 'false');
        button.addEventListener('click', function () {
          activeTarget = target.id;
          renderTargetFilter();
          renderForm();
          updateProgress();
          renderOutput();
        });
        targetFilterEl.appendChild(button);
      })(TARGETS[i]);
    }
  }

  function renderTargetProgress() {
    targetProgressEl.innerHTML = '';
    for (var i = 0; i < PROGRESS_TARGETS.length; i += 1) {
      var target = PROGRESS_TARGETS[i];
      var targetInfo = TARGETS[i + 1];
      var result = engine.progressByTarget(questions, answers, target);
      var percent = result.total ? Math.round((result.done / result.total) * 100) : 0;

      var row = document.createElement('div');
      row.className = 'target-progress-row';

      var label = document.createElement('span');
      label.textContent = t(targetInfo.label);

      var track = document.createElement('div');
      track.className = 'target-progress-track';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(percent));

      var bar = document.createElement('div');
      bar.className = 'target-progress-bar';
      bar.style.width = percent + '%';
      track.appendChild(bar);

      var count = document.createElement('span');
      count.className = 'target-progress-count';
      count.textContent = result.done + '/' + result.total;

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(count);
      targetProgressEl.appendChild(row);
    }
  }

  function renderForm() {
    var openTopics = {};
    form.querySelectorAll('.topic-section').forEach(function (section) {
      openTopics[section.getAttribute('data-topic')] = section.open;
    });
    form.innerHTML = '';
    var topicSections;
    if (activeQuestionSource === 'imported') {
      var bySection = {};
      engine.filterByTarget(questions, activeTarget).forEach(function (question) {
        bySection[question.section] = bySection[question.section] || [];
        bySection[question.section].push(question);
      });
      topicSections = Object.keys(bySection).map(function (section) {
        var list = bySection[section];
        return {
          topic: { id: section, label: section || t('importedSection') },
          questions: list,
          progress: engine.progress(list, answers)
        };
      });
    } else {
      topicSections = topicModel.sections(questions, activeTarget,
        function (items, target) { return engine.filterByTarget(items, target); },
        function (items, currentAnswers) { return engine.progress(items, currentAnswers); }, answers);
    }
    for (var s = 0; s < topicSections.length; s += 1) {
      var topicSection = topicSections[s];
      var sectionEl = document.createElement('details');
      sectionEl.className = 'form-section topic-section';
      sectionEl.setAttribute('data-topic', topicSection.topic.id);
      sectionEl.open = Object.prototype.hasOwnProperty.call(openTopics, topicSection.topic.id)
        ? openTopics[topicSection.topic.id]
        : s === 0;

      var heading = document.createElement('summary');
      heading.className = 'section-title';
      heading.textContent = t(topicSection.topic.label);
      var count = document.createElement('span');
      count.className = 'topic-count';
      count.textContent = topicProgressLabel(topicSection.progress.done, topicSection.progress.total);
      heading.appendChild(count);
      sectionEl.appendChild(heading);

      for (var q = 0; q < topicSection.questions.length; q += 1) {
        var topicQuestion = topicSection.questions[q];
        sectionEl.appendChild(isPriorityKey(topicQuestion.key) ? renderPriorityField(topicQuestion) : renderField(topicQuestion));
      }
      form.appendChild(sectionEl);
    }
    var images = renderImageSection();
    if (images) linkedinImageFieldsEl.replaceChildren(images);
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    for (var i = 0; i < TABS.length; i += 1) {
      (function (tab) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tab' + (tab.id === activeTab ? ' active' : '');
        button.textContent = t(tab.label);
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', tab.id === activeTab ? 'true' : 'false');
        button.addEventListener('click', function () {
          activeTab = tab.id;
          renderTabs();
          renderOutput();
        });
        tabsEl.appendChild(button);
      })(TABS[i]);
    }
  }

  function updateProgress() {
    var result = engine.progressByTarget(questions, answers, activeTarget);
    var percent = result.total ? Math.round((result.done / result.total) * 100) : 0;
    progressText.textContent = result.done + '/' + result.total;
    progressBar.style.width = percent + '%';
    progressTrack.setAttribute('aria-valuenow', String(percent));
    renderTargetProgress();
    updatePriorityProgress();
    updateRenderedMarkers();
    if (remainingQuestions) remainingQuestions.textContent = (lang === 'he' ? 'נשארו ' : 'Remaining ') + (result.total - result.done) + (lang === 'he' ? ' שאלות לענות' : ' questions');
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function highlightMissing(text) {
    return text.replace(/\[([A-Z0-9_]+)\]/g, function (match, key) {
      return '<mark class="missing">[' + key + ']</mark>';
    });
  }

  function currentTab() {
    for (var i = 0; i < TABS.length; i += 1) {
      if (TABS[i].id === activeTab) return TABS[i];
    }
    return TABS[0];
  }

  function interviewText() {
    var lines = [];
    for (var j = 0; j < STAR_IDS.length; j += 1) {
      var question = questionById[STAR_IDS[j]];
      if (!question) continue;
      lines.push(questionLabel(question));
      var value = answers[question.key];
      lines.push(value && value.trim() ? String(value) : '');
      lines.push('');
    }
    importedQuestions.filter(function (question) {
      return question.used_for && question.used_for.indexOf('interview') !== -1;
    }).forEach(function (question) {
      lines.push(questionLabel(question));
      var value = answers[question.key];
      lines.push(answerHasContent(value) ? String(value) : '');
      lines.push('');
    });
    return lines.join('\n');
  }

  function renderInterview() {
    interviewPracticeEl.innerHTML = '';

    var intro = document.createElement('p');
    intro.className = 'interview-intro';
    intro.textContent = t('interviewIntro');
    interviewPracticeEl.appendChild(intro);

    for (var i = 0; i < STAR_IDS.length; i += 1) {
      var question = questionById[STAR_IDS[i]];
      if (!question) continue;

      var block = document.createElement('div');
      block.className = 'interview-item';

      var title = document.createElement('h4');
      title.className = 'interview-item-title';
      title.textContent = questionLabel(question);
      block.appendChild(title);

      var textarea = document.createElement('textarea');
      textarea.className = 'interview-answer';
      textarea.rows = 3;
      textarea.placeholder = t('practicePlaceholder');
      textarea.value = answers[question.key] == null ? '' : String(answers[question.key]);

      (function (question, textarea) {
        textarea.addEventListener('input', function () {
          answers[question.key] = textarea.value;
          syncFormControl(question);
          saveAnswers();
          updateProgress();
        });
      })(question, textarea);

      block.appendChild(textarea);
      interviewPracticeEl.appendChild(block);
    }
    renderImportedInterviewQuestions();
  }

  function renderImportedInterviewQuestions() {
    importedQuestions.filter(function (question) {
      return question.used_for && question.used_for.indexOf('interview') !== -1;
    }).forEach(function (question) {
      var block = document.createElement('div');
      block.className = 'interview-item';
      var title = document.createElement('h4');
      title.className = 'interview-item-title';
      title.textContent = questionLabel(question);
      block.appendChild(title);

      var control = makeControl(question);
      control.id = 'interview-' + question.id;
      control.classList.add('interview-answer');
      if (question.type === 'checkbox') {
        control.checked = answers[question.key] === true;
        control.addEventListener('change', function () {
          answers[question.key] = control.checked;
          syncFormControl(question);
          saveAnswers();
          updateProgress();
        });
      } else {
        control.value = answers[question.key] == null ? '' : String(answers[question.key]);
        control.addEventListener('input', function () {
          answers[question.key] = control.value;
          syncFormControl(question);
          saveAnswers();
          updateProgress();
        });
      }
      block.appendChild(control);
      interviewPracticeEl.appendChild(block);
    });
  }

  // Keep the form control in step with an answer edited from another view
  // (for example the interview tab), so the two never show stale values.
  function syncFormControl(question) {
    var control = document.getElementById('q-' + question.id);
    if (!control) return;
    var value = answers[question.key];
    if (question.type === 'checkbox') {
      control.checked = value === true;
    } else {
      var text = value == null ? '' : String(value);
      if (control.value !== text) control.value = text;
    }
  }

  function renderOutput() {
    var tab = currentTab();
    if (tab.type === 'cv-preview' || tab.type === 'linkedin-preview') {
      renderPreview(tab.type);
      return;
    }
    previewActions.hidden = true;
    cvPreviewFrame.hidden = true;
    linkedinPreview.hidden = true;
    if (tab.type === 'interview') {
      emptyOptionalWarning.hidden = true;
      outputEl.hidden = true;
      missingBox.hidden = true;
      interviewPracticeEl.hidden = false;
      renderInterview();
      return;
    }

    outputEl.hidden = false;
    interviewPracticeEl.hidden = true;
    var generated = generatedOutputFor(tab);
    var template = generated != null ? generated : (templates[tab.template] || '');
    var emptyOptionalKeys = engine.listEmptyOptionalKeys(engine.localizeAnswers(answers, tab.dir === 'rtl' ? 'he' : 'en'), template);
    emptyOptionalWarning.textContent = emptyOptionalKeys.length
      ? t('emptyOptionalWarning') + emptyOptionalKeys.join(', ')
      : '';
    emptyOptionalWarning.hidden = emptyOptionalKeys.length === 0;
    var filled = fillForTab(tab, template);

    outputEl.setAttribute('dir', tab.dir);
    outputEl.innerHTML = highlightMissing(escapeHtml(filled));

    var missing = engine.listMissing(template, answers);
    missingList.innerHTML = '';

    for (var i = 0; i < missing.length; i += 1) {
      var key = missing[i];
      var question = questionByKey[key];
      var item = document.createElement('li');
      var text = question ? questionLabel(question) : key;
      var labelSpan = document.createElement('span');
      labelSpan.textContent = text;
      var code = document.createElement('code');
      code.textContent = '[' + key + ']';
      item.appendChild(labelSpan);
      item.appendChild(code);
      missingList.appendChild(item);
    }

    missingEmpty.hidden = missing.length > 0;
    missingList.hidden = missing.length === 0;
    missingBox.hidden = false;
  }

  function renderPreview(type) {
    var data = previewAnswers || answers;
    var isCv = type === 'cv-preview';
    var isLinkedIn = type === 'linkedin-preview';
    previewActions.hidden = false;
    outputEl.hidden = true; interviewPracticeEl.hidden = true; missingBox.hidden = true;
    cvPreviewFrame.hidden = !isCv;
    linkedinPreview.hidden = !isLinkedIn;
    previewClear.hidden = !previewAnswers;
    if (previewPhotoToggle && previewPhotoToggle.parentElement) previewPhotoToggle.parentElement.hidden = !isCv;
    var printBtn = document.getElementById('preview-print');
    if (printBtn) printBtn.hidden = !isCv;
    if (isCv) {
      var facts = profileFacts(data);
      var cvDocument = preview && window.ProfileCV && facts.length
        ? preview.cvDocument(window.ProfileCV, facts, data, previewLanguage, previewShowPhoto)
        : (preview ? preview.emptyDocument(previewLanguage) : '');
      var cvProjectHtml = previewAnswers ? '' : importedProjectHtml('cv', previewLanguage);
      if (cvProjectHtml) {
        var mainEnd = cvDocument.lastIndexOf('</main>');
        if (mainEnd >= 0) cvDocument = cvDocument.slice(0, mainEnd) + cvProjectHtml + cvDocument.slice(mainEnd);
      }
      cvPreviewFrame.srcdoc = cvDocument;
      return;
    }
    if (!isLinkedIn || !preview) return;
    var result = { headline: '', about: '', experience: '', projects: '', skills: '' };
    var linkedInFacts = profileFacts(data);
    if (window.ProfileLinkedIn && linkedInFacts.length) {
      result = window.ProfileLinkedIn.generate(linkedInFacts, { lang: previewLanguage, answers: data });
    } else if (preview.hasAnswers(data)) {
      result = {
        headline: data.HEADLINE || data.TARGET_JOB_TITLE || '',
        about: data.ABOUT || data.SUMMARY || '',
        experience: data.EXPERIENCE || '',
        projects: data.PROJECTS || '',
        skills: data.SKILLS || ''
      };
    }
    if (!previewAnswers) {
      var linkedinProjectText = importedProjectText('linkedin', false, previewLanguage);
      if (linkedinProjectText) result.projects = [result.projects, linkedinProjectText].filter(Boolean).join('\n\n');
    }
    preview.renderLinkedIn(linkedinPreview, result, linkedInFacts, data, previewLanguage, function (text) {
      var value = String(text || '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { showCopyStatus(t('copied')); }).catch(function () {
          try { fallbackCopy(value); showCopyStatus(t('copied')); } catch (error) { showCopyStatus(t('copyFailed')); }
        });
        return;
      }
      try { fallbackCopy(value); showCopyStatus(t('copied')); } catch (error) { showCopyStatus(t('copyFailed')); }
    });
  }

  function scaleCvPreview() {
    if (!cvPreviewFrame || cvPreviewFrame.hidden || !cvPreviewFrame.contentDocument) return;
    var page = cvPreviewFrame.contentDocument.querySelector('main');
    if (!page || !cvPreviewFrame.clientWidth) return;
    var scale = Math.min(1, cvPreviewFrame.clientWidth / page.scrollWidth);
    page.style.transformOrigin = 'top center';
    page.style.transform = 'scale(' + scale + ')';
    cvPreviewFrame.style.height = Math.ceil(page.scrollHeight * scale + 24) + 'px';
    cvPreviewFrame.setAttribute('data-scale-to-fit', String(scale));
  }

  function schedulePreviewRefresh() {
    if (previewRefreshTimer) window.clearTimeout(previewRefreshTimer);
    previewRefreshTimer = window.setTimeout(function () {
      previewRefreshTimer = null;
      if (currentTab().type === 'cv-preview' || currentTab().type === 'linkedin-preview') renderOutput();
    }, 180);
  }

  function afterEdit() {
    previewAnswers = null;
    saveState.markChanged(answers);
    showSaveState();
    if (autosaveTimer) window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(function () { saveAnswers({ immediate: false }); }, 900);
    updateProgress();
    if (currentTab().type === 'cv-preview' || currentTab().type === 'linkedin-preview') schedulePreviewRefresh();
    else renderOutput();
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.left = '-1000px';
    document.body.appendChild(area);
    area.select();
    var succeeded = false;
    try {
      succeeded = document.execCommand('copy');
    } finally {
      document.body.removeChild(area);
    }
    if (!succeeded) throw new Error('copy failed');
  }

  function copyCurrentOutput() {
    var tab = currentTab();
    var generated = generatedOutputFor(tab);
    var text = tab.type === 'interview'
      ? interviewText()
      : fillForTab(tab, generated != null ? generated : (templates[tab.template] || ''));
    function done() {
      showCopyStatus(t('copied'));
    }
    function fallback() {
      try {
        fallbackCopy(text);
        done();
      } catch (error) {
        showCopyStatus(t('copyFailed'));
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function downloadCv(tabId) {
    var tab = TABS.filter(function (item) { return item.id === tabId; })[0];
    var language = tabId === 'cv_he' ? 'he' : 'en';
    var html;
    var facts = profileFacts(answers);
    if (window.ProfileCV && facts.length) {
      html = window.ProfileCV.renderHtml(facts, { lang: language, answers: answers, showPhoto: previewShowPhoto });
      var projectHtml = importedProjectHtml('cv', language);
      if (projectHtml) html = html.replace('</body>', projectHtml + '</body>');
    } else {
      var cvText = generatedOutputFor(tab);
      if (cvText == null) cvText = templates[tab.template] || '';
      cvText = fillForTab(tab, cvText);
      html = '<!doctype html><html lang="' + language + '"><body><pre>' + escapeHtml(cvText) + '</pre></body></html>';
    }
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = tabId === 'cv_he' ? 'cv-hebrew.html' : 'cv-english.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportAnswers() {
    var blob = new Blob([JSON.stringify(answers, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'profile-builder-answers.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function importAnswers(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var next = answerStore.parseAnswersPayload(String(reader.result));
        var conflicts = [];
        Object.keys(next).forEach(function (k) {
          var inc = next[k];
          var incEmpty = inc === undefined || inc === null || inc === '' || (Array.isArray(inc) && inc.length === 0);
          if (incEmpty) return;
          var cur = answers[k];
          var curEmpty = cur === undefined || cur === null || cur === '' || (Array.isArray(cur) && cur.length === 0);
          if (curEmpty) answers[k] = inc;
          else if (JSON.stringify(cur) !== JSON.stringify(inc)) conflicts.push(k);
        });
        if (conflicts.length) {
          window.alert('מוזג בלי למחוק כלום. ' + conflicts.length + ' שדות היו שונים בקובץ, נשמר מה שכבר בטופס: ' + conflicts.join(', '));
        }
        saveAnswers({ immediate: true });
        renderForm();
        updateProgress();
        renderOutput();
      } catch (error) {
        window.alert(t('importError'));
      } finally {
        importFile.value = '';
      }
    };
    reader.onerror = function () {
      window.alert(t('importError'));
      importFile.value = '';
    };
    reader.readAsText(file);
  }

  function resetAnswers() {
    if (!window.confirm(t('resetConfirm'))) return;
    answers = {};
    replaceNext = true;
    saveAnswers({ immediate: true });
    renderForm();
    updateProgress();
    renderOutput();
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = lang === 'he' ? 'English' : 'עברית';

    var translatable = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < translatable.length; i += 1) {
      translatable[i].textContent = t(translatable[i].getAttribute('data-i18n'));
    }

    materialTextInput.placeholder = t('materialTextPlaceholder');
    renderMaterials();
    renderQuestionSourceControl();
    renderTargetFilter();
    renderForm();
    renderTabs();
    updateProgress();
    renderOutput();
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    safeSet(LANG_KEY, lang);
    applyLanguage();
  });

  document.getElementById('export-btn').addEventListener('click', exportAnswers);

  document.getElementById('builtin-questions-btn').addEventListener('click', function () {
    setQuestionSource('builtin');
  });
  document.getElementById('imported-questions-btn').addEventListener('click', function () {
    setQuestionSource('imported');
  });
  document.getElementById('close-material-review').addEventListener('click', function () {
    var dialog = document.getElementById('material-review-dialog');
    if (typeof dialog.close === 'function') dialog.close();
  });
  materialFileInput.addEventListener('change', function () {
    if (materialFileInput.files && materialFileInput.files[0]) {
      addMaterialFile(materialFileInput.files[0]).finally(function () { materialFileInput.value = ''; });
    }
  });
  addTextMaterialButton.addEventListener('click', addTextMaterial);
  questionsJsonInput.addEventListener('change', function () {
    if (questionsJsonInput.files && questionsJsonInput.files[0]) importQuestionsAndAnswers(questionsJsonInput.files[0]);
  });

  document.getElementById('import-btn').addEventListener('click', function () {
    importFile.click();
  });

  importFile.addEventListener('change', function () {
    if (importFile.files && importFile.files[0]) importAnswers(importFile.files[0]);
  });

  document.getElementById('reset-btn').addEventListener('click', resetAnswers);

  document.getElementById('copy-btn').addEventListener('click', copyCurrentOutput);
  document.getElementById('download-cv-en').addEventListener('click', function () { downloadCv('cv_en'); });
  document.getElementById('download-cv-he').addEventListener('click', function () { downloadCv('cv_he'); });
  document.getElementById('preview-he').addEventListener('click', function () { previewLanguage = 'he'; renderOutput(); });
  document.getElementById('preview-en').addEventListener('click', function () { previewLanguage = 'en'; renderOutput(); });
  document.getElementById('preview-sample').addEventListener('click', function () { previewAnswers = preview ? preview.clone(preview.SAMPLE_ANSWERS) : {}; renderOutput(); });
  previewClear.addEventListener('click', function () { previewAnswers = null; renderOutput(); });
  previewPhotoToggle.addEventListener('change', function () { previewShowPhoto = previewPhotoToggle.checked; renderOutput(); });
  document.getElementById('preview-print').addEventListener('click', function () { if (cvPreviewFrame && !cvPreviewFrame.hidden && cvPreviewFrame.contentWindow) cvPreviewFrame.contentWindow.print(); });
  cvPreviewFrame.addEventListener('load', scaleCvPreview);
  window.addEventListener('resize', scaleCvPreview);

  saveButton.addEventListener('click', function () { saveAnswers({ immediate: true }); });
  remainingQuestions.addEventListener('click', function () {
    var first = null;
    for (var i = 0; i < questions.length; i += 1) {
      if (engine.filterByTarget([questions[i]], activeTarget).length && !isAnswered(questions[i])) {
        first = document.getElementById('q-' + questions[i].id);
        break;
      }
    }
    if (first) first = first.closest('.field');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveAnswers({ immediate: true });
    }
  });
  window.addEventListener('beforeunload', function (event) {
    if (!saveState.isDirty()) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadLocalCollections();
  applyLanguage();
  renderForm();
  updateProgress();
  renderOutput();
})();
