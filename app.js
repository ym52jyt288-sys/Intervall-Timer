"use strict";
const app = document.querySelector("#app");
const bar = document.querySelector("#bar");
const dialog = document.querySelector("#dialog");
const {timeline, durationText, integer} = TimerModel;
const themes = {
  fokus: {name:"Fokus", desc:"Ein ruhiger Kreis in Salbeigrün.", colors:["#296247","#9cb49d","#e6eddf"]},
  takt: {name:"Takt", desc:"Klare Segmente in Kobaltblau.", colors:["#294ec0","#93ace9","#e1e8f7"]},
  horizont: {name:"Horizont", desc:"Ein warmer Bogen in Terrakotta.", colors:["#ab4e2e","#dba17c","#f5e4d2"]}
};
const paths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  sound:'<path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute:'<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  play:'<path d="m8 4 12 8-12 8z" fill="currentColor" stroke-linejoin="round"/>',
  pause:'<path d="M8 5v14m8-14v14" stroke-width="4"/>',
  clock:'<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M10 2h4"/>',
  chev:'<path d="m7 10 5 5 5-5"/>', more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  up:'<path d="m6 15 6-6 6 6"/>', down:'<path d="m6 9 6 6 6-6"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function pref(key,fallback){try{return localStorage.getItem("intervall."+key) ?? fallback;}catch{return fallback;}}
function setPref(key,value){try{localStorage.setItem("intervall."+key,value);}catch{/* Auswahl gilt für diese Sitzung. */}}
function uid(){return globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);}
function newBlock(){return {id:uid(),name:"",work:30,rest:10,rounds:4};}
function validId(value){return typeof value==="string" && /^[a-zA-Z0-9_-]+$/.test(value);}
function validTimer(t){return t && validId(t.id) && typeof t.name==="string" && t.name.trim() && typeof t.finalRest==="boolean" && Array.isArray(t.blocks) && t.blocks.length && t.blocks.every(b=>b && validId(b.id) && typeof b.name==="string" && integer(b.work,1) && integer(b.rest,0) && integer(b.rounds,1)) && Number.isSafeInteger(timeline(t).duration*1000);}
let storeError="";
function readTimers(){
  storeError="";
  try{const raw=localStorage.getItem("intervall.timers.v1");if(raw===null)return [];
    const data=JSON.parse(raw);
    if(data.version!==1 || !Array.isArray(data.timers) || !data.timers.every(validTimer))throw Error();
    return data.timers;
  }catch{storeError="Die gespeicherten Timer lassen sich nicht lesen. Prüfe den Browserspeicher und lade die Seite erneut.";return [];}
}
const savedDesign=pref("design","");
let design=Object.hasOwn(themes,savedDesign)?savedDesign:"fokus";
let sound=pref("sound","on")==="on";
let timers=readTimers(), view=Object.hasOwn(themes,savedDesign)?"home":"design", demoRest=false;
let draft, expanded, attempted=false, run=null, finished=null, ticker, audio, lock, requestingLock=false;
function header(){
  document.body.dataset.design=view==="design"?"fokus":design;
  const soundBtn=`<button class="quiet" data-action="sound" aria-label="Ton ${sound?"ausschalten":"einschalten"}" aria-pressed="${sound}">${icon(sound?"sound":"mute")}<span>Ton ${sound?"an":"aus"}</span></button>`;
  bar.innerHTML=`<div class="bar-inner"><div class="brand"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>Intervall</div><nav aria-label="App-Einstellungen">${view==="home"?`<button class="quiet" data-action="design">${icon("grid")}<span>Design</span></button>`:""}${soundBtn}</nav></div>`;
}
function go(next){
  view=next;header();
  if(next==="design")gallery();
  if(next==="home")home();
  if(next==="edit")editor();
  if(next==="run")training();
  if(next==="done")completion();
  app.focus({preventScroll:true});window.scrollTo(0,0);
}
// Alle Koordinaten beziehen sich auf dieselbe Zeichenfläche. Text und Skala
// bleiben so in der Vorschau und im Training unabhängig von der Kartengröße zusammen.
function dial(theme) {
  if (theme === "fokus") {
    return `<circle class="hairline" cx="120" cy="100" r="98"/>
      <circle class="track" cx="120" cy="100" r="87"/>
      <circle class="ink" cx="120" cy="100" r="87" pathLength="100" transform="rotate(-90 120 100)"/>`;
  }
  if (theme === "takt") {
    return Array.from({length:24}, (_, i) =>
      `<rect class="segment" x="${13 + i * 9}" y="145" width="6" height="24" rx="2" style="--n:${i}"/>`
    ).join("");
  }
  return `<path class="ticks" d="M10 153a110 110 0 0 1 220 0"/>
    <path class="track" d="M22 153a98 98 0 0 1 196 0"/>
    <path class="ink" d="M22 153a98 98 0 0 1 196 0" pathLength="100"/>`;
}
function face(theme, time, phase) {
  const layouts = {
    fokus: {labelY:85, timeY:129, size:49},
    takt: {labelY:57, timeY:123, size:65},
    horizont: {labelY:107, timeY:151, size:46}
  };
  const layout = layouts[theme];
  return `<svg class="face ${theme}" viewBox="0 0 240 200" role="img" aria-label="${phase}, ${time}">
    <g class="dial" aria-hidden="true">${dial(theme)}</g>
    <g text-anchor="middle" aria-hidden="true">
      <text class="phase-name" x="120" y="${layout.labelY}" font-size="12">${phase}</text>
      <text class="time" x="120" y="${layout.timeY}" font-size="${layout.size}" data-size="${layout.size}">${time}</text>
    </g>
  </svg>`;
}
function gallery(){
  app.className="gallery page";
  app.innerHTML=`<div class="gallery-intro"><div><h1>Design auswählen</h1><p>Wähle die Ansicht für deinen Intervalltimer.</p></div><div class="switcher" role="group" aria-label="Phase der Vorschau">${["Belastung","Pause"].map((p,i)=>`<button data-action="demo" data-rest="${i}" aria-pressed="${Boolean(i)===demoRest}">${p}</button>`).join("")}</div></div>
  <div class="choices" role="group" aria-label="Designvarianten">${Object.entries(themes).map(([key,t])=>`<button class="choice" data-design="${key}" data-action="pick" aria-pressed="${key===design}" aria-label="${t.name} auswählen">
  <span class="sample ${demoRest?"resting":""}" style="--progress:${demoRest?60:73}"><span class="sample-top"><span>${icon("clock")} Wade</span><span>Runde 2 von 4</span></span>
  ${face(key,demoRest?"00:06":"00:22",demoRest?"Pause":"Belastung")}
  <span class="sample-foot">Danach ${demoRest?"30 s Belastung":"10 s Pause"}</span></span>
  <span class="choice-info"><span class="choice-title">${t.name}<span class="radio">${key===design?icon("check"):""}</span></span><span class="description">${t.desc}</span><span class="swatches" aria-hidden="true">${t.colors.map(c=>`<i style="background:${c}"></i>`).join("")}</span></span></button>`).join("")}</div>
  <div class="gallery-bottom"><span>Du kannst das Design jederzeit wechseln.</span><button class="primary" data-action="apply">${icon("check")} ${themes[design].name} verwenden</button></div>`;
}
function home(){
  app.className="page narrow";
  app.innerHTML=`<div class="heading"><h1>Meine Timer</h1></div>${storeError?`<p class="error" role="alert">${storeError}</p>`:""}
  ${timers.length?`<div class="library">${timers.map(t=>{
    const meta=t.blocks.length===1?(t.blocks[0].name.trim()||"1 Block"):`${t.blocks.length} Blöcke`;
    return `<article class="timer-row"><div><h2>${escapeHTML(t.name)}</h2><p>${escapeHTML(meta)} · ${durationText(timeline(t).duration)} min</p></div><button class="start" data-action="start" data-id="${escapeHTML(t.id)}" aria-label="${escapeHTML(t.name)} starten">${icon("play")}<span>Starten</span></button><button class="icon-btn" data-action="menu" data-id="${escapeHTML(t.id)}" aria-label="Menü für ${escapeHTML(t.name)}">${icon("more")}</button></article>`;
  }).join("")}</div>`:`<section class="empty"><div class="empty-dial" aria-hidden="true">${face(design,"00:30","Belastung")}</div><h2>Dein erster Timer</h2><p>Lege Belastung, Pause und Runden für deine Dehnübungen fest.</p></section>`}
  <div class="actions"><button class="primary" data-action="new">${icon("plus")} Timer erstellen</button></div>`;
}
function beginEdit(t){
  draft=t?JSON.parse(JSON.stringify(t)):{id:uid(),name:"",blocks:[newBlock()],finalRest:false};
  expanded=draft.blocks[0].id;attempted=false;go("edit");
}
function problem(key,val){
  if(key==="title")return val.trim()?"":"Gib deinem Timer einen Namen.";
  if(key==="name")return "";
  const min=key==="rest"?0:1;
  return integer(val,min)?"":`Gib eine ganze Zahl ab ${min} ein.`;
}
function field(key,label,value,blockId=""){
  const id=`f-${key}-${blockId}`,numeric=["work","rest","rounds"].includes(key);
  return `<label class="field" for="${id}">${label}<input id="${id}" data-key="${key}" data-block="${blockId}" type="text" ${numeric?'inputmode="numeric" pattern="[0-9]*"':""} value="${escapeHTML(value)}" ${key==="name"?'placeholder="z. B. Wade"':key==="title"?'placeholder="z. B. Morgenroutine"':""} aria-describedby="${id}-error"><small id="${id}-error" class="error"></small></label>`;
}
function summary(b,i){return `${b.name.trim()||"Block "+(i+1)} · ${b.rounds||"–"} × ${b.work||"–"} s · ${b.rest||"–"} s Pause`;}
function editor(){
  app.className="page narrow";
  app.innerHTML=`<h1>${timers.some(t=>t.id===draft.id)?"Timer bearbeiten":"Timer erstellen"}</h1><div class="editor-panel">${field("title","Timername",draft.name)}</div>
  <div class="block-list">${draft.blocks.map((b,i)=>`<section class="block"><button class="disclose" data-action="expand" data-id="${b.id}" aria-expanded="${b.id===expanded}"><strong id="summary-${b.id}">${escapeHTML(summary(b,i))}</strong>${icon("chev")}</button>${b.id===expanded?`<div class="block-body">${field("name","Übungsname (optional)",b.name,b.id)}<div class="numbers">${field("work","Belastung (s)",b.work,b.id)}${field("rest","Pause (s)",b.rest,b.id)}${field("rounds","Runden",b.rounds,b.id)}</div><div class="block-tools"><button class="quiet" aria-label="Block nach oben" data-action="up" ${i===0?"disabled":""}>${icon("up")}</button><button class="quiet" aria-label="Block nach unten" data-action="down" ${i===draft.blocks.length-1?"disabled":""}>${icon("down")}</button><button class="quiet" data-action="remove" ${draft.blocks.length===1?"disabled":""}>${icon("trash")} Entfernen</button></div></div>`:""}</section>`).join("")}</div>
  <button class="secondary" data-action="add">${icon("plus")} Block hinzufügen</button>
  <label class="option"><input type="checkbox" id="final-rest" ${draft.finalRest?"checked":""}>Pause nach der letzten Belastung</label>
  <section class="total"><div><span>Gesamtdauer</span><strong id="duration"></strong></div><p id="preview"></p></section>
  <p id="save-error" role="alert" class="error"></p><div class="actions"><button class="secondary" data-action="home">Abbrechen</button><button class="primary" data-action="save">${icon("check")} Speichern</button></div>`;
  updateEditor();
}
function showError(input){
  const message=problem(input.dataset.key,input.value);
  document.getElementById(input.id+"-error").textContent=message;
  input.setAttribute("aria-invalid",String(Boolean(message)));
}
function validNumbers(b){return ["work","rest","rounds"].every(k=>!problem(k,b[k]));}
function nextText(plan,p){
  const next=plan.at(p.end);
  if(!next)return "Danach fertig";
  if(next.resting)return `Danach ${next.length} s Pause`;
  return next.index!==p.index?`Danach ${next.name} · ${next.length} s`:`Danach ${next.length} s Belastung`;
}
function updateEditor(){
  for(const input of app.querySelectorAll("[data-key]")){
    if(attempted || input.dataset.touched)showError(input);
  }
  const valid=draft.blocks.every(validNumbers);
  const plan=valid?timeline(draft):null, safe=plan && Number.isSafeInteger(plan.duration*1000);
  document.querySelector("#duration").textContent=safe?durationText(plan.duration)+" min":"–";
  const first=safe?plan.at(0):null;
  document.querySelector("#preview").textContent=first?`Start mit ${first.name} · ${first.length} s Belastung. ${nextText(plan,first)}.`:valid?"Die Gesamtdauer ist zu groß. Bitte kürze einen Block.":"Prüfe die Werte in den Blöcken.";
}
function persist(change){
  const current=readTimers();
  if(storeError)return storeError;
  const next=change(current);
  try{localStorage.setItem("intervall.timers.v1",JSON.stringify({version:1,timers:next}));timers=next;return "";}
  catch{return "Speichern fehlgeschlagen. Prüfe den freien Speicher und versuche es erneut.";}
}
function save(){
  attempted=true;
  const badBlock=draft.blocks.find(b=>!validNumbers(b));
  if(badBlock)expanded=badBlock.id;
  editor();
  const bad=app.querySelector('[aria-invalid="true"]');
  if(bad){bad.focus();return;}
  if(!Number.isSafeInteger(timeline(draft).duration*1000))return;
  const t={...draft,name:draft.name.trim(),blocks:draft.blocks.map(b=>({...b,name:b.name.trim(),work:Number(b.work),rest:Number(b.rest),rounds:Number(b.rounds)}))};
  const error=persist(current=>current.some(x=>x.id===t.id)?current.map(x=>x.id===t.id?t:x):[...current,t]);
  if(error)document.querySelector("#save-error").textContent=error;else go("home");
}
app.addEventListener("input",e=>{
  const input=e.target;
  if(view!=="edit")return;
  if(input.id==="final-rest")draft.finalRest=input.checked;
  if(input.dataset.key){
    const k=input.dataset.key;
    if(k==="title")draft.name=input.value;
    else{
      const i=draft.blocks.findIndex(b=>b.id===input.dataset.block);
      draft.blocks[i][k]=input.value;
      document.getElementById("summary-"+input.dataset.block).textContent=summary(draft.blocks[i],i);
    }
    input.dataset.touched="1";
  }
  updateEditor();
});
function unlockAudio(){
  if(!sound)return;
  try{
    const Context=window.AudioContext || window.webkitAudioContext;
    if(!audio && Context)audio=new Context();
    if(audio && audio.state!=="running")audio.resume().catch(()=>{});
  }catch{/* Der visuelle Timer läuft auch ohne Audio. */}
}
function signal(kind){
  if(!sound || !audio || document.hidden)return;
  try{
    const tone=audio.createOscillator(), gain=audio.createGain(), now=audio.currentTime;
    const length=kind==="done"?.32:.15;
    tone.frequency.setValueAtTime(kind==="rest"?420:kind==="done"?660:820,now);
    if(kind==="done")tone.frequency.setValueAtTime(990,now+.13);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.16,now+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,now+length);
    tone.connect(gain);gain.connect(audio.destination);tone.start(now);tone.stop(now+length+.01);
    tone.onended=()=>{tone.disconnect();gain.disconnect();};
  }catch{/* Audioausgabe ist auf diesem Gerät nicht verfügbar. */}
}
function needsLock(){return Boolean(run && !run.paused && !document.hidden);}
async function syncLock(){
  if(!needsLock()){
    const old=lock;lock=null;
    if(old)try{await old.release();}catch{}
    return;
  }
  if(lock || requestingLock || !navigator.wakeLock)return;
  requestingLock=true;
  try{
    const held=await navigator.wakeLock.request("screen");
    if(needsLock()){
      lock=held;
      held.addEventListener("release",()=>{if(lock===held)lock=null;});
    }else await held.release();
  }catch{}finally{requestingLock=false;}
}
function elapsed(){return run.paused?run.spent:run.spent+Math.max(0,Date.now()-run.since);}
function start(t){
  unlockAudio();clearInterval(ticker);
  run={timer:t,plan:timeline(t),spent:0,since:Date.now(),paused:false,phaseStart:-1};
  go("run");ticker=setInterval(updateRun,100);syncLock();
}
function training(){
  app.className="session page";
  app.innerHTML=`<section class="session-face"><div class="session-info" aria-live="polite" aria-atomic="true"><h1 id="exercise"></h1><p id="round"></p><span id="spoken-phase" class="sr"></span></div>
    ${face(design,"00:00","Belastung")}
    <p class="next" id="next"></p></section>
    <div class="training-actions">
      <div class="step-actions" role="group" aria-label="Aktueller Schritt">
        <button class="secondary" data-action="previous-step" aria-label="Vorheriger Schritt">Zurück</button>
        <button class="secondary" data-action="restart-step" aria-label="Schritt neu starten">Neu starten</button>
        <button class="secondary" data-action="skip-step">Weiter</button>
      </div>
      <button class="primary" data-action="toggle" id="toggle">${icon("pause")} Anhalten</button>
      <button class="quiet" data-action="end">Beenden</button>
    </div>`;
  updateRun();
}
function updateRun(){
  if(!run || document.hidden)return;
  const now=elapsed()/1000,p=run.plan.at(now);
  if(!p){
    finished=run.timer;stop();signal("done");go("done");return;
  }
  if(p.start!==run.phaseStart){
    run.phaseStart=p.start;
    const phase=p.resting?"Pause":"Belastung";
    document.querySelector("#exercise").textContent=p.name;
    document.querySelector("#round").textContent=`Runde ${p.round} von ${p.rounds}`+(run.timer.blocks.length>1?` · Block ${p.index+1} von ${run.timer.blocks.length}`:"");
    document.querySelector("#spoken-phase").textContent=phase;
    app.querySelector(".phase-name").textContent=phase;
    app.classList.toggle("resting",p.resting);
    document.querySelector("#next").textContent=nextText(run.plan,p);
    app.querySelector('[data-action="previous-step"]').disabled = p.start === 0;
    app.querySelector('[data-action="skip-step"]').textContent = p.end === run.plan.duration ? "Abschließen" : "Weiter";
    if(!run.paused)signal(p.resting?"rest":"work");
  }
  const display=durationText(Math.ceil(p.end-now),true);
  const time=app.querySelector(".time");
  if (time.textContent !== display || time.dataset.phase !== String(p.start)) {
    time.textContent = display;
    time.dataset.phase = String(p.start);
    time.setAttribute("font-size", Number(time.dataset.size) * 5 / Math.max(5, display.length));
    time.ownerSVGElement.setAttribute("aria-label", (p.resting ? "Pause, " : "Belastung, ") + display);
  }
  app.style.setProperty("--progress",String(100*(p.end-now)/p.length));
}
function changeStep(action) {
  if (!run) return;
  const phase = run.plan.at(elapsed() / 1000);
  if (phase) {
    let position = phase.start;
    if (action === "previous-step") {
      if (phase.start === 0) return;
      // Jede Phase dauert mindestens eine ganze Sekunde.
      position = run.plan.at(phase.start - 1).start;
    } else if (action === "skip-step") {
      // Falls der natürliche Wechsel gerade vor dem nächsten Zeichnen lag,
      // zeigt der erste Tipp die neue Phase und überspringt sie nicht gleich mit.
      position = run.phaseStart === phase.start ? phase.end : phase.start;
    }
    run.spent = position * 1000;
    run.since = Date.now();
    run.phaseStart = -1;
  }
  updateRun();
}
function toggle(){
  updateRun();if(!run)return;
  if(run.paused){unlockAudio();run.since=Date.now();run.paused=false;}
  else{run.spent=elapsed();run.paused=true;}
  document.querySelector("#toggle").innerHTML=run.paused?icon("play")+" Fortsetzen":icon("pause")+" Anhalten";
  app.classList.toggle("paused",run.paused);updateRun();syncLock();
}
function stop(){
  clearInterval(ticker);run=null;syncLock();app.style.removeProperty("--progress");
  if(dialog.open)dialog.close();
}
function completion(){
  app.className="page complete narrow";
  app.innerHTML=`<div class="done-mark">${icon("check")}</div><h1>Geschafft</h1><p>${escapeHTML(finished.name)} · ${durationText(timeline(finished).duration)} min geplant</p><div class="actions"><button class="primary" data-action="again">${icon("play")} Erneut starten</button><button class="secondary" data-action="home">Meine Timer</button></div>`;
}
window.addEventListener("storage",event=>{
  if(event.key==="intervall.timers.v1" || event.key===null){
    timers=readTimers();
    if(view==="home")home();
  }
});
document.addEventListener("visibilitychange",()=>{if(run){updateRun();syncLock();}});
window.addEventListener("pageshow",()=>{if(run){updateRun();syncLock();}});
function modal(title,buttons,description=""){
  dialog.innerHTML=`<h2 id="dialog-title">${escapeHTML(title)}</h2>${description?`<p>${escapeHTML(description)}</p>`:""}<div class="dialog-actions"></div>`;
  const actions=dialog.querySelector(".dialog-actions");
  for(const [label,style,fn] of buttons){
    const b=document.createElement("button");b.className=style;b.textContent=label;
    b.onclick=()=>{dialog.close();fn?.();};actions.append(b);
  }
  dialog.showModal();
}
function timerMenu(t){
  modal(t.name,[["Bearbeiten","primary",()=>beginEdit(t)],["Löschen","danger",()=>confirmDelete(t)],["Abbrechen","secondary"]]);
}
function confirmDelete(t){
  modal("Timer löschen?",[["Abbrechen","secondary"],["Löschen","danger",()=>{
    const error=persist(current=>current.filter(x=>x.id!==t.id));
    if(error)modal("Löschen fehlgeschlagen",[["Schließen","secondary"]],error);else go("home");
  }]],`„${t.name}“ wird von diesem Gerät entfernt.`);
}
document.addEventListener("click",e=>{
  const button=e.target.closest("button[data-action]");if(!button)return;
  const id=button.dataset.id,action=button.dataset.action;
  const t=timers.find(item=>item.id===id);
  switch(action){
    case "sound": sound=!sound;setPref("sound",sound?"on":"off");unlockAudio();header();bar.querySelector('[data-action="sound"]').focus({preventScroll:true});break;
    case "design": go("design");break;
    case "pick": design=button.dataset.design;gallery();app.querySelector(`[data-design="${design}"]`).focus({preventScroll:true});break;
    case "demo": demoRest=button.dataset.rest==="1";gallery();app.querySelector(`button[data-rest="${button.dataset.rest}"]`).focus({preventScroll:true});break;
    case "apply": setPref("design",design);go("home");break;
    case "home": go("home");break;
    case "new": beginEdit();break;
    case "start": start(t);break;
    case "menu": timerMenu(t);break;
    case "expand": expanded=expanded===id?null:id;editor();break;
    case "add": {const b=newBlock();draft.blocks.push(b);expanded=b.id;editor();document.getElementById("f-name-"+b.id).focus();break;}
    case "remove":
    case "up":
    case "down": {
      const i=draft.blocks.findIndex(b=>b.id===expanded);
      if(action==="remove"){draft.blocks.splice(i,1);expanded=draft.blocks[Math.min(i,draft.blocks.length-1)].id;}
      else{const j=action==="up"?i-1:i+1;[draft.blocks[i],draft.blocks[j]]=[draft.blocks[j],draft.blocks[i]];}
      editor();break;
    }
    case "save":save();break;
    case "toggle":toggle();break;
    case "previous-step":
    case "restart-step":
    case "skip-step":
      changeStep(action);
      break;
    case "again":start(finished);break;
    case "end":modal("Training beenden?",[["Zurück zum Timer","secondary"],["Beenden","danger",()=>{stop();go("home");}]],"Der aktuelle Durchlauf endet.");break;
  }
});
go(view);
