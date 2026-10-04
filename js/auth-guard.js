import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
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
    const approved = accessSnap.exists() && accessSnap.data().approved === true;

    if (!approved) {
      window.location.replace("access-required.html");
      return;
    }

    const topicPanel = document.querySelector('[data-topic-progress="sentences-clauses-cohesion"]');
    if (topicPanel) {
      try {
        const topicId = "sentences-clauses-cohesion";
        const localKey = "wordmagic:" + user.uid + ":" + topicId + ":progress";
        const progressRef = doc(db, "progress", user.uid, "topics", topicId);
        const snap = await getDoc(progressRef);
        let p;
        if (snap.exists()) {
          p = snap.data();
          localStorage.setItem(localKey, JSON.stringify(p));
        } else {
          try { p = JSON.parse(localStorage.getItem(localKey) || "{}"); } catch { p = {}; }
          if (Number(p.attempts || 0) > 0) await setDoc(progressRef, p);
        }
        const paint = (data = {}) => {
          const attempts = Number(data.attempts || 0), best = Number(data.bestScore || 0), proficient = data.proficient === true;
          topicPanel.querySelector(".practice-dots").textContent = Array.from({length:5}, (_,i) => i < Math.min(attempts,5) ? "●" : "○").join(" ");
          topicPanel.querySelector("[data-attempts]").textContent = Math.min(attempts,5) + "/5" + (attempts > 5 ? " • " + attempts + " total" : "");
          topicPanel.querySelector("[data-progress-bar]").style.width = (Math.min(attempts,5) * 20) + "%";
          topicPanel.querySelector("[data-best]").textContent = attempts ? "Best: " + best + "/30" : "Best: —";
          const badge = topicPanel.querySelector("[data-proficiency]");
          badge.textContent = proficient ? "✓ PROFICIENT" : attempts > 0 ? "IN PROGRESS" : "START";
          badge.classList.toggle("achieved", proficient);
        };
        paint(p);
        const reset = topicPanel.querySelector('[data-reset-topic="sentences-clauses-cohesion"]');
        reset?.addEventListener("click", async event => {
          event.preventDefault(); event.stopPropagation();
          if (!confirm("Reset Sentences, Clauses & Cohesion progress to 0? This clears attempts, best score and proficiency on all devices.")) return;
          reset.disabled = true;
          try {
            const resetData = {attempts:0,bestScore:0,lastScore:0,proficient:false,lastCompletedAt:null};
            await setDoc(progressRef, resetData);
            localStorage.setItem(localKey, JSON.stringify(resetData));
            paint(resetData);
          } catch (err) {
            console.error("Topic reset failed:", err);
            alert("Progress could not be reset. Please try again.");
          } finally { reset.disabled = false; }
        });
      } catch (progressError) {
        console.warn("English topic progress could not be loaded:", progressError);
      }
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
