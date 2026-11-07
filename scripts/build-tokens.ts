// Writes src/styles/tokens.css from src/styles/tokens.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildTokensCss, type TokenFile } from '../src/styles/buildTokens.ts';

const file = JSON.parse(readFileSync('src/styles/tokens.json', 'utf8')) as TokenFile;
writeFileSync('src/styles/tokens.css', buildTokensCss(file));
console.log('Wrote src/styles/tokens.css');
