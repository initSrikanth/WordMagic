import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const topicNames={"sentences-clauses-cohesion":"Sentences, Clauses & Cohesion","expanded-noun-groups":"Expanded Noun Groups & Precise Description"};
function clean(d={}){return{attempts:Number(d.attempts||0),bestScore:Number(d.bestScore||0),lastScore:Number(d.lastScore||0),proficient:d.proficient===true,lastCompletedAt:d.lastCompletedAt||null}}
async function setupTopic(user,panel){
  const topicId=panel.dataset.topicProgress,localKey="wordmagic:"+user.uid+":"+topicId+":progress",progressRef=doc(db,"progress",user.uid,"topics",topicId);
  const snap=await getDoc(progressRef);let p;
  if(snap.exists()){p=clean(snap.data());localStorage.setItem(localKey,JSON.stringify(p))}
  else{try{p=clean(JSON.parse(localStorage.getItem(localKey)||"{}"))}catch{p=clean()}if(p.attempts>0)await setDoc(progressRef,p)}
  const paint=(data={})=>{const x=clean(data),attempts=x.attempts,best=x.bestScore,proficient=x.proficient;
    panel.querySelector(".practice-dots").textContent=Array.from({length:5},(_,i)=>i<Math.min(attempts,5)?"●":"○").join(" ");
    panel.querySelector("[data-attempts]").textContent=Math.min(attempts,5)+"/5"+(attempts>5?" • "+attempts+" total":"");
    panel.querySelector("[data-progress-bar]").style.width=(Math.min(attempts,5)*20)+"%";
    panel.querySelector("[data-best]").textContent=attempts?"Best: "+best+"/30":"Best: —";
    const badge=panel.querySelector("[data-proficiency]");badge.textContent=proficient?"✓ PROFICIENT":attempts>0?"IN PROGRESS":"START";badge.classList.toggle("achieved",proficient)};
  paint(p);
  const reset=panel.querySelector("[data-reset-topic]");
  reset?.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();if(!confirm("Reset "+(topicNames[topicId]||"topic")+" progress to 0? This clears attempts, best score and proficiency on all devices."))return;reset.disabled=true;try{const z={attempts:0,bestScore:0,lastScore:0,proficient:false,lastCompletedAt:null};await setDoc(progressRef,z);localStorage.setItem(localKey,JSON.stringify(z));paint(z)}catch(err){console.error("Topic reset failed:",err);alert("Progress could not be reset. Please try again.")}finally{reset.disabled=false}})
}
onAuthStateChanged(auth,async user=>{if(!user){location.replace("index.html");return}try{const access=await getDoc(doc(db,"access",user.uid));if(!(access.exists()&&access.data().approved===true)){location.replace("access-required.html");return}
  for(const panel of document.querySelectorAll("[data-topic-progress]")){try{await setupTopic(user,panel)}catch(e){console.warn("Topic progress could not be loaded:",panel.dataset.topicProgress,e)}}
  document.querySelectorAll("[data-user-name]").forEach(el=>el.textContent=user.displayName||"WordMagic learner");document.querySelectorAll("[data-user-email]").forEach(el=>el.textContent=user.email||"");document.querySelectorAll("[data-user-photo]").forEach(el=>{if(user.photoURL){el.src=user.photoURL;el.hidden=false}});document.body.classList.add("authenticated")
}catch(error){console.error("WordMagic access check failed:",error);location.replace("access-required.html?error=1")}});
document.addEventListener("click",async event=>{const logout=event.target.closest("[data-logout]");if(!logout)return;logout.disabled=true;await signOut(auth);location.replace("index.html")});