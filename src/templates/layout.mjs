const escape = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const origin = 'https://acg-africa-redesign.webspero-1073.chatgpt.site';
const arrow = '<svg class="arrow" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const navigation = `
  <a class="compact-home-link" href="/">Home</a>
  <a href="https://acgafrica.com/who-we-are/">Who We Are</a>
  <a href="https://acgafrica.com/what-we-do/">What We Do</a>
  <a href="https://acgafrica.com/victory-district/">Victory District™</a>
  <div class="team-group">
    <a href="https://acgafrica.com/our-team/">Our Team</a>
    <details id="team-menu" class="team-menu">
      <summary aria-label="Show Our Team sections"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></summary>
      <div class="submenu">
        <a href="https://acgafrica.com/our-team/#founder-and-executive-chairman">Leadership</a>
        <a href="https://acgafrica.com/our-team/#our-advisory-board">Advisory Board</a>
        <a href="https://acgafrica.com/our-team/#our-research-and-impact-advisory-panel">Research &amp; Impact Advisory Panel</a>
      </div>
    </details>
  </div>
  <a href="https://acgafrica.com/acg-news/">Our News</a>
  <a class="nav-contact" href="https://acgafrica.com/contact-us/">Contact Us ${arrow}</a>`;

export function renderPage(page, common) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(page.title)} | African Collaborations Group</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="robots" content="noindex,nofollow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(page.title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:url" content="${origin}/${page.slug ? page.slug+'/' : ''}">
  <meta property="og:image" content="${origin}${common.og}">
  <meta property="og:image:alt" content="African Collaborations Group">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${origin}/${page.slug ? page.slug+'/' : ''}">
  <link rel="icon" type="image/png" href="${common.favicon}">
  <link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <script>document.documentElement.classList.add('js');</script>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/content-system.css">
  <link rel="stylesheet" href="/storytelling.css">
  <script src="/app.js" defer></script>
</head>
<body${page.inner ? ' class="inner-page"' : ''}>
  <a class="skip" href="#main">Skip to content</a>
  <header id="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/" aria-label="African Collaborations Group home"><img src="${common.logo}" width="561" height="271" alt="ACG African Collaborations Group"></a>
      <button class="menu-toggle" aria-controls="navigation" aria-expanded="false" type="button">Menu <span class="menu-glyph" aria-hidden="true"></span></button>
      <nav id="navigation" aria-label="Main navigation">${navigation}</nav>
    </div>
  </header>
  <main id="main" tabindex="-1">${page.body}</main>
  <footer>
    <div class="wrap footer-top">
      <a class="brand" href="/" aria-label="ACG home"><img src="${common.logo}" width="561" height="271" alt="African Collaborations Group"></a>
      <div class="footer-copy">${common.footerText[0] || ''}</div>
      <div class="footer-links">
        <a class="text-link" href="${common.linkedin}">Visit our LinkedIn Profile ${arrow}</a>
      </div>
    </div>
    <div class="wrap footer-bottom">${common.footerText.slice(1).join('')}<a class="text-link" href="#main">Back to top ↑</a></div>
  </footer>
</body>
</html>`;
}
