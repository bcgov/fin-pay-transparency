## Overview
PTRT (Pay Transparency Reporting Tool) allows BC Employers to generate reports for their business and GEO staff to review published reports.

This repository is a monorepo; the repository root does not have a `package.json`. npm commands must be run in the project's directory or using npm's `--prefix <project>` argument.

 The projects are:
`frontend` - SPA for the public facing webiste used by Employers via BCeID.
`admin-frontend` - SPA for the internal staff to review the data in PTRT. (aka Admin Portal)
`backend` - RESTful API for websites to get data.
`doc-gen-service` - RESTful API specifically for generating pdf.
`backend-external` - RESTful API accessible to internal staff to get data for external processing.
`clamav-service`- RESTful API for virus scanning files.
`packages/@bcgov/vuetify-theme` - Vuetify blueprint and css for BC Design System theme.

Misc instructions:
- If following instructions from AGENTS.md does not produce the intended outcome, tell the user so that AGENTS.md can be fixed.
- When needing to run shell commands, prefer powershell commands unless the user specifies otherwise in their prompt or in their personal settings.

## Test commands

- Change to the relevant package directory before running npm scripts.
- Vitest is not Jest: do not use `--runInBand`.
- Use `npm test` for the complete project suite.
- On Windows, prefer PowerShell and repository edit tools; `python` is not guaranteed to be installed.

