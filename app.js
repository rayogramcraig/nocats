import {transform} from './transform.js?v=2';
const form=document.querySelector('#form'), input=document.querySelector('#url'), status=document.querySelector('#status'), button=document.querySelector('#submit'), frame=document.querySelector('#preview');
const modeSwitch=document.querySelector('#mode'), replacement=document.querySelector('#replacement');
let active, lastPage;
function options() {return {mode:modeSwitch.getAttribute('aria-checked')==='true'?'replace':'redact', replacement:replacement.value.trim()||'demon'};}
function render(data) {
  const selected=options(), clean=transform(data.html,data.url,selected);
  frame.onload=()=>{
    const doc=frame.contentDocument;if(!doc)return;
    doc.addEventListener('submit',event=>event.preventDefault());
    doc.addEventListener('click',event=>{
      const a=event.target.closest?.('a[href]');if(!a)return;event.preventDefault();
      try {const target=new URL(a.href),source=new URL(data.url);if(target.origin===source.origin&&target.pathname===source.pathname&&target.search===source.search&&target.hash){doc.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView();return;}load(target.href);}catch{}
    });
  };
  frame.srcdoc=clean.html;document.querySelector('#result').hidden=false;document.body.classList.add('viewing');
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
  input.value=url.href;button.disabled=true;status.textContent='Inspecting the premises…';
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href}),signal:controller.signal});
    const data=await response.json();if(!response.ok) throw Error(data.error||'Could not load that webpage.');
    lastPage=data;render(data);
  } catch(error) {if(error.name!=='AbortError') status.textContent=error.message==='Failed to fetch'?'Could not reach No Cats. Check the Edge Function URL and allowed origins.':error.message;}
  finally {if(active===controller) button.disabled=false;}
}
form.addEventListener('submit',event=>{event.preventDefault();load(input.value);});
function startAnother() {
  active?.abort();active=null;button.disabled=false;lastPage=null;frame.onload=null;frame.srcdoc='';
  document.querySelector('#result').hidden=true;document.body.classList.remove('viewing');
  status.textContent='';input.focus();input.select();window.scrollTo({top:0,behavior:'instant'});
}
document.querySelector('#close').addEventListener('click',startAnother);
document.querySelector('#another').addEventListener('click',startAnother);
