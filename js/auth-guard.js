import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("index.html");
    return;
  }

  try {
    const accessSnap = await getDoc(doc(db, "access", user.uid));
    const approvedValue = accessSnap.exists() ? accessSnap.data().approved : undefined;
    const approved = accessSnap.exists() && approvedValue === true;

    if (!approved) {
      const params = new URLSearchParams();
      params.set("exists", String(accessSnap.exists()));
      params.set("approved", String(approvedValue));
      params.set("type", typeof approvedValue);
      window.location.replace("access-required.html?" + params.toString());
      return;
    }

    document.querySelectorAll("[data-user-name]").forEach(el => {
      el.textContent = user.displayName || "WordMagic learner";
    });
    document.querySelectorAll("[data-user-email]").forEach(el => {
      el.textContent = user.email || "";
    });
    document.querySelectorAll("[data-user-photo]").forEach(el => {
      if (user.photoURL) {
        el.src = user.photoURL;
        el.hidden = false;
      }
    });
    document.body.classList.add("authenticated");
  } catch (error) {
    console.error("WordMagic access check failed:", error);
    window.location.replace("access-required.html?error=1");
  }
});

document.addEventListener("click", async (event) => {
  const logout = event.target.closest("[data-logout]");
  if (!logout) return;
  logout.disabled = true;
  await signOut(auth);
  window.location.replace("index.html");
});
