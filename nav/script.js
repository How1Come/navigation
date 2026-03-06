// Cloudflare Worker API (set to your Worker URL, or '' to use only localStorage)
const API_BASE = " https://nav-sites-sync.sujimmy666666.workers.dev"; // e.g. "https://nav-sites.xxx.workers.dev"

// DOM Elements
const navList = document.getElementById("navList");
const navItems = navList.querySelectorAll("li a");
const sidebarIcon = document.getElementById("sidebarIcon");
const sidebar = document.getElementById("sidebar");
const categoryLinks = document.querySelectorAll(".category-list li a");
const sitesContainer = document.getElementById("sitesContainer");
const loginToggle = document.getElementById("loginToggle");

// Modals
const passwordModal = document.getElementById("passwordModal");
const loginModal = document.getElementById("loginModal");
const adminModal = document.getElementById("adminModal");
const closeButtons = document.querySelectorAll(".close-btn");

// --- 新增：確保 modal 控制函式在事件綁定前可用 ---
function showModal(modal) {
  try {
    // 先關閉其他 modal
    closeAllModals();
    if (!modal) return;
    modal.style.display = "flex";
    modal.style.zIndex = "10000";
    if (!modal.hasAttribute("tabindex")) modal.setAttribute("tabindex", "-1");
    setTimeout(() => {
      try {
        modal.focus();
      } catch (e) {
        /* ignore */
      }
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
// --- 新增結束 ---

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

// 新增狀態：是否顯示受限網站、是否啟用特殊視覺
let showWarn = false;
let specialVisuals = false;

// DOM for new controls
const toggleWarnBtn = document.getElementById("toggleWarnBtn");
const visualsToggle = document.getElementById("visualsToggle");

// Initialize the application
function init() {
  // Load sites: try Cloudflare first, then localStorage
  fetchSitesFromCloud().catch(loadSites).then(function () {
    addEventListeners();
    populateSiteSelects();

    document.querySelectorAll(".box img").forEach((img) => {
      if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
    });

    // Only admin can see restricted sites and special visuals; foreigners cannot
    if (sessionStorage.getItem("adminSession") === "1") {
      showWarn = localStorage.getItem("showWarn") === "true";
      specialVisuals = localStorage.getItem("specialVisuals") === "true";
    } else {
      showWarn = false;
      specialVisuals = false;
    }

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
  });
}

// Add event listeners
function addEventListeners() {
  // Navigation menu
  navItems.forEach((item) => {
    item.addEventListener("click", handleNavItemClick);
  });

  // Sidebar toggle
  sidebarIcon.addEventListener("click", toggleSidebar);

  // Sidebar fold button
  document.getElementById("foldSidebarBtn").addEventListener("click", function() {
    sidebar.classList.toggle("folded");
    const icon = this.querySelector("i");
    if (sidebar.classList.contains("folded")) {
      icon.classList.remove("fa-chevron-left");
      icon.classList.add("fa-chevron-right");
    } else {
      icon.classList.remove("fa-chevron-right");
      icon.classList.add("fa-chevron-left");
    }
  });

  document.getElementById("foldHeaderBtn").addEventListener("click", function() {
    const header = document.querySelector("header");
    header.classList.toggle("folded");
    const icon = this.querySelector("i");
    if (header.classList.contains("folded")) {
      icon.classList.remove("fa-chevron-up");
      icon.classList.add("fa-chevron-down");
    } else {
      icon.classList.remove("fa-chevron-down");
      icon.classList.add("fa-chevron-up");
    }
  });

  // Category filtering - Using Event Delegation
  const categoryListElement = document.querySelector(".category-list");
  if (categoryListElement) {
    categoryListElement.addEventListener("click", function (e) {
      if (e.target.tagName === "A" || e.target.closest("a")) {
        const linkElement = e.target.closest("a");
        // Call filterSitesByCategory, but ensure 'this' context is the link
        filterSitesByCategory.call(linkElement, e);
      }
    });
  }

  if (loginToggle) {
    loginToggle.addEventListener("click", function (e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      // If already logged in this session, open admin panel directly
      if (sessionStorage.getItem("adminSession") === "1") {
        showModal(adminModal);
        populateSiteSelects();
        return;
      }
      showModal(loginModal);
    });
  }

  // Exit admin (clear session, close panel)
  const exitAdminBtn = document.getElementById("exitAdminBtn");
  if (exitAdminBtn) {
    exitAdminBtn.addEventListener("click", function () {
      sessionStorage.removeItem("adminSession");
      sessionStorage.removeItem("adminToken");
      isAdmin = false;
      closeAllModals();
    });
  }

  // Modal close buttons
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  // Admin login
  document.getElementById("loginBtn").addEventListener("click", handleLogin);

  // Password verification (click and Enter)
  document.getElementById("submitBtn").addEventListener("click", handlePasswordSubmit);
  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handlePasswordSubmit();
    });
  }

  // Tab switching in admin panel
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", switchTab);
  });

  // Site forms
  addSiteForm.addEventListener("submit", handleAddSite);
  editSiteForm.addEventListener("submit", handleUpdateSite);
  document
    .getElementById("removeLinkBtn")
    .addEventListener("click", handleRemoveSite);

  // Edit site selection change
  editSiteSelect.addEventListener("change", populateEditForm);
  removeSiteSelect.addEventListener("change", showSitePreview);

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeAllModals();
    }
  });

  // 新增：管理控制的事件綁定（若元素存在）
  if (toggleWarnBtn) {
    toggleWarnBtn.addEventListener("click", () => {
      showWarn = !showWarn;
      localStorage.setItem("showWarn", showWarn);
      toggleWarnBtn.textContent = showWarn ? "隱藏受限網站" : "顯示受限網站";
      applyWarnVisibility(showWarn);
    });
    // 可見性在登出/登入間持久化，由 localStorage處理
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
  // Remove active class from all items
  navItems.forEach((item) => item.classList.remove("active"));

  // Add active class to clicked item
  e.target.classList.add("active");
}

// Toggle sidebar
function toggleSidebar() {
  sidebar.classList.toggle("active");

  // Toggle navigation menu on mobile
  const navUl = document.querySelector("nav ul");
  if (window.innerWidth <= 768) {
    navUl.classList.toggle("active");
  }
}

// Filter sites by category
function filterSitesByCategory(e) {
  e.preventDefault();
  console.log(
    "filterSitesByCategory called. Event target:",
    e.target,
    "Current target (this):",
    this
  );

  // 'this' is now the clicked link element due to .call() in the event listener
  const clickedLink = this;
  console.log("Clicked link href:", clickedLink.getAttribute("href"));

  // Update active class on category links
  const allCategoryLinks = document.querySelectorAll(".category-list li a");
  allCategoryLinks.forEach((link) => link.classList.remove("active"));
  clickedLink.classList.add("active");

  // Get category from href attribute
  const category = clickedLink.getAttribute("href").substring(1);
  console.log("Extracted category:", category);

  // Show/hide sites based on category and showWarn flag
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    // 受限網站顯示邏輯改為使用 showWarn（可由管理開關控制）
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

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("active");
  }
}

// Apply or remove show/hide for warn boxes (重新依當前分類計算)
function applyWarnVisibility(show) {
  const activeLink = document.querySelector(".category-list li a.active");
  const activeCategory = activeLink
    ? activeLink.getAttribute("href").substring(1)
    : "全部";

  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    if (!box.classList.contains("warn")) {
      // 非受限依分類顯示
      if (activeCategory === "全部") {
        box.style.display = "block";
      } else if (box.classList.contains(activeCategory)) {
        box.style.display = "block";
      } else {
        box.style.display = "none";
      }
      return;
    }

    // 受限盒子
    if (!show) {
      box.style.display = "none";
      return;
    }

    // show === true：依分類顯示
    if (activeCategory === "全部") {
      box.style.display = "block";
    } else if (box.classList.contains(activeCategory)) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });
}

// Apply or revert special visuals (封面與背景)
function applySpecialVisuals(enabled) {
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box, index) => {
    const img = box.querySelector("img");
    if (!img) return;

    if (enabled) {
      if (!img.dataset.originalSrc) img.dataset.originalSrc = img.src;
      // Prefer per-site special cover if set, else fallback to simages/sN.jpg
      const id = box.dataset.id;
      const site = id ? sites.find((s) => s.id === id) : null;
      img.src = (site && site.specialImageUrl) ? site.specialImageUrl : `simages/s${index + 1}.jpg`;
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

  // 背景影片
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

// 修改 handlePasswordSubmit 以在驗證成功時顯示內容並還原為預設封面/背景
function handlePasswordSubmit() {
  const password = document.getElementById("passwordInput").value;

  if (password === "277353") {
    // 顯示內容
    sitesContainer.style.display = "grid";

    // 確保特殊視覺關閉（還原封面與背景為預設）
    specialVisuals = false;
    localStorage.setItem("specialVisuals", "false");
    if (visualsToggle) visualsToggle.checked = false;
    applySpecialVisuals(false);

    // 移除毛玻璃樣式（如有）
    sidebar.classList.remove("liquid-glass");
    const hdr = document.querySelector("header");
    if (hdr) hdr.classList.remove("liquid-glass");

    // 關閉密碼模態框
    closeAllModals();
  } else {
    alert("密码错误");
  }
}

// Add video background
function addVideoBackground() {
  // Remove existing video if any
  const existingVideo = document.getElementById("bgVideo");
  if (existingVideo) {
    existingVideo.remove();
  }

  // Create video element
  const video = document.createElement("video");
  video.id = "bgVideo";
  const source = document.createElement("source");

  // Choose random video
  const videos = ["bg_video/raiden.mp4", "bg_video/hutao.mp4"];
  const randomVideo = videos[Math.floor(Math.random() * videos.length)];

  // Set video attributes
  source.setAttribute("src", randomVideo);
  video.appendChild(source);
  video.setAttribute("autoplay", true);
  video.setAttribute("loop", true);
  video.setAttribute("muted", true);
  video.setAttribute("playsinline", true);

  // CSS 由 style.css 控制
  document.body.appendChild(video);
}

// Switch tab in admin panel
function switchTab(e) {
  // Remove active class from all tab buttons
  tabButtons.forEach((btn) => btn.classList.remove("active"));

  // Add active class to clicked tab button
  e.target.classList.add("active");

  // Get tab id
  const tabId = e.target.getAttribute("data-tab");

  // Hide all tab contents
  tabContents.forEach((content) => {
    content.style.display = "none";
  });

  // Show selected tab content
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
  const specialImageUrl = document.getElementById("siteSpecialImage").value.trim() || undefined;
  const isRestricted = document.getElementById("isRestricted").checked;

  const site = {
    id: Date.now().toString(),
    url,
    name,
    description,
    category,
    imageUrl,
    specialImageUrl: specialImageUrl || undefined,
    isRestricted,
  };

  sites.push(site);
  saveSites();
  syncSitesToCloud();
  addSiteToDOM(site);

  addSiteForm.reset();
  document.getElementById("siteSpecialImage").value = "";
  const specialPreview = document.getElementById("specialImagePreview");
  if (specialPreview) { specialPreview.innerHTML = ""; specialPreview.style.display = "none"; }
  populateSiteSelects();
  alert("网站添加成功！");
}

// Handle update site
function handleUpdateSite(e) {
  e.preventDefault();

  // Get selected site id
  const siteId = editSiteSelect.value;

  // Find site in sites array
  const siteIndex = sites.findIndex((site) => site.id === siteId);

  if (siteIndex !== -1) {
    const url = document.getElementById("editSiteUrl").value;
    const name = document.getElementById("editSiteName").value;
    const description = document.getElementById("editSiteDescription").value;
    const category = document.getElementById("editSiteCategory").value;
    const imageUrl =
      document.getElementById("editSiteImage").value ||
      sites[siteIndex].imageUrl;
    const specialImageUrl = document.getElementById("editSiteSpecialImage").value.trim() || undefined;
    const isRestricted = document.getElementById("editIsRestricted").checked;

    sites[siteIndex] = {
      ...sites[siteIndex],
      url,
      name,
      description,
      category,
      imageUrl,
      specialImageUrl: specialImageUrl || undefined,
      isRestricted,
    };

    saveSites();
    syncSitesToCloud();
    updateSitesDOM();
    populateSiteSelects();
    alert("网站更新成功！");
  }
}

// Handle remove site
function handleRemoveSite() {
  // Get selected site id
  const siteId = removeSiteSelect.value;

  if (siteId) {
    // Confirm deletion
    if (confirm("确定要删除这个网站吗？")) {
      sites = sites.filter((site) => site.id !== siteId);
      saveSites();
      syncSitesToCloud();
      updateSitesDOM();

      // Update site selects
      populateSiteSelects();

      // Clear preview
      removeSitePreview.innerHTML = "";

      // Show success message
      alert("网站删除成功！");
    }
  } else {
    alert("请选择要删除的网站");
  }
}

// Populate edit form
function populateEditForm() {
  // Get selected site id
  const siteId = editSiteSelect.value;

  // Find site in sites array
  const site = sites.find((site) => site.id === siteId);

  if (site) {
    document.getElementById("editSiteUrl").value = site.url;
    document.getElementById("editSiteName").value = site.name;
    document.getElementById("editSiteDescription").value = site.description;
    document.getElementById("editSiteCategory").value = site.category;
    document.getElementById("editSiteImage").value = site.imageUrl || "";
    document.getElementById("editSiteSpecialImage").value = site.specialImageUrl || "";
    document.getElementById("editIsRestricted").checked = site.isRestricted;
    const editSpecialPreview = document.getElementById("editSpecialImagePreview");
    if (editSpecialPreview) {
      editSpecialPreview.innerHTML = site.specialImageUrl
        ? `<img src="${site.specialImageUrl}" alt="特殊封面">`
        : "";
      editSpecialPreview.style.display = site.specialImageUrl ? "block" : "none";
    }
  }
}

// Show site preview
function showSitePreview() {
  // Get selected site id
  const siteId = removeSiteSelect.value;

  // Find site in sites array
  const site = sites.find((site) => site.id === siteId);

  if (site) {
    // Create preview HTML
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
  // Create site element
  const siteElement = document.createElement("div");
  siteElement.className = `box ${site.category}`;
  siteElement.dataset.id = site.id;

  if (site.isRestricted) {
    siteElement.classList.add("warn");
  }

  // Set site HTML
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

  // Append and then store original src for future還原
  sitesContainer.appendChild(siteElement);
  const img = siteElement.querySelector("img");
  if (img && !img.dataset.originalSrc) img.dataset.originalSrc = img.src;

  // 如果目前 specialVisuals 已啟用，立即用特殊封面替換
  if (specialVisuals) {
    const boxes = Array.from(document.querySelectorAll(".box"));
    const idx = boxes.indexOf(siteElement);
    if (img) img.src = `simages/s${idx + 1}.jpg`;
  }
}

// Update sites in DOM
function updateSitesDOM() {
  // Clear container
  sitesContainer.innerHTML = "";

  // Add all sites to DOM
  sites.forEach((site) => {
    addSiteToDOM(site);
  });
}

// Populate site selects
function populateSiteSelects() {
  // Clear selects
  editSiteSelect.innerHTML = '<option value="">选择网站...</option>';
  removeSiteSelect.innerHTML = '<option value="">选择网站...</option>';

  // Add sites to selects
  sites.forEach((site) => {
    const option = document.createElement("option");
    option.value = site.id;
    option.textContent = site.name;

    // Add to edit select
    editSiteSelect.appendChild(option.cloneNode(true));

    // Add to remove select
    removeSiteSelect.appendChild(option);
  });
}

// Save sites to localStorage (and optionally sync to Cloudflare)
function saveSites() {
  localStorage.setItem("sites", JSON.stringify(sites));
}

// Sync sites to Cloudflare Worker (no-op if API_BASE empty or no token)
function syncSitesToCloud() {
  if (!API_BASE) return;
  const token = sessionStorage.getItem("adminToken");
  if (!token) return;

  fetch(API_BASE + "/sites", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ sites }),
  })
    .then((r) => {
      if (r.status === 401) {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminSession");
        isAdmin = false;
        alert("登入已過期，請重新登入");
      }
    })
    .catch(() => {});
}

// Load sites from localStorage
function loadSites() {
  const savedSites = localStorage.getItem("sites");

  if (savedSites) {
    sites = JSON.parse(savedSites);
    updateSitesDOM();
  } else {
    initializeDefaultSites();
  }
}

// Fetch sites from Cloudflare (used on init)
function fetchSitesFromCloud() {
  if (!API_BASE) return Promise.reject();
  return fetch(API_BASE + "/sites")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const list = data.sites != null ? data.sites : data;
      if (!Array.isArray(list)) return Promise.reject();
      if (list.length === 0) {
        // Cloud empty: use localStorage or DOM defaults so page is not blank
        loadSites();
        return true;
      }
      sites = list;
      updateSitesDOM();
      saveSites(); // cache to localStorage
      return true;
    });
}

// Initialize default sites
function initializeDefaultSites() {
  // Get all site boxes from DOM
  const boxes = document.querySelectorAll(".box");

  // Create site objects from boxes
  boxes.forEach((box, index) => {
    const link = box.querySelector("a");
    const img = box.querySelector("img");
    const title = box.querySelector("h2");
    const description = box.querySelector("p");

    // Get category from class
    const categoryClasses = Array.from(box.classList).filter(
      (cls) => cls !== "box" && cls !== "warn"
    );
    const category = categoryClasses.length > 0 ? categoryClasses[0] : "其他";

    // Create site object
    const site = {
      id: `default-${index}`,
      url: link.href,
      name: title.textContent,
      description: description.textContent,
      category,
      imageUrl: img.src,
      isRestricted: box.classList.contains("warn"),
    };

    // Add to sites array
    sites.push(site);
  });

  saveSites();
}

// 取代單純的 DOMContentLoaded 註冊，改為依 readyState 判斷
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Show password prompt
function showPasswordPrompt() {
  const password = prompt("请输入密码:");

  if (password === "114514") {
    // Show content
    sitesContainer.style.display = "grid";
  } else {
    // Hide content
    sitesContainer.style.display = "none";
    alert("密码错误，无法查看内容。");
  }
}

// Initialize the application when DOM is loaded
// 图片拖放上传功能
const dragArea = document.getElementById("dragArea");
const editDragArea = document.getElementById("editDragArea");
const fileInput = document.getElementById("fileInput");
const editFileInput = document.getElementById("editFileInput");
const imagePreview = document.getElementById("imagePreview");
const editImagePreview = document.getElementById("editImagePreview");
const siteImageInput = document.getElementById("siteImage");
const editSiteImageInput = document.getElementById("editSiteImage");

// 添加新分類按鈕
const addCategoryBtn = document.getElementById("addCategoryBtn");
const editAddCategoryBtn = document.getElementById("editAddCategoryBtn");

// 初始化拖放區域
function initDragArea(dragArea, fileInput, imagePreview, imageUrlInput) {
  // 點擊拖放區域觸發文件選擇
  dragArea.addEventListener("click", () => {
    fileInput.click();
  });

  // 文件選擇變化處理
  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      handleFile(file, imagePreview, imageUrlInput);
    }
  });

  // 拖放事件處理
  ["dragover", "dragleave", "drop"].forEach((eventName) => {
    dragArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (eventName === "dragover") {
        dragArea.classList.add("active");
      } else if (eventName === "dragleave") {
        dragArea.classList.remove("active");
      } else if (eventName === "drop") {
        dragArea.classList.remove("active");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          handleFile(file, imagePreview, imageUrlInput);
        }
      }
    });
  });
}

// 處理上傳的圖片文件
function handleFile(file, imagePreview, imageUrlInput) {
  const reader = new FileReader();

  reader.onload = function (e) {
    // 顯示圖片預覽
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="預覽圖片">`;
    imagePreview.style.display = "block";

    // 更新圖片URL輸入框
    imageUrlInput.value = e.target.result;
  };

  reader.readAsDataURL(file);
}

// 添加新分類功能
function setupAddCategory(addButton, categorySelect) {
  addButton.addEventListener("click", () => {
    // 創建一個包含常用圖標的數組
    const suggestedIcons = [
      { name: "fas fa-star", description: "星星" },
      { name: "fas fa-book", description: "書籍" },
      { name: "fas fa-music", description: "音樂" },
      { name: "fas fa-film", description: "電影" },
      { name: "fas fa-code", description: "代碼" },
      { name: "fas fa-shopping-cart", description: "購物" },
      { name: "fas fa-graduation-cap", description: "教育" },
      { name: "fas fa-chart-line", description: "數據" },
      { name: "fas fa-camera", description: "攝影" },
      { name: "fas fa-utensils", description: "美食" },
      { name: "fas fa-plane", description: "旅行" },
      { name: "fas fa-briefcase", description: "工作" },
    ];

    // 創建圖標建議HTML
    let iconSuggestionsHTML = "<p>建議圖標：</p><div class='icon-suggestions'>";
    suggestedIcons.forEach((icon) => {
      iconSuggestionsHTML += `<div class='icon-option'><i class='${icon.name}'></i> ${icon.description}</div>`;
    });
    iconSuggestionsHTML += "</div>";

    // 創建自定義提示框
    const customPrompt = document.createElement("div");
    customPrompt.className = "custom-prompt-overlay";
    customPrompt.innerHTML = `
      <div class="custom-prompt">
        <h3>添加新分類</h3>
        <div class="form-group">
          <label for="newCategoryName">分類名稱</label>
          <input type="text" id="newCategoryName" placeholder="輸入新分類名稱" required>
        </div>
        <div class="form-group">
          <label for="newCategoryIcon">分類圖標</label>
          <input type="text" id="newCategoryIcon" placeholder="輸入圖標類名，例如：fas fa-star">
        </div>
        ${iconSuggestionsHTML}
        <div class="prompt-buttons">
          <button type="button" id="cancelCategoryBtn" class="btn secondary-btn">取消</button>
          <button type="button" id="confirmCategoryBtn" class="btn primary-btn">確認</button>
        </div>
      </div>
    `;
    document.body.appendChild(customPrompt);

    // 添加圖標選項點擊事件
    document.querySelectorAll(".icon-option").forEach((option) => {
      option.addEventListener("click", function () {
        const iconClass = this.querySelector("i").className;
        document.getElementById("newCategoryIcon").value = iconClass;
        // 移除其他選中狀態
        document
          .querySelectorAll(".icon-option")
          .forEach((opt) => opt.classList.remove("selected"));
        // 添加選中狀態
        this.classList.add("selected");
      });
    });

    // 取消按鈕事件
    document
      .getElementById("cancelCategoryBtn")
      .addEventListener("click", () => {
        document.body.removeChild(customPrompt);
      });

    // 確認按鈕事件
    document
      .getElementById("confirmCategoryBtn")
      .addEventListener("click", () => {
        const newCategory = document.getElementById("newCategoryName").value;
        const iconClass =
          document.getElementById("newCategoryIcon").value || "fas fa-folder";

        if (newCategory && newCategory.trim() !== "") {
          // 檢查分類是否已存在
          let exists = false;
          for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === newCategory) {
              exists = true;
              break;
            }
          }

          if (!exists) {
            // 添加到下拉列表
            const option = document.createElement("option");
            option.value = newCategory;
            option.textContent = newCategory;
            categorySelect.appendChild(option);
            option.selected = true;

            // 添加到另一個下拉列表
            const otherSelect =
              categorySelect.id === "siteCategory"
                ? document.getElementById("editSiteCategory")
                : document.getElementById("siteCategory");

            const otherOption = document.createElement("option");
            otherOption.value = newCategory;
            otherOption.textContent = newCategory;
            otherSelect.appendChild(otherOption);

            // 添加到側邊欄分類列表
            addCategoryToSidebar(newCategory, iconClass);

            // 保存分類到本地存儲
            saveCategories();

            // 關閉提示框
            document.body.removeChild(customPrompt);
          } else {
            alert("該分類已存在!");
          }
        } else {
          alert("請輸入有效的分類名稱!");
        }
      });
  });
}

// 添加分類到側邊欄
function addCategoryToSidebar(category, iconClass = "fas fa-folder") {
  const categoryList = document.querySelector(".category-list");
  const li = document.createElement("li");
  li.innerHTML = `<a href="#${category}"><i class="${iconClass}"></i> ${category}</a>`;
  categoryList.appendChild(li);

  // 添加點擊事件
  li.querySelector("a").addEventListener("click", filterSitesByCategory);
}

// 过滤分类函数
function filterByCategory(category) {
  // 显示/隐藏网站基于分类
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    if (category === "全部") {
      box.style.display = "block";
    } else if (box.classList.contains(category)) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });

  // 在移动设备上关闭侧边栏
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("active");
  }
}

// 保存分類到本地存儲
function saveCategories() {
  const categorySelect = document.getElementById("siteCategory");
  const categories = [];

  for (let i = 0; i < categorySelect.options.length; i++) {
    categories.push(categorySelect.options[i].value);
  }

  localStorage.setItem("categories", JSON.stringify(categories));
}

// 加載分類
function loadCategories() {
  const savedCategories = localStorage.getItem("categories");
  if (savedCategories) {
    const categories = JSON.parse(savedCategories);
    const defaultCategories = ["娛樂", "工具", "二次元", "AI畫圖"];

    // 添加新分類到下拉列表和側邊欄
    categories.forEach((category) => {
      if (!defaultCategories.includes(category)) {
        // 添加到下拉列表
        const siteCategorySelect = document.getElementById("siteCategory");
        const editSiteCategorySelect =
          document.getElementById("editSiteCategory");

        const option1 = document.createElement("option");
        option1.value = category;
        option1.textContent = category;
        siteCategorySelect.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = category;
        option2.textContent = category;
        editSiteCategorySelect.appendChild(option2);

        // 添加到側邊欄
        addCategoryToSidebar(category);
      }
    });
  }
}

// 初始化拖放區域和分類功能
function initImageUploadAndCategories() {
  initDragArea(dragArea, fileInput, imagePreview, siteImageInput);
  initDragArea(
    editDragArea,
    editFileInput,
    editImagePreview,
    editSiteImageInput
  );

  // 特殊封面拖放區域（添加 / 編輯）
  const specialDragArea = document.getElementById("specialDragArea");
  const specialFileInput = document.getElementById("specialFileInput");
  const specialImagePreview = document.getElementById("specialImagePreview");
  const siteSpecialImageInput = document.getElementById("siteSpecialImage");
  if (specialDragArea && specialFileInput && specialImagePreview && siteSpecialImageInput) {
    initDragArea(specialDragArea, specialFileInput, specialImagePreview, siteSpecialImageInput);
  }
  const editSpecialDragArea = document.getElementById("editSpecialDragArea");
  const editSpecialFileInput = document.getElementById("editSpecialFileInput");
  const editSpecialImagePreview = document.getElementById("editSpecialImagePreview");
  const editSiteSpecialImageInput = document.getElementById("editSiteSpecialImage");
  if (editSpecialDragArea && editSpecialFileInput && editSpecialImagePreview && editSiteSpecialImageInput) {
    initDragArea(editSpecialDragArea, editSpecialFileInput, editSpecialImagePreview, editSiteSpecialImageInput);
  }

  setupAddCategory(addCategoryBtn, document.getElementById("siteCategory"));
  setupAddCategory(
    editAddCategoryBtn,
    document.getElementById("editSiteCategory")
  );
  loadCategories();
}

// 修復背景視頻尺寸
function fixBackgroundVideo() {
  const bgVideo = document.getElementById("bgVideo");
  if (bgVideo) {
    bgVideo.style.width = "100%";
    bgVideo.style.height = "100%";
    bgVideo.style.objectFit = "cover";
  }
}

// 管理員登入
async function handleLogin() {
  const username = (document.getElementById("username")?.value || "").trim();
  const password = (document.getElementById("password")?.value || "").trim();

  if (username !== "admin" || password !== "howcome") {
    alert("用户名或密码错误");
    return;
  }

  isAdmin = true;
  sessionStorage.setItem("adminSession", "1");

  if (API_BASE) {
    try {
      const r = await fetch(API_BASE + "/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (data.token) sessionStorage.setItem("adminToken", data.token);
    } catch (_) {}
    // Push current sites to cloud so cloud has existing data (e.g. after first deploy)
    syncSitesToCloud();
  }

  closeAllModals();
  showModal(adminModal);
  populateSiteSelects();
  document.querySelectorAll(".box.warn").forEach((box) => {
    box.style.display = showWarn ? "block" : "none";
  });
  alert("管理員登入成功");
}
