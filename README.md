# Profile Builder

A downloadable, local-first app for building a professional profile, CV, and LinkedIn drafts in Hebrew or English.

## Start here

1. Add your CV, a LinkedIn data-export ZIP, text files, pasted notes, or a public HTTPS page.
2. Choose OpenAI, Anthropic, or Google Gemini. Enter the model name and your own API key.
3. Check the consent box and run the analysis. The app suggests answers for fields it can support from your materials and creates follow-up questions for distinct roles and projects.
4. Review the suggestions in the questions step. AI-suggested answers are drafts; confirm their accuracy before using them in a CV or LinkedIn profile.
5. Review the generated drafts and print or save your CV as PDF.

You need your own provider account and API key. Model use may incur charges from that provider. The API key is held only in the open page and is cleared after an analysis; it is not saved in browser storage or included in this repository. When you consent to analysis, the materials you added are sent directly from your browser to the selected provider. Do not send sensitive information you do not want that provider to process.

## Run locally

The app is static and needs no application server. To use browser-to-provider AI requests, serve the files over HTTP so the provider can accept the browser connection. For example, with Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. You can also use a static HTTPS host.

## Source and link limits

- LinkedIn export ZIPs are mapped locally before analysis.
- PDF files are attached to the selected AI provider. Text, Markdown, and CSV files are read in the browser.
- Public HTTPS pages are read only when the website permits browser access (CORS). Pages requiring sign-in, and websites that block browser access, must be exported or pasted instead.
- The app does not clone or crawl GitHub repositories. Add specific public pages/files or upload your project materials.
- Answers and added materials remain in this browser unless you explicitly send them to the selected AI provider. Clearing browser storage removes saved answers and materials.

## Tests

```sh
node --test tests/
```
