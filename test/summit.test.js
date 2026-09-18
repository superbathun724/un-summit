const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
// The five changes made for the October summit: a stage demo, the toast, and the three places
// the presentation script and the screen had to agree. Same harness as the other two files.
const dir=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(dir,f),"utf8");
const html=(()=>{
  let h=read("index.html");
  const link='<link rel="stylesheet" href="styles.css">',tag='<script src="app.js"></script>';
  if(!h.includes(link)||!h.includes(tag))throw new Error("index.html no longer links styles.css and app.js");
  return h.replace(link,"<style>"+read("styles.css")+"</style>").replace(tag,"<script>"+read("app.js")+"</script>");
})();
let fails=0,passes=0;
const ok=(c,m)=>{c?passes++:(fails++,console.log("  FAIL: "+m));};
const todayStr=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);

// opts.url: query string; opts.save: a save already on the phone; opts.before(w): extra setup
function boot(city,opts={}){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/"+(opts.url||""),pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}});
      if(opts.save)w.localStorage.setItem("yl",JSON.stringify(opts.save));
      if(opts.before)opts.before(w)}});
  const w=dom.window,d=w.document;
  const api={w,d,
    g:e=>w.eval(e),
    $:s=>d.querySelector(s),
    all:s=>[...d.querySelectorAll(s)],
    click:el=>el.dispatchEvent(new w.MouseEvent("click",{bubbles:true})),
    tab:n=>d.querySelector(`nav button[data-tab="${n}"]`).dispatchEvent(new w.MouseEvent("click",{bubbles:true})),
    tap:(n=1)=>{for(let i=0;i<n;i++)d.querySelector("#scene").dispatchEvent(
      new w.MouseEvent("pointerdown",{bubbles:true,clientX:100,clientY:100}))}};
  w.addEventListener("error",e=>{fails++;console.log("  JS ERROR ("+city+"): "+e.message)});
  if(city){d.querySelector("#countrySel").value=city;
    d.querySelector("#countrySel").dispatchEvent(new w.Event("change"));
    api.click(d.querySelector("#startBtn"))}
  return api;
}

console.log("--- summit 1: ?demo=1 stages a day and never saves it ---");
{
  // A real save on the phone, which the demo must leave exactly as it found it.
  const real={uid:"dreal",c:"SOK",tons:60,coins:77,cut:12,given:40,upg:{sandbag:1},day:todayStr(),streak:9,
    taps:12,ledger:0.04,shield:{self:22},mode:"cut",def:12,defAcc:0,defTotal:500,ads:2,adAt:0,vote:2,
    notes:[{d:"2026-09-01",c:"SOK",t:"the drain"}],at:Date.now()-5000,gaveToday:40,techToday:0};
  const raw=JSON.stringify(real);
  // Count every write, at both doors: the app's own store and the browser's storage.
  const spy=w=>{w.__writes=0;const si=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=function(k,v){w.__writes++;return si.call(this,k,v)}};
  const writes=a=>a.g("__writes");      // the fixture is written before the spy goes in

  ["ULS","SEO","BUS"].forEach(c=>{
    const a=boot(c,{url:"?demo=1",save:real,before:spy});
    a.g("__storeSets=0;const _ss=store.set;store.set=v=>{__storeSets++;_ss(v)}");
    const k=a.g("me()");
    ok(a.g("DEMO")===true,c+": the flag is read from the URL");
    ok(a.$("#demoTag").hidden===false&&a.$("header").contains(a.$("#demoTag")),c+": a DEMO badge is in the header");
    ok(a.g("S.coins")===300&&a.$("#coins").textContent==="300",c+": 300 coins, got "+a.g("S.coins"));
    ok(a.g("S.streak")===4,c+": a 4-day streak, got "+a.g("S.streak"));
    const upg=a.g("JSON.stringify(S.upg)");
    ok(k.role==="R"?upg==="{}":upg==='{"bus":1}',c+": one first-rung cut upgrade, none for a disaster-risk city: "+upg);
    if(k.role!=="R")ok(Math.abs(a.g("S.tons")-a.g("capCut()")*0.75)<=1,c+": 25% of today's tonnes already cut, "+a.g("S.tons")+" of "+a.g("capCut()"));
    if(k.role!=="E")ok(a.g("S.shield.self")===35&&a.$("#shieldPct").textContent==="35%",c+": shield 35%, just under the line");
    const full=a.g("Math.min(1,me().base/DAY_CAP)*0.95"),sm=+a.$("#smog").style.opacity;
    ok(sm>full*0.65&&sm<full*0.85,c+": a quarter of the smog is gone, "+sm.toFixed(2)+" of "+full.toFixed(2));
    // The wave waits for Support, so the presenter chooses when its three minutes start.
    ok(a.g("EMG.length")===0,c+": no wave yet on My City, got "+a.g("EMG.length"));
    a.tab("voice");a.tab("rank");a.tab("city");
    ok(a.g("EMG.length")===0,c+": other tabs do not trigger it");
    a.tab("support");
    ok(a.g("EMG.length")===1,c+": first visit to Support lands it, got "+a.g("EMG.length"));
    const hit=a.g("COUNTRIES.find(x=>x.c===EMG[0].c)");
    ok(hit.role==="R"&&hit.c!==c,c+": it hit another disaster-risk city: "+hit.c);
    ok(a.g(`WORLD.${hit.c}.shield`)<a.g("SAFE"),c+": whose shield really was below the line");
    ok(!!a.$(`#supportList .row.emg[data-emgrow="${hit.c}"]`),c+": the red card is on screen at once");
    ok(new RegExp("Wave hit "+hit.n).test(a.$("#ticker").textContent),c+": and announced: "+a.$("#ticker").textContent);
    a.g("EMG[0].until=Date.now()-1;tick()");a.tab("city");a.tab("support");
    ok(a.g("EMG.length")===0,c+": only the first visit -- it does not come back");
    a.g("emgAdd('"+hit.c+"')");

    // The real game underneath: taps, a purchase, a send, an ad.
    a.tab("city");
    const c0=a.g("S.coins"),tp0=a.g("S.taps");
    a.tap(30);
    ok(a.g("S.taps")===tp0+30&&a.g("S.coins")===c0+30,c+": 30 taps land and pay as usual");
    const bb=a.$("#upgrades .btn");a.click(bb);
    ok(Object.values(JSON.parse(a.g("JSON.stringify(S.upg)"))).reduce((x,y)=>x+y,0)===(k.role==="R"?1:2),c+": buying works");
    a.tab("support");
    const g0=a.g("S.given");
    a.click(a.$(`#supportList .row.emg[data-emgrow="${hit.c}"] .btn[data-cost]`));
    ok(a.g("S.given")===g0+20,c+": sending works");
    a.g("S.adAt=0");a.click(a.$("#supportList [data-ad]"));a.g("AD.until=0");a.click(a.$("#adDone"));
    ok(a.g("S.given")===g0+40,c+": a watched ad sends as usual");
    a.g("tick()");a.g("save()");a.g("flush()");
    a.w.dispatchEvent(new a.w.Event("pagehide"));
    a.d.dispatchEvent(new a.w.Event("visibilitychange"));

    // and none of it was written anywhere
    ok(a.g("__storeSets")===0,c+": store.set() was never called, got "+a.g("__storeSets"));
    ok(writes(a)===0,c+": localStorage was never written, got "+writes(a));
    ok(a.w.localStorage.getItem("yl")===raw,c+": the real save is byte-for-byte what it was");
    a.w.close();
  });

  // The demo starts from blank, so the gate never threatens to wipe the real save.
  let a=boot(null,{url:"?demo=1",save:real});
  a.$("#countrySel").value="ULS";a.$("#countrySel").dispatchEvent(new a.w.Event("change"));
  ok(a.$("#gateWarn").hidden===true,"a demo never warns about losing the save -- it cannot lose it");
  ok(/demo/i.test(a.$("#startBtn").textContent),"and the button says it is a demo: "+a.$("#startBtn").textContent);
  a.click(a.$("#startBtn"));
  ok(a.g("S.uid")==="demo"&&a.g("S.notes.length")===0,"the staged day carries none of the real player's data");
  // switching city mid-demo re-stages, still without writing
  a.click(a.$("#chip"));a.$("#countrySel").value="SEO";a.$("#countrySel").dispatchEvent(new a.w.Event("change"));
  a.click(a.$("#startBtn"));
  ok(a.g("S.c")==="SEO"&&a.g("S.coins")===300&&a.g("EMG.length")===0,"switching city in a demo stages the new city");
  a.tab("support");
  ok(a.g("EMG.length")===1,"with its own wave waiting for Support");
  ok(a.w.localStorage.getItem("yl")===raw,"and still writes nothing");
  a.w.close();

  // Reload without the flag: the phone's own progress, untouched.
  a=boot("SOK",{save:real});
  ok(a.g("DEMO")===false&&a.$("#demoTag").hidden===true,"no flag, no badge");
  ok(a.g("S.uid")==="dreal"&&a.g("S.coins")===77&&a.g("S.streak")===9&&a.g("S.shield.self")===22,
     "the real save comes back as it was: coins "+a.g("S.coins")+", streak "+a.g("S.streak"));
  ok(a.g("EMG.length")===0,"and no staged wave");
  a.g("flush()");
  ok(JSON.parse(a.w.localStorage.getItem("yl")).uid==="dreal","a normal game still saves");
  a.w.close();

  // ?demo=0, ?demo=10 and friends are not the demo.
  ["?demo=0","?demo=10","?xdemo=1"].forEach(q=>{const b=boot("SEO",{url:q});
    ok(b.g("DEMO")===false,q+" is not a demo");b.w.close()});
}

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
