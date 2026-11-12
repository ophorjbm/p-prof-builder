(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PROFILE_TEMPLATES = factory();
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var linkedinEn = `## Headline
[HEADLINE]

## About
[ABOUT]

## Experience
[EXPERIENCE]

## Education
[EDUCATION_DEGREE] | [EDUCATION_INSTITUTION] | [EDUCATION_DATES]

## Skills
[SKILLS]

## Projects
[PROJECTS]

## Certifications
[CERTIFICATIONS]

## Volunteering
[VOLUNTEERING]

## Languages
[LANGUAGES]

## Contact
[EMAIL] | [PHONE] | [LINKEDIN_URL] | [GITHUB_URL] | [PORTFOLIO_URL]`;

  var linkedinHe = `## כותרת
[HEADLINE]

## אודות
[ABOUT]

## ניסיון
[EXPERIENCE]

## השכלה
[EDUCATION_DEGREE] | [EDUCATION_INSTITUTION] | [EDUCATION_DATES]
[EDUCATION_HONORS]

## כישורים
[SKILLS]

## פרויקטים
[PROJECTS]

## הסמכות
[CERTIFICATIONS]

## התנדבות
[VOLUNTEERING]

## שפות
[LANGUAGES]

## פרטי קשר
[EMAIL] | [PHONE] | [LINKEDIN_URL] | [GITHUB_URL] | [PORTFOLIO_URL]`;

  var cvEn = `## Contact
[FULL_NAME]
[CITY] | [EMAIL] | [PHONE] | [LINKEDIN_URL] | [GITHUB_URL] | [PORTFOLIO_URL]

## Summary
[TARGET_JOB_TITLE]
[SUMMARY]

## Experience
[EXPERIENCE]

## Education
[EDUCATION_DEGREE] | [EDUCATION_INSTITUTION] | [EDUCATION_DATES]
[EDUCATION_HONORS]

## Skills
[SKILLS]

## Projects
[PROJECTS]

## Certifications
[CERTIFICATIONS]

## Achievements
[ACHIEVEMENTS]

## Volunteering
[VOLUNTEERING]

## Languages
[LANGUAGES]`;

  var cvHe = `## פרטי קשר
[FULL_NAME]
[CITY] | [EMAIL] | [PHONE] | [LINKEDIN_URL] | [GITHUB_URL] | [PORTFOLIO_URL]

## תקציר
[TARGET_JOB_TITLE]
[SUMMARY]

## ניסיון
[EXPERIENCE]

## השכלה
[EDUCATION_DEGREE] | [EDUCATION_INSTITUTION] | [EDUCATION_DATES]
[EDUCATION_HONORS]

## כישורים
[SKILLS]

## פרויקטים
[PROJECTS]

## הסמכות
[CERTIFICATIONS]

## הישגים
[ACHIEVEMENTS]

## התנדבות
[VOLUNTEERING]

## שפות
[LANGUAGES]`;

  return {
    linkedin_en: linkedinEn,
    linkedin_he: linkedinHe,
    cv_en: cvEn,
    cv_he: cvHe
  };
});
