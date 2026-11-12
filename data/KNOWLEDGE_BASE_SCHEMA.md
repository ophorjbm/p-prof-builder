# Profile facts

The app's built-in prompts are defined in `questions.json` and bundled for the
browser in `../js/questions.js`. The app creates draft facts from the answers
entered by each user; no example person's profile is included.

`knowledge-base.json` is an optional, local-first fact store used by the
generation modules. It starts empty. A fact can include:

- `id`: a unique ID matching `F-...`.
- `questionKey`: the answer key used to fill the fact.
- `category` and `section`: where the fact belongs in a CV or LinkedIn draft.
- `tags`: one or more of `cv`, `linkedin`, and `interview`.
- `text`: Hebrew and/or English text.
- `fields`: optional structured details such as a contact type or work dates.
- `status`: `confirmed` or `needs-input`.
- `sensitivity`: `public` or `private`.

The `ProfileKB` module validates facts and excludes private facts from public
output. Never add personal profile data to the repository; enter it in the app,
where it stays in the browser's local storage.
