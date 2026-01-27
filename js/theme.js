document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark");
      if (toggle) toggle.innerHTML = "☀️";
    } else {
      document.body.classList.remove("dark");
      if (toggle) toggle.innerHTML = "🌙";
    }
  }

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  // Toggle click
  toggle?.addEventListener("click", () => {
    const current = localStorage.getItem("theme") || "light";
    const newTheme = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });

});
