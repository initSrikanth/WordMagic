import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const message = document.getElementById("accessMessage");

if (new URLSearchParams(window.location.search).get("error") === "1") {
  message.textContent = "WordMagic could not verify access. Please sign out and try again.";
}

onAuthStateChanged(auth, (user) => {
  if (!user) window.location.replace("index.html");
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("index.html");
});
