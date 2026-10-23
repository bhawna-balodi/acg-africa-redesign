import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function element() {
  return {
    attributes: {}, events: {}, classes: new Set(), open: false,
    setAttribute(key,value) { this.attributes[key]=value; },
    getAttribute(key) { return this.attributes[key]; },
    addEventListener(key,callback) { this.events[key]=callback; },
    focus() { this.focused=true; },
    get classList() {
      return {
        add: key=>this.classes.add(key),
        remove: key=>this.classes.delete(key),
        toggle: (key,value)=>value?this.classes.add(key):this.classes.delete(key)
      };
    }
  };
}
const toggle=element(), navigation=element(), menu=element(), summary=element(), header=element();
menu.querySelector=()=>summary;
const document=element();
document.documentElement=element();
document.querySelector=selector=>({
  '.menu-toggle':toggle, '#navigation':navigation, '#team-menu':menu, '#site-header':header
}[selector]);
const breakpoint=element();
const window=element();
window.scrollY=0;
window.matchMedia=()=>breakpoint;
window.requestAnimationFrame=callback=>callback();
vm.runInNewContext(fs.readFileSync('src/scripts/site.js','utf8'),{document,window});

toggle.events.click();
assert.equal(toggle.attributes['aria-expanded'],'true');
assert(navigation.classes.has('is-open'));
menu.open=true;
document.events.keydown({key:'Escape'});
assert.equal(menu.open,false);
assert(summary.focused);
assert.equal(toggle.attributes['aria-expanded'],'true');
document.events.keydown({key:'Escape'});
assert.equal(toggle.attributes['aria-expanded'],'false');
assert(toggle.focused);
toggle.events.click();
menu.open=true;
document.events.click({target:{closest:()=>null}});
assert.equal(menu.open,false);
assert.equal(toggle.attributes['aria-expanded'],'false');
toggle.events.click();
breakpoint.events.change();
assert.equal(toggle.attributes['aria-expanded'],'false');
window.scrollY=64;
window.events.scroll();
assert(header.classes.has('is-scrolled'));
window.scrollY=0;
window.events.scroll();
assert(!header.classes.has('is-scrolled'));

console.log('PASS: menu/submenu dismissal, breakpoint reset and stable header state.');
