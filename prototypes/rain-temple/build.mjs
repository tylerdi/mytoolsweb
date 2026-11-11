import { build } from 'esbuild';
await build({entryPoints:['prototypes/rain-temple/main.mjs'],bundle:true,format:'esm',target:['es2022'],minify:true,outfile:'prototypes/rain-temple/temple.js',legalComments:'eof'});
console.log('Built rain-temple/temple.js (Three.js bundled locally).');
