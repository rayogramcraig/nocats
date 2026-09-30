import {transform} from './transform.js?v=2';
const form=document.querySelector('#form'), input=document.querySelector('#url'), status=document.querySelector('#status'), button=document.querySelector('#submit'), frame=document.querySelector('#preview');
const modeSwitch=document.querySelector('#mode'), replacement=document.querySelector('#replacement');
let active, lastPage, linkTimer;
let previewSerial=0;
function report(message) { status.textContent=message; status.classList.toggle("navigation-status",document.body.classList.contains("viewing")); }
function options() {return {mode:modeSwitch.getAttribute('aria-checked')==='true'?'replace':'redact', replacement:replacement.value.trim()||'demon'};}
function render(data) {
  const selected=options(), clean=transform(data.html,data.url,selected);
  clearInterval(linkTimer);
  const marker=String(++previewSerial);
  let attached=false;
  function attachLinks() {
    const doc=frame.contentDocument;
    if(attached||!doc||doc.documentElement?.getAttribute('data-nocats-preview')!==marker)return;
    attached=true;clearInterval(linkTimer);
    doc.addEventListener('submit',event=>event.preventDefault(),true);
    doc.addEventListener('click',event=>{
      const origin=event.target.nodeType===1?event.target:event.target.parentElement;
      const a=origin?.closest?.('a[href],area[href]');if(!a)return;
      event.preventDefault();event.stopPropagation();
      try {
        const target=new URL(a.getAttribute('href'),data.url),source=new URL(data.url);
        if(!['http:','https:'].includes(target.protocol)){report('This link is not a webpage.');return;}
        if(target.origin===source.origin&&target.pathname===source.pathname&&target.search===source.search&&target.hash){doc.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView();return;}
        load(target.href);
      }catch{report('Could not open this link.');}
    },true);
  }
  // Attach as soon as the new document exists, without waiting for remote images.
  frame.onload=attachLinks;
  frame.srcdoc=clean.html.replace(/<html(?=[\s>])/i,`<html data-nocats-preview="${marker}"`);
  linkTimer=setInterval(attachLinks,25);
  status.classList.remove('navigation-status');
  document.querySelector('#result').hidden=false;document.body.classList.add('viewing');
  document.querySelector('#summary').textContent=`${clean.count} cat mention${clean.count===1?'':'s'} ${selected.mode==='replace'?'replaced':'redacted'} · ${new URL(data.url).hostname}`;
  status.textContent=selected.mode==='replace'?`Cat words replaced with “${selected.replacement}”. Images remain.`:'Cat words blacked out. Images remain; some interactive pages may look different.';
}
function resizeTerm(){replacement.style.width=Math.max(3,Math.min(24,replacement.value.length+1))+'ch';}
modeSwitch.addEventListener('click',()=>{modeSwitch.setAttribute('aria-checked',String(modeSwitch.getAttribute('aria-checked')!=='true'));if(lastPage)render(lastPage);});
replacement.addEventListener('input',()=>{resizeTerm();if(lastPage&&options().mode==='replace')render(lastPage);});
replacement.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();replacement.blur();}});
replacement.addEventListener('blur',()=>{if(!replacement.value.trim()){replacement.value='demon';resizeTerm();}});
resizeTerm();
async function load(value) {
  let url;
  try { url=new URL(/^https?:\/\//i.test(value.trim())?value.trim():'https://'+value.trim());if (!['http:','https:'].includes(url.protocol)||url.username||url.password) throw Error(); } catch {status.textContent='Enter a valid http or https webpage URL.';return;}
  const endpoint=window.NOCATS_CONFIG?.endpoint;
  if (!endpoint || endpoint.includes('YOUR_PROJECT_REF')) {status.textContent='Almost ready: add your Supabase project reference in config.js.';return;}
  active?.abort();const controller=new AbortController();active=controller;
  input.value=url.href;button.disabled=true;report('Loading '+url.hostname+'…');
  let timedOut=false;const requestTimer=setTimeout(()=>{timedOut=true;controller.abort();},25000);
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href}),signal:controller.signal});
    const data=await response.json();if(!response.ok) throw Error(data.error||'Could not load that webpage.');
    if(active!==controller)return;lastPage=data;render(data);
  } catch(error) {if(active===controller){if(timedOut)report('This page took too long to load. Try the link again.');else if(error.name!=='AbortError')report(error.message==='Failed to fetch'?'Could not reach No Cats. Check the Edge Function URL and allowed origins.':error.message);}}
  finally {clearTimeout(requestTimer);if(active===controller) button.disabled=false;}
}
form.addEventListener('submit',event=>{event.preventDefault();load(input.value);});
function startAnother() {
  clearInterval(linkTimer);status.classList.remove('navigation-status');active?.abort();active=null;button.disabled=false;lastPage=null;frame.onload=null;frame.srcdoc='';
  document.querySelector('#result').hidden=true;document.body.classList.remove('viewing');
  status.textContent='';input.focus();input.select();window.scrollTo({top:0,behavior:'instant'});
}
document.querySelector('#close').addEventListener('click',startAnother);
document.querySelector('#another').addEventListener('click',startAnother);
