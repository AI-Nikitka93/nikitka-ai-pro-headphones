# Contributing

This repository is a personal portfolio showcase, not an open-source project.

## Contribution Posture

Unsolicited feature PRs, redesigns, forks for reuse, and derivative product work are not accepted. The source is visible so the project can be reviewed as portfolio work.

Small maintenance contributions may be considered when they help review the portfolio site:

- typo fixes;
- broken link reports;
- accessibility or responsive-layout bug reports;
- documentation corrections;
- reproducible browser issues in the live demo.

## Local Checks

Before proposing a small fix, run the relevant checks:

```bash
node --check app.js
node --check three-anatomy.js
python -m py_compile tools/create_nikitka_product_model.py
git diff --check
```

For visible changes, include the browser, viewport, route, and screenshot or reproduction steps.

## Rights

By submitting a PR, you confirm that your contribution is your own work and that you have the right to submit it to this repository. Accepted contributions do not change the repository license posture: this project remains portfolio-review only and all rights remain reserved.
