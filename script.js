const navList = document.getElementById('navList');
const navItems = navList.getElementsByTagName('li');

// Add a class to the clicked navigation item to highlight it
function handleNavItemClick(event) {
  const clickedItem = event.target;
  
  // Remove the 'active' class from all navigation items
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
  }
  
  // Add the 'active' class to the clicked item
  clickedItem.classList.add('active');
}

// Attach the click event listener to each navigation item
for (let i = 0; i < navItems.length; i++) {
  navItems[i].addEventListener('click', handleNavItemClick);
}

function openWebsite(url) {
    window.location.href = url;
  }