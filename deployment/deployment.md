# Deployment Guide — Ubuntu Server (nginx + systemd)

This guide walks through deploying **Annotation Studio & Engine** on Ubuntu 22.04
(or newer Ubuntu LTS). The result is:

- **Engine** – FastAPI backend managed by a `systemd` service, listening on
  `127.0.0.1:8001` (loopback only).
- **Studio** – React static build served by **nginx** over HTTPS.
- **Reverse proxy** – nginx forwards API calls from `https://<your-domain>/api/...`
  to the Engine on `http://127.0.0.1:8001`.

This guide is written for a common real-world scenario on shared servers:

- Application code is deployed under a **private home directory** such as
  `/home/<deploy-user>/annotation` (which nginx usually cannot read).
- The Studio build artifacts are copied to a web-readable directory such as
  `/var/www/annotation` for nginx to serve safely.


## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Ubuntu 22.04 LTS (or newer) | Other Debian-based distros may work |
| A sudo-capable user | Commands below use `sudo` where needed |
| A domain name | Used in the nginx `server_name` directive |
| HTTPS configured for the domain | Often managed with Certbot; do not break other vhosts on shared servers |
| SMTP credentials | Required for ontology proposal email notifications |
| Recommender API endpoint | Required when `USE_MOCK_RECOMMENDATIONS = False` |

**Terminology used in this guide:**

- `<deploy-user>`: the Linux user that owns the code and runs the Engine service (example: `pasta`)
- `<your-domain>`: the public domain name (example: `annotation.example.org`)
- `<repo-dir>`: `/home/<deploy-user>/annotation`
- `<web-root>`: `/var/www/annotation`

---

## 2. Install System Dependencies

### 2.1 Update the package index

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install nginx (if not already installed)

> If nginx is already present on your server (common), you can skip installation.
> You should still verify the config is valid before and after changes.

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx --no-pager
```

### 2.3 Install Node.js 20 LTS (for building Studio)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x
npm --version
```

### 2.4 Install Pixi

Pixi manages the Python environment and dependencies for the Engine.

```bash
curl -fsSL https://pixi.sh/install.sh | bash
```

After installation, open a new shell or source your shell profile so that the
`pixi` command is available:

```bash
source ~/.bashrc   # or ~/.zshrc / ~/.profile, depending on your shell
pixi --version
```

---

## 3. Deploy the Application Code

Choose a location for the application code. This guide uses:

- `/home/<deploy-user>/annotation`

Example:

```bash
cd /home/<deploy-user>
git clone https://github.com/clnsmth/annotation.git annotation
```

---

## 4. Configure the Engine

The Engine requires a `config.py` file that is **not** committed to the
repository. A template is provided at `engine/webapp/config.py.template`.

```bash
cp /home/<deploy-user>/annotation/engine/webapp/config.py.template \
   /home/<deploy-user>/annotation/engine/webapp/config.py

nano /home/<deploy-user>/annotation/engine/webapp/config.py
```

Key settings to update for production:

| Setting | Description |
|---|---|
| `VOCABULARY_PROPOSAL_RECIPIENT` | Email address that receives new term proposals |
| `SMTP_SERVER` | Your SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Typically `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER` | SMTP login username / sending address |
| `SMTP_PASSWORD` | SMTP password or app-specific password |
| `USE_MOCK_RECOMMENDATIONS` | Set to `False` to use the real recommender API |
| `API_URL` | Full URL to the attribute recommender service |
| `ANNOTATE_BATCH_SIZE` | Number of attributes submitted per recommender request |

> **Security note:** `config.py` contains credentials. Ensure it is readable
> only by the service user:
>
> ```bash
> chmod 600 /home/<deploy-user>/annotation/engine/webapp/config.py
> ```

---

## 5. Install Engine Dependencies

```bash
cd /home/<deploy-user>/annotation/engine
pixi install
```

Pixi creates a self-contained environment under `engine/.pixi/`. No system
Python packages are modified.

Confirm the environment is healthy:

```bash
pixi run serve &   # start temporarily
curl http://127.0.0.1:8001/   # should return a JSON response
kill %1            # stop the temporary server
```

---

## 6. Build the Studio and Publish to /var/www

### 6.1 Create config.ts

The repo includes a template file at `studio/src/config.template.ts`. Create a
real config file:

```bash
cp /home/<deploy-user>/annotation/studio/src/config.template.ts \
   /home/<deploy-user>/annotation/studio/src/config.ts
```

### 6.2 Create a production env file

The Studio reads the backend URL at build time via Vite env vars:

```bash
cat > /home/<deploy-user>/annotation/studio/.env.production << 'EOF'
VITE_API_BASE_URL=https://<your-domain>
VITE_USE_BACKEND_PARSER=true
EOF
```

### 6.3 Build Studio

```bash
cd /home/<deploy-user>/annotation/studio
npm install
npm run build
```

The production build is written to `studio/dist/`.

### 6.4 Publish the build output to a web-readable directory

On many servers, nginx runs as `www-data` and cannot read private home
directories (commonly `chmod 750` on `/home/<deploy-user>`). To avoid relaxing
permissions, copy only the built static files to `/var/www/annotation`.

```bash
sudo mkdir -p /var/www/annotation
sudo rsync -a --delete \
  /home/<deploy-user>/annotation/studio/dist/ \
  /var/www/annotation/

sudo chown -R www-data:www-data /var/www/annotation
sudo chmod -R u=rwX,g=rX,o=rX /var/www/annotation
```

---

## 7. Create a Systemd Service for the Engine

A systemd service keeps the Engine running across reboots and restarts it
automatically on failure.

### 7.1 Find the Pixi-managed uvicorn binary

```bash
ls /home/<deploy-user>/annotation/engine/.pixi/envs/default/bin/uvicorn
```

### 7.2 Create the service file

```bash
sudo nano /etc/systemd/system/annotation-engine.service
```

Paste the following, replacing `<deploy-user>`:

```ini
[Unit]
Description=Annotation Engine (FastAPI / Uvicorn)
After=network.target

[Service]
Type=simple
User=<deploy-user>
WorkingDirectory=/home/<deploy-user>/annotation/engine
ExecStart=/home/<deploy-user>/annotation/engine/.pixi/envs/default/bin/uvicorn \
    webapp.run:app \
    --host 127.0.0.1 \
    --port 8001
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

> **Note:** The `--host 127.0.0.1` flag binds the Engine to the loopback
> interface only. nginx proxies external traffic to it. Do not bind to
> `0.0.0.0` unless you intentionally want the API port exposed directly.

### 7.3 Enable and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now annotation-engine
sudo systemctl status annotation-engine --no-pager
```

Check logs at any time with:

```bash
journalctl -u annotation-engine -f
```

---

## 8. Configure nginx

### 8.1 Where to put the nginx config

On Ubuntu, nginx commonly uses:

- `/etc/nginx/sites-available/<site-name>`
- `/etc/nginx/sites-enabled/<site-name>` (symlink)

On shared servers, a vhost file may already exist for `<your-domain>` and may be
managed by Certbot. In that case, **edit the existing vhost** rather than
creating a new one, and avoid removing unrelated sites.

### 8.2 HTTPS server block (serves Studio + proxies API)

In the HTTPS (`listen 443 ssl`) server block for `server_name <your-domain>;`,
ensure it contains:

```nginx
root /var/www/annotation;
index index.html;

# React SPA routing
location / {
    try_files $uri $uri/ /index.html;
}

# Proxy API requests to the FastAPI backend.
#
# IMPORTANT:
# - External API path is /api/...
# - Internal FastAPI routes are typically /... (no /api prefix)
# - The trailing slash on proxy_pass strips the /api/ prefix.
location /api/ {
    proxy_pass http://127.0.0.1:8001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 8.3 Reload nginx

Always test before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. Verify the Deployment

### 9.1 Engine health check (local)

```bash
curl http://127.0.0.1:8001/
```

Expected: a JSON response from the FastAPI application.

### 9.2 Studio via nginx

Open a browser and navigate to:

- `https://<your-domain>`

You should see the Annotation Studio UI.

### 9.3 End-to-end API check through nginx

```bash
curl https://<your-domain>/api/documents/targets
```

Expected: a JSON response proxied from the Engine.

---

## 10. Maintenance

### Updating the application

```bash
cd /home/<deploy-user>/annotation
git pull

# Rebuild/publish the Studio if frontend files changed
cd studio
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/annotation/

# Reinstall Engine dependencies if pyproject.toml changed
cd ../engine
pixi install

# Restart the Engine service to pick up backend changes
sudo systemctl restart annotation-engine
```

### Viewing Engine logs

```bash
journalctl -u annotation-engine --since "1 hour ago"
```

### Checking nginx access/error logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 11. Notes on Permissions and Security

- Avoid serving directly from `/home/<deploy-user>/...` unless your home
  directory permissions allow the nginx user (`www-data`) to traverse and read
  those directories.
- Prefer publishing only the built static files to `/var/www/annotation`.
- Keep `engine/webapp/config.py` out of version control and restrict its
  permissions (`chmod 600`).
- Keep the Engine bound to loopback (`127.0.0.1`) and expose it only via nginx.