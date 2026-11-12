(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProfileTopics = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var TOPICS = [
    { id: 'personal', label: 'topicPersonal' },
    { id: 'summary', label: 'topicSummary' },
    { id: 'experience', label: 'topicExperience' },
    { id: 'education', label: 'topicEducation' },
    { id: 'skills', label: 'topicSkills' },
    { id: 'projects', label: 'topicProjects' },
    { id: 'additional', label: 'topicAdditional' },
    { id: 'interview', label: 'topicInterview' }
  ];

  var topicIds = TOPICS.map(function (topic) { return topic.id; });

  var PROMPT_TEMPLATES = {
    contact: { he: 'ספרו בקצרה: {q}', en: 'Tell me briefly: {q}' },
    summary: { he: 'סכמו: {q}', en: 'Summarize: {q}' },
    experience: { he: 'ספרו סיפור STAR על: {q}', en: 'Tell a STAR story about: {q}' },
    education: { he: 'ספרו על: {q}', en: 'Tell me about: {q}' },
    skill: { he: 'תנו דוגמה לשימוש ב: {q}', en: 'Give an example of using: {q}' },
    language: { he: 'מה רמתכם ב: {q}', en: 'What is your level in: {q}' },
    certification: { he: 'ספרו על ההסמכה: {q}', en: 'Tell me about the certification: {q}' },
    project: { he: 'ספרו על הפרויקט: {q}', en: 'Tell me about the project: {q}' },
    volunteering: { he: 'ספרו על ההתנדבות: {q}', en: 'Tell me about the volunteering: {q}' },
    achievement: { he: 'ספרו על ההישג: {q}', en: 'Tell me about the achievement: {q}' },
    other: { he: 'הסבירו: {q}', en: 'Explain: {q}' }
  };

  function topicFor(question) {
    var section = question && question.section;
    return topicIds.indexOf(section) !== -1 ? section : null;
  }

  function factsFrom(source) {
    if (!source) return [];
    if (typeof source.all === 'function') return source.all();
    if (Array.isArray(source)) return source;
    if (typeof source.byTag === 'function') return source.byTag('interview') || [];
    return [];
  }

  function labelFor(fact, lang) {
    var language = lang === 'he' ? 'he' : 'en';
    var question = fact.question || {};
    return question[language] || question.en || question.he || fact.questionKey || fact.id;
  }

  function fromKnowledgeBase(source, options) {
    var lang = options && options.lang === 'he' ? 'he' : 'en';
    return factsFrom(source).filter(function (fact) {
      return !options || !options.tag || (fact.tags || []).indexOf(options.tag) !== -1;
    }).map(function (fact) {
      var key = fact.questionKey || fact.key || fact.id;
      var prompt = (PROMPT_TEMPLATES[fact.category] || PROMPT_TEMPLATES.other)[lang]
        .replace('{q}', labelFor(fact, lang));
      var text = fact.text || {};
      return {
        id: fact.id,
        key: key,
        questionKey: key,
        answerKey: fact.questionKey || ('KB_' + String(fact.id).replace(/-/g, '')),
        topic: topicFor(fact) || fact.category || 'additional',
        category: fact.category || 'other',
        section: fact.section || fact.category || 'additional',
        prompt: prompt,
        text: prompt,
        answer: text[lang] || text.en || text.he || '',
        tags: Array.isArray(fact.tags) ? fact.tags.slice() : []
      };
    });
  }

  function sections(questions, activeTarget, filterByTarget, progress, answers) {
    var visible = filterByTarget(questions, activeTarget);
    return TOPICS.map(function (topic) {
      var topicQuestions = visible.filter(function (question) { return topicFor(question) === topic.id; });
      return { topic: topic, questions: topicQuestions, progress: progress(topicQuestions, answers || {}) };
    }).filter(function (section) { return section.questions.length > 0; });
  }

  return {
    TOPICS: TOPICS,
    topicFor: topicFor,
    sections: sections,
    fromKnowledgeBase: fromKnowledgeBase,
    reachableFactIds: function (source, options) {
      return fromKnowledgeBase(source, options).map(function (item) { return item.id; });
    },
    interviewTaggedFacts: function (source) {
      return factsFrom(source).filter(function (fact) {
        return (fact.tags || []).indexOf('interview') !== -1;
      });
    }
  };
});
