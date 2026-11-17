/** Render the public service catalogue and navigation from the Node service data.
 * Run from any directory with: node scripts/build-services.js
 * Commit the rendered HTML so both GitHub Pages and the Node server serve the same pages.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, html) => fs.writeFileSync(path.join(root, file), html);
const {services} = JSON.parse(read('data/site-data.json'));

const groups = [
  ['mep', 'MEP Design Services', 'Design for the building’s mechanical, electrical, and plumbing systems.'],
  ['bim', 'BIM Services', 'Building information models, drawing conversions, and coordination checks.'],
  ['construction', 'Construction Support Services', 'Drawings, quantities, components, and checks for construction teams.'],
  ['drafting', 'Architectural & Structural Drafting', 'Drawings that develop the architect’s or engineer’s design.'],
  ['other', 'Other Services', 'Visual rendering and fire protection design.'],
].map(([slug, title, summary]) => ({
  slug, title, summary,
  url: `services-${slug}.html`,
  services: services.filter((service) => service.categorySlug === slug),
}));

const legacy = new Map([
  ['mechanical-hvac', 'mechanical'], ['electrical-design', 'electrical'],
  ['plumbing-design', 'plumbing'], ['fire-protection', 'fire'],
]);

function html(text) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function block(page, name, content) {
  const start = `<!-- catalog:${name} -->`;
  const end = `<!-- /catalog:${name} -->`;
  if (!page.includes(start) || !page.includes(end)) {
    throw new Error(`Missing catalog block: ${name}`);
  }
  return page.replace(new RegExp(`${start}[\\s\\S]*?${end}`), () => `${start}\n${content}\n${end}`);
}

function menu(groups) {
  return groups.map((group) => `              <section class="catalog-menu-group">
                <h2><a href="${group.url}">${html(group.title)}</a></h2>
                <ul>${group.services.map((service) => `<li><a href="${service.url}">${html(service.title)}</a></li>`).join('')}</ul>
              </section>`).join('\n');
}

function cardGrid(items) {
  return `      <div class="subpage-grid-2 catalog-grid">
${items.map((item) => `        <article class="subpage-detail-box"${item.anchor ? ` id="${item.anchor}"` : ''}>
          <h3><a href="${item.url}">${html(item.title)} <span aria-hidden="true">&rarr;</span></a></h3>
          <p>${html(item.summary)}</p>
        </article>`).join('\n')}
      </div>`;
}

function catalogOverview() {
  return groups.map((group) => `    <section class="catalog-group" id="${group.slug}">
      <h2><a href="${group.url}">${html(group.title)} <span aria-hidden="true">&rarr;</span></a></h2>
      <p>${html(group.summary)}</p>
${cardGrid(group.services.map((service) => ({...service, anchor: legacy.get(service.id)})))}
    </section>`).join('\n');
}

const headerTemplate = read('scripts/site-header.template').trimEnd();
const navigation = [
  ['index.html', 'Home'],
  ['about.html', 'About Us'],
  ['services.html', 'Services'],
  ['portfolio.html', 'Project Examples'],
  ['sectors.html', 'Industries'],
  ['blog.html', 'Design Notes'],
  ['career.html', 'Careers'],
  ['contact.html', 'Contact Us'],
];
const additionalDrawerLinks = [
  ['process.html', 'How We Work'],
  ['faqs.html', 'FAQs'],
];

function withHeader(page, filename) {
  const catalogMenu = menu(groups);
  const isServicePage = filename === 'services.html' || filename.startsWith('services-');
  const isCareers = filename === 'career.html';
  const email = isCareers ? 'careers@stratum-engineering.com' : 'contact@stratum-engineering.com';
  const attributes = (href, linkClass) => {
    const isCurrent = href === filename;
    const isServiceSection = href === 'services.html' && isServicePage;
    return `href="${href}" class="${linkClass}${isCurrent || isServiceSection ? ' active' : ''}"${isCurrent ? ' aria-current="page"' : ''}`;
  };
  const desktop = navigation.map(([href, label]) => {
    const link = attributes(href, 'nav-link');
    if (href !== 'services.html') {
      return `        <div class="nav-item"><a ${link}>${label}</a></div>`;
    }
    return `        <div class="nav-item has-mega">
          <a ${link}>
            <span>Services</span>
            <svg class="chevron" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </a>
          <div class="mega-dropdown service-catalog-menu">
${catalogMenu}
          </div>
        </div>`;
  }).join('\n');
  const drawer = [...navigation, ...additionalDrawerLinks].map(([href, label]) => {
    const link = attributes(href, 'drawer-link');
    if (href !== 'services.html') return `      <a ${link}>${label}</a>`;
    return `      <details class="drawer-service-catalog">
        <summary${isServicePage ? ' class="active"' : ''}>Services</summary>
        <a ${link}>All services</a>
${catalogMenu}
      </details>`;
  }).join('\n');
  const enquiryLink = filename === 'contact.html' ? '#project-enquiry' : 'contact.html';
  const enquiry = (drawer = false) => {
    const classes = `btn btn-primary site-enquiry${drawer ? ' drawer-enquiry' : ''}`;
    if (page.includes('id="quoteModal"')) {
      return `<button type="button" class="${classes} trigger-modal">Discuss Your Project</button>`;
    }
    return `<a href="${enquiryLink}" class="${classes}${drawer && filename === 'contact.html' ? ' drawer-link' : ''}">Discuss Your Project</a>`;
  };
  const header = headerTemplate
    .replace('        <!-- primary-navigation -->', desktop)
    .replace('      <!-- drawer-navigation -->', drawer)
    .replace('<!-- header-enquiry -->', enquiry())
    .replace('<!-- drawer-enquiry -->', enquiry(true))
    .replaceAll('{{email}}', email)
    .replaceAll('{{email-label}}', isCareers ? 'Careers email' : 'Email Stratum');
  return block(page, 'header', header);
}

function withCatalog(page, filename) {
  page = withHeader(page, filename);
  page = block(page, 'footer', groups.map((group) =>
    `            <li><a class="footer-link" href="${group.url}">${html(group.title)}</a></li>`).join('\n'));
  if (page.includes('<!-- catalog:form -->')) {
    page = block(page, 'form', groups.map((group) =>
      `                <label class="checkbox-label"><input type="checkbox" name="service" value="${html(group.title)}"><span>${html(group.title)}</span></label>`).join('\n'));
  }
  return page;
}

const publicPages = ['index', 'about', 'blog', 'career', 'contact', 'faqs', 'portfolio', 'process', 'sectors', 'services'];
for (const name of publicPages) {
  const filename = name + '.html';
  let page = withCatalog(read(filename), filename);
  if (name === 'index') page = block(page, 'home', cardGrid(groups));
  if (name === 'services') page = block(page, 'overview', catalogOverview());
  write(filename, page);
}

const hub = read('services.html');
const header = hub.slice(0, hub.indexOf('  <main id="service-main">'));
const footer = hub.slice(hub.indexOf('  <footer class="site-footer">'));

function renderPage(entry, group, content) {
  const breadcrumb = `<a href="index.html">Home</a> / <a href="services.html">Services</a>${group ? ` / <a href="${group.url}">${html(group.title)}</a>` : ''} / <span aria-current="page">${html(entry.title)}</span>`;
  const head = header
    .replace(/<title>[^<]*<\/title>/, () => `<title>${html(entry.title)} | Stratum Engineering</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, (_, prefix) => `${prefix}${html(entry.summary)}"`)
    .replace(/stratum-engineering\.com\/services\.html/, `stratum-engineering.com/${entry.url}`);
  const body = `  <main id="service-main">
    <section class="page-header-banner">
      <div class="hero-backdrop-grid"></div>
      <div class="container">
        <div class="page-header-content">
          <nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>
          <h1 class="page-title">${html(entry.title)}</h1>
          <p class="page-desc">${html(entry.summary)}</p>
        </div>
      </div>
    </section>
    <section class="section-padding">
      <div class="container">
${content}
        <div class="catalog-actions">
          <a href="mailto:contact@stratum-engineering.com?subject=${encodeURIComponent(entry.title)}" class="btn btn-primary">Email about this service &rarr;</a>
          <a href="${group ? group.url : 'services.html'}" class="btn btn-outline">${group ? `Back to ${html(group.title)}` : 'All services'}</a>
        </div>
      </div>
    </section>
  </main>

`;
  write(entry.url, withHeader('<!-- Generated by scripts/build-services.js. -->\n' + head + body + footer, entry.url));
}

for (const group of groups) {
  renderPage(group, null, `        <h2>Services in this category</h2>\n${cardGrid(group.services.map((service) => ({...service, anchor: legacy.get(service.id)})))}`);
  for (const service of group.services) {
    renderPage(service, group, `        <div class="subpage-detail-box catalog-service-detail">
          <h2>What we do</h2>
          <p>${html(service.scope)}</p>
          <h2>What you receive</h2>
          <ul>${service.deliverables.map((deliverable) => `<li>${html(deliverable)}</li>`).join('')}</ul>
        </div>`);
  }
}
