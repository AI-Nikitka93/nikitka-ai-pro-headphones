# Security Policy

## Scope

This is a static portfolio website. It has no backend, authentication, database, payment flow, or secret-bearing server runtime.

Supported surface:

- the current production deployment at `https://nikitka-ai-pro-headphones.vercel.app/`;
- the current `main` branch.

Older deployments, local experiments, ignored QA captures, and generated intermediate assets are not supported security surfaces.

## Reporting

Do not open a public issue if the report includes exploit details, private data, secret exposure, or a reproducible security abuse path.

For sensitive reports, contact the repository owner through GitHub or use GitHub's private vulnerability reporting / security advisory flow if it is available for this repository.

For non-sensitive display bugs, broken links, or browser compatibility issues, use the issue templates.

## Notes

- The project uses public third-party CDN imports for Three.js modules.
- Radio streams are public SomaFM stream URLs and are played client-side.
- No API keys or private credentials are required for local development.
