/**
 * Gera src/data/cardapio.schema.json a partir do esquema Zod: o VS Code passa a
 * autocompletar e validar o cardapio.json enquanto você digita.
 * Rode depois de mudar src/lib/menu.ts:  npm run schema
 */
import { writeFile } from 'node:fs/promises';
import { cardapioJsonSchema } from '../src/lib/menu.ts';

await writeFile('src/data/cardapio.schema.json', `${JSON.stringify(cardapioJsonSchema(), null, 2)}\n`);
console.log('✓ src/data/cardapio.schema.json');
