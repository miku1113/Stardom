/**
 * STRATUM VDC & MEP ENGINEERING - ADMIN PANEL JS CONTROLLER
 */

let siteData = null;
let authToken = localStorage.getItem('stratum_token') || null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  setupDropzone();
});

// ==========================================
// AUTHENTICATION
// ==========================================
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/status', {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const data = await res.json();
    if (data.authenticated) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Auth check error:', err);
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';
  loadDashboardData();
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorAlert = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  errorAlert.style.display = 'none';
  loginBtn.disabled = true;
  loginBtn.innerText = 'Verifying...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await res.json();

    if (result.success) {
      authToken = result.token;
      localStorage.setItem('stratum_token', result.token);
      showToast('Logged in successfully', 'success');
      showDashboard();
    } else {
      errorAlert.innerText = result.message || 'Invalid username or password';
      errorAlert.style.display = 'block';
    }
  } catch (err) {
    errorAlert.innerText = 'Server error. Please ensure server is running.';
    errorAlert.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerText = 'Log In to Dashboard';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
  } catch (err) {}
  authToken = null;
  localStorage.removeItem('stratum_token');
  showToast('Logged out successfully');
  showLogin();
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadDashboardData() {
  try {
    const res = await fetch('/api/data', {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    siteData = await res.json();

    renderOverview();
    renderProjects();
    renderServices();
    renderContentForm();
    renderBlogs();
    renderCareers();
    renderInquiries();
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    showToast('Failed to load site data', 'error');
  }
}

// ==========================================
// RENDER OVERVIEW
// ==========================================
function renderOverview() {
  if (!siteData) return;
  const projects = siteData.projects || [];
  const services = siteData.services || [];
  const inquiries = siteData.inquiries || [];
  const careers = siteData.careers || [];

  document.getElementById('overviewProjectsCount').innerText = projects.length;
  document.getElementById('overviewServicesCount').innerText = services.length;
  document.getElementById('overviewInquiriesCount').innerText = inquiries.length;
  document.getElementById('overviewCareersCount').innerText = careers.filter(c => c.active).length;
  document.getElementById('inquiriesCountBadge').innerText = inquiries.filter(i => i.status === 'New').length;

  // Recent Inquiries Table
  const tbody = document.getElementById('overviewRecentInquiriesTable');
  const recent = inquiries.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748B;">No inquiries received yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(inq => {
    const dateFormatted = new Date(inq.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const badgeClass = getBadgeClass(inq.status);
    return `
      <tr>
        <td style="color:#94A3B8; font-size:12.5px;">${dateFormatted}</td>
        <td><strong>${escapeHtml(inq.name)}</strong></td>
        <td>${escapeHtml(inq.firm || 'Individual')}</td>
        <td>${escapeHtml(inq.phone || inq.email || '-')}</td>
        <td><span class="admin-badge ${badgeClass}">${escapeHtml(inq.status)}</span></td>
        <td>
          <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="switchTab('inquiries')">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// RENDER PROJECTS
// ==========================================
function renderProjects() {
  if (!siteData) return;
  const grid = document.getElementById('projectsGrid');
  const searchTerm = (document.getElementById('projectSearchInput').value || '').toLowerCase();
  const categoryFilter = document.getElementById('projectCategoryFilter').value;

  const filtered = (siteData.projects || []).filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm) || (p.location && p.location.toLowerCase().includes(searchTerm)) || (p.description && p.description.toLowerCase().includes(searchTerm));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748B;">No matching projects found. Click "+ Add Project" to create one.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return `
      <div class="grid-item-card">
        <img src="${escapeHtml(p.image || 'assets/project-commercial.jpg')}" alt="${escapeHtml(p.title)}" class="grid-item-img" onerror="this.src='assets/project-commercial.jpg'">
        <div class="grid-item-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <span class="sidebar-badge" style="background:rgba(2,132,199,0.2); color:#38BDF8; border-color:rgba(2,132,199,0.4);">${escapeHtml(p.category)}</span>
            ${p.featured ? '<span style="font-size:11px; color:#F59E0B; font-weight:600;">★ Featured</span>' : ''}
          </div>
          <h3 class="grid-item-title">${escapeHtml(p.title)}</h3>
          <div style="font-size:12px; color:#64748B; margin-bottom:10px;">📍 ${escapeHtml(p.location || 'India')} | 📐 ${escapeHtml(p.area || '-')}</div>
          <p class="grid-item-desc">${escapeHtml(p.description)}</p>
          <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">
            ${tags.slice(0, 3).map(t => `<span style="font-size:11px; background:#0F172A; padding:3px 8px; border-radius:4px; border:1px solid #334155; color:#CBD5E1;">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="grid-item-footer">
            <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="editProject('${p.id}')">Edit</button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteProject('${p.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// RENDER SERVICES
// ==========================================
function renderServices() {
  if (!siteData) return;
  const tbody = document.getElementById('servicesTableBody');
  const catFilter = document.getElementById('serviceCategoryFilter').value;

  const filtered = (siteData.services || []).filter(s => {
    return catFilter === 'all' || s.category === catFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748B;">No services found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const deliverables = Array.isArray(s.deliverables) ? s.deliverables.join(', ') : (s.deliverables || '-');
    return `
      <tr>
        <td>
          <strong style="color:#FFF; display:block;">${escapeHtml(s.title)}</strong>
          <span style="font-size:11.5px; color:#64748B;">ID: ${escapeHtml(s.id)}</span>
        </td>
        <td>
          <span class="sidebar-badge" style="font-size:10px;">${escapeHtml(s.category)}</span>
        </td>
        <td style="max-width:320px; font-size:13px; color:#94A3B8;">
          ${escapeHtml(s.summary || s.scope || '-')}
        </td>
        <td style="max-width:240px; font-size:12px; color:#64748B;">
          <div><strong style="color:#CBD5E1;">Deliverables:</strong> ${escapeHtml(deliverables)}</div>
          <div style="margin-top:4px;"><strong style="color:#CBD5E1;">Codes:</strong> ${escapeHtml(s.standards || '-')}</div>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="editService('${s.id}')">Edit</button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteService('${s.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// RENDER SITE CONTENT FORM
// ==========================================
function renderContentForm() {
  if (!siteData) return;
  const company = siteData.company || {};
  const hero = siteData.hero || {};

  document.getElementById('contentCompanyName').value = company.name || '';
  document.getElementById('contentTagline').value = company.tagline || '';
  document.getElementById('contentPhone').value = company.phone || '';
  document.getElementById('contentEmail').value = company.email || '';
  document.getElementById('contentCareersEmail').value = company.careersEmail || '';
  document.getElementById('contentAddress').value = company.address || '';

  document.getElementById('contentHeroBadge').value = hero.badge || '';
  document.getElementById('contentHeroTitle').value = hero.title || '';
  document.getElementById('contentHeroSubtitle').value = hero.subtitle || '';
}

// ==========================================
// RENDER BLOGS
// ==========================================
function renderBlogs() {
  if (!siteData) return;
  const grid = document.getElementById('blogsGrid');
  const blogs = siteData.blogs || [];

  if (blogs.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#64748B;">No blog posts available. Click "+ Add Blog Post" to publish one.</div>`;
    return;
  }

  grid.innerHTML = blogs.map(b => `
    <div class="grid-item-card">
      <img src="${escapeHtml(b.image || 'assets/services-mep-thumb.jpg')}" alt="${escapeHtml(b.title)}" class="grid-item-img" onerror="this.src='assets/services-mep-thumb.jpg'">
      <div class="grid-item-body">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span class="sidebar-badge">${escapeHtml(b.category || 'Article')}</span>
          <span style="font-size:11.5px; color:#64748B;">${escapeHtml(b.date || '')}</span>
        </div>
        <h3 class="grid-item-title">${escapeHtml(b.title)}</h3>
        <p class="grid-item-desc">${escapeHtml(b.summary || '')}</p>
        <div class="grid-item-footer">
          <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="editBlog('${b.id}')">Edit</button>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteBlog('${b.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================
// RENDER CAREERS
// ==========================================
function renderCareers() {
  if (!siteData) return;
  const tbody = document.getElementById('careersTableBody');
  const careers = siteData.careers || [];

  if (careers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748B;">No job listings found.</td></tr>`;
    return;
  }

  tbody.innerHTML = careers.map(c => `
    <tr>
      <td><strong style="color:#FFF;">${escapeHtml(c.title)}</strong></td>
      <td>${escapeHtml(c.department || 'Engineering')}</td>
      <td>${escapeHtml(c.location || 'Gurugram')} / ${escapeHtml(c.type || 'Full-time')}</td>
      <td>${escapeHtml(c.experience || '-')}</td>
      <td>
        <span class="admin-badge ${c.active ? 'badge-contacted' : 'badge-archived'}">
          ${c.active ? 'Active' : 'Closed'}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin btn-admin-outline btn-admin-sm" onclick="editCareer('${c.id}')">Edit</button>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteCareer('${c.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// RENDER INQUIRIES
// ==========================================
function renderInquiries() {
  if (!siteData) return;
  const tbody = document.getElementById('inquiriesTableBody');
  const searchTerm = (document.getElementById('inquirySearchInput').value || '').toLowerCase();
  const statusFilter = document.getElementById('inquiryStatusFilter').value;

  const filtered = (siteData.inquiries || []).filter(i => {
    const matchSearch = (i.name && i.name.toLowerCase().includes(searchTerm)) ||
                        (i.email && i.email.toLowerCase().includes(searchTerm)) ||
                        (i.firm && i.firm.toLowerCase().includes(searchTerm)) ||
                        (i.details && i.details.toLowerCase().includes(searchTerm));
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748B;">No inquiries found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inq => {
    const dateFormatted = new Date(inq.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const badgeClass = getBadgeClass(inq.status);
    return `
      <tr>
        <td style="color:#94A3B8; font-size:12px; white-space:nowrap;">${dateFormatted}</td>
        <td>
          <strong style="color:#FFF;">${escapeHtml(inq.name)}</strong>
          <div style="font-size:12px; color:#94A3B8;">✉ ${escapeHtml(inq.email || '-')}</div>
          <div style="font-size:12px; color:#94A3B8;">📞 ${escapeHtml(inq.phone || '-')}</div>
        </td>
        <td>${escapeHtml(inq.firm || 'Individual Client')}</td>
        <td style="max-width:320px; font-size:13px; color:#CBD5E1;">${escapeHtml(inq.details || '-')}</td>
        <td>
          <select class="admin-select" style="padding:4px 8px; font-size:12px; width:auto;" onchange="updateInquiryStatus('${inq.id}', this.value)">
            <option value="New" ${inq.status === 'New' ? 'selected' : ''}>New</option>
            <option value="In Review" ${inq.status === 'In Review' ? 'selected' : ''}>In Review</option>
            <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Archived" ${inq.status === 'Archived' ? 'selected' : ''}>Archived</option>
          </select>
        </td>
        <td>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteInquiry('${inq.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function getBadgeClass(status) {
  if (status === 'New') return 'badge-new';
  if (status === 'In Review') return 'badge-review';
  if (status === 'Contacted') return 'badge-contacted';
  return 'badge-archived';
}

// ==========================================
// PROJECT ACTIONS
// ==========================================
function openProjectModal(isNew = true, project = null) {
  document.getElementById('projectModalTitle').innerText = isNew ? 'Add New Project' : 'Edit Project';
  document.getElementById('projectId').value = project ? project.id : '';
  document.getElementById('projectTitle').value = project ? project.title : '';
  document.getElementById('projectCategory').value = project ? project.category : 'commercial';
  document.getElementById('projectSector').value = project ? (project.sector || '') : '';
  document.getElementById('projectLocation').value = project ? (project.location || '') : '';
  document.getElementById('projectArea').value = project ? (project.area || '') : '';
  document.getElementById('projectYear').value = project ? (project.completionYear || '2025') : '2025';
  document.getElementById('projectImageUrl').value = project ? (project.image || '') : '';
  document.getElementById('projectTags').value = project && Array.isArray(project.tags) ? project.tags.join(', ') : '';
  document.getElementById('projectDescription').value = project ? (project.description || '') : '';
  document.getElementById('projectFeatured').checked = project ? Boolean(project.featured) : false;

  const previewBox = document.getElementById('projectImgPreviewBox');
  const previewImg = document.getElementById('projectImgPreview');
  if (project && project.image) {
    previewImg.src = project.image;
    previewBox.style.display = 'inline-block';
  } else {
    previewBox.style.display = 'none';
  }

  openModal('projectModal');
}

function editProject(id) {
  const p = (siteData.projects || []).find(item => item.id === id);
  if (p) openProjectModal(false, p);
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to permanently delete this project?')) return;
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const result = await res.json();
    if (result.success) {
      showToast('Project deleted', 'success');
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const isEdit = Boolean(id);

  const payload = {
    title: document.getElementById('projectTitle').value.trim(),
    category: document.getElementById('projectCategory').value,
    sector: document.getElementById('projectSector').value.trim(),
    location: document.getElementById('projectLocation').value.trim(),
    area: document.getElementById('projectArea').value.trim(),
    completionYear: document.getElementById('projectYear').value.trim(),
    image: document.getElementById('projectImageUrl').value.trim() || 'assets/project-commercial.jpg',
    tags: document.getElementById('projectTags').value.split(',').map(s => s.trim()).filter(Boolean),
    description: document.getElementById('projectDescription').value.trim(),
    featured: document.getElementById('projectFeatured').checked
  };

  try {
    const url = isEdit ? `/api/projects/${id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(isEdit ? 'Project updated successfully' : 'New project added', 'success');
      closeModal('projectModal');
      loadDashboardData();
    } else {
      showToast(result.message || 'Error saving project', 'error');
    }
  } catch (err) {
    showToast('Failed to save project', 'error');
  }
}

// ==========================================
// SERVICE ACTIONS
// ==========================================
function openServiceModal(isNew = true, service = null) {
  document.getElementById('serviceModalTitle').innerText = isNew ? 'Add New Service' : 'Edit Service Details';
  document.getElementById('serviceId').value = service ? service.id : '';
  document.getElementById('serviceTitle').value = service ? service.title : '';
  document.getElementById('serviceCategory').value = service ? service.category : 'MEP DESIGN SERVICES';
  document.getElementById('serviceSummary').value = service ? (service.summary || '') : '';
  document.getElementById('serviceScope').value = service ? (service.scope || '') : '';
  document.getElementById('serviceDeliverables').value = service && Array.isArray(service.deliverables) ? service.deliverables.join(', ') : (service ? service.deliverables || '' : '');
  document.getElementById('serviceStandards').value = service ? (service.standards || '') : '';
  document.getElementById('serviceTools').value = service ? (service.tools || '') : '';

  openModal('serviceModal');
}

function editService(id) {
  const s = (siteData.services || []).find(item => item.id === id);
  if (s) openServiceModal(false, s);
}

async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;
  try {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const result = await res.json();
    if (result.success) {
      showToast('Service deleted', 'success');
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to delete service', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function handleServiceSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('serviceId').value;
  const isEdit = Boolean(id);

  const payload = {
    title: document.getElementById('serviceTitle').value.trim(),
    category: document.getElementById('serviceCategory').value,
    summary: document.getElementById('serviceSummary').value.trim(),
    scope: document.getElementById('serviceScope').value.trim(),
    deliverables: document.getElementById('serviceDeliverables').value.split(',').map(s => s.trim()).filter(Boolean),
    standards: document.getElementById('serviceStandards').value.trim(),
    tools: document.getElementById('serviceTools').value.trim()
  };

  try {
    const url = isEdit ? `/api/services/${id}` : '/api/services';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(isEdit ? 'Service updated successfully' : 'New service added', 'success');
      closeModal('serviceModal');
      loadDashboardData();
    } else {
      showToast(result.message || 'Error saving service', 'error');
    }
  } catch (err) {
    showToast('Failed to save service', 'error');
  }
}

// ==========================================
// CONTENT & SITE INFO FORM SUBMIT
// ==========================================
async function handleSiteContentSubmit(e) {
  e.preventDefault();
  const payload = {
    company: {
      name: document.getElementById('contentCompanyName').value.trim(),
      tagline: document.getElementById('contentTagline').value.trim(),
      phone: document.getElementById('contentPhone').value.trim(),
      email: document.getElementById('contentEmail').value.trim(),
      careersEmail: document.getElementById('contentCareersEmail').value.trim(),
      address: document.getElementById('contentAddress').value.trim()
    },
    hero: {
      badge: document.getElementById('contentHeroBadge').value.trim(),
      title: document.getElementById('contentHeroTitle').value.trim(),
      subtitle: document.getElementById('contentHeroSubtitle').value.trim()
    }
  };

  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Site settings updated successfully!', 'success');
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to update', 'error');
    }
  } catch (err) {
    showToast('Network error saving settings', 'error');
  }
}

// ==========================================
// BLOG ACTIONS
// ==========================================
function openBlogModal(isNew = true, blog = null) {
  document.getElementById('blogModalTitle').innerText = isNew ? 'Add Blog Post' : 'Edit Blog Post';
  document.getElementById('blogId').value = blog ? blog.id : '';
  document.getElementById('blogTitle').value = blog ? blog.title : '';
  document.getElementById('blogCategory').value = blog ? (blog.category || '') : 'Engineering';
  document.getElementById('blogAuthor').value = blog ? (blog.author || '') : 'Stratum Engineering Squad';
  document.getElementById('blogReadTime').value = blog ? (blog.readTime || '') : '5 min read';
  document.getElementById('blogImage').value = blog ? (blog.image || '') : 'assets/services-mep-thumb.jpg';
  document.getElementById('blogSummary').value = blog ? (blog.summary || '') : '';
  document.getElementById('blogContent').value = blog ? (blog.content || '') : '';

  openModal('blogModal');
}

function editBlog(id) {
  const b = (siteData.blogs || []).find(item => item.id === id);
  if (b) openBlogModal(false, b);
}

async function deleteBlog(id) {
  if (!confirm('Are you sure you want to delete this blog post?')) return;
  try {
    const res = await fetch(`/api/blogs/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const result = await res.json();
    if (result.success) {
      showToast('Blog post deleted', 'success');
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to delete blog', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function handleBlogSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('blogId').value;
  const isEdit = Boolean(id);

  const payload = {
    title: document.getElementById('blogTitle').value.trim(),
    category: document.getElementById('blogCategory').value.trim(),
    author: document.getElementById('blogAuthor').value.trim(),
    readTime: document.getElementById('blogReadTime').value.trim(),
    image: document.getElementById('blogImage').value.trim() || 'assets/services-mep-thumb.jpg',
    summary: document.getElementById('blogSummary').value.trim(),
    content: document.getElementById('blogContent').value.trim()
  };

  try {
    const url = isEdit ? `/api/blogs/${id}` : '/api/blogs';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(isEdit ? 'Article updated' : 'Article published', 'success');
      closeModal('blogModal');
      loadDashboardData();
    } else {
      showToast(result.message || 'Error saving article', 'error');
    }
  } catch (err) {
    showToast('Failed to save article', 'error');
  }
}

// ==========================================
// CAREER ACTIONS
// ==========================================
function openCareerModal(isNew = true, job = null) {
  document.getElementById('careerModalTitle').innerText = isNew ? 'Add Job Opening' : 'Edit Job Opening';
  document.getElementById('careerId').value = job ? job.id : '';
  document.getElementById('careerTitle').value = job ? job.title : '';
  document.getElementById('careerDepartment').value = job ? (job.department || '') : 'BIM & VDC';
  document.getElementById('careerLocation').value = job ? (job.location || '') : 'Gurugram HQ';
  document.getElementById('careerExperience').value = job ? (job.experience || '') : '3+ Years';
  document.getElementById('careerTags').value = job && Array.isArray(job.tags) ? job.tags.join(', ') : '';
  document.getElementById('careerDescription').value = job ? (job.description || '') : '';
  document.getElementById('careerActive').checked = job ? Boolean(job.active) : true;

  openModal('careerModal');
}

function editCareer(id) {
  const c = (siteData.careers || []).find(item => item.id === id);
  if (c) openCareerModal(false, c);
}

async function deleteCareer(id) {
  if (!confirm('Are you sure you want to delete this job opening?')) return;
  try {
    const res = await fetch(`/api/careers/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const result = await res.json();
    if (result.success) {
      showToast('Job opening deleted', 'success');
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to delete opening', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}

async function handleCareerSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('careerId').value;
  const isEdit = Boolean(id);

  const payload = {
    title: document.getElementById('careerTitle').value.trim(),
    department: document.getElementById('careerDepartment').value.trim(),
    location: document.getElementById('careerLocation').value.trim(),
    experience: document.getElementById('careerExperience').value.trim(),
    tags: document.getElementById('careerTags').value.split(',').map(s => s.trim()).filter(Boolean),
    description: document.getElementById('careerDescription').value.trim(),
    active: document.getElementById('careerActive').checked
  };

  try {
    const url = isEdit ? `/api/careers/${id}` : '/api/careers';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      showToast(isEdit ? 'Job listing updated' : 'New job opening created', 'success');
      closeModal('careerModal');
      loadDashboardData();
    } else {
      showToast(result.message || 'Error saving job opening', 'error');
    }
  } catch (err) {
    showToast('Failed to save job opening', 'error');
  }
}

// ==========================================
// INQUIRY ACTIONS
// ==========================================
async function updateInquiryStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Status updated to "${newStatus}"`, 'success');
      loadDashboardData();
    }
  } catch (err) {
    showToast('Failed to update inquiry status', 'error');
  }
}

async function deleteInquiry(id) {
  if (!confirm('Are you sure you want to delete this inquiry record?')) return;
  try {
    const res = await fetch(`/api/inquiries/${id}`, {
      method: 'DELETE',
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });
    const result = await res.json();
    if (result.success) {
      showToast('Inquiry deleted', 'success');
      loadDashboardData();
    }
  } catch (err) {
    showToast('Failed to delete inquiry', 'error');
  }
}

function exportInquiriesCSV() {
  if (!siteData || !siteData.inquiries || siteData.inquiries.length === 0) {
    showToast('No inquiries to export');
    return;
  }
  const headers = ['ID', 'Date', 'Name', 'Email', 'Firm', 'Phone', 'Scope Details', 'Status'];
  const rows = siteData.inquiries.map(i => [
    i.id,
    new Date(i.date).toISOString(),
    `"${(i.name || '').replace(/"/g, '""')}"`,
    `"${(i.email || '').replace(/"/g, '""')}"`,
    `"${(i.firm || '').replace(/"/g, '""')}"`,
    `"${(i.phone || '').replace(/"/g, '""')}"`,
    `"${(i.details || '').replace(/"/g, '""')}"`,
    i.status
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Stratum_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// PASSWORD CHANGE
// ==========================================
async function handlePasswordChange(e) {
  e.preventDefault();
  const newUsername = document.getElementById('newAdminUsername').value.trim();
  const currentPassword = document.getElementById('currentAdminPassword').value;
  const newPassword = document.getElementById('newAdminPassword').value;
  const confirmPassword = document.getElementById('confirmAdminPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ currentPassword, newPassword, newUsername })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Admin credentials updated successfully!', 'success');
      document.getElementById('passwordChangeForm').reset();
    } else {
      showToast(result.message || 'Error updating password', 'error');
    }
  } catch (err) {
    showToast('Network error updating password', 'error');
  }
}

// ==========================================
// IMAGE UPLOAD DROPZONE
// ==========================================
function setupDropzone() {
  const dropzone = document.getElementById('projectDropzone');
  const fileInput = document.getElementById('projectFileInput');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--admin-primary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--admin-border)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--admin-border)';
    if (e.dataTransfer.files.length) {
      uploadFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      uploadFile(fileInput.files[0]);
    }
  });

  // Manual URL typing updates preview
  document.getElementById('projectImageUrl').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    const previewBox = document.getElementById('projectImgPreviewBox');
    const previewImg = document.getElementById('projectImgPreview');
    if (val) {
      previewImg.src = val;
      previewBox.style.display = 'inline-block';
    } else {
      previewBox.style.display = 'none';
    }
  });
}

async function uploadFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Only image files are supported', 'error');
    return;
  }

  showToast('Uploading image...', 'info');
  const reader = new FileReader();

  reader.onload = async () => {
    const base64Data = reader.result;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          name: file.name,
          data: base64Data
        })
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('projectImageUrl').value = result.url;
        const previewBox = document.getElementById('projectImgPreviewBox');
        const previewImg = document.getElementById('projectImgPreview');
        previewImg.src = result.url;
        previewBox.style.display = 'inline-block';
        showToast('Image uploaded successfully!', 'success');
      } else {
        showToast(result.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('Error uploading image', 'error');
    }
  };

  reader.readAsDataURL(file);
}

// ==========================================
// TAB ROUTING & EVENT LISTENERS
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));

  const navItem = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
  const section = document.getElementById(`tab-${tabId}`);

  if (navItem) navItem.classList.add('active');
  if (section) section.classList.add('active');

  const titles = {
    overview: 'Dashboard Overview',
    inquiries: 'Client Inquiries & Leads Inbox',
    projects: 'Projects & Portfolio Manager',
    services: 'Engineering Services Manager (15 Disciplines)',
    content: 'Site Contact Info & Hero Content',
    blogs: 'Technical Blog Articles',
    careers: 'Career Opportunities & Jobs',
    settings: 'Security & Password Settings'
  };
  document.getElementById('pageTitle').innerText = titles[tabId] || 'Admin Dashboard';
}

function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Navigation tab clicks
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Topbar quick add
  document.getElementById('quickAddProjectBtn').addEventListener('click', () => {
    switchTab('projects');
    openProjectModal(true);
  });

  // Project manager buttons
  document.getElementById('openNewProjectModalBtn').addEventListener('click', () => openProjectModal(true));
  document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);
  document.getElementById('projectSearchInput').addEventListener('input', renderProjects);
  document.getElementById('projectCategoryFilter').addEventListener('change', renderProjects);

  // Service manager buttons
  document.getElementById('openNewServiceModalBtn').addEventListener('click', () => openServiceModal(true));
  document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
  document.getElementById('serviceCategoryFilter').addEventListener('change', renderServices);

  // Site content form
  document.getElementById('siteContentForm').addEventListener('submit', handleSiteContentSubmit);

  // Blog manager buttons
  document.getElementById('openNewBlogModalBtn').addEventListener('click', () => openBlogModal(true));
  document.getElementById('blogForm').addEventListener('submit', handleBlogSubmit);

  // Career manager buttons
  document.getElementById('openNewCareerModalBtn').addEventListener('click', () => openCareerModal(true));
  document.getElementById('careerForm').addEventListener('submit', handleCareerSubmit);

  // Inquiries buttons
  document.getElementById('inquirySearchInput').addEventListener('input', renderInquiries);
  document.getElementById('inquiryStatusFilter').addEventListener('change', renderInquiries);
  document.getElementById('exportInquiriesBtn').addEventListener('click', exportInquiriesCSV);

  // Password change
  document.getElementById('passwordChangeForm').addEventListener('submit', handlePasswordChange);
}

// ==========================================
// MODAL & TOAST UTILITIES
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Close modal on backdrop click
document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
    }
  });
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
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
