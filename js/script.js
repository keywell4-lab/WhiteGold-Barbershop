
/* =====================================
   WHITE GOLD BARBERSHOP
   Main JavaScript
   ===================================== */

// Wait until the HTML page has loaded.
document.addEventListener("DOMContentLoaded", function () {

    // Highlight the current page in the navigation.
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".navbar nav a");

    navLinks.forEach(function (link) {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    // Display a confirmation before opening external links.
    const externalLinks = document.querySelectorAll(
        'a[target="_blank"]'
    );

    externalLinks.forEach(function (link) {
        link.setAttribute("rel", "noopener noreferrer");
    });

});
