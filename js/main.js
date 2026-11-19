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

  // Project enquiry forms - Direct transmission to Stratum Engineering email
  const enquiryForms = [...document.querySelectorAll('form.project-form')];

  enquiryForms.forEach(form => {
    // Ensure form is always visible and submit button is enabled on all hosts
    form.removeAttribute('hidden');
    form.style.display = 'block';
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = false;
    const status = form.querySelector('.inquiry-status');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const fields = new FormData(form);
      const name = (fields.get('name') || '').toString().trim();
      const email = (fields.get('email') || '').toString().trim();
      const firm = (fields.get('firm') || '').toString().trim();
      const phone = (fields.get('phone') || '').toString().trim();
      const location = (fields.get('location') || '').toString().trim();
      const buildingType = (fields.get('building_type') || '').toString().trim();
      const services = fields.getAll('service');
      const details = (fields.get('details') || '').toString().trim();

      if (!name || !email) {
        if (status) {
          status.style.color = '#EF4444';
          status.textContent = 'Please fill in your name and email address.';
        }
        return;
      }

      const originalBtnText = submitButton ? submitButton.textContent : 'Send enquiry';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending to Stratum…';
      }
      if (status) {
        status.style.color = '#38BDF8';
        status.textContent = 'Transmitting your brief to mihirjariwala334@gmail.com…';
      }

      const emailPayload = {
        _subject: `New Project Consultation Request: ${name} (${firm || 'Client'})`,
        _template: 'table',
        _captcha: 'false',
        'Client Name': name,
        'Work Email': email,
        'Phone Number': phone || 'Not provided',
        'Company / Firm': firm || 'Not provided',
        'Project Location': location || 'Not specified',
        'Building Type': buildingType || 'Not specified',
        'Services Requested': services.length ? services.join(', ') : 'General Consultation',
        'Project Brief & Scope': details || 'N/A',
        'Submitted At': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      let sent = false;

      // 1. Direct email dispatch via FormSubmit AJAX to testing email: mihirjariwala334@gmail.com
      try {
        const formSubmitRes = await fetch('https://formsubmit.co/ajax/mihirjariwala334@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });
        if (formSubmitRes.ok) {
          sent = true;
        }
      } catch (err) {
        console.warn('FormSubmit AJAX attempt:', err);
      }

      // 2. Dual-save to local server API if running on Node
      try {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            firm,
            details: `Building: ${buildingType} | Loc: ${location} | Services: ${services.join(', ')}\n\n${details}`,
            type: 'Consultation'
          })
        });
      } catch (_) {}

      if (sent) {
        form.reset();
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Enquiry Sent Successfully ✓';
          submitButton.style.background = '#10B981';
          submitButton.style.borderColor = '#10B981';
          submitButton.style.color = '#FFFFFF';
        }
        if (status) {
          status.style.color = '#34D399';
          status.innerHTML = `<strong>✓ Thank you, ${name}!</strong> Your project brief has been sent to <strong>mihirjariwala334@gmail.com</strong>. We will review it and reply promptly.`;
        }
      } else {
        // Fallback: mailto link pre-populated with all the form details
        const mailSubject = encodeURIComponent(`Project Consultation Request - ${name} (${firm || 'Client'})`);
        const mailBody = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${firm}\nLocation: ${location}\nBuilding Type: ${buildingType}\nServices: ${services.join(', ')}\n\nProject Brief:\n${details}`
        );
        const mailtoUrl = `mailto:mihirjariwala334@gmail.com?subject=${mailSubject}&body=${mailBody}`;

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnText;
        }
        if (status) {
          status.style.color = '#F59E0B';
          status.innerHTML = `Connecting to email service… <a href="${mailtoUrl}" style="color:#FFFFFF; text-decoration:underline; font-weight:700;">Click here to send directly via your mail client &rarr;</a>`;
        }
        window.location.href = mailtoUrl;
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
