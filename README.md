# Ribbon

Standalone prototype project.

Live prototype: https://ribbon-keepsakes-prototype.kuki1029.chatgpt.site

## Run locally

Run `npm run dev`, then open http://127.0.0.1:4178. If the original preview is already running on that port, stop it first or run `python3 -m http.server 4179 --bind 127.0.0.1 --directory dist`.

`npm run build` checks the static application. For browser tests, install development dependencies with `npm install`, install WebKit with `npx playwright install webkit`, start the local preview on port 4178, then run `npm run test:responsive`. Chrome must also be installed.

## Files

- `dist/`: editable local prototype
- `published-site/`: clean deployment source, Git repository, and existing Sites identity
- `tests/`: browser checks
- `screenshots/`: visual checks
- `reference-study/`, `archive/`, and design notes: supporting material, excluded from the hosted site

Drafts and imported memories are stored in each visitor’s browser, not this folder. The original project copy remains in the portfolio folder to avoid interrupting the running preview.
