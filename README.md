# Profile Builder

A free, local-first tool for drafting LinkedIn profiles and CVs. Download or clone the repository, then open `index.html` in a browser. No account, API key, application server, or AI service is required.

## What it does

- Guides you through general questions about your contact details, work history, education, skills, projects, and achievements.
- Creates editable LinkedIn and CV drafts with Hebrew or English layouts, previews, and printable CV files. It does not translate answers automatically; enter them in the language you want to use.
- Imports a LinkedIn data-export ZIP and maps supported CSV fields locally.
- Saves optional materials and answers in this browser only. Imported files are not uploaded.
- Imports custom questions and answers from a JSON file.
- Includes local image tools and a LinkedIn Featured image creator. Loading a public GitHub avatar is optional and requires internet access.

## Current limits

The app does not scan GitHub repositories, automatically extract text from PDF files, or call an AI model. A PDF may be stored locally; paste its text into the form or use an AI service separately if you want help drafting answers. Always review generated text for accuracy before publishing.

## Privacy

Answers, imported questions, and added materials are stored in this browser's local storage. They are not written to the project files or sent to a server. Clearing browser storage removes them; use the optional export button to keep a backup.

## Run tests

```sh
node --test tests/
```
