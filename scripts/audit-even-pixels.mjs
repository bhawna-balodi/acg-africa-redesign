import fs from 'node:fs';
import assert from 'node:assert/strict';

// Audit authored CSS pixel lengths, not percentage/fr/rem calculations,
// image intrinsic dimensions or SVG coordinates. Preserve existing responsive
// breakpoint boundaries and transform offsets (motion) as explicitly agreed.
const findings=[],exceptions=[];
for(const file of fs.readdirSync('src/styles').filter(f=>f.endsWith('.css'))){
 const css=fs.readFileSync('src/styles/'+file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 for(const match of css.matchAll(/(-?\d*\.?\d+)px\b/g)){
  const value=Number(match[1]);
  if(Number.isInteger(value)&&Math.abs(value)%2===0)continue;
  const start=Math.max(css.lastIndexOf(';',match.index),css.lastIndexOf('{',match.index),css.lastIndexOf('}',match.index))+1;
  const context=css.slice(start,match.index);
  const entry={file,value,context:context.trim().slice(-120)};
  const ruleStart=css.lastIndexOf('{',match.index);
  const selector=css.slice(css.lastIndexOf('}',ruleStart)+1,ruleStart).trim();
  // Explicitly requested 1px strokes for the shared contact form controls.
  const contactFieldBorder=file==='contact.css'&&value===1&&context.trim()==='border:'&&selector==='.contact-field input,.contact-field select,.contact-field textarea,.contact-copy-fallback';
  if(contactFieldBorder||/@media[^{}]*$/.test(context)||/(?:^|;)\s*transform\s*:[^;{}]*$/.test(context))exceptions.push(entry);
  else findings.push(entry);
 }
}
assert.deepEqual(findings,[],'Odd/fractional authored visual pixel sizes: '+JSON.stringify(findings));
console.log('PASS: authored visual pixel sizes are even integers except approved contact field strokes; '+exceptions.length+' approved contact/breakpoint/motion values.');
