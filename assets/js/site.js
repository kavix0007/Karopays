/* Shared public-site behaviour: mobile menu + active nav link. */
document.addEventListener("DOMContentLoaded", function () {
  var button = document.querySelector(".mobile-menu-toggle");
  var nav = document.querySelector(".site-header .desktop-nav");
  if (!nav) return;
  var here = location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a").forEach(function (a) {
    if (a.getAttribute("href") === here) { a.classList.add("active"); a.setAttribute("aria-current", "page"); }
  });
  if (!button) return;
  function set(open) {
    nav.classList.toggle("mobile-nav-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }
  button.addEventListener("click", function (e) { e.preventDefault(); set(!nav.classList.contains("mobile-nav-open")); });
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
});
