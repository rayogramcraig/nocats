export function filteredLink(destination, appUrl, options = {}) {
  const target=new URL(destination);
  if(!['http:','https:'].includes(target.protocol))throw new Error('Not a webpage');
  const route=new URL(appUrl);route.search='';route.hash='';
  route.searchParams.set('url',target.href);
  route.searchParams.set('mode',options.mode==='replace'?'replace':'redact');
  route.searchParams.set('term',options.replacement||'demon');
  return route.href;
}
export const CAT_WORDS = /\b(?:cats?|kittens?|kitt(?:y|ies)|felines?|pussycats?|tomcats?|tabb(?:y|ies)|meows?|purr(?:s|ing|ed)?)\b/gi;
export function redact(text, options = {}) { return text.replace(CAT_WORDS, word => options.mode === 'replace' ? (options.replacement || 'demon') : '█'.repeat(word.length)); }
export function transform(html, sourceUrl, options = {}) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,iframe,frame,frameset,object,embed,applet,base,meta,template,portal').forEach(el => el.remove());
  // Remote code is disabled. Styles and images still load from their source.
  doc.querySelectorAll('link').forEach(el => {if (!['stylesheet','icon'].includes(el.rel.toLowerCase())) el.remove();});
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name) || ['srcdoc','nonce','integrity','autofocus','formaction','action','ping','download'].includes(attr.name)) el.removeAttribute(attr.name);
      else if (['title','alt','aria-label','placeholder','value'].includes(attr.name)) el.setAttribute(attr.name, redact(attr.value, options));
      else if (['href','src','xlink:href','poster','background'].includes(attr.name)) {
        try { const url = new URL(attr.value, sourceUrl); if (!['http:','https:'].includes(url.protocol) && !(attr.name === 'src' && /^data:image\/(png|jpeg|gif|webp);/i.test(attr.value))) el.removeAttribute(attr.name); else el.setAttribute(attr.name,url.href); } catch {el.removeAttribute(attr.name);}
      }
    }
    if (el.hasAttribute('data-src') && !el.hasAttribute('src')) {
      try {const u=new URL(el.getAttribute('data-src'),sourceUrl);if (['http:','https:'].includes(u.protocol)) el.setAttribute('src',u.href);} catch {}
    }
  });
  if(options.appUrl) doc.querySelectorAll('a[href],area[href]').forEach(link=>{
    const original=link.getAttribute('href');
    try {
      link.setAttribute('data-nocats-url',original);
      link.setAttribute('href',filteredLink(original,options.appUrl,options));
      link.setAttribute('target','_top');
      link.removeAttribute('download');
    } catch {link.removeAttribute('href');link.removeAttribute('target');}
  });
  const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_TEXT);
  let count=0, node;
  while ((node=walker.nextNode())) {
    if (['STYLE','SCRIPT'].includes(node.parentElement?.tagName)) continue;
    node.textContent=node.textContent.replace(CAT_WORDS,word=>{count++;return options.mode === 'replace' ? (options.replacement || 'demon') : '█'.repeat(word.length);});
  }
  const base=doc.createElement('base');base.href=sourceUrl;doc.head.prepend(base);
  const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="default-src 'none'; script-src 'none'; style-src https: http: 'unsafe-inline'; img-src https: http: data:; font-src https: http: data:; media-src https: http:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'";doc.head.prepend(csp);
  return {html:'<!doctype html>\n'+doc.documentElement.outerHTML,count};
}
