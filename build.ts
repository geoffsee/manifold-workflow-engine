import isolatedDecl from 'bun-plugin-isolated-decl';

// handles building the types for the library
await Bun.build({
  entrypoints: ['./src/index.ts', './src/types.ts'],
  outdir: './dist',
  target: 'browser',
  plugins: [
    isolatedDecl({
      forceGenerate: true,  // Generate declaration files even if there are errors
    })
  ],
});
