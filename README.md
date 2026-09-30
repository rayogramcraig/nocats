# No Cats — version 1

A static GitHub Pages frontend plus a public Supabase Edge Function. No database, accounts, API key, AI service, or build step required.

## 1. GitHub Pages

Upload the contents of this folder to your repository root, keeping the subfolders intact. Enable GitHub Pages: Settings → Pages → Deploy from a branch → main / root. CNAME is already set to nocats.org. Configure your domain using GitHub's custom-domain instructions and enable HTTPS once available:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## 2. Supabase function

In Supabase Dashboard → Edge Functions, create a function named `fetch-page`. Paste the contents of `supabase/functions/fetch-page/index.ts` into the editor and deploy. Disable **Verify JWT** for this function: it is intentionally public, with no user login.

Alternatively, with Supabase CLI installed, run from this folder:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy fetch-page --no-verify-jwt
```

No database tables are needed. The default permitted frontend origins are https://nocats.org, https://www.nocats.org, and http://localhost:8000. If you also use a github.io URL, set the Edge Function secret `ALLOWED_ORIGINS` to a comma-separated list including it and your production domain. Include complete origins, without paths or trailing slashes.

Official public-function configuration:
https://supabase.com/docs/guides/functions/function-configuration

## 3. Connect frontend

Edit `config.js`: replace `YOUR_PROJECT_REF` with your Supabase project reference (the same value in your project URL). Commit this file. No Supabase key should be added; never put a service-role key in the frontend.

## 4. Try it

Open nocats.org, paste a public article URL, and select DECAT. It should show the page with matching words replaced by black blocks. Links load through No Cats. For local testing, run `python3 -m http.server 8000` in this folder and open http://localhost:8000 (not a file:// URL).

## Scope

Catches whole words: cat/cats, kitten/kittens, kitty/kitties, feline/felines, pussycat/pussycats, tomcat/tomcats, tabby/tabbies, meow/meows, and purr/purrs/purring/purred. No substring matches in words like “education” or “category”. Does not understand context: “CAT scan” is also redacted; Garfield, breeds, translated terms, cat pictures, and words baked into images are not detected. Text spread across separate HTML elements can escape matching. The count covers text nodes; matching accessibility labels and input values are also redacted.

Retains HTML and CSS, with a source base URL for relative assets. Source JavaScript, embedded frames, and forms are disabled. Images and styles are loaded directly from the source website. Paywalls, anti-bot sites, and JavaScript-only pages can fail or appear incomplete. No authenticated browsing or paywall bypass. CSS-generated words are not filtered. Some assets may reject hotlinking.

The server returns HTML as JSON; the browser sanitizes and redacts it before displaying it in a sandboxed iframe. CSP and sandbox prohibit scripts, forms, popups, embeds, and automatic top-level navigation. Navigation is handled by the parent app. No submitted URL is intentionally logged or stored by this code, though hosting providers have their own logs, and original asset servers receive requests.

## Deployment limits

The function accepts only HTTP(S), standard ports, and public destinations; validates DNS and every redirect; caps HTML at 3 MB and fetch time at 15 seconds. DNS validation and fetch perform separate resolutions, so this is not hardened against DNS rebinding. Origin checks prevent ordinary cross-origin browser use, but are not authentication or abuse protection: non-browser clients can forge Origin. This MVP has no durable rate limiting. Before promoting it widely, add platform-level abuse controls or a shared rate limiter and stronger network egress restrictions. Supabase usage may incur charges.

## Checks

`npm test` runs whole-word redaction checks. The Supabase deployment still needs an end-to-end check on your project; no live project credentials were supplied.
