# Contributing

Thank you for helping improve Codefolk.

1. Install Node.js 24 and run `npm ci`.
2. Edit named palette values or workbench/token mappings under `src/`.
3. Run `npm run generate` and commit the generated themes.
4. Run `npm test`.
5. Press `F5` and review both themes with `test/samples` and the documented workbench surfaces.

When a new VS Code version adds color IDs, update the pinned registry snapshot deliberately and note the audited VS Code version in the changelog. Do not add a color merely to reach full coverage; only add colors that support the Codefolk visual system.
