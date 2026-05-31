const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── Colors & fonts ────────────────────────────────────────────────
const NAVY   = '#1B3A5C';
const GOLD   = '#C9A84C';
const WHITE  = '#FFFFFF';
const DARK   = '#1A1A1A';
const MID    = '#444444';
const LIGHT  = '#777777';
const RULE   = '#D0C4A8';
const BG_HDR = '#1B3A5C';

function createDoc(outputPath) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER', autoFirstPage: true });
  doc.pipe(fs.createWriteStream(outputPath));
  return doc;
}

function pageHeader(doc, title, subtitle) {
  // Navy header band
  doc.rect(0, 0, doc.page.width, 70).fill(BG_HDR);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18)
     .text(title, 50, 18, { width: doc.page.width - 100 });
  doc.fillColor(WHITE).font('Helvetica').fontSize(10)
     .text(subtitle, 50, 42, { width: doc.page.width - 100 });
  doc.y = 88;
  doc.fillColor(DARK);
}

function sectionHeading(doc, text) {
  if (doc.y > doc.page.height - 120) { doc.addPage(); pageContHeader(doc); }
  doc.moveDown(0.6);
  doc.rect(50, doc.y, doc.page.width - 100, 22).fill(NAVY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
     .text(text, 58, doc.y - 18, { width: doc.page.width - 116 });
  doc.moveDown(0.15);
  doc.fillColor(DARK);
}

function subHeading(doc, text) {
  if (doc.y > doc.page.height - 100) { doc.addPage(); pageContHeader(doc); }
  doc.moveDown(0.4);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10.5).text(text, 50);
  doc.moveDown(0.1);
  doc.fillColor(DARK);
}

function bodyText(doc, text, indent = 50) {
  if (doc.y > doc.page.height - 80) { doc.addPage(); pageContHeader(doc); }
  doc.font('Helvetica').fontSize(9.5).fillColor(DARK)
     .text(text, indent, doc.y, { width: doc.page.width - indent - 50, lineGap: 2 });
}

function bullet(doc, label, desc, indent = 62) {
  if (doc.y > doc.page.height - 80) { doc.addPage(); pageContHeader(doc); }
  const width = doc.page.width - indent - 50;
  const startY = doc.y;
  doc.font('Helvetica').fontSize(9).fillColor(GOLD).text('•', 50, startY, { width: 10, continued: false });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
     .text(label + ' ', indent, startY, { width, continued: !!desc, lineGap: 2 });
  if (desc) {
    doc.font('Helvetica').fillColor(MID).text('— ' + desc, { width: doc.page.width - doc.x - 50, lineGap: 2 });
  }
}

function numberedItem(doc, num, label, desc, indent = 68) {
  if (doc.y > doc.page.height - 80) { doc.addPage(); pageContHeader(doc); }
  const width = doc.page.width - indent - 50;
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text(`${num}.`, 50, startY, { width: 16 });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK)
     .text(label + (desc ? ' ' : ''), indent, startY, { width, continued: !!desc, lineGap: 2 });
  if (desc) {
    doc.font('Helvetica').fillColor(MID).text('— ' + desc, { width: doc.page.width - doc.x - 50, lineGap: 2 });
  }
}

function italic(doc, text, indent = 68) {
  if (doc.y > doc.page.height - 60) { doc.addPage(); pageContHeader(doc); }
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(LIGHT)
     .text(text, indent, doc.y, { width: doc.page.width - indent - 50, lineGap: 2 });
}

function codeBlock(doc, lines) {
  if (doc.y > doc.page.height - 100) { doc.addPage(); pageContHeader(doc); }
  doc.moveDown(0.3);
  const blockH = lines.length * 13 + 12;
  doc.rect(50, doc.y, doc.page.width - 100, blockH).fill('#F0EBE0');
  let cy = doc.y + 6;
  lines.forEach(line => {
    doc.font('Courier').fontSize(8).fillColor('#2C3E50')
       .text(line, 58, cy, { width: doc.page.width - 116, lineGap: 0 });
    cy += 13;
  });
  doc.y = cy + 6;
  doc.fillColor(DARK);
  doc.moveDown(0.3);
}

function rule(doc) {
  doc.moveDown(0.4);
  doc.strokeColor(RULE).lineWidth(0.5)
     .moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
  doc.moveDown(0.4);
}

function tableRow(doc, col1, col2, isHeader = false) {
  if (doc.y > doc.page.height - 60) { doc.addPage(); pageContHeader(doc); }
  const rowH = 18;
  const col1W = 200;
  const col2W = doc.page.width - 100 - col1W;
  if (isHeader) {
    doc.rect(50, doc.y, doc.page.width - 100, rowH).fill(NAVY);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
       .text(col1, 56, doc.y - rowH + 5, { width: col1W })
       .text(col2, 56 + col1W, doc.y - rowH + 5, { width: col2W });
  } else {
    doc.rect(50, doc.y, doc.page.width - 100, rowH).fill(doc._rowAlt ? '#F7F3EC' : WHITE);
    doc._rowAlt = !doc._rowAlt;
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5)
       .text(col1, 56, doc.y - rowH + 5, { width: col1W });
    doc.font('Helvetica').fontSize(8.5).fillColor(MID)
       .text(col2, 56 + col1W, doc.y - 13, { width: col2W });
  }
  doc.y += 2;
  doc.fillColor(DARK);
}

function footer(doc) {
  const y = doc.page.height - 35;
  const savedY = doc.y;
  doc.strokeColor(GOLD).lineWidth(0.5)
     .moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  doc.save();
  doc.font('Helvetica').fontSize(7.5).fillColor(LIGHT)
     .text('ThePrayingDoctor Ministry · interactivebiblemap.com · How-To Guide', 50, y + 6,
           { width: doc.page.width - 100, align: 'center', lineBreak: false });
  doc.restore();
  doc.y = savedY;
}

let _contTitle = '';
function pageContHeader(doc) {
  doc.rect(0, 0, doc.page.width, 40).fill(BG_HDR);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(11)
     .text(_contTitle + ' (continued)', 50, 13, { width: doc.page.width - 100 });
  doc.y = 56;
  doc.fillColor(DARK);
}

// ══════════════════════════════════════════════════════════════════
// QUICK REFERENCE PDF
// ══════════════════════════════════════════════════════════════════
function buildQuickRef(outputPath) {
  const doc = createDoc(outputPath);
  _contTitle = 'How To Build & Deploy a Website — Quick Reference';

  doc._inFooter = false;
  doc.on('pageAdded', () => {
    if (doc._inFooter) return;
    doc._inFooter = true;
    const savedY = doc.y;
    const y = doc.page.height - 35;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    doc.font('Helvetica').fontSize(7.5)
       .text('ThePrayingDoctor Ministry · interactivebiblemap.com · How-To Guide',
             50, y + 6, { width: doc.page.width - 100, align: 'center', lineBreak: false });
    doc.y = savedY;
    doc._inFooter = false;
  });

  pageHeader(doc,
    'How To Build & Deploy a Static Website',
    'Quick Reference Guide · ThePrayingDoctor Ministry');

  // Overview row
  doc.font('Helvetica').fontSize(9).fillColor(MID)
     .text('8 Phases · ~4-8 hours total · ~$10-15/year · Everything else is FREE', 50, doc.y,
           { width: doc.page.width - 100, align: 'center' });
  doc.moveDown(0.6);

  // Phase 1
  sectionHeading(doc, 'PHASE 1 — The Idea & Tools Setup');
  bullet(doc, 'Decide what your website does', 'Define purpose, audience, and content before writing any code');
  bullet(doc, 'Get Claude Code', 'AI coding assistant that writes and edits your website files (inside VS Code)');
  bullet(doc, 'Get VS Code', 'Free text editor where your project files live');

  // Phase 2
  sectionHeading(doc, 'PHASE 2 — Buy Your Domain  (~$10-15/year)');
  bullet(doc, 'Go to Namecheap.com', 'Purchase your domain name (e.g., yourdomain.com)');
  bullet(doc, 'Search and buy', 'Choose .com for best trust and recognition');
  bullet(doc, 'Enable auto-renew', 'So you never accidentally lose your domain');

  // Phase 3
  sectionHeading(doc, 'PHASE 3 — Set Up Professional Email  (Free basic)');
  bullet(doc, 'Go to zoho.com/mail', 'Free professional email tied to your domain (contact@yourdomain.com)');
  bullet(doc, 'Add your domain', 'Follow Zoho\'s setup wizard');
  bullet(doc, 'Add MX Records in Namecheap', 'Tells the internet to route emails to Zoho');
  bullet(doc, 'Download Zoho Mail app', 'Access your professional email from your phone');
  italic(doc, 'Note: Email forwarding requires a paid Zoho plan (~$1-4/month)');

  // Phase 4
  sectionHeading(doc, 'PHASE 4 — Build the Website  (2-6 hours)');
  bullet(doc, 'Work with Claude Code in VS Code', 'Describe what you want — Claude writes the code');
  bullet(doc, 'index.html', 'The main page structure (skeleton)');
  bullet(doc, 'css/styles.css', 'All the visual styling and colors');
  bullet(doc, 'js/app.js', 'All the interactive features and behavior');
  bullet(doc, 'Test locally', 'Open index.html in your browser to preview before publishing');
  bullet(doc, 'Add password protection', 'Script in <head> of index.html — hides body until correct password');

  // Phase 5
  sectionHeading(doc, 'PHASE 5 — Set Up GitHub  (Free)');
  bullet(doc, 'Create account at github.com', 'Stores your code history and enables auto-deploy');
  bullet(doc, 'Create a new repository', 'Name it after your project');
  bodyText(doc, 'Run these commands in VS Code terminal (one-time setup):', 62);
  doc.moveDown(0.2);
  codeBlock(doc, [
    'git init',
    'git config --global user.email "you@example.com"',
    'git config --global user.name "Your Name"',
    'git remote add origin https://github.com/USERNAME/REPO-NAME.git',
    'git branch -M main',
    'git add .',
    'git commit -m "Initial commit"',
    'git push -u origin main',
  ]);
  bullet(doc, 'Future updates', 'Just 3 commands: git add .  →  git commit -m "msg"  →  git push');

  // Phase 6
  sectionHeading(doc, 'PHASE 6 — Deploy on Netlify  (Free)');
  bullet(doc, 'Create account at netlify.com', 'Free hosting for static websites');
  bullet(doc, 'First deploy', 'Drag your project folder onto the Netlify "Drag to deploy" area');
  bullet(doc, 'Link GitHub repository', 'Deploy Settings → Link repository → select your GitHub repo');
  bullet(doc, 'Auto-deploy is now ON', 'Every git push automatically updates your live website');

  // Phase 7
  sectionHeading(doc, 'PHASE 7 — Connect Domain to Netlify  (15-30 min + propagation)');
  bullet(doc, 'Go to Namecheap → Advanced DNS', 'Delete all default records first');
  bullet(doc, 'Add A Record', 'Host: @  |  Value: 75.2.60.5  |  TTL: Automatic');
  bullet(doc, 'Add CNAME Record', 'Host: www  |  Value: yourdomain.com  |  TTL: Automatic');
  bullet(doc, 'Wait 5-30 minutes', 'DNS propagates worldwide — green checks mean it\'s working');
  bullet(doc, 'Test', 'Visit yourdomain.com and www.yourdomain.com in your browser');

  // Phase 8
  sectionHeading(doc, 'PHASE 8 — Logo & Branding');
  bullet(doc, 'Generate logo with AI', 'Use DALL-E, Midjourney, or Adobe Firefly with a detailed prompt');
  bullet(doc, 'Convert PNG to SVG', 'Inkscape (free, offline): File → Open PNG → Path → Trace Bitmap → Export SVG');
  bullet(doc, 'Place in images/ folder', 'Reference as images/logo.svg in your HTML');
  bullet(doc, 'Footer placement', 'Add logo + contact email to site footer');

  // Troubleshooting table
  sectionHeading(doc, 'TROUBLESHOOTING QUICK FIXES');
  doc.moveDown(0.3);
  doc._rowAlt = false;
  tableRow(doc, 'Problem', 'Fix', true);
  tableRow(doc, 'Site not loading (DNS_PROBE_NXDOMAIN)', 'Check A Record & CNAME in Namecheap Advanced DNS');
  tableRow(doc, 'Password not working', 'Move script to <head> with body { display:none } trick');
  tableRow(doc, 'Logo shows broken image icon', 'Convert PNG to SVG; verify file is in images/ folder');
  tableRow(doc, 'GitHub push fails', 'Check: git remote -v  →  fix with: git remote set-url origin CORRECT-URL');
  tableRow(doc, 'Netlify not auto-deploying', 'Deploy Settings → Link to GitHub repository');
  tableRow(doc, 'Changes not showing on site', 'Hard refresh: Ctrl+Shift+R');

  doc.end();
  console.log('✅ Quick Reference PDF saved to:', outputPath);
}

// ══════════════════════════════════════════════════════════════════
// DETAILED GUIDE PDF
// ══════════════════════════════════════════════════════════════════
function buildDetailedGuide(outputPath) {
  const doc = createDoc(outputPath);
  _contTitle = 'How To Build & Deploy a Website — Detailed Guide';

  doc._inFooter = false;
  doc.on('pageAdded', () => {
    if (doc._inFooter) return;
    doc._inFooter = true;
    const savedY = doc.y;
    const y = doc.page.height - 35;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    doc.font('Helvetica').fontSize(7.5)
       .text('ThePrayingDoctor Ministry · interactivebiblemap.com · How-To Guide',
             50, y + 6, { width: doc.page.width - 100, align: 'center', lineBreak: false });
    doc.y = savedY;
    doc._inFooter = false;
  });

  pageHeader(doc,
    'How To Build & Deploy a Static Website — Detailed Guide',
    'From Idea to Live Website Using Claude Code · ThePrayingDoctor Ministry');

  // Overview box
  doc.rect(50, doc.y, doc.page.width - 100, 56).fill('#F0EBE0');
  const ox = 60, oy = doc.y + 8;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('OVERVIEW', ox, oy);
  doc.font('Helvetica').fontSize(8.5).fillColor(DARK)
     .text('Total time: 4-8 hours (spread across sessions)  ·  Total cost: ~$10-15/year (domain only — everything else is free)', ox, oy + 13, { width: doc.page.width - 120 })
     .text('Skill level: Beginner-friendly with basic tech comfort', ox, oy + 26, { width: doc.page.width - 120 })
     .text('What this covers: HTML/CSS/JS static site · custom domain · professional email · GitHub version control · Netlify hosting · logo branding', ox, oy + 38, { width: doc.page.width - 120 });
  doc.y += 64;
  doc.fillColor(DARK);

  // Tools table
  doc.moveDown(0.4);
  subHeading(doc, 'Tools You\'ll Need');
  doc.moveDown(0.2);
  doc._rowAlt = false;
  tableRow(doc, 'Tool', 'Purpose  ·  Cost', true);
  tableRow(doc, 'Claude Code (in VS Code)', 'AI coding assistant  ·  Free');
  tableRow(doc, 'VS Code', 'Code editor  ·  Free');
  tableRow(doc, 'Namecheap', 'Buy domain  ·  ~$10-15/year');
  tableRow(doc, 'Zoho Mail', 'Professional email  ·  Free (basic)');
  tableRow(doc, 'GitHub', 'Store & version code  ·  Free');
  tableRow(doc, 'Netlify', 'Host your website  ·  Free');
  tableRow(doc, 'Inkscape', 'Convert logo PNG to SVG  ·  Free');

  // Phase 1
  sectionHeading(doc, 'PHASE 1 — Planning Your Website  |  Time: 30-60 min');
  numberedItem(doc, 1, 'Define your purpose', 'What does it do? Who is it for? What problem does it solve?');
  italic(doc, 'Why: Claude Code works best with a clear vision. Vague ideas lead to vague websites.');
  numberedItem(doc, 2, 'Outline key features', 'List everything you want before you start building');
  italic(doc, 'Why: A feature list prevents constant back-and-forth during development.');
  numberedItem(doc, 3, 'Choose your color palette & fonts', 'Pick 2-3 colors and 1-2 fonts that match your brand');
  italic(doc, 'Why: Visual consistency makes a professional-looking site.');
  numberedItem(doc, 4, 'Decide on a domain name', 'Short, memorable, and relevant to your content');
  italic(doc, 'Why: Your domain is your permanent address. Choose wisely before purchasing.');
  doc.moveDown(0.3);
  doc.rect(50, doc.y, doc.page.width - 100, 32).fill('#EAF4FB');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY).text('PRO TIP:', 58, doc.y - 24);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MID)
     .text('Write a 2-3 sentence description of your site and give it to Claude Code at the start. Example: "Interactive Bible Map is a free ministry resource that lets users explore Scripture geographically and chronologically."', 58, doc.y - 13, { width: doc.page.width - 116 });
  doc.y += 8;

  // Phase 2
  sectionHeading(doc, 'PHASE 2 — Buying Your Domain  |  Time: 15-30 min  |  Cost: ~$10-15/year');
  numberedItem(doc, 1, 'Go to Namecheap.com', 'Reputable, affordable domain registrar');
  italic(doc, 'Why: Reliable, affordable, and has a straightforward DNS management interface.');
  numberedItem(doc, 2, 'Search for your domain name', 'Try .com first — most recognizable and trusted');
  numberedItem(doc, 3, 'Purchase the domain', 'Use credit card or PayPal');
  numberedItem(doc, 4, 'Enable auto-renew', 'Toggle it ON in your account settings');
  italic(doc, 'Why: If you forget to renew, you lose your domain permanently. Auto-renew prevents this.');
  numberedItem(doc, 5, 'Leave DNS settings alone for now', 'You\'ll configure these later when connecting to Netlify');
  bodyText(doc, 'Cost: .com domain ~$10-15/year · Privacy protection (WithheldForPrivacy): usually included free', 62);

  // Phase 3
  sectionHeading(doc, 'PHASE 3 — Professional Email Setup  |  Time: 30-45 min  |  Cost: Free (basic)');
  numberedItem(doc, 1, 'Go to zoho.com/mail', 'Sign up for a free account');
  italic(doc, 'Why: Gives you contact@yourdomain.com instead of yourname@gmail.com — looks professional.');
  numberedItem(doc, 2, 'Add your domain', 'Click "Add Domain" and enter your domain name');
  numberedItem(doc, 3, 'Verify domain ownership', 'Zoho gives you a TXT record to add in Namecheap → Advanced DNS');
  italic(doc, 'Why: Proves to Zoho that you actually own the domain.');
  numberedItem(doc, 4, 'Add MX Records in Namecheap', 'Zoho gives you specific MX values to enter');
  italic(doc, 'Why: MX records tell the internet "send emails for this domain to Zoho\'s servers."');
  numberedItem(doc, 5, 'Wait 15-30 minutes', 'DNS changes take time to propagate');
  numberedItem(doc, 6, 'Complete Zoho setup', 'Create your email address (e.g., contact@yourdomain.com)');
  numberedItem(doc, 7, 'Download Zoho Mail app', 'Available on iOS (App Store) and Android (Google Play)');
  doc.moveDown(0.2);
  bodyText(doc, '⚠ Note: Email forwarding requires a paid Zoho plan (~$1-4/month). Free plan = send/receive only.', 62);

  // Phase 4
  sectionHeading(doc, 'PHASE 4 — Building the Website  |  Time: 2-6 hours');
  numberedItem(doc, 1, 'Open VS Code', 'Your coding workspace');
  numberedItem(doc, 2, 'Create a project folder', 'e.g., C:\\Users\\YourName\\my-website');
  numberedItem(doc, 3, 'Open Claude Code', 'Ctrl+Shift+P → type "Claude" → open panel');
  numberedItem(doc, 4, 'Describe your website to Claude', 'Include: purpose, features, colors, fonts, examples');
  numberedItem(doc, 5, 'Work iteratively', 'Ask for one feature at a time — test it — then ask for the next');
  italic(doc, 'Why: Small changes are easier to test and fix than building everything at once.');
  doc.moveDown(0.3);
  subHeading(doc, 'Key files Claude Code creates:');
  bullet(doc, 'index.html', 'The skeleton/structure of your page (what elements exist and where)');
  bullet(doc, 'css/styles.css', 'The visual design — colors, fonts, sizing, layout');
  bullet(doc, 'js/app.js', 'The interactive behavior — what happens when you click things');
  bullet(doc, 'js/locations.js', 'Your data (for a map: location names, coordinates, descriptions)');
  doc.moveDown(0.3);
  subHeading(doc, 'Password Protection — Add to <head> of index.html:');
  codeBlock(doc, [
    '<style>',
    '  body { display: none; }',
    '  body.authenticated { display: block; }',
    '</style>',
    '<script>',
    '  (function() {',
    '    let authenticated = false;',
    '    while (!authenticated) {',
    '      const pw = prompt("Enter password:");',
    '      if (pw === "yourpassword") {',
    '        authenticated = true;',
    '        document.body.classList.add("authenticated");',
    '      } else if (pw === null) {',
    '        window.location.href = "about:blank"; break;',
    '      }',
    '    }',
    '  })();',
    '</script>',
  ]);
  italic(doc, 'Why: Hides the entire page before the DOM loads — prevents flash of content before password check.');

  // Phase 5
  sectionHeading(doc, 'PHASE 5 — Setting Up GitHub  |  Time: 15-30 min  |  Cost: Free');
  bodyText(doc, 'GitHub stores every version of your code. If you break something, you can go back. It also connects to Netlify for automatic deployments.', 62);
  doc.moveDown(0.2);
  numberedItem(doc, 1, 'Create account at github.com', 'Free account is sufficient');
  numberedItem(doc, 2, 'Create a new repository', 'Click + (top right) → New repository → Name it → Leave as Public → Create');
  numberedItem(doc, 3, 'Open VS Code terminal', 'Press Ctrl+` (backtick key)');
  numberedItem(doc, 4, 'Configure Git identity (one-time setup)', '');
  codeBlock(doc, [
    'git config --global user.email "you@example.com"',
    'git config --global user.name "Your Name"',
  ]);
  numberedItem(doc, 5, 'Initialize and connect your project:', '');
  codeBlock(doc, [
    'git init',
    'git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git',
    'git branch -M main',
    'git add .',
    'git commit -m "Initial commit"',
    'git push -u origin main',
  ]);
  italic(doc, 'git init = start tracking · git remote add = connect to GitHub · git push = upload files');
  numberedItem(doc, 6, 'Authorize Git Credential Manager', 'A popup appears — click Authorize in browser (one-time only)');
  doc.moveDown(0.3);
  subHeading(doc, 'For ALL future updates (just 3 commands):');
  codeBlock(doc, [
    'git add .',
    'git commit -m "Brief description of what changed"',
    'git push',
  ]);

  // Phase 6
  sectionHeading(doc, 'PHASE 6 — Hosting on Netlify  |  Time: 15-20 min  |  Cost: Free');
  bodyText(doc, 'Netlify takes your code from GitHub and makes it a live website. Every push to GitHub automatically rebuilds and publishes your site.', 62);
  doc.moveDown(0.2);
  numberedItem(doc, 1, 'Create account at netlify.com', 'Free plan is sufficient for static sites');
  numberedItem(doc, 2, 'First deploy (manual)', 'Drag your entire project folder onto the "Drag to deploy" section');
  italic(doc, 'Why: Gets your site live immediately while you set up the GitHub connection.');
  numberedItem(doc, 3, 'Connect GitHub for auto-deploy', 'Deploy Settings → Link to repository → GitHub → select your repo → Deploy');
  italic(doc, 'Why: After this, every git push automatically updates your live site.');
  numberedItem(doc, 4, 'Verify the connection', 'In Deploys tab look for: Production: main@[hash] Published');
  italic(doc, 'Why: The commit hash confirms Netlify is reading from GitHub, not a manual upload.');

  // Phase 7
  sectionHeading(doc, 'PHASE 7 — Connecting Domain to Netlify  |  Time: 15-30 min + propagation');
  bodyText(doc, 'DNS is like a phonebook for the internet — it translates your domain name into the IP address of Netlify\'s server.', 62);
  doc.moveDown(0.2);
  numberedItem(doc, 1, 'Go to Namecheap → Advanced DNS', '');
  numberedItem(doc, 2, 'Delete default records', 'Remove parking page CNAME and URL redirect records');
  numberedItem(doc, 3, 'Add these two records:', '');
  doc.moveDown(0.2);
  doc._rowAlt = false;
  tableRow(doc, 'Type', 'Host  ·  Value  ·  TTL', true);
  tableRow(doc, 'A Record', '@  ·  75.2.60.5  ·  Automatic');
  tableRow(doc, 'CNAME Record', 'www  ·  yourdomain.com  ·  Automatic');
  doc.moveDown(0.2);
  italic(doc, 'Why: A Record points your root domain to Netlify. CNAME makes www. work too.');
  numberedItem(doc, 4, 'Save each record', 'Click the checkmark on each row');
  numberedItem(doc, 5, 'Wait 5-30 minutes', 'DNS changes spread worldwide — some locations update faster');
  numberedItem(doc, 6, 'Test', 'Visit yourdomain.com and www.yourdomain.com · Hard refresh: Ctrl+Shift+R');

  // Phase 8
  sectionHeading(doc, 'PHASE 8 — Logo & Branding  |  Time: 30-60 min');
  subHeading(doc, 'Creating a logo with AI:');
  numberedItem(doc, 1, 'Use an AI image generator', 'DALL-E, Midjourney, Adobe Firefly, etc.');
  numberedItem(doc, 2, 'Write a detailed prompt including:', 'Site name and purpose · visual elements · color hex codes · style · usage size');
  doc.moveDown(0.3);
  subHeading(doc, 'Converting PNG to SVG using Inkscape (free, offline, privacy-safe):');
  italic(doc, 'Why SVG? Scales perfectly at any size — ideal for logos, crisp at all resolutions.');
  doc.moveDown(0.15);
  numberedItem(doc, 1, 'Download Inkscape at inkscape.org', 'Free, open-source, works completely offline');
  numberedItem(doc, 2, 'Install', 'Follow the installer wizard');
  numberedItem(doc, 3, 'Open your PNG', 'File → Open → select your logo.png');
  numberedItem(doc, 4, 'Trace the image', 'Path → Trace Bitmap → click OK');
  numberedItem(doc, 5, 'Export as SVG', 'File → Export As → choose SVG format → Save');
  numberedItem(doc, 6, 'Place in project', 'Save as images/logo.svg');
  numberedItem(doc, 7, 'Reference in HTML', '<img src="images/logo.svg" alt="Logo" class="footer-logo">');
  doc.moveDown(0.2);
  subHeading(doc, 'Placement options:');
  bullet(doc, 'Footer (recommended for busy sites)', 'Groups logo + contact info naturally, keeps header clean');
  bullet(doc, 'Header', 'Better for brand-forward sites with simpler navigation');

  // Troubleshooting
  sectionHeading(doc, 'TROUBLESHOOTING — DNS / Domain Issues');
  subHeading(doc, 'DNS_PROBE_FINISHED_NXDOMAIN — "This site can\'t be reached"');
  bodyText(doc, 'Cause: DNS records missing, wrong, or haven\'t propagated yet', 68);
  bodyText(doc, 'Fix: Check Namecheap Advanced DNS — verify A Record (@ → 75.2.60.5) and CNAME (www → yourdomain.com)', 68);
  bodyText(doc, 'Bypass: Wait 5-30 min, hard refresh (Ctrl+Shift+R), try incognito window', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'DNS records keep disappearing');
  bodyText(doc, 'Cause: Conflicting records (parking page CNAME or URL redirect overriding your A Record)', 68);
  bodyText(doc, 'Fix: Delete ALL existing records first, then add only the A Record and CNAME', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'www.yourdomain.com works but yourdomain.com doesn\'t (or vice versa)');
  bodyText(doc, 'Cause: One of the two records is missing or incorrect', 68);
  bodyText(doc, 'Fix: Verify BOTH records exist in Namecheap Advanced DNS', 68);

  sectionHeading(doc, 'TROUBLESHOOTING — Git / GitHub Issues');
  subHeading(doc, '"error: src refspec main does not match any"');
  bodyText(doc, 'Cause: Tried to push before making a commit', 68);
  bodyText(doc, 'Fix: Run git add . then git commit -m "message" before pushing', 68);
  doc.moveDown(0.3);
  subHeading(doc, '"fatal: repository not found" or YOUR-USERNAME still in URL');
  bodyText(doc, 'Cause: Remote URL has placeholder text instead of your real username', 68);
  codeBlock(doc, ['git remote set-url origin https://github.com/YOURACTUALUSERNAME/REPO-NAME.git']);
  subHeading(doc, '"Author identity unknown"');
  bodyText(doc, 'Cause: First-time setup — Git doesn\'t know who you are yet', 68);
  codeBlock(doc, [
    'git config --global user.email "you@example.com"',
    'git config --global user.name "Your Name"',
  ]);
  subHeading(doc, 'Push succeeds but GitHub repo is still empty');
  bodyText(doc, 'Cause: Remote URL was wrong during the push', 68);
  bodyText(doc, 'Fix: Check git remote -v · fix URL · push again', 68);

  sectionHeading(doc, 'TROUBLESHOOTING — Netlify / Deployment Issues');
  subHeading(doc, 'Netlify not auto-deploying after GitHub push');
  bodyText(doc, 'Cause: Netlify still set to "Netlify Drop" — GitHub not linked yet', 68);
  bodyText(doc, 'Fix: Deploy Settings → Link to Git repository → Select your GitHub repo', 68);
  bodyText(doc, 'Verify: Deploys tab should show Production: main@[hash] Published', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'Site updates pushed but live site hasn\'t changed');
  bodyText(doc, 'Fix 1: Hard refresh (Ctrl+Shift+R)', 68);
  bodyText(doc, 'Fix 2: Check Netlify Deploys tab — is there a new deploy triggered today?', 68);
  bodyText(doc, 'Fix 3: If still showing "Last deployed from Netlify Drop" — GitHub connection incomplete', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'Deploy says "Published" but image/file is missing');
  bodyText(doc, 'Cause: New file wasn\'t included in the push', 68);
  bodyText(doc, 'Fix: Run git add . → git commit -m "message" → git push again', 68);

  sectionHeading(doc, 'TROUBLESHOOTING — Password Protection Issues');
  subHeading(doc, 'No password prompt — site loads directly');
  bodyText(doc, 'Cause: Password script placed after HTML has started rendering', 68);
  bodyText(doc, 'Fix: Move script to <head> with body { display:none } — body.authenticated { display:block }', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'Wrong password still loads the site');
  bodyText(doc, 'Cause: Script only checks once and falls through', 68);
  bodyText(doc, 'Fix: Use a while loop that keeps prompting until the correct password is entered', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'Clearing browser cache removes password session');
  bodyText(doc, 'This is NORMAL behavior. Cache clear wipes session storage. Just re-enter the password.', 68);

  sectionHeading(doc, 'TROUBLESHOOTING — Logo / Image Issues');
  subHeading(doc, 'Logo shows as broken image icon');
  bodyText(doc, 'Cause 1: File path wrong in HTML (check src="images/logo.svg")', 68);
  bodyText(doc, 'Cause 2: File not pushed to GitHub (run git add . → commit → push)', 68);
  bodyText(doc, 'Cause 3: PNG format has rendering issues — convert to SVG using Inkscape', 68);
  doc.moveDown(0.3);
  subHeading(doc, 'Logo appears but is tiny / barely visible');
  bodyText(doc, 'Cause: CSS height set too small', 68);
  codeBlock(doc, ['.footer-logo { height: 36px; width: auto; }']);
  subHeading(doc, 'Inkscape Trace Bitmap looks noisy');
  bodyText(doc, 'Fix: In Trace Bitmap dialog, reduce Speckles threshold and increase smoothing.', 68);
  bodyText(doc, 'Try "Brightness Cutoff" mode for cleaner results on logos with solid colors.', 68);

  // Commands cheat sheet
  sectionHeading(doc, 'QUICK REFERENCE — Git Commands You\'ll Use Most');
  codeBlock(doc, [
    '# First-time Git setup',
    'git init',
    'git config --global user.email "you@example.com"',
    'git config --global user.name "Your Name"',
    'git remote add origin https://github.com/USERNAME/REPO.git',
    'git branch -M main',
    '',
    '# Every time you update the site',
    'git add .',
    'git commit -m "Brief description of change"',
    'git push',
    '',
    '# Check what\'s going on',
    'git status          # What files have changed?',
    'git log             # What commits have been made?',
    'git remote -v       # What URL is GitHub pointing to?',
    '',
    '# Fix wrong remote URL',
    'git remote set-url origin https://github.com/USERNAME/REPO.git',
  ]);

  // Checklist
  sectionHeading(doc, 'CHECKLIST — Is Your Site Ready to Share?');
  const checks = [
    'Domain purchased and auto-renew ON',
    'Professional email set up and accessible on phone',
    'Website built and tested locally in browser',
    'Password protection working (body hidden until correct password)',
    'GitHub repository created with all files pushed',
    'Netlify connected to GitHub (auto-deploy confirmed working)',
    'Custom domain DNS configured (A Record + CNAME in Namecheap)',
    'Site loads at yourdomain.com and www.yourdomain.com',
    'Logo displays correctly in footer/header',
    'Contact email shows and is clickable (mailto: link)',
    'Hard refresh tested after each change (Ctrl+Shift+R)',
  ];
  checks.forEach(item => {
    doc.moveDown(0.15);
    doc.rect(58, doc.y, 10, 10).stroke(NAVY);
    doc.font('Helvetica').fontSize(9).fillColor(DARK)
       .text(item, 74, doc.y - 10, { width: doc.page.width - 124 });
    doc.moveDown(0.1);
  });

  doc.end();
  console.log('✅ Detailed Guide PDF saved to:', outputPath);
}

// Run both
buildQuickRef(path.join('C:\\Users\\debor\\interactive-bible-map', 'HOW-TO-QUICK-REFERENCE.pdf'));
buildDetailedGuide(path.join('C:\\Users\\debor\\interactive-bible-map', 'HOW-TO-DETAILED-GUIDE.pdf'));
