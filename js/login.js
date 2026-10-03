import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const status = document.getElementById("loginStatus");
const button = document.getElementById("googleLoginBtn");

onAuthStateChanged(auth, (user) => {
  if (user) window.location.replace("dashboard.html");
});

button?.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Opening Google sign-in…";
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("WordMagic sign-in failed:", error);
    status.textContent = error.code === "auth/unauthorized-domain"
      ? "This website is not authorised in Firebase yet."
      : "Sign-in could not be completed. Please try again.";
    button.disabled = false;
  }
});
