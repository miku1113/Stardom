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

  // --- 1. Sticky Header with Zero-Stutter Scroll Effect ---
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');

  if (header) {
    let isHeaderTicking = false;

    const onScrollUpdate = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

      // Hysteresis buffer (50px add, 15px remove) prevents any threshold flicker/oscillation
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else if (scrollY < 15) {
        header.classList.remove('scrolled');
      }

      if (backToTop) {
        if (scrollY > 450) {
          backToTop.classList.add('show');
        } else if (scrollY < 380) {
          backToTop.classList.remove('show');
        }
      }

      isHeaderTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!isHeaderTicking) {
        window.requestAnimationFrame(onScrollUpdate);
        isHeaderTicking = true;
      }
    }, { passive: true });

    // Initial check in case page loaded scrolled down
    onScrollUpdate();
  }

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
            card.style.display = 'flex';
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
        submitButton.textContent = 'Transmitting brief…';
      }
      if (status) {
        status.style.color = '#38BDF8';
        status.textContent = 'Sending your enquiry to Stratum Engineering…';
      }

      const recipientEmail = 'contact@stratum-engineering.com';
      const projectSubject = `Stratum Enquiry - ${name}${firm ? ` (${firm})` : ''}`;

      const emailPayload = {
        _subject: projectSubject,
        _template: 'table',
        _captcha: 'false',
        _replyto: email,
        'Enquiry Type': 'Stratum Enquiry',
        'Client Name': name,
        'Work Email': email,
        'Phone Number': phone || 'Not provided',
        'Company / Firm': firm || 'Not provided',
        'Project Location': location || 'Not specified',
        'Building Type': buildingType || 'Not specified',
        'Disciplines Needed': services.length ? services.join(', ') : 'General Consultation',
        'Project Scope & Brief': details || 'N/A',
        'Submitted At (IST)': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      let sent = false;

      // 1. Direct email dispatch via FormSubmit AJAX to Stratum Engineering official email
      try {
        const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${recipientEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });
        if (formSubmitRes.ok) {
          const data = await formSubmitRes.json().catch(() => ({}));
          if (data.success === true || data.success === 'true' || (data.message && data.message.toLowerCase().includes('success'))) {
            sent = true;
          }
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

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodeURIComponent(projectSubject)}&body=${encodeURIComponent(`Client Name: ${name}\nWork Email: ${email}\nPhone: ${phone}\nCompany: ${firm || 'N/A'}\nLocation: ${location || 'N/A'}\nBuilding Type: ${buildingType || 'N/A'}\nServices: ${services.join(', ') || 'General Consultation'}\n\nProject Brief:\n${details}\n\nSubmitted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`)}`;

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
          status.innerHTML = `
            <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.4); border-radius:8px; padding:16px; margin-top:14px; text-align:left;">
              <div style="font-weight:700; font-size:14px; margin-bottom:6px; color:#34D399;">✓ Thank you, ${name}! Your enquiry has been sent.</div>
              <p style="color:#D1D5DB; font-size:12.5px; line-height:1.5; margin:0;">
                Our engineering team has received your project brief at <strong>${recipientEmail}</strong>. We will review your requirements and respond promptly.
              </p>
            </div>`;
        }
      } else {
        // Fallback: direct mailto & web compose link
        const mailSubject = encodeURIComponent(projectSubject);
        const mailBody = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${firm}\nLocation: ${location}\nBuilding Type: ${buildingType}\nServices: ${services.join(', ')}\n\nProject Brief:\n${details}`
        );
        const mailtoUrl = `mailto:${recipientEmail}?subject=${mailSubject}&body=${mailBody}`;

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnText;
        }
        if (status) {
          status.innerHTML = `
            <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.4); border-radius:8px; padding:16px; margin-top:14px; text-align:left;">
              <div style="color:#F59E0B; font-weight:700; margin-bottom:8px;">Ready to Send Directly:</div>
              <p style="color:#D1D5DB; font-size:12.5px; line-height:1.5; margin:0 0 10px 0;">
                Click below to dispatch your brief directly to <strong>${recipientEmail}</strong>:
              </p>
              <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:6px; background:#FFFFFF; color:#000000; font-weight:700; font-size:13px; padding:9px 18px; border-radius:9999px; text-decoration:none; margin-bottom:8px;">
                Open &amp; Send in Gmail &rarr;
              </a>
              <div style="font-size:12px; color:#A1A1AA;">Or <a href="${mailtoUrl}" style="color:#FFFFFF; text-decoration:underline;">open in default email app</a></div>
            </div>`;
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
    '.project-cresto-card, .portfolio-card, .testimonials-three-grid, .testimonials-reviews-grid, ' +
    '.testimonial-card-cresto, .industry-pill, ' +
    '.process-cresto-row, .step-card, .blog-four-grid, .faq-item, .cta-cresto-banner, ' +
    '.inquiry-grid, .value-prop-visual, .value-prop-content, .subpage-card, .stepper-step'
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

  // --- 12. Dynamic Architectural Stepper Controller ---
  const dynamicStepper = document.getElementById('dynamicStepper');
  if (dynamicStepper) {
    const steps = dynamicStepper.querySelectorAll('.stepper-step');
    const detailBadge = document.getElementById('stepperDetailBadge');
    const detailBody = document.getElementById('stepperDetailBody');
    const counter = document.getElementById('stepperCounter');
    const prevBtn = document.getElementById('stepperPrevBtn');
    const nextBtn = document.getElementById('stepperNextBtn');

    const phaseData = [
      {
        phase: 'PHASE 01',
        title: 'Scope Definition & Statutory Scrutiny',
        badge: 'STAGE 01 &bull; INTAKE &amp; FEASIBILITY',
        summary: 'Reviewing architectural plans, structural grids, and regional municipal compliance boundaries before calculating equipment capacities.',
        tasks: [
          'Scrutiny of architectural CAD/BIM floor plans, elevations, and structural column grid spacing.',
          'Surat Municipal Corporation (SMC) & NBC 2016 statutory compliance benchmark analysis.',
          'Occupancy classification, diversity factors, and emergency egress routing.',
          'Establishment of the formal Design Basis Report (DBR) and project drawing register.'
        ],
        outputs: 'Design Basis Report (DBR), Spatial MEP Allocation Schematics, Milestones Schedule',
        formats: 'Autodesk Revit (.rvt), AutoCAD (.dwg), Searchable PDF (.pdf)',
        codes: 'NBC 2016 Part 4 & 8, IS 732, ECBC 2017, SMC Fire Regulations',
        turnaround: '3 to 5 Business Days'
      },
      {
        phase: 'PHASE 02',
        title: 'Engineering Calculations & System Sizing',
        badge: 'STAGE 02 &bull; SIZING &amp; SPECIFICATIONS',
        summary: 'Rigorous engineering math sizing HVAC thermal loads, electrical transformers, hydro-pneumatic pumping, and fire hydraulic networks.',
        tasks: [
          'Room-by-room thermal cooling load calculation via ASHRAE RTS / HAP Carrier simulations.',
          'Electrical connected & maximum demand load sheets, transformer, DG backup, and busduct sizing.',
          'Hydro-pneumatic pumping head calculations, domestic/flushing storage tanks, and STP sizing.',
          'Preparation of single line diagrams (SLDs), equipment schedules, and schematic risers.'
        ],
        outputs: 'Heat Load Calculations, Electrical SLDs, Equipment Schedules, Plumbing Schematics',
        formats: 'AutoCAD (.dwg), Engineering Spreadsheets (.xlsx), Schematic PDF (.pdf)',
        codes: 'ASHRAE Fundamentals, IS 1391, NBC 2016 Part 9, CEA Norms',
        turnaround: '5 to 7 Business Days'
      },
      {
        phase: 'PHASE 03',
        title: '3D BIM Multi-Trade Clash Coordination',
        badge: 'STAGE 03 &bull; 3D BIM COORDINATION',
        summary: 'Spatial alignment of mechanical ductwork, electrical cable trays, fire pipes, and plumbing stacks against concrete structure in 3D BIM.',
        tasks: [
          'Full 3D modeling across all MEP disciplines in Autodesk Revit 2024 at LOD 300/350.',
          'Automated hard & clearance clash detection in Navisworks Manage across all trades.',
          'Beam penetrations, structural drop beam checks, and false ceiling height optimization.',
          'Multi-disciplinary clash review meetings and signed-off composite overlay drawings.'
        ],
        outputs: 'Coordinated 3D BIM Model, Navisworks Clash Audit Report, Combined Services Drawings (CSD)',
        formats: 'Autodesk Navisworks (.nwd), Revit (.rvt), Industry Foundation Classes (.ifc)',
        codes: 'ISO 19650 BIM Standards, AIA Document E202, NBC 2016 Coordination Guidelines',
        turnaround: '7 to 10 Business Days'
      },
      {
        phase: 'PHASE 04',
        title: 'GFC Release & Statutory Approvals',
        badge: 'STAGE 04 &bull; GFC ISSUANCE &amp; TENDER',
        summary: 'Final issuance of Good For Construction (GFC) sets, sleeve cutout locations, municipal submission sets, and comprehensive BOQ.',
        tasks: [
          'Final release of Good For Construction (GFC) sheets with dimensioned sleeve & core-cut coordinates.',
          'Statutory submission sets formatted specifically for Surat Municipal Corporation (SMC) Fire NOC.',
          'Preparation of itemized Bill of Quantities (BOQ) with unit rates and technical tender specifications.',
          'Site coordination handover and contractor technical RFI resolution support.'
        ],
        outputs: 'Stamped GFC Drawing Packages, Sleeve & Opening Cutout Drawings, Tender BOQ',
        formats: 'Stamped PDF Sets, High-Res AutoCAD (.dwg), Itemized BOQ (.xlsx)',
        codes: 'NBC 2016 Part 4 Fire & Life Safety, SMC Bylaws, GPCB Environmental Norms',
        turnaround: 'Immediate Site Release & Handover'
      }
    ];

    let currentStep = 0;

    function renderStep(idx) {
      currentStep = idx;
      const data = phaseData[idx];

      // Update Step Classes and Connector Fill Bars
      steps.forEach((step, i) => {
        const fill = step.querySelector('.stepper-connector-fill');
        step.classList.remove('is-active', 'is-completed');
        if (i < idx) {
          step.classList.add('is-completed');
          if (fill) fill.style.width = '100%';
        } else if (i === idx) {
          step.classList.add('is-active');
          if (fill) fill.style.width = '100%';
        } else {
          if (fill) fill.style.width = '0%';
        }
      });

      // Update Panel Below
      if (detailBadge) {
        detailBadge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:var(--color-copper);display:inline-block;"></span> ${data.badge}`;
      }
      if (counter) {
        counter.textContent = `Phase ${idx + 1} of ${phaseData.length}`;
      }

      if (detailBody) {
        detailBody.innerHTML = `
          <div class="stepper-panel-grid">
            <div>
              <h3 class="stepper-panel-heading">${data.title}</h3>
              <p class="stepper-panel-summary">${data.summary}</p>
              <ul class="stepper-panel-tasks-list">
                ${data.tasks.map(t => `<li><span class="stepper-task-dot"></span><span>${t}</span></li>`).join('')}
              </ul>
            </div>
            <div>
              <div class="stepper-meta-card">
                <div class="stepper-meta-item">
                  <span class="stepper-meta-label">Primary Deliverables</span>
                  <span class="stepper-meta-value">${data.outputs}</span>
                </div>
                <div class="stepper-meta-item">
                  <span class="stepper-meta-label">File Formats Issued</span>
                  <span class="stepper-meta-value" style="font-family:var(--font-main);font-size:12px;color:#A1A1AA;">${data.formats}</span>
                </div>
                <div class="stepper-meta-item">
                  <span class="stepper-meta-label">Standards Applied</span>
                  <span class="stepper-meta-value" style="color:var(--color-copper);font-family:var(--font-main);font-size:11.5px;">${data.codes}</span>
                </div>
                <div class="stepper-meta-item">
                  <span class="stepper-meta-label">Typical Stage Duration</span>
                  <span class="stepper-meta-value">${data.turnaround}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Hover & Click Handlers: Hovering instantly updates, and last hovered step remains shown below!
    steps.forEach((step, idx) => {
      step.addEventListener('mouseenter', () => {
        renderStep(idx);
      });
      step.addEventListener('click', () => {
        renderStep(idx);
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prev = (currentStep - 1 + phaseData.length) % phaseData.length;
        renderStep(prev);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = (currentStep + 1) % phaseData.length;
        renderStep(next);
      });
    }

    // Initial render: Step 01
    renderStep(0);
  }

  // --- 13. Reviews Horizontal Carousel & Auto-Scroll Controller ---
  const reviewsTrack = document.getElementById('reviewsSliderTrack');
  const reviewsWrapper = document.getElementById('reviewsCarouselWrap');
  const reviewDots = document.querySelectorAll('.review-dot');
  const reviewsPrevBtn = document.getElementById('reviewsPrevBtn');
  const reviewsNextBtn = document.getElementById('reviewsNextBtn');
  const testimonialsSection = document.getElementById('testimonials');

  if (reviewsTrack && reviewDots.length > 0) {
    const slides = reviewsTrack.querySelectorAll('.review-slide');
    let autoScrollTimer = null;
    let isHovered = false;
    let hoverResumeTimer = null;
    let isSectionInView = true; // default true so it starts immediately
    const AUTO_SCROLL_DELAY = 3400; // 3.4 seconds per review

    function updateActiveDot(idx) {
      reviewDots.forEach((dot, i) => {
        if (i === idx) {
          dot.classList.add('is-active');
        } else {
          dot.classList.remove('is-active');
        }
      });
    }

    function getActiveSlideIndex() {
      const scrollPos = reviewsTrack.scrollLeft;
      let closestIdx = 0;
      let minDiff = Infinity;

      slides.forEach((slide, idx) => {
        const diff = Math.abs(slide.offsetLeft - reviewsTrack.offsetLeft - scrollPos);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      return closestIdx;
    }

    function advanceNext() {
      const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
      // If at or near the end, loop smoothly back to beginning
      if (reviewsTrack.scrollLeft >= maxScroll - 25) {
        reviewsTrack.scrollTo({ left: 0, behavior: 'smooth' });
        updateActiveDot(0);
      } else {
        const slide = slides[0];
        const step = (slide ? slide.offsetWidth : 350) + 24;
        const target = Math.min(reviewsTrack.scrollLeft + step, maxScroll);
        reviewsTrack.scrollTo({ left: target, behavior: 'smooth' });
      }
    }

    function advancePrev() {
      const slide = slides[0];
      const step = (slide ? slide.offsetWidth : 350) + 24;
      if (reviewsTrack.scrollLeft <= 15) {
        const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
        reviewsTrack.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        reviewsTrack.scrollTo({ left: Math.max(0, reviewsTrack.scrollLeft - step), behavior: 'smooth' });
      }
    }

    function startAutoScroll() {
      stopAutoScroll();
      if (isHovered || !isSectionInView) return;
      autoScrollTimer = setInterval(() => {
        advanceNext();
      }, AUTO_SCROLL_DELAY);
    }

    function stopAutoScroll() {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    }

    function restartTimer() {
      stopAutoScroll();
      startAutoScroll();
    }

    // Scroll listener for manual dragging / touch swiping
    let scrollTimeout;
    reviewsTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const activeIdx = getActiveSlideIndex();
        updateActiveDot(activeIdx);
      }, 50);
    }, { passive: true });

    // Interactive Dot Navigation
    reviewDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        if (slides[idx]) {
          const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth;
          const target = Math.min(slides[idx].offsetLeft - reviewsTrack.offsetLeft, maxScroll);
          reviewsTrack.scrollTo({ left: target, behavior: 'smooth' });
          updateActiveDot(idx);
          restartTimer();
        }
      });
    });

    // Arrow Buttons
    if (reviewsPrevBtn) {
      reviewsPrevBtn.addEventListener('click', () => {
        advancePrev();
        restartTimer();
      });
    }

    if (reviewsNextBtn) {
      reviewsNextBtn.addEventListener('click', () => {
        advanceNext();
        restartTimer();
      });
    }

    // Hover handling: pause briefly for reading, but auto-resume after 6s so it never freezes
    const interactionContainer = reviewsWrapper || reviewsTrack;
    interactionContainer.addEventListener('mouseenter', () => {
      isHovered = true;
      stopAutoScroll();
      clearTimeout(hoverResumeTimer);
      hoverResumeTimer = setTimeout(() => {
        isHovered = false;
        startAutoScroll();
      }, 6000);
    });

    interactionContainer.addEventListener('mouseleave', () => {
      isHovered = false;
      clearTimeout(hoverResumeTimer);
      startAutoScroll();
    });

    // Touch support: pause during swipe, resume 1s after release
    interactionContainer.addEventListener('touchstart', () => {
      isHovered = true;
      stopAutoScroll();
    }, { passive: true });

    interactionContainer.addEventListener('touchend', () => {
      clearTimeout(hoverResumeTimer);
      hoverResumeTimer = setTimeout(() => {
        isHovered = false;
        startAutoScroll();
      }, 1200);
    }, { passive: true });

    // Page visibility pause (saves CPU/battery when tab is inactive)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoScroll();
      } else if (isSectionInView && !isHovered) {
        startAutoScroll();
      }
    });

    // Viewport Intersection Observer: start when visible, pause when scrolled away
    if (testimonialsSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isSectionInView = entry.isIntersecting;
          if (isSectionInView && !isHovered) {
            startAutoScroll();
          } else {
            stopAutoScroll();
          }
        });
      }, { threshold: [0, 0.15] });
      observer.observe(testimonialsSection);
    } else {
      isSectionInView = true;
      startAutoScroll();
    }
  }

  // --- 14. Hero Scanner HUD Indicator Switcher (Phase-Locked to CSS Animation) ---
  const laserBeam = document.querySelector('.spotlight-laser-beam');
  const heroScanLabel = document.getElementById('heroScanLabel');
  const laserTagText = document.querySelector('.laser-tag-text');

  if (laserBeam && heroScanLabel) {
    let anim = null;
    const getAnim = () => {
      if (!anim && laserBeam.getAnimations) {
        const anims = laserBeam.getAnimations();
        if (anims.length > 0) anim = anims[0];
      }
      return anim;
    };

    let lastMode = '';
    const updateHUD = () => {
      const activeAnim = getAnim();
      let isDownSweep = true;
      if (activeAnim && typeof activeAnim.currentTime === 'number') {
        const cycle = activeAnim.currentTime % 6500;
        isDownSweep = cycle < 3250;
      } else {
        isDownSweep = (Date.now() % 6500) < 3250;
      }

      const currentMode = isDownSweep ? 'skeleton' : 'exterior';
      if (currentMode !== lastMode) {
        lastMode = currentMode;
        if (isDownSweep) {
          heroScanLabel.innerHTML = '<span class="hud-mode-dot" style="background:#00E5FF;box-shadow:0 0 8px #00E5FF;"></span><span>SCAN: MEP BIM SKELETON</span>';
          if (laserTagText) laserTagText.textContent = 'MEP SCAN ACTIVE';
        } else {
          heroScanLabel.innerHTML = '<span class="hud-mode-dot" style="background:var(--color-copper);box-shadow:0 0 8px var(--color-copper);"></span><span>SCAN: ARCHITECTURAL EXTERIOR</span>';
          if (laserTagText) laserTagText.textContent = 'EXTERIOR RESTORE';
        }
      }
    };

    setInterval(updateHUD, 100);
  }
});
