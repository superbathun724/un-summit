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

console.log("--- summit 2: the toast never hides the last row ---");
{
  const css=read("styles.css");
  const shown=a=>a.$("#toast").style.display!=="none";
  let a=boot("ULS");
  a.g("toastOff()");
  a.tap(25);                                        // the 25th tap raises a FACTS toast
  ok(shown(a)&&a.g("tt")!==null,"the fact toast is up, with its timer");
  ok(a.$("#app").classList.contains("toasting"),"and the page knows a toast is up");
  a.tab("rank");
  ok(!shown(a),"changing tab closes it at once");
  ok(a.g("tt")===null,"and its timer is cleared, so it cannot fire later");
  ok(!a.$("#app").classList.contains("toasting"),"and the extra room goes away with it");
  ok(/\$\d/.test(a.$("#ledger").textContent),"the ledger amount is there: "+a.$("#ledger").textContent);

  // Room below the last row while a toast is up, on every page that scrolls.
  ok(/#app\.toasting section:not\(#city\),#app\.toasting \.pad\{padding-bottom:calc\(var\(--toastH/.test(css),
     "every page gets the toast's height as bottom room while it is up");
  // A plain toast lets taps through to the buttons under it; its own buttons still work.
  ok(/\.toast\{[^}]*pointer-events:none/.test(css),"a plain toast does not swallow taps");
  ok(/\.toast button\{pointer-events:auto\}/.test(css),"but its own buttons take them");

  // An offer with a button waits for the player, and can be dismissed by hand.
  a.tab("city");
  let fired=0;
  a.w.__act=()=>fired++;
  a.g('toast("Your city was hit.",()=>__act(),"Watch ad")');
  ok(shown(a)&&a.g("tt")===null,"an action toast has no timer: it does not close by itself");
  ok(!!a.$("#toast #tx"),"it has a close button");
  a.tab("support");
  ok(shown(a),"and a tab change does not throw the offer away");
  a.click(a.$("#tx"));
  ok(!shown(a)&&fired===0,"x closes it without running the action");
  a.g('toast("Your city was hit.",()=>__act(),"Watch ad")');
  a.click(a.$("#ta"));
  ok(!shown(a)&&fired===1,"the action button runs it once and closes");
  // a plain toast after an action toast is plain again
  a.g('toast("hit",()=>__act(),"Go");toast("news")');
  ok(!a.$("#toast").classList.contains("act")&&a.g("tt")!==null,"the next plain toast times out as usual");
  a.w.close();
}

console.log("--- summit 3: a send on Support follows what the city voted for ---");
{
  // Every other city's card carries one line: what it voted for, from its own ladder.
  let a=boot("BUS");a.tab("support");
  const cards=a.all("#supportList [data-city]");
  ok(cards.length===11,"eleven other cities listed, got "+cards.length);
  cards.forEach(r=>{
    const c=r.dataset.city,opts=a.g(`pollSet('${c}').opts`),line=r.querySelector(".vote");
    ok(!!line&&/^Voted for: /.test(line.textContent),c+" has a vote line: "+(line&&line.textContent));
    ok(line&&opts.includes(line.textContent.replace("Voted for: ","")),c+" voted from its own list: "+(line&&line.textContent));
  });
  const busanOpts=a.g("pollSet('BUS').opts");
  const lines=JSON.stringify(cards.map(r=>r.querySelector(".vote").textContent));
  // Seeded votes shown next to real send buttons must say what they are, on this page, not
  // only on Voice: someone who opens Support alone would read them as real ballots.
  const note=a.$("#support p.note").textContent;
  ok(note.includes("Other cities' votes are sample data until the pilot starts."),"Support says the other votes are sample data: "+note);
  ok(a.$("#support").contains(a.$("#voteSample"))&&!a.$("#voteSample").hidden,"and it is visible on the Support page itself");
  // the send buttons were not touched
  ok(cards.every(r=>/^(Build|Tech) 20$/.test(r.querySelector(".btn[data-cost]").textContent)),"send labels unchanged");

  // My own city: not voted yet -> a way to Voice.
  const mine=a.$("#supportList [data-self] .vote");
  ok(mine&&mine.textContent==="Not voted yet — go to Voice","own row asks for a vote: "+(mine&&mine.textContent));
  a.click(mine);
  ok(a.$("#voice").classList.contains("on"),"and pressing it opens Voice");
  a.g("vote(2)");
  a.tab("support");
  ok(a.$("#supportList [data-self] .vote").textContent==="Voted for: "+busanOpts[2],
     "after voting the own row shows the pick: "+a.$("#supportList [data-self] .vote").textContent);
  a.tab("voice");a.g("vote(0)");a.tab("support");
  ok(a.$("#supportList [data-self] .vote").textContent==="Voted for: "+busanOpts[0],"and follows a changed vote");
  // an emergency row carries it too
  a.g("emgAdd('GAN')");a.tab("support");
  ok(/^Voted for: /.test(a.$('#supportList [data-emgrow="GAN"] .vote').textContent),"a red card carries the line too");
  a.w.close();

  // Same day, a reload: the other cities' votes do not move.
  a=boot("BUS");a.tab("support");
  ok(JSON.stringify(a.all("#supportList [data-city] .vote").map(e=>e.textContent))===lines,"a reload the same day shows the same votes");
  // A new day may move them, and the rows are rebuilt for it.
  const days=new Set(["2026-01-01","2026-01-02","2026-01-03","2026-01-04","2026-01-05"].map(d=>
    a.g(`(()=>{const t=today;today=()=>"${d}";const v=COUNTRIES.map(x=>votedFor(x.c)).join();today=t;return v})()`)));
  ok(days.size>1,"different days give different votes");
  a.w.close();

  // An emission city has no shield row; its own vote still shows, without a send button.
  a=boot("SEO");a.tab("support");
  const m=a.$("#supportList [data-mine]");
  ok(!!m&&/Not voted yet/.test(m.textContent),"an emission city sees its own vote line");
  ok(!m.querySelector(".btn"),"and it offers nothing to send to yourself");
  a.g("vote(1)");a.tab("support");
  ok(a.$("#supportList [data-mine] .vote").textContent==="Voted for: "+a.g("pollSet().opts[1]"),"and shows its pick");
  a.w.close();
}

console.log("--- summit 4: Ranking shows where your own score is heading ---");
{
  let a=boot("ULS");
  a.tab("rank");
  const pct=()=>parseFloat(a.$("#dutyBar").style.width),rel=()=>parseFloat(a.$("#reliefBar").style.width);
  ok(a.$("#dutyTxt").textContent==="Today's duty 0% · full duty = 70 points","duty line: "+a.$("#dutyTxt").textContent);
  ok(a.$("#reliefTxt").textContent==="Relief sent 0 / 200 coins · +30 points","relief line: "+a.$("#reliefTxt").textContent);
  ok(a.$("#rankProg .bar #dutyBar")&&a.$("#rankProg .bar #reliefBar"),"both are the existing .bar");
  ok(a.$("#rank").contains(a.$("#rankProg"))&&a.$("#rankProg").compareDocumentPosition(a.$("#rankList"))&4,"the card sits above the list");

  // Tapping moves duty at once. Ulsan is both: 30 taps of a 300 t cut side is 10% of 2 halves = 5%.
  a.tab("city");a.tap(30);
  ok(Math.abs(pct()-100*a.g("dutyDone()"))<1e-9&&pct()>0,"the duty bar moved with the taps: "+a.$("#dutyBar").style.width);
  ok(a.$("#dutyTxt").textContent==="Today's duty 5% · full duty = 70 points","and its label: "+a.$("#dutyTxt").textContent);
  // The number shown is the same thing the score is made of.
  a.tab("rank");
  ok(Math.abs(+a.$("#rankList .rank.me .v").textContent-70*a.g("dutyDone()"))<0.06,"the board's 70-share and the bar agree");

  // Sending moves relief at once.
  a.g("S.coins=500");a.tab("support");
  a.click(a.$('#supportList [data-city="BUS"] .btn[data-cost]'));
  ok(rel()===10&&/Relief sent 20 \/ 200/.test(a.$("#reliefTxt").textContent),"one send is 10% of the relief bar: "+a.$("#reliefTxt").textContent);
  for(let i=0;i<14;i++)a.g("give('BUS')");
  ok(rel()===100&&/Relief sent 200 \/ 200/.test(a.$("#reliefTxt").textContent),"and it stops full at 200: "+a.$("#reliefTxt").textContent);

  // The full explanation is folded, not deleted.
  const det=a.$("#rank details");
  ok(!!det&&!det.open,"the long explanation is folded by default");
  ok(det.textContent.includes("Today only, out of 100, and it resets at midnight. Your own city's day is worth 70 — the same 70 whether it cuts tonnes, builds shield or both. The last 30 comes only from coins you send elsewhere, so nobody tops this alone. Scores are per player, so a small town and a capital sit on the same scale."),
     "and it still carries the whole original text");
  ok(a.$("#rank p.note").textContent==="Today only, out of 100. 70 from your own city, 30 only from coins you send elsewhere.",
     "the open line is the one-sentence summary: "+a.$("#rank p.note").textContent);
  a.w.close();

  // A defence city's duty is its defence day.
  a=boot("SOK");a.tap(150);a.tab("rank");
  ok(a.$("#dutyTxt").textContent.startsWith("Today's duty 25%"),"Sokcho 150 of 600 defence is 25%: "+a.$("#dutyTxt").textContent);
  a.w.close();
}

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
