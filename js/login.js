import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const status = document.getElementById("loginStatus");
const button = document.getElementById("googleLoginBtn");

// Firebase restores an existing session asynchronously. Wait for that once
// before enabling a new popup so page-load restoration cannot race the popup.
await auth.authStateReady();

if (auth.currentUser) {
  window.location.replace("dashboard.html");
} else {
  button.disabled = false;

  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Opening Google sign-in…";

    try {
      await signInWithPopup(auth, provider);
      window.location.replace("dashboard.html");
    } catch (error) {
      console.error("WordMagic sign-in failed:", error);

      const messages = {
        "auth/unauthorized-domain": "This website is not authorised in Firebase yet.",
        "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
        "auth/popup-closed-by-user": "The Google sign-in window closed before sign-in finished. Please try again.",
        "auth/cancelled-popup-request": "Another sign-in attempt was already open. Please try again."
      };

      status.textContent = messages[error.code] || "Sign-in could not be completed. Please try again.";
      button.disabled = false;
    }
  });
}
