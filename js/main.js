/**
 * Stratum VDC & MEP Engineering
 * Interactive JavaScript Components
 * Website: stratum-engineering.com
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 0. Set Active Navigation Link based on Current Page ---
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinksAll = document.querySelectorAll('.nav-link, .drawer-link');
  navLinksAll.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
      link.classList.add('active');
    }
  });

  // --- 1. Sticky Header with Scroll Effect ---
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (backToTop) {
      if (window.scrollY > 500) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    }
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 2. Mobile Drawer Navigation ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerCloseBtn = document.querySelector('.drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.drawer-link');
  const drawerOverlay = document.querySelector('.drawer-overlay');

  const closeDrawer = () => {
    mobileDrawer.classList.remove('open');
    drawerOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      if (drawerOverlay) drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeDrawer);
    }

    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', closeDrawer);
    }

    drawerLinks.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }

  // --- 3. Services Filter Tabs ---
  const serviceTabBtns = document.querySelectorAll('.service-tab-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  if (serviceTabBtns.length > 0) {
    serviceTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        serviceTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        serviceCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 4. Portfolio Filters ---
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        document.querySelectorAll('.portfolio-card').forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 5. FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');

  if (faqItems.length > 0) {
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(i => {
          i.classList.remove('active');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // --- 6. Animated Counter on Viewport Enter ---
  const statNumbers = document.querySelectorAll('.stat-num[data-target]');
  let hasCounted = false;

  const runCounter = () => {
    statNumbers.forEach(stat => {
      const target = +stat.getAttribute('data-target');
      const suffix = stat.getAttribute('data-suffix') || '+';
      const duration = 1800;
      const stepTime = 20;
      const totalSteps = duration / stepTime;
      const increment = target / totalSteps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          stat.innerHTML = `${target}<span class="plus">${suffix}</span>`;
          clearInterval(timer);
        } else {
          stat.innerHTML = `${Math.floor(current)}<span class="plus">${suffix}</span>`;
        }
      }, stepTime);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasCounted) {
        hasCounted = true;
        runCounter();
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-strip');
  if (statsSection) {
    observer.observe(statsSection);
  }

  // --- 7. Modal Open & Close ---
  const modal = document.querySelector('#quoteModal');
  if (modal) {
    const closeModalButton = modal.querySelector('.modal-close-btn');
    let returnFocus;

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      // Portfolio loading can replace the card that opened the dialog.
      const focusTarget = returnFocus?.isConnected ? returnFocus : document.querySelector('.filter-btn.active');
      focusTarget?.focus();
    };

    document.addEventListener('click', event => {
      const trigger = event.target.closest('.trigger-modal');
      if (!trigger) return;

      event.preventDefault();
      returnFocus = trigger;
      if (mobileDrawer?.contains(trigger)) {
        closeDrawer();
        returnFocus = mobileToggle;
      }

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeModalButton.focus({ preventScroll: true });
    });

    closeModalButton.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', event => {
      if (!modal.classList.contains('open')) return;
      if (event.key === 'Escape') {
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = [...modal.querySelectorAll('button, a[href], input, textarea')]
        .filter(control => !control.disabled && control.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const focused = document.activeElement;
      if (!modal.contains(focused) || focused === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
  }

  // Project enquiry forms share the same fields and API.
  const enquiryForms = [...document.querySelectorAll('form.project-form')];
  if (enquiryForms.length) {
    fetch(enquiryForms[0].action, { method: 'HEAD' })
      .then(response => {
        if (response.status !== 204) return;
        enquiryForms.forEach(form => {
          form.hidden = false;
          form.querySelector('button[type="submit"]').disabled = false;
        });
      })
      .catch(() => {}); // The email link remains available on static hosts and during outages.
  }

  enquiryForms.forEach(form => {
    const submitButton = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.inquiry-status');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const fields = new FormData(form);
      const services = fields.getAll('service');
      const brief = fields.get('details').trim();
      const payload = {
        name: fields.get('name').trim(),
        email: fields.get('email').trim(),
        firm: fields.get('firm').trim(),
        phone: fields.get('phone').trim(),
        details: services.length ? `Services: ${services.join(', ')}\n\n${brief}` : brief,
        type: 'Consultation'
      };

      submitButton.disabled = true;
      status.textContent = 'Sending your enquiry…';

      try {
        const response = await fetch(form.action, {
          method: form.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok || !(await response.json()).success) {
          throw new Error('Enquiry could not be saved');
        }

        form.reset();
        status.textContent = 'Thank you. We received your enquiry.';
      } catch {
        status.textContent = 'Your enquiry could not be sent. Use the email link above to send your brief.';
      } finally {
        submitButton.disabled = false;
      }
    });
  });

  // --- 10. Dynamic Portfolio Hydration from Admin Database ---
  const portfolioGrid = document.querySelector('.portfolio-grid');
  if (portfolioGrid) {
    fetch('/api/projects')
      .then(res => res.json())
      .then(projects => {
        if (Array.isArray(projects) && projects.length > 0) {
          portfolioGrid.innerHTML = projects.map(p => {
            const tags = Array.isArray(p.tags) ? p.tags : [];
            return `
              <div class="portfolio-card" data-category="${escapeHtml(p.category || 'commercial')}">
                <div class="portfolio-img-box">
                  <img src="${escapeHtml(p.image || 'assets/project-commercial.jpg')}" alt="${escapeHtml(p.title)}" onerror="this.src='assets/project-commercial.jpg'">
                  <span class="portfolio-tag-overlay">${escapeHtml(p.sector || p.category || 'Engineering')}</span>
                </div>
                <div class="portfolio-details">
                  <h3>${escapeHtml(p.title)}</h3>
                  <p>${escapeHtml(p.description)}</p>
                  <div class="project-meta-chips">
                    ${tags.map(t => `<span class="meta-chip">${escapeHtml(t)}</span>`).join('')}
                  </div>
                  <button class="btn btn-outline trigger-modal" style="padding:10px 20px; font-size:13.5px;">Discuss your project</button>
                </div>
              </div>
            `;
          }).join('');

          document.querySelector('.filter-btn.active')?.click();
        }
      })
      .catch(err => console.log('Serving default portfolio view'));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 11. Modern Architectural Scroll-Driven Reveals ---
  const revealTargets = document.querySelectorAll(
    '.section-headline, .section-eyebrow, .services-header-split, .highlight-box, ' +
    '.discipline-card, .drawing-sheet-card, .software-cresto-card, .why-pill-badge, ' +
    '.project-cresto-card, .portfolio-card, .testimonials-three-grid, .industry-pill, ' +
    '.process-cresto-row, .step-card, .blog-four-grid, .faq-item, .cta-cresto-banner, ' +
    '.inquiry-grid, .value-prop-visual, .value-prop-content, .subpage-card'
  );

  if ('IntersectionObserver' in window && revealTargets.length > 0) {
    revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));

    const scrollObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.06
    });

    revealTargets.forEach(el => scrollObserver.observe(el));
  }
});
