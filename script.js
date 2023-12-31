const navList = document.getElementById('navList');
const navItems = navList.getElementsByTagName('li');

window.onload = function() {
  var password = prompt("Please enter your password:", "");

  if (password === "114514") {
    document.querySelector('.container').style.display = 'flex'; // Change this line
  } else {
    alert("Incorrect password. You will not be able to see the content.");
    document.querySelector('.container').style.display = 'none';
  }
}

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
  window.open(url, '_blank');
}

document.getElementById('contactBtn').addEventListener('click', function() {
  document.getElementById('popup').style.display = 'block';
});

document.getElementById('submitBtn').addEventListener('click', function() {
  var password = document.getElementById('passwordInput').value;
  
  if (password === '277353') {
    var images = document.getElementsByTagName('img');
    for (var i = 0; i < images.length; i++) {
      images[i].src = 'simages/s' + (i + 1) + '.jpg';
    }

    // Add the live wallpaper
    var video = document.createElement('video');
    var source = document.createElement('source');
    var videos = ['bg_video/raiden.mp4', 'bg_video/hutao.mp4'];
    var randomVideo = videos[Math.floor(Math.random() * videos.length)];
    source.setAttribute('src', randomVideo);
    video.appendChild(source);
    video.setAttribute('autoplay', true);
    video.setAttribute('loop', true);
    video.setAttribute('muted', true);
    video.style.position = 'fixed';  // Add this line
    video.style.right = '0';  // Add this line
    video.style.bottom = '0';  // Add this line
    video.style.minWidth = '100%';  // Add this line
    video.style.minHeight = '100%';  // Add this line
    video.style.width = 'auto';  // Add this line
    video.style.height = 'auto';  // Add this line
    video.style.zIndex = '-1';  // Add this line
    document.body.appendChild(video);
  }
});

document.querySelectorAll('#sidebar a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    // Hide the password popup
    document.getElementById('popup').style.display = 'none';

    // Get the category from the clicked link
    var category = this.textContent;

    // Hide all boxes
    document.querySelectorAll('.box').forEach(box => {
      box.style.display = 'none';
    });

    // If the "全部" category is clicked, show all boxes
    if (category == '全部') {
      document.querySelectorAll('.box').forEach(box => {
        box.style.display = 'block';
      });
    } else {
      // Otherwise, show boxes in the selected category
      document.querySelectorAll('.box.' + category).forEach(box => {
        box.style.display = 'block';
      });
    }
  });
});

document.getElementById('sidebarIcon').addEventListener('click', function() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar.style.width === '0px' || sidebar.style.width === '') {
    sidebar.style.width = '250px';
  } else {
    sidebar.style.width = '0px';
  }
});