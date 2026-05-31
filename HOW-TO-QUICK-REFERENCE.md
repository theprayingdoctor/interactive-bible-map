# How To Build & Deploy a Static Website — Quick Reference
### (1-2 Page Version)

---

## PHASE 1: The Idea & Tools Setup
- **Decide what your website does** — Define the purpose, audience, and content before writing any code
- **Get Claude Code** — AI coding assistant that writes and edits your website files
- **Get VS Code** — Text editor where your project files live; Claude Code runs inside it

---

## PHASE 2: Buy Your Domain
- **Go to Namecheap.com** — Purchase your domain name (e.g., `interactivebiblemap.com`) ~$10-15/year
- **Search for your desired domain** — Check availability and buy it
- **Keep auto-renew ON** — So you don't accidentally lose your domain

---

## PHASE 3: Set Up a Professional Email
- **Go to Zoho Mail (zoho.com/mail)** — Free professional email tied to your domain (e.g., `contact@yourdomain.com`)
- **Create account & add your domain** — Follow Zoho's setup wizard
- **Add MX records in Namecheap** — Tells the internet to send emails to Zoho (Zoho gives you the exact values)
- **Download Zoho Mail app** — Access your email from your phone
- **Note:** Email forwarding requires a paid Zoho plan

---

## PHASE 4: Build the Website
- **Work with Claude Code in VS Code** — Describe what you want, Claude writes the code
- **Key files created:**
  - `index.html` — The main page structure
  - `css/styles.css` — All the visual styling/colors
  - `js/app.js` — All the interactive features
- **Test locally** — Open `index.html` in your browser to preview before publishing
- **Add password protection** — Simple script in `index.html` to restrict access during development

---

## PHASE 5: Set Up GitHub (Version Control)
- **Create account at github.com** — Free; stores your code history
- **Create a new repository** — Name it after your project (e.g., `interactive-bible-map`)
- **Initialize Git in your project folder** (in VS Code terminal):
  ```
  git init
  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"
  git remote add origin https://github.com/USERNAME/REPO-NAME.git
  git branch -M main
  git add .
  git commit -m "Initial commit"
  git push -u origin main
  ```
- **Future updates** — Just 3 commands: `git add .` → `git commit -m "message"` → `git push`

---

## PHASE 6: Deploy on Netlify
- **Create account at netlify.com** — Free hosting for static websites
- **Link to GitHub repository** — Go to Deploy Settings → Link repository → select your GitHub repo
- **Auto-deploy is now ON** — Every `git push` automatically updates your live website
- **First time only:** May need to manually drag-and-drop your folder to get started

---

## PHASE 7: Connect Domain to Netlify
- **In Namecheap Advanced DNS** — Delete default records, then add:
  - `A Record` → Host: `@` → Value: `75.2.60.5` (Netlify's IP)
  - `CNAME Record` → Host: `www` → Value: `yourdomain.com`
- **Wait 5-30 minutes** — DNS propagates worldwide (green checks = working)
- **Test your domain** — Visit `yourdomain.com` in browser

---

## PHASE 8: Logo & Branding
- **Generate logo with AI** — Use DALL-E, Midjourney, or Adobe Firefly with a detailed prompt
- **Convert PNG to SVG** — Use Inkscape (free, offline, safe): File → Open PNG → Path → Trace Bitmap → Export as SVG
- **Place in `images/` folder** — Reference as `images/logo.svg` in HTML
- **Footer placement** — Add logo + contact email to site footer

---

## TROUBLESHOOTING QUICK FIXES

| Problem | Fix |
|---|---|
| Site not loading (DNS_PROBE_NXDOMAIN) | Check A Record & CNAME in Namecheap DNS |
| Password not working | Move password script to `<head>`, hide body until authenticated |
| Logo broken image | Convert PNG to SVG; verify file is in `images/` folder |
| GitHub push fails | Check remote URL: `git remote -v` → fix with `git remote set-url origin CORRECT-URL` |
| Netlify not auto-deploying | Go to Deploy Settings → Link to GitHub repository |
| Changes not showing on site | Hard refresh: Ctrl+Shift+R |

---
*Built under ThePrayingDoctor ministry · interactivebiblemap.com*
