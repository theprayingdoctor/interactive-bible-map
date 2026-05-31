# How To Build & Deploy a Static Website — Detailed Guide
### From Idea to Live Website Using Claude Code

---

## OVERVIEW

**What this guide covers:** Building and deploying a static website (pure HTML/CSS/JavaScript — no server needed) with a custom domain, professional email, password protection, logo, and automatic deployment via GitHub and Netlify.

**Total estimated time:** 4-8 hours (spread across sessions)
**Total estimated cost:** ~$10-15/year (domain only; everything else is free)
**Skill level:** Beginner-friendly with basic tech comfort

**Tools you'll need:**
| Tool | Purpose | Cost |
|---|---|---|
| Claude Code (in VS Code) | AI coding assistant | Free |
| VS Code | Code editor | Free |
| Namecheap | Buy domain | ~$10-15/yr |
| Zoho Mail | Professional email | Free (basic) |
| GitHub | Store & version code | Free |
| Netlify | Host your website | Free |
| Inkscape | Convert logo to SVG | Free |

---

## PHASE 1: Planning Your Website
**Time: 30-60 min**

### What to do:
- **Define your purpose** — What does the website do? Who is it for? What problem does it solve?
  - *Why: Claude Code works best when you have a clear vision. Vague ideas lead to vague websites.*
- **Outline key features** — List everything you want: map, sidebar, buttons, language toggle, etc.
  - *Why: Having a feature list upfront prevents constant back-and-forth during development.*
- **Choose your color palette & fonts** — Pick 2-3 colors and 1-2 fonts that match your brand
  - *Why: Visual consistency makes a professional-looking site.*
- **Decide on a domain name** — Short, memorable, and relevant to your content
  - *Why: Your domain is your permanent address. Choose wisely before purchasing.*

### Pro tip:
Write a 2-3 sentence description of your site. Example: *"Interactive Bible Map is a free ministry resource that lets users explore Scripture geographically and chronologically through an interactive map. It shows key locations from Acts, Jesus' ministry, and Paul's letters."* Give this to Claude Code at the start.

---

## PHASE 2: Buying Your Domain
**Time: 15-30 min | Cost: ~$10-15/year**

### What to do:
1. **Go to Namecheap.com** — Reputable, affordable domain registrar
   - *Why: Namecheap is reliable, affordable, and has a straightforward DNS management interface.*
2. **Search for your domain name** — Try `.com` first; it's most recognizable
   - *Why: `.com` builds trust with users.*
3. **Add to cart and purchase** — Use a credit card or PayPal
4. **Enable auto-renew** — Toggle it ON in your account settings
   - *Why: If you forget to renew, you lose your domain. Auto-renew prevents this.*
5. **Leave DNS settings alone for now** — You'll configure these later when connecting to Netlify

### Cost breakdown:
- `.com` domain: ~$10-15/year at Namecheap
- Privacy protection (WithheldForPrivacy): Usually included free

---

## PHASE 3: Setting Up Professional Email
**Time: 30-45 min | Cost: Free (basic plan)**

### What to do:
1. **Go to zoho.com/mail** — Sign up for a free account
   - *Why: Zoho Mail lets you have `contact@yourdomain.com` instead of `yourname@gmail.com` — looks professional.*
2. **Add your domain** — Click "Add Domain" and enter your domain name
3. **Verify domain ownership** — Zoho gives you a TXT record to add in Namecheap
   - Go to Namecheap → Advanced DNS → Add TXT Record with the value Zoho provides
   - *Why: Proves to Zoho that you actually own the domain.*
4. **Add MX Records in Namecheap** — Zoho gives you specific MX record values
   - *Why: MX records tell the internet "send emails for this domain to Zoho's servers."*
5. **Wait 15-30 minutes** — DNS changes take time to propagate
6. **Complete Zoho setup** — Create your email address (e.g., `contact@yourdomain.com`)
7. **Download Zoho Mail app** — Available on iOS and Android (App Store / Google Play)
   - *Why: Lets you check your professional email from your phone.*

### Notes:
- Email **forwarding** requires a paid Zoho plan (~$1-4/month)
- Free plan lets you send/receive but not auto-forward to another email
- Zoho is privacy-friendly and trusted (no ad-scanning like Gmail)

---

## PHASE 4: Building the Website with Claude Code
**Time: 2-6 hours (varies by complexity)**

### What to do:
1. **Open VS Code** — Your coding workspace
2. **Create a project folder** — e.g., `C:\Users\YourName\my-website`
3. **Open Claude Code** — Press `Ctrl+Shift+P` → type "Claude" → open Claude Code panel
4. **Describe your website** — Be specific. Include:
   - Purpose and audience
   - Features you want
   - Colors and fonts
   - Any inspiration or examples
5. **Work iteratively** — Ask for one feature at a time, test it, then ask for the next
   - *Why: Small changes are easier to test and fix than building everything at once.*

### Key files Claude Code creates:
- **`index.html`** — The skeleton/structure of your page (what exists and where)
- **`css/styles.css`** — The visual design (colors, fonts, sizing, layout)
- **`js/app.js`** — The interactive behavior (what happens when you click things)
- **`js/locations.js`** — Your data (for a map site: location names, coordinates, descriptions)

### Add password protection:
Place this in `<head>` of `index.html` to hide the site until a password is entered:
```html
<style>
  body { display: none; }
  body.authenticated { display: block; }
</style>

<script>
  (function() {
    let authenticated = false;
    while (!authenticated) {
      const pw = prompt("Enter password:");
      if (pw === "yourpassword") {
        authenticated = true;
        document.body.classList.add("authenticated");
      } else if (pw === null) {
        window.location.href = "about:blank";
        break;
      }
    }
  })();
</script>
```
*Why: Hides the entire page before the DOM loads, preventing flash of content.*

### Testing locally:
- Double-click `index.html` to open in browser
- Press `Ctrl+Shift+R` to hard refresh after changes
- *Why: Always test locally before pushing to your live site.*

---

## PHASE 5: Setting Up GitHub (Version Control)
**Time: 15-30 min | Cost: Free**

### What is GitHub?
GitHub stores every version of your code. If you break something, you can go back. It also connects to Netlify for automatic deployments.

### What to do:
1. **Create account at github.com** — Free account is sufficient
2. **Create a new repository:**
   - Click `+` (top right) → New repository
   - Name it (e.g., `my-website`)
   - Leave as Public
   - Click "Create repository"
3. **Open VS Code terminal** — Press Ctrl+` (backtick)
4. **Configure Git identity** (one-time setup):
   ```bash
   git config --global user.email "you@example.com"
   git config --global user.name "Your Name"
   ```
5. **Initialize and connect your project:**
   ```bash
   git init
   git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
   git branch -M main
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
   - *Why: `git init` starts tracking your folder. `git remote add` connects it to GitHub. `git push` uploads it.*

6. **Authorize Git Credential Manager** — A popup will appear asking to authorize via browser. Click Authorize.
   - *Why: One-time permission so Git can securely communicate with GitHub.*

### For all future updates:
```bash
git add .
git commit -m "Short description of what changed"
git push
```
*Why: `add` stages changes, `commit` saves a snapshot, `push` sends it to GitHub.*

---

## PHASE 6: Hosting on Netlify
**Time: 15-20 min | Cost: Free**

### What is Netlify?
Netlify takes your code from GitHub and makes it available as a live website. Every time you push to GitHub, Netlify automatically rebuilds and publishes your site.

### What to do:
1. **Create account at netlify.com** — Free plan is sufficient for static sites
2. **First deploy (manual):**
   - In your Netlify dashboard, find the "Drag to deploy" section
   - Drag your entire project folder onto it
   - Wait for "Deploy successful" (green checkmark)
   - *Why: Gets your site live immediately while you connect GitHub.*
3. **Connect GitHub for auto-deploy:**
   - Go to your site → Deploy Settings
   - Click "Link to repository" → Select GitHub
   - Authorize Netlify → Select your repository
   - Click Deploy
   - *Why: After this, every `git push` automatically updates your live site.*
4. **Verify it's connected:**
   - In Deploys, you should see `Production: main@[commit hash] Published`
   - *Why: The commit hash confirms Netlify is reading from GitHub, not a manual upload.*

---

## PHASE 7: Connecting Your Domain to Netlify
**Time: 15-30 min (+ up to 24 hours for DNS to propagate)**

### What is DNS?
DNS is like a phonebook for the internet — it translates your domain name into the IP address of your server (Netlify).

### What to do:
1. **Go to Namecheap → Advanced DNS**
2. **Delete default records** — Remove the parking page CNAME and URL redirect records
3. **Add these records:**
   - Type: `A Record` | Host: `@` | Value: `75.2.60.5` | TTL: Automatic
   - Type: `CNAME Record` | Host: `www` | Value: `yourdomain.com` | TTL: Automatic
   - *Why: A Record points your root domain to Netlify's server. CNAME makes `www.` work too.*
4. **Save** — Click the checkmark on each record
5. **Wait 5-30 minutes** — DNS changes take time to spread worldwide
6. **Test** — Visit `yourdomain.com` and `www.yourdomain.com`

### What to expect:
- Some locations update faster than others (normal)
- Hard refresh (Ctrl+Shift+R) to bypass browser cache
- If still not working after 30 min, re-check the A Record value

---

## PHASE 8: Logo & Branding
**Time: 30-60 min**

### Creating a logo:
1. **Use AI image generator** (DALL-E, Midjourney, Adobe Firefly, etc.)
2. **Write a detailed prompt** including:
   - Site name and purpose
   - Visual elements (compass rose, map, cross, etc.)
   - Colors (provide hex codes if you have them)
   - Style (modern, classic, minimal, etc.)
   - How it will be used (web header, favicon, etc.)

### Converting PNG to SVG (with Inkscape):
*Why SVG? Scales perfectly at any size, ideal for logos, smaller file size.*
1. **Download Inkscape** at inkscape.org — Free, offline, privacy-safe
2. **Install** (follow installer wizard)
3. **Open your PNG logo:** File → Open → select your logo.png
4. **Trace the image:** Path → Trace Bitmap → click OK
5. **Export as SVG:** File → Export As → choose SVG format → Save
6. **Place in project:** Save as `images/logo.svg`
7. **Reference in HTML:** `<img src="images/logo.svg" alt="Logo" class="footer-logo">`

### Placing the logo:
- **Footer placement** (recommended for busy sites) — Groups logo + contact info naturally
- **Header placement** — Better for brand-forward sites with simpler headers

---

## TROUBLESHOOTING GUIDE

### DNS / Domain Issues

**Problem:** `DNS_PROBE_FINISHED_NXDOMAIN` — "This site can't be reached"
- **Cause:** DNS records missing, wrong, or haven't propagated yet
- **Fix:** Check Namecheap Advanced DNS — verify A Record (`@` → `75.2.60.5`) and CNAME (`www` → `yourdomain.com`) exist
- **Bypass:** Wait 5-30 min, then hard refresh (Ctrl+Shift+R)

**Problem:** DNS records keep disappearing
- **Cause:** Conflicting records (URL redirect or parking page overriding your A Record)
- **Fix:** Delete ALL existing records first, then add only the A Record and CNAME

**Problem:** `www.yourdomain.com` works but `yourdomain.com` doesn't (or vice versa)
- **Cause:** One of the two records (A Record or CNAME) is missing or wrong
- **Fix:** Verify both records exist in Namecheap Advanced DNS

---

### Git / GitHub Issues

**Problem:** `error: src refspec main does not match any`
- **Cause:** You tried to push before making a commit
- **Fix:** Run `git add .` then `git commit -m "message"` before pushing

**Problem:** `fatal: repository 'https://github.com/YOUR-USERNAME/...' not found`
- **Cause:** The remote URL still has placeholder text (`YOUR-USERNAME`) instead of your real username
- **Fix:** `git remote set-url origin https://github.com/YOURACTUALUSERNAME/REPO-NAME.git`

**Problem:** `Author identity unknown` — fatal error on commit
- **Cause:** Git doesn't know who you are yet (first-time setup)
- **Fix:**
  ```bash
  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"
  ```

**Problem:** `fatal: not a git repository`
- **Cause:** Git hasn't been initialized in your project folder
- **Fix:** Navigate to your project folder and run `git init`

**Problem:** Push appears to succeed but GitHub repo is still empty
- **Cause:** Remote URL was wrong (pointed to wrong/placeholder URL)
- **Fix:** Check with `git remote -v`, fix the URL, then push again

---

### Netlify / Deployment Issues

**Problem:** Netlify not auto-deploying after GitHub push
- **Cause:** Netlify is still set to "Netlify Drop" (manual upload) — GitHub not linked
- **Fix:** Go to Deploy Settings → Link to Git repository → Select your GitHub repo
- **How to verify it's working:** Look for `Production: main@[hash] Published` in Deploys tab

**Problem:** Site updates pushed to GitHub but live site hasn't changed
- **Fix 1:** Hard refresh (Ctrl+Shift+R)
- **Fix 2:** Check Netlify Deploys tab — is there a new deploy triggered today?
- **Fix 3:** If Netlify shows "Last deployed from Netlify Drop" — GitHub isn't connected yet

**Problem:** Deploy says "Published" but file (like image) is missing
- **Cause:** File wasn't included in the push (new files sometimes need explicit `git add`)
- **Fix:** Run `git add .` → `git commit -m "message"` → `git push` again

---

### Password Protection Issues

**Problem:** No password prompt — site loads directly
- **Cause:** Password script is placed after HTML has already started rendering
- **Fix:** Move password script to `<head>` tag with CSS `body { display: none }` trick (see Phase 4)

**Problem:** Password prompt appears but wrong password still loads the site
- **Cause:** Script only checks once and falls through
- **Fix:** Use a `while` loop that keeps prompting until correct password is entered

**Problem:** Clearing browser cache removes password session
- **Cause:** Normal behavior — cache clear wipes session storage
- **Fix:** This is expected. Just re-enter the password. Not a bug.

---

### Logo / Image Issues

**Problem:** Logo shows as broken image icon
- **Cause 1:** File path is wrong in HTML (check `src="images/logo.svg"`)
- **Cause 2:** File wasn't uploaded to Netlify (push the file to GitHub)
- **Cause 3:** PNG format has rendering issues — convert to SVG

**Problem:** Logo appears but is tiny/invisible
- **Cause:** CSS height set too small (e.g., `height: 20px` is very small for a complex logo)
- **Fix:** Increase CSS height: `.footer-logo { height: 36px; width: auto; }`

**Problem:** Inkscape Trace Bitmap looks bad / too noisy
- **Fix:** In Trace Bitmap dialog, reduce "Speckles" threshold and increase smoothing. Try "Brightness Cutoff" mode for cleaner results on logos with solid colors.

---

## QUICK REFERENCE: Commands You'll Use Most

```bash
# First-time Git setup
git init
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main

# Every time you update the site
git add .
git commit -m "Brief description of change"
git push

# Check what's going on
git status          # What files have changed?
git log             # What commits have been made?
git remote -v       # What URL is GitHub pointing to?

# Fix wrong remote URL
git remote set-url origin https://github.com/USERNAME/REPO.git
```

---

## CHECKLIST: Is Your Site Ready?

- [ ] Domain purchased and auto-renew ON
- [ ] Professional email set up and accessible on phone
- [ ] Website built and tested locally
- [ ] Password protection working (body hidden until correct password)
- [ ] GitHub repository created with all files pushed
- [ ] Netlify connected to GitHub (auto-deploy working)
- [ ] Custom domain DNS configured (A Record + CNAME)
- [ ] Site loads at yourdomain.com and www.yourdomain.com
- [ ] Logo displays correctly in footer/header
- [ ] Contact email shows and is clickable
- [ ] Hard refresh tested after each change

---

*Built under ThePrayingDoctor ministry · interactivebiblemap.com*
*Guide based on real build session — May 2026*
