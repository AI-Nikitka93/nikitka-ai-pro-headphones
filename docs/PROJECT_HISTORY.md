### 2026-05-23 01:13:26 +03:00 — GitHub portfolio packaging
- Changed: Rebuilt the GitHub-facing repository package for a review-only portfolio project: English/Russian README, all-rights-reserved licensing, contribution/support/security surfaces, issue and pull request templates, architecture notes, changelog, packaging audit, CODEOWNERS, and GitHub metadata.
- Files: README.md; README.ru.md; LICENSE; CONTRIBUTING.md; SECURITY.md; SUPPORT.md; CODE_OF_CONDUCT.md; CHANGELOG.md; docs/architecture.md; docs/GITHUB_PACKAGING_AUDIT.md; docs/PROJECT_HISTORY.md; .github/CODEOWNERS; .github/PULL_REQUEST_TEMPLATE.md; .github/ISSUE_TEMPLATE/01-site-bug.yml; .github/ISSUE_TEMPLATE/02-docs-feedback.yml; .github/ISSUE_TEMPLATE/config.yml.
- Verification: node --check app.js; node --check three-anatomy.js; python -m py_compile tools\create_nikitka_product_model.py; YAML parse check for .github/ISSUE_TEMPLATE/*.yml; git diff --check.
- Status: DONE.

### 2026-05-23 01:18:04 +03:00 — Site rights notice
- Changed: Added a subtle portfolio-review rights signal to the live HTML head and footer, with a direct footer link to the repository license.
- Files: index.html; docs/PROJECT_HISTORY.md.
- Verification: node --check app.js; node --check three-anatomy.js; python -m py_compile tools\create_nikitka_product_model.py; YAML parse check for .github/ISSUE_TEMPLATE/*.yml; git diff --check.
- Status: DONE.

### 2026-05-23 12:17:41 +03:00 — Radio select contrast fix
- Changed: Fixed the native radio station dropdown contrast by forcing the audio select and its options into a dark color scheme with readable option text; bumped the stylesheet query string so browsers load the corrected CSS.
- Files: style.css; index.html; docs/PROJECT_HISTORY.md.
- Verification: node --check app.js; node --check three-anatomy.js; git diff --check; Playwright computed-style check for #radio-select and all six options.
- Status: DONE.
