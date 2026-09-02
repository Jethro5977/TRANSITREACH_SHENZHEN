# Connecting the deployed site to the routing engine

**For whoever deploys TransitReach to Netlify.** You do not need to have set up the routing
engine, or to know how it works, to follow this.

## What you are connecting

TransitReach is a static site, but the reachable-area calculation is done by
**OpenTripPlanner** — a Java service holding a ~500 MB street and transit graph in memory.
No static host or serverless function can run that, so it lives on its own always-on server.

```
Netlify (static site)  ──/otp/* proxy──▶  EC2 instance running OpenTripPlanner
```

The routing engine is **already running** on a Monash / ARDC Nectar Research Cloud
instance (Ubuntu 24.04, 2 vCPU, 8 GB RAM), at:

```
http://203.101.230.213:8080
```

Check it any time — this should return JSON, not an error:

```
http://203.101.230.213:8080/otp/traveltime/isochrone?batch=true&location=3.132852,101.687817&time=2026-09-01T08:00:00%2B08:00&modes=WALK,SUBWAY,TRAM&arriveBy=false&cutoff=30M
```

If that fails, the site's map will show "Could not compute the reachable area" — the site
itself is fine, the engine is not. See "If it breaks" below.

## The two things you must configure

Both are required. Doing only one leaves the map broken.

### 1. Proxy `/otp/*` in `public/_redirects`

The file already exists. Add the `/otp/*` line **above** the existing catch-all:

```
/otp/*   http://203.101.230.213:8080/otp/:splat   200
/*       /index.html                             200
```

**Order matters.** If `/*` comes first it swallows `/otp/*`, and every routing request
returns the HTML page instead of a result. That failure looks like the engine being down.

The `200` is what makes this a proxy rather than a redirect: Netlify fetches the routing
service server-side and returns the result as if it came from your own domain.

### 2. Set `VITE_OTP_BASE_URL` to `/`

In Netlify: **Site configuration → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `VITE_OTP_BASE_URL` | `/` |

A single forward slash, nothing else. The app strips the trailing slash, leaving an empty
base, so it requests `/otp/...` on its own origin — which the proxy above then forwards.

## Why the proxy, rather than calling the server directly

You might reasonably set `VITE_OTP_BASE_URL=http://203.101.230.213:8080` and skip the
redirect. **That does not work in production.** Netlify serves your site over HTTPS, and
browsers block an HTTPS page from calling a plain-HTTP address — the requests fail as mixed
content, usually with no obvious error beyond a console warning.

Routing through Netlify means the browser only ever talks to Netlify over HTTPS. The
HTTP hop happens server-side, where the browser's rule does not apply. It also keeps the
server's address out of the shipped JavaScript.

## Deploy settings

Standard Vite defaults; Netlify usually detects these:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 18 or newer |

## After deploying — verify

1. Open the site, go to **Map**.
2. Search a station (e.g. `KAJANG`) and select it.
3. A shaded reachable area should appear within a few seconds, with a "Reachable within
   30 min" panel showing an area in km².
4. Change the time budget to 60 min — the area should grow noticeably.

If you see **"Could not compute the reachable area"**, the proxy or the variable is wrong.
Open DevTools → Network and look at the `/otp/traveltime/...` request:

| What you see | What it means |
|---|---|
| Returns HTML instead of JSON | `/otp/*` is below `/*` in `_redirects` — reorder them |
| 404 | The `/otp/*` redirect line is missing entirely |
| Request goes to `localhost:8080` | `VITE_OTP_BASE_URL` is not set, **or the site was not rebuilt after setting it** |
| Blocked as mixed content | The variable points at `http://...` directly instead of `/` |
| 502 / times out | The routing server is down — see below |

## The redeploy trap

`VITE_*` variables are **baked into the JavaScript at build time**, not read when the page
loads. Setting or changing the variable has no effect until Netlify rebuilds.

After changing it: **Deploys → Trigger deploy → Clear cache and deploy site.**

## If it breaks

**Symptom: the map worked, now every calculation fails.**

Almost always the routing server. Test the URL at the top of this document. If it does not
respond, whoever administers the Nectar instance needs to restart OpenTripPlanner on it:

```bash
sudo systemctl status otp
sudo systemctl restart otp
```

The service is enabled at boot and restarts on failure, so it should recover on its own
from a crash or reboot. It takes **about 25 seconds** to become available after starting —
the graph has to be read into memory first. A failure immediately after a restart may just
be that.

**Symptom: the server's address changed.**

If the instance is ever rebuilt or reallocated, update the `_redirects` line and redeploy.
Because the address is baked into `_redirects` rather than the JavaScript, this is a
one-line change plus a deploy — no code edit.

## Cost

The routing server runs on the **ARDC Nectar Research Cloud**, provided through Monash, so
there is no per-hour cost to the project. Two things still matter:

- **Allocations expire.** Nectar project allocations are time-limited and need renewal.
  If the allocation lapses the instance stops, and every reachability calculation on the
  deployed site fails — the rest of the site keeps working, showing "Could not compute the
  reachable area".
- Whoever holds the allocation should know the renewal date.

An AWS EC2 deployment was built first and is documented in `routing/deploy/README.md`. It
is currently **stopped**, kept as a fallback. That document also lists its teardown
commands, which should be run if the Nectar instance proves stable and the fallback is no
longer wanted — the stopped instance still accrues small storage and IP-address charges.
