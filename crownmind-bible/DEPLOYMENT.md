# CrownMind Bible v023 — live deployment

This is a complete Python web application, not a static HTML upload. All nine Bible translations, two commentary collections, topics, and prophecy connections are included. SQLite stays on the application server and is opened read-only. No Supabase account or database password is required.

## Hosting
Use a Docker-capable or persistent Python hosting service with HTTPS. The host must allow the bundled database and source archives (about 150 MB unpacked). This package cannot run by uploading its public folder to a static host. Put HTTPS and request-rate limiting at the hosting gateway/reverse proxy. The app is public, read-only, and has no administrative web endpoints.

Docker build (inside crownmind-bible):

```sh
docker build -t crownmind-bible:v023 .
docker run --rm -p 127.0.0.1:8080:8080 crownmind-bible:v023
```

Configure your HTTPS reverse proxy to forward to 127.0.0.1:8080. On a managed container platform, expose container port 8080; PORT is configurable. Health check: /healthz. The container runs as a non-root user.

Without Docker (Python 3.10+):

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
HOST=127.0.0.1 PORT=8080 python server.py
```

Use HOST=0.0.0.0 only where the managed platform requires it and provides the public HTTPS gateway. Run the process under the platform supervisor. Do not expose a development server. Requirements permit patched releases within the stated major versions; record installed versions for reproducible deployments.

## Integrate with CrownMind Institute
Option A: deploy this service on a Bible subdomain, then link it from the Institute navigation. Assign your actual subdomain through the hosting platform and DNS, and enable HTTPS. No hostname has been provisioned by this package.

Option B: reverse-proxy it under /bible/. Forward all /bible/ requests to this app with that prefix stripped. Redirect /bible to /bible/ so relative asset and API URLs resolve correctly. Example nginx locations inside your existing HTTPS server block:

```nginx
location = /bible { return 301 /bible/; }
location /bible/ {
    proxy_pass http://127.0.0.1:8080/;
    proxy_set_header Host $host;
}
```

Option C: embed the HTTPS subdomain with an iframe in the Institute page. Replace the example hostname below with your actual deployment URL:

```html
<iframe src="https://YOUR-BIBLE-HOST/" title="CrownMind Bible Library"
        style="width:100%;height:90vh;border:0" loading="lazy"></iframe>
```

Framing is allowed from this service's own origin, https://crownmind.net and https://www.crownmind.net. If the Institute uses another origin, edit the exact frame-ancestors allowlist in app.py and redeploy. Cross-origin API access is intentionally disabled; iframe use needs no CORS.

## Visitor data and updates
Bookmarks and notes stay in the visitor's browser localStorage. They are not account-based, backed up online, or shared across devices; moving to a new domain does not transfer existing local notes. Embedded storage can be restricted by browser privacy settings. Bible imports are offline maintenance tasks: update a copy of data/bible.db, validate, then redeploy. Never expose the data folder as static content. Keep source and license notices bundled; inherited edition/numbering qualifications remain applicable.

## Verification before going live
Run `python test_live.py`. Then check the deployed /healthz URL, all nine translation options, search and pagination, commentary, Topics, Return button, and browser notes. Verify the actual HTTPS URL and integration route on desktop and mobile. The supplied package has been tested locally; no live deployment, domain, account integration, or production traffic load test is claimed.

Implementation reference: https://flask.palletsprojects.com/en/stable/deploying/waitress/
