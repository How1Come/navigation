// DOM Elements
const navList = document.getElementById("navList");
const navItems = navList.querySelectorAll("li a");
const sidebarIcon = document.getElementById("sidebarIcon");
const sidebar = document.getElementById("sidebar");
const categoryLinks = document.querySelectorAll(".category-list li a");
const sitesContainer = document.getElementById("sitesContainer");
const loginToggle = document.getElementById("loginToggle");
const contactBtn = document.getElementById("contactBtn");

// Modals
const passwordModal = document.getElementById("passwordModal");
const loginModal = document.getElementById("loginModal");
const adminModal = document.getElementById("adminModal");

// Admin panel elements
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const addSiteForm = document.getElementById("addSiteForm");
const editSiteForm = document.getElementById("editSiteForm");
const editSiteSelect = document.getElementById("editSiteSelect");
const removeSiteSelect = document.getElementById("removeSiteSelect");
const removeSitePreview = document.getElementById("removeSitePreview");

// Site data storage
let sites = [];
let isAdmin = false; // 新增：管理員登入狀態

// Cloudflare Worker API endpoint
const WORKER_API = "https://long-voice-58b0.sujimmy666666.workers.dev";

// 新增狀態：是否顯示受限網站、是否啟用特殊視覺
let showWarn = false;
let specialVisuals = false;

// DOM for new controls
const toggleWarnBtn = document.getElementById("toggleWarnBtn");
const visualsToggle = document.getElementById("visualsToggle");

// --- Modal functions ---
function showModal(modal) {
  try {
    closeAllModals();
    if (!modal) return;
    modal.style.display = "flex";
    modal.style.zIndex = "10000";
    if (!modal.hasAttribute("tabindex")) modal.setAttribute("tabindex", "-1");
    setTimeout(() => {
      try {
        modal.focus();
      } catch (e) {}
    }, 50);
  } catch (e) {
    console.error("showModal error:", e);
  }
}

function closeAllModals() {
  try {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
      modal.style.zIndex = "";
    });
  } catch (e) {
    console.error("closeAllModals error:", e);
  }
}

// Initialize the application
function init() {
  console.log("init() called");
  loadSites();
  addEventListeners();
  populateSiteSelects();

  document.querySelectorAll(".box img").forEach((img) => {
    if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
  });

  showWarn = localStorage.getItem("showWarn") === "true";
  specialVisuals = localStorage.getItem("specialVisuals") === "true";

  if (toggleWarnBtn) {
    toggleWarnBtn.textContent = showWarn ? "隱藏受限網站" : "顯示受限網站";
  }
  if (visualsToggle) visualsToggle.checked = specialVisuals;

  applyWarnVisibility(showWarn);
  applySpecialVisuals(specialVisuals);

  initImageUploadAndCategories();
  fixBackgroundVideo();

  sitesContainer.style.display = "none";
  showModal(passwordModal);
}

// Add event listeners
function addEventListeners() {
  navItems.forEach((item) => {
    item.addEventListener("click", handleNavItemClick);
  });

  sidebarIcon.addEventListener("click", toggleSidebar);

  document.getElementById("foldSidebarBtn").addEventListener("click", function() {
    sidebar.classList.toggle("folded");
    const icon = this.querySelector("i");
    if (sidebar.classList.contains("folded")) {
      icon.classList.remove("fa-angle-left");
      icon.classList.add("fa-angle-right");
    } else {
      icon.classList.remove("fa-angle-right");
      icon.classList.add("fa-angle-left");
    }
  });

  document.getElementById("foldHeaderBtn").addEventListener("click", function() {
    const header = document.querySelector("header");
    header.classList.toggle("folded");
    const icon = this.querySelector("i");
    if (header.classList.contains("folded")) {
      icon.classList.remove("fa-angle-up");
      icon.classList.add("fa-angle-down");
    } else {
      icon.classList.remove("fa-angle-down");
      icon.classList.add("fa-angle-up");
    }
  });

  const categoryListElement = document.querySelector(".category-list");
  if (categoryListElement) {
    categoryListElement.addEventListener("click", function (e) {
      if (e.target.tagName === "A" || e.target.closest("a")) {
        const linkElement = e.target.closest("a");
        filterSitesByCategory.call(linkElement, e);
      }
    });
  }

  if (contactBtn) {
    contactBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(passwordModal);
    });
  }
  if (loginToggle) {
    loginToggle.addEventListener("click", function (e) {
      e.preventDefault();
      showModal(loginModal);
    });
  }

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("submitBtn").addEventListener("click", handlePasswordSubmit);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  addSiteForm.addEventListener("submit", handleAddSite);
  editSiteForm.addEventListener("submit", handleUpdateSite);
  document.getElementById("removeLinkBtn").addEventListener("click", handleRemoveSite);

  editSiteSelect.addEventListener("change", populateEditForm);
  removeSiteSelect.addEventListener("change", showSitePreview);

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  if (toggleWarnBtn) {
    toggleWarnBtn.addEventListener("click", () => {
      showWarn = !showWarn;
      localStorage.setItem("showWarn", showWarn);
      toggleWarnBtn.textContent = showWarn ? "隱藏受限網站" : "顯示受限網站";
      applyWarnVisibility(showWarn);
    });
  }

  if (visualsToggle) {
    visualsToggle.addEventListener("change", (e) => {
      specialVisuals = e.target.checked;
      localStorage.setItem("specialVisuals", specialVisuals);
      applySpecialVisuals(specialVisuals);
    });
  }
}

// Handle navigation item click
function handleNavItemClick(e) {
  navItems.forEach((item) => item.classList.remove("active"));
  e.target.classList.add("active");
}

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle("active");
  const navUl = document.querySelector("nav ul");
  if (window.innerWidth <= 768) {
    navUl.classList.toggle("active");
  }
}

// Filter sites by category
function filterSitesByCategory(e) {
  e.preventDefault();
  const clickedLink = this;
  const allCategoryLinks = document.querySelectorAll(".category-list li a");
  allCategoryLinks.forEach((link) => link.classList.remove("active"));
  clickedLink.classList.add("active");

  const category = clickedLink.getAttribute("href").substring(1);
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    if (box.classList.contains("warn") && !showWarn) {
      box.style.display = "none";
      return;
    }
    if (category === "全部") {
      box.style.display = "block";
    } else if (box.classList.contains(category)) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });

  if (window.innerWidth <= 768) {
    sidebar.classList.remove("active");
  }
}

// Apply or remove show/hide for warn boxes
function applyWarnVisibility(show) {
  const activeLink = document.querySelector(".category-list li a.active");
  const activeCategory = activeLink
    ? activeLink.getAttribute("href").substring(1)
    : "全部";

  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    if (!box.classList.contains("warn")) {
      if (activeCategory === "全部") {
        box.style.display = "block";
      } else if (box.classList.contains(activeCategory)) {
        box.style.display = "block";
      } else {
        box.style.display = "none";
      }
      return;
    }
    if (!show) {
      box.style.display = "none";
      return;
    }
    if (activeCategory === "全部") {
      box.style.display = "block";
    } else if (box.classList.contains(activeCategory)) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });
}

// Apply or revert special visuals
function applySpecialVisuals(enabled) {
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box, index) => {
    const img = box.querySelector("img");
    if (!img) return;

    if (enabled) {
      if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
      img.src = `simages/s${index + 1}.jpg`;
    } else {
      if (img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
      } else {
        const id = box.dataset.id;
        if (id) {
          const site = sites.find((s) => s.id === id);
          if (site && site.imageUrl) img.src = site.imageUrl;
        }
      }
    }
  });

  if (enabled) {
    addVideoBackground();
    sidebar.classList.add("liquid-glass");
    document.querySelector("header").classList.add("liquid-glass");
  } else {
    const existingVideo = document.getElementById("bgVideo");
    if (existingVideo) existingVideo.remove();
    sidebar.classList.remove("liquid-glass");
    document.querySelector("header").classList.remove("liquid-glass");
  }
}

// 修改 handlePasswordSubmit
function handlePasswordSubmit() {
  const password = document.getElementById("passwordInput").value;

  if (password === "277353") {
    sitesContainer.style.display = "grid";
    specialVisuals = false;
    localStorage.setItem("specialVisuals", "false");
    if (visualsToggle) visualsToggle.checked = false;
    applySpecialVisuals(false);

    sidebar.classList.remove("liquid-glass");
    const hdr = document.querySelector("header");
    if (hdr) hdr.classList.remove("liquid-glass");

    closeAllModals();
  } else {
    alert("密码错误");
  }
}

// Add video background
function addVideoBackground() {
  const existingVideo = document.getElementById("bgVideo");
  if (existingVideo) {
    existingVideo.remove();
  }
  const video = document.createElement("video");
  video.id = "bgVideo";
  const source = document.createElement("source");

  const videos = ["bg_video/raiden.mp4", "bg_video/hutao.mp4"];
  const randomVideo = videos[Math.floor(Math.random() * videos.length)];

  source.setAttribute("src", randomVideo);
  video.appendChild(source);
  video.setAttribute("autoplay", true);
  video.setAttribute("loop", true);
  video.setAttribute("muted", true);
  video.setAttribute("playsinline", true);

  document.body.appendChild(video);
}

// Switch tab in admin panel
function switchTab(e) {
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  e.target.classList.add("active");
  const tabId = e.target.getAttribute("data-tab");
  tabContents.forEach((content) => {
    content.style.display = "none";
  });
  document.getElementById(`${tabId}Tab`).style.display = "block";
}

// Handle add site
function handleAddSite(e) {
  e.preventDefault();

  const url = document.getElementById("siteUrl").value;
  const name = document.getElementById("siteName").value;
  const description = document.getElementById("siteDescription").value;
  const category = document.getElementById("siteCategory").value;
  const imageUrl =
    document.getElementById("siteImage").value || `images/default.jpg`;
  const isRestricted = document.getElementById("isRestricted").checked;

  const site = {
    id: Date.now().toString(),
    url,
    name,
    description,
    category,
    imageUrl,
    isRestricted,
  };

  sites.push(site);
  saveSites();
  addSiteToDOM(site);
  addSiteForm.reset();
  populateSiteSelects();
  alert("网站添加成功！");
}

// Handle update site
function handleUpdateSite(e) {
  e.preventDefault();
  const siteId = editSiteSelect.value;
  const siteIndex = sites.findIndex((site) => site.id === siteId);

  if (siteIndex !== -1) {
    const url = document.getElementById("editSiteUrl").value;
    const name = document.getElementById("editSiteName").value;
    const description = document.getElementById("editSiteDescription").value;
    const category = document.getElementById("editSiteCategory").value;
    const imageUrl =
      document.getElementById("editSiteImage").value ||
      sites[siteIndex].imageUrl;
    const isRestricted = document.getElementById("editIsRestricted").checked;

    sites[siteIndex] = {
      ...sites[siteIndex],
      url,
      name,
      description,
      category,
      imageUrl,
      isRestricted,
    };

    saveSites();
    updateSitesDOM();
    populateSiteSelects();
    alert("网站更新成功！");
  }
}

// Handle remove site
function handleRemoveSite() {
  const siteId = removeSiteSelect.value;
  if (siteId) {
    if (confirm("确定要删除这个网站吗？")) {
      sites = sites.filter((site) => site.id !== siteId);
      saveSites();
      updateSitesDOM();
      populateSiteSelects();
      removeSitePreview.innerHTML = "";
      alert("网站删除成功！");
    }
  } else {
    alert("请选择要删除的网站");
  }
}

// Populate edit form
function populateEditForm() {
  const siteId = editSiteSelect.value;
  const site = sites.find((site) => site.id === siteId);
  if (site) {
    document.getElementById("editSiteUrl").value = site.url;
    document.getElementById("editSiteName").value = site.name;
    document.getElementById("editSiteDescription").value = site.description;
    document.getElementById("editSiteCategory").value = site.category;
    document.getElementById("editSiteImage").value = site.imageUrl;
    document.getElementById("editIsRestricted").checked = site.isRestricted;
  }
}

// Show site preview
function showSitePreview() {
  const siteId = removeSiteSelect.value;
  const site = sites.find((site) => site.id === siteId);
  if (site) {
    removeSitePreview.innerHTML = `
      <div class="preview-box">
        <div class="preview-image">
          <img src="${site.imageUrl}" alt="${site.name}">
        </div>
        <div class="preview-content">
          <h3>${site.name}</h3>
          <p>${site.description}</p>
          <p class="preview-url">${site.url}</p>
          <p class="preview-category">分类: ${site.category}</p>
          ${
            site.isRestricted
              ? '<p class="preview-restricted">限制访问</p>'
              : ""
          }
        </div>
      </div>
    `;
  } else {
    removeSitePreview.innerHTML = "";
  }
}

// Add site to DOM
function addSiteToDOM(site) {
  const siteElement = document.createElement("div");
  siteElement.className = `box ${site.category}`;
  siteElement.dataset.id = site.id;

  if (site.isRestricted) {
    siteElement.classList.add("warn");
  }

  siteElement.innerHTML = `
    <a href="${site.url}" target="_blank">
      <div class="box-image">
        <img src="${site.imageUrl}" alt="${site.name}">
      </div>
      <div class="box-content">
        <h2>${site.name}</h2>
        <p>${site.description}</p>
      </div>
    </a>
  `;

  sitesContainer.appendChild(siteElement);
  const img = siteElement.querySelector("img");
  if (img && !img.dataset.originalSrc) img.dataset.originalSrc = img.src;

  if (specialVisuals) {
    const boxes = Array.from(document.querySelectorAll(".box"));
    const idx = boxes.indexOf(siteElement);
    if (img) img.src = `simages/s${idx + 1}.jpg`;
  }
}

// Update sites in DOM
function updateSitesDOM() {
  sitesContainer.innerHTML = "";
  sites.forEach((site) => {
    addSiteToDOM(site);
  });
}

// Populate site selects
function populateSiteSelects() {
  editSiteSelect.innerHTML = '<option value="">选择网站...</option>';
  removeSiteSelect.innerHTML = '<option value="">选择网站...</option>';
  sites.forEach((site) => {
    const option = document.createElement("option");
    option.value = site.id;
    option.textContent = site.name;
    editSiteSelect.appendChild(option.cloneNode(true));
    removeSiteSelect.appendChild(option);
  });
}

// Save sites to Cloudflare KV
async function saveSites() {
  try {
    await fetch(WORKER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sites)
    });
  } catch (e) {
    console.error("Save KV error:", e);
  }
}

// Load sites from Cloudflare KV
async function loadSites() {
  try {
    const res = await fetch(WORKER_API);
    if (res.ok) {
      sites = await res.json();
      if (!Array.isArray(sites)) sites = [];
      updateSitesDOM();
    } else {
      console.warn("KV returned non-200, fallback to defaults");
      initializeDefaultSites();
    }
  } catch (e) {
    console.error("Load KV error:", e);
    initializeDefaultSites();
  }
}

// Initialize with default sites
function initializeDefaultSites() {
  sites = [];
  updateSitesDOM();
}

// Initialize image upload & categories
function initImageUploadAndCategories() {
  const siteImageInput = document.getElementById("siteImage");
  const editSiteImageInput = document.getElementById("editSiteImage");

  [siteImageInput, editSiteImageInput].forEach((input) => {
    if (input) {
      input.addEventListener("dragover", (e) => {
        e.preventDefault();
        input.classList.add("drag-over");
      });
      input.addEventListener("dragleave", () => {
        input.classList.remove("drag-over");
      });
      input.addEventListener("drop", (e) => {
        e.preventDefault();
        input.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            input.value = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  });

  const siteCategoryInput = document.getElementById("siteCategory");
  const editSiteCategoryInput = document.getElementById("editSiteCategory");
  if (siteCategoryInput) {
    siteCategoryInput.addEventListener("change", () => {
      addCategory(siteCategoryInput.value);
    });
  }
  if (editSiteCategoryInput) {
    editSiteCategoryInput.addEventListener("change", () => {
      addCategory(editSiteCategoryInput.value);
    });
  }
}

// Add category
function addCategory(category) {
  if (!category) return;
  const categoryList = document.querySelector(".category-list");
  if (!categoryList) return;

  const existing = Array.from(categoryList.querySelectorAll("a")).some(
    (a) => a.textContent === category
  );
  if (!existing) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${category}`;
    a.textContent = category;
    a.addEventListener("click", filterSitesByCategory);
    li.appendChild(a);
    categoryList.appendChild(li);
  }
}

// Fix background video
function fixBackgroundVideo() {
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true;
    video.play().catch((err) => console.log("Auto-play prevented:", err));
  });
}

// Handle login
function handleLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "howcome") {
    isAdmin = true;
    closeAllModals();
    showModal(adminModal);
  } else {
    alert("用户名或密码错误");
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", init);
