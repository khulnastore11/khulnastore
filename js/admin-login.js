import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// If already logged in → go to admin
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "admin.html";
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  errorEl.style.display = "none";

  if (!email || !password) {
    errorEl.textContent = "Please enter email and password.";
    errorEl.style.display = "block";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "admin.html";

  } catch (error) {
  console.log("FULL ERROR:", error);
  errorEl.textContent = error.code;
  errorEl.style.display = "block";
}


});
