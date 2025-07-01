function addSiteToDOM(site) {
  // ... existing code ...

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

  // ... existing code ...
}
