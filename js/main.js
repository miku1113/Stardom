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

    if (window.scrollY > 500) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
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

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeDrawer);
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
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        portfolioCards.forEach(card => {
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
        faqItems.forEach(i => i.classList.remove('active'));

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
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
  const openModalBtns = document.querySelectorAll('.trigger-modal');
  const closeModalBtn = document.querySelector('.modal-close-btn');

  if (modal) {
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // --- 8. Toast Notification Utility ---
  const showToast = (message) => {
    let toast = document.querySelector('.toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#00D084">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>${message}</span>
    `;

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  };

  // --- 9. Form Submission Handling (Modal & In-Page) wired to /api/inquiries ---
  const forms = document.querySelectorAll('form.project-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle>
        </svg>
        <span>Sending Requirements...</span>
      `;

      // Extract form fields
      const inputs = form.querySelectorAll('input, textarea');
      const payload = {
        name: '',
        email: '',
        firm: '',
        phone: '',
        details: '',
        type: 'Consultation'
      };

      inputs.forEach(input => {
        const type = input.type;
        const val = input.value.trim();
        if (type === 'email') payload.email = val;
        else if (type === 'tel') payload.phone = val;
        else if (input.tagName.toLowerCase() === 'textarea') payload.details = val;
        else if (input.placeholder && input.placeholder.toLowerCase().includes('firm')) payload.firm = val;
        else if (!payload.name) payload.name = val;
        else if (!payload.firm) payload.firm = val;
      });

      try {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Inquiry API note:', err);
      }

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        form.reset();

        if (modal && modal.classList.contains('open')) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }

        showToast("Thank you! Your project inquiry has been received. A Stratum MEP engineer will contact you within 24 hours under NDA.");
      }, 800);
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
                  <button class="btn btn-outline trigger-modal" style="padding:10px 20px; font-size:13.5px;">Inquire About Similar Project</button>
                </div>
              </div>
            `;
          }).join('');

          // Re-bind modal triggers for newly created elements
          document.querySelectorAll('.portfolio-card .trigger-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              if (modal) {
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
              }
            });
          });
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
});
