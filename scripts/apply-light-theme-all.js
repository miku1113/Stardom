const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(root, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Ensure light-theme.css is linked in <head>
  if (!content.includes('css/light-theme.css')) {
    content = content.replace(
      /(<link rel="stylesheet" href="css\/styles\.css[^"]*">)/,
      '$1\n  <link rel="stylesheet" href="css/light-theme.css?v=2.0">'
    );
    changed = true;
  }

  // 2. Ensure footer logo has both dark and light versions
  // Pattern 1: standard subpages
  const footerSingleRegex = /<div style="margin-bottom:14px;">\s*<img src="assets\/stratum-official-logo\.png[^"]*" alt="Stratum Engineering"[^>]*>\s*<\/div>/g;
  const footerDual = `<div style="margin-bottom:14px;">
            <img src="assets/stratum-official-logo.png?v=10.0" alt="Stratum Engineering" class="footer-logo-img logo-dark" style="height:54px; width:auto; object-fit:contain; display:block;">
            <img src="assets/stratum-official-logo-black.png?v=10.0" alt="Stratum Engineering" class="footer-logo-img logo-light" style="height:54px; width:auto; object-fit:contain; display:none;">
          </div>`;

  if (content.match(footerSingleRegex)) {
    content = content.replace(footerSingleRegex, footerDual);
    changed = true;
  }

  // Pattern 2: index.html footer-brand-info
  const footerBrandInfoRegex = /<div class="footer-brand-info">\s*<img src="assets\/stratum-official-logo\.png[^"]*" alt="Stratum Engineering"[^>]*margin-bottom:14px;[^>]*>/g;
  const footerBrandInfoDual = `<div class="footer-brand-info">
          <img src="assets/stratum-official-logo.png?v=10.0" alt="Stratum Engineering" class="footer-logo-img logo-dark" style="height:54px; width:auto; object-fit:contain; display:block; margin-bottom:14px;">
          <img src="assets/stratum-official-logo-black.png?v=10.0" alt="Stratum Engineering" class="footer-logo-img logo-light" style="height:54px; width:auto; object-fit:contain; display:none; margin-bottom:14px;">`;

  if (content.match(footerBrandInfoRegex)) {
    content = content.replace(footerBrandInfoRegex, footerBrandInfoDual);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
