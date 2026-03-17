# Deployment Guide — Ubuntu Server

This guide walks through deploying Annotation Studio & Engine on a fresh Ubuntu
22.04 LTS or 24.04 LTS server. The result is:

- **Engine** – FastAPI backend managed by a systemd service, listening on
  `127.0.0.1:8000`.
- **Studio** – React static build served by nginx, with nginx also acting as a
  reverse proxy for Engine API calls.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install System Dependencies](#2-install-system-dependencies)
3. [Deploy the Application Code](#3-deploy-the-application-code)
4. [Configure the Engine](#4-configure-the-engine)
5. [Install Engine Dependencies](#5-install-engine-dependencies)
6. [Build the Studio](#6-build-the-studio)
7. [Create a Systemd Service for the Engine](#7-create-a-systemd-service-for-the-engine)
8. [Configure nginx](#8-configure-nginx)
9. [Verify the Deployment](#9-verify-the-deployment)
10. [Maintenance](#10-maintenance)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Ubuntu 22.04 LTS or 24.04 LTS | Other Debian-based distros may work |
| A non-root sudo user | All commands below use `sudo` where needed |
| Domain name or server IP | Used in the nginx `server_name` directive |
| SMTP credentials | Required for ontology proposal email notifications |
| Recommender API endpoint | Required when `USE_MOCK_RECOMMENDATIONS = False` |

---

## 2. Install System Dependencies

### 2.1 Update the package index

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 2.3 Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x
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

Choose a location for the application. `/opt/annotation` is used throughout
this guide, but any directory accessible to your deploy user works.

```bash
sudo mkdir -p /opt/annotation
sudo chown $USER:$USER /opt/annotation

# Clone the repository (replace the URL with your fork/mirror if needed)
git clone https://github.com/clnsmth/annotation.git /opt/annotation
```

---

## 4. Configure the Engine

The Engine requires a `config.py` file that is **not** committed to the
repository. A template is provided at `engine/webapp/config.py.template`.

```bash
cp /opt/annotation/engine/webapp/config.py.template \
   /opt/annotation/engine/webapp/config.py
```

Open the file and edit each value:

```bash
nano /opt/annotation/engine/webapp/config.py
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
> chmod 600 /opt/annotation/engine/webapp/config.py
> ```

---

## 5. Install Engine Dependencies

```bash
cd /opt/annotation/engine
pixi install
```

Pixi creates a self-contained environment under `engine/.pixi/`. No system
Python packages are modified.

Confirm the environment is healthy:

```bash
pixi run serve &   # start temporarily
curl http://127.0.0.1:8000/   # should return a JSON response
kill %1            # stop the temporary server
```

---

## 6. Build the Studio

### 6.1 Create the environment file

The Studio reads the backend URL from a `.env` file at build time. Create one
from the template:

```bash
cp /opt/annotation/studio/src/config.template.ts \
   /opt/annotation/studio/src/config.ts
```

For production you can override the backend URL using a Vite environment file:

```bash
cat > /opt/annotation/studio/.env.production << 'EOF'
VITE_API_BASE_URL=http://your-server.example.com
VITE_USE_BACKEND_PARSER=true
EOF
```

Replace `your-server.example.com` with your actual domain or public IP address.

### 6.2 Install dependencies and build

```bash
cd /opt/annotation/studio
npm install
npm run build
```

The production build is written to `studio/dist/`. nginx will serve files
directly from this directory.

---

## 7. Create a Systemd Service for the Engine

A systemd service keeps the Engine running across reboots and restarts it
automatically on failure.

### 7.1 Find the Pixi-managed uvicorn binary

```bash
ls /opt/annotation/engine/.pixi/envs/default/bin/uvicorn
```

### 7.2 Create the service file

```bash
sudo nano /etc/systemd/system/annotation-engine.service
```

Paste the following, replacing `<your-user>` with your deploy user name:

```ini
[Unit]
Description=Annotation Engine (FastAPI / Uvicorn)
After=network.target

[Service]
Type=simple
User=<your-user>
WorkingDirectory=/opt/annotation/engine
ExecStart=/opt/annotation/engine/.pixi/envs/default/bin/uvicorn \
    webapp.run:app \
    --host 127.0.0.1 \
    --port 8000
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
sudo systemctl enable annotation-engine
sudo systemctl start annotation-engine
sudo systemctl status annotation-engine
```

Check logs at any time with:

```bash
journalctl -u annotation-engine -f
```

---

## 8. Configure nginx

### 8.1 Create the site configuration

```bash
sudo nano /etc/nginx/sites-available/annotation
```

Paste the following, replacing `your-server.example.com` with your domain or
server IP:

```nginx
server {
    listen 80;
    server_name your-server.example.com;

    # Serve the React frontend static build
    root /opt/annotation/studio/dist;
    index index.html;

    # Handle client-side routing (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8.2 Enable the site and reload nginx

```bash
sudo ln -s /etc/nginx/sites-available/annotation \
           /etc/nginx/sites-enabled/annotation

# Remove the default site if it is still enabled
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # test configuration for syntax errors
sudo systemctl reload nginx
```

### 8.3 (Optional) Enable HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-server.example.com
```

Certbot will automatically update the nginx configuration and set up certificate
renewal.

---

## 9. Verify the Deployment

### 9.1 Engine health check

```bash
curl http://127.0.0.1:8000/
```

Expected: a JSON response from the FastAPI application.

### 9.2 Studio via nginx

Open a browser and navigate to `http://your-server.example.com`. You should see
the Annotation Studio upload page.

### 9.3 End-to-end API check through nginx

```bash
curl http://your-server.example.com/api/documents/targets
```

Expected: a JSON response proxied from the Engine.

---

## 10. Maintenance

### Updating the application

```bash
cd /opt/annotation
git pull

# Rebuild the Studio if frontend files changed
cd studio
npm install
npm run build

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
