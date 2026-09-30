import {transform} from './transform.js';
const form=document.querySelector('#form'), input=document.querySelector('#url'), status=document.querySelector('#status'), button=document.querySelector('#submit'), frame=document.querySelector('#preview');
let active;
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
    const clean=transform(data.html,data.url);
    frame.onload=()=>{
      const doc=frame.contentDocument;
      doc.addEventListener('submit',event=>event.preventDefault());
      doc.addEventListener('click',event=>{
        const a=event.target.closest?.('a[href]');if(!a)return;event.preventDefault();
        try {const target=new URL(a.href);const source=new URL(data.url);if(target.origin===source.origin&&target.pathname===source.pathname&&target.search===source.search&&target.hash){doc.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView();return;}load(target.href);}catch{}
      });
    };
    frame.srcdoc=clean.html;document.querySelector('#result').hidden=false;document.body.classList.add('viewing');
    document.querySelector('#summary').textContent=`${clean.count} cat mention${clean.count===1?'':'s'} redacted · ${new URL(data.url).hostname}`;
    status.textContent='Cat words blacked out. Images remain; some interactive pages may look different.';
  } catch(error) {if(error.name!=='AbortError') status.textContent=error.message==='Failed to fetch'?'Could not reach No Cats. Check the Edge Function URL and allowed origins.':error.message;}
  finally {if(active===controller) button.disabled=false;}
}
form.addEventListener('submit',event=>{event.preventDefault();load(input.value);});
document.querySelector('#close').addEventListener('click',()=>{active?.abort();frame.srcdoc='';document.querySelector('#result').hidden=true;document.body.classList.remove('viewing');status.textContent='One URL. Zero tolerance.';input.focus();});
