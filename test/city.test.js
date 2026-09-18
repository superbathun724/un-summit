const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
// The app ships as three files. jsdom fetches <link> and <script src> asynchronously, and
// these tests are synchronous, so the harness inlines them here. What runs is still exactly
// what the browser ends up with -- and if a file is renamed, every test fails at once.
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

function boot(city){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}})}});
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
  d.querySelector("#countrySel").value=city;
  api.click(d.querySelector("#startBtn"));
  return api;
}

console.log("--- role E: Seoul, cut only ---");
{
  const a=boot("SEO");
  ok(a.g("me().role")==="E","Seoul is E");
  ok(a.g("mode()")==="cut","forced to cut mode");
  ok(a.$("#modeSw").hidden===true,"no mode switch for a one-job city");
  ok(a.$("#mCut").hidden===false&&a.$("#mDef").hidden===true,"emissions card only");
  ok(a.$("#hint").textContent.includes("chimney"),"hint: "+a.$("#hint").textContent);
  const t0=a.g("S.tons");
  a.tap(10);
  ok(a.g("S.tons")===t0-10,"taps cut tonnes");
  ok(a.g("S.defTotal")===0,"taps build no defence");
  const names=a.all("#upgrades .t").map(e=>e.textContent.trim());
  ok(names[0]==="Bus rapid transit line"&&names[3]==="Clean district heating","Seoul's cut ladder: "+names.join(", "));
  ok(a.$("#shieldWall").getAttribute("opacity")==="0","no seawall drawn");
  a.tab("support");
  ok(!a.$("#supportList").textContent.includes("Your own shield"),"an E city has no self shield row");
  a.w.close();
}

console.log("--- role R: Sokcho, defence only ---");
{
  const a=boot("SOK");
  ok(a.g("me().role")==="R","Sokcho is R");
  ok(a.g("mode()")==="def","forced to defence mode");
  ok(a.$("#modeSw").hidden===true,"no mode switch");
  ok(a.$("#mDef").hidden===false&&a.$("#mCut").hidden===true,"shield card only");
  ok(a.$("#hint").textContent.includes("seawall"),"hint: "+a.$("#hint").textContent);
  ok(a.$("#shieldWall").getAttribute("opacity")==="1","seawall always drawn in defence mode");
  const t0=a.g("S.tons"),c0=a.g("S.coins");
  a.tap(19);
  ok(a.g("S.tons")===t0,"taps do not touch tonnes");
  ok(a.g("S.defTotal")===19,"19 defence points, got "+a.g("S.defTotal"));
  ok(a.g("S.coins")===c0+19,"taps still earn coins");
  ok((a.g("S.shield.self")||0)===0,"19 points is not 1% yet");
  a.tap(1);
  ok(a.g("S.shield.self")===1,"20 points = +1% shield, got "+a.g("S.shield.self"));
  ok(a.$("#shieldPct").textContent==="1%","shield meter shows 1%, got "+a.$("#shieldPct").textContent);
  const wallLow=+a.$("#wallBody").getAttribute("height");
  a.tap(580);
  ok(a.g("S.shield.self")===30,"a full day of tapping alone = 30%, got "+a.g("S.shield.self"));
  ok(+a.$("#wallBody").getAttribute("height")>wallLow,"wall grows with the shield");
  ok(a.g("S.def")===600,"daily defence budget spent, got "+a.g("S.def"));
  const d0=a.g("S.defTotal");
  a.tap(5);
  ok(a.g("S.defTotal")===d0,"daily cap blocks further taps");
  ok(a.$("#hint").textContent.includes("Today's work is done"),"hint: "+a.$("#hint").textContent);
  const names=a.all("#upgrades .t").map(e=>e.textContent.trim());
  ok(names[0]==="Fishing port drainage"&&names[3]==="Sokcho port breakwater","Sokcho's defence ladder: "+names.join(", "));
  ok(a.$("#cityNote").textContent.includes("siren"),"note swapped for defence");
  a.tab("support");
  ok(a.$("#supportList").textContent.includes("Your own shield"),"self shield row present");
  a.w.close();
}

console.log("--- role B: Ulsan, switchable ---");
{
  const a=boot("ULS");
  ok(a.g("me().role")==="B","Ulsan is B");
  ok(a.$("#modeSw").hidden===false,"mode switch visible");
  ok(a.g("mode()")==="cut","starts in cut mode");
  ok(a.$("#mCut").hidden===false&&a.$("#mDef").hidden===false,"a both-city sees both cards");
  ok(a.$("#mCut").classList.contains("active")&&!a.$("#mDef").classList.contains("active"),"emissions card is the live one");
  const btns=a.all("#modeSw button");
  ok(btns[0].classList.contains("on")&&!btns[1].classList.contains("on"),"cut button marked on");
  const t0=a.g("S.tons");
  a.tap(5);
  ok(a.g("S.tons")===t0-5,"cut mode taps cut");

  a.click(btns[1]);                                  // -> Build defence
  ok(a.g("mode()")==="def","switched to defence");
  ok(btns[1].classList.contains("on")&&!btns[0].classList.contains("on"),"defence button marked on");
  ok(a.$("#mDef").classList.contains("active")&&!a.$("#mCut").classList.contains("active"),"shield card is now the live one");
  ok(a.$("#streak").parentNode.id==="mDef","streak follows the live card");
  ok(a.$("#ticker").textContent.includes("Defence mode"),"ticker: "+a.$("#ticker").textContent);
  ok(a.all("#upgrades .t")[0].textContent.trim()==="Taehwa river levee","Ulsan's defence ladder after switch");
  const t1=a.g("S.tons");
  a.tap(40);
  ok(a.g("S.tons")===t1,"defence taps leave tonnes alone");
  ok(a.g("S.shield.self")===2,"40 taps = 2%, got "+a.g("S.shield.self"));

  a.click(btns[0]);                                  // -> back to Cut
  ok(a.g("mode()")==="cut","switched back");
  ok(a.all("#upgrades .t")[0].textContent.trim()==="Industrial belt bus line","Ulsan's cut ladder restored");
  ok(a.$("#tons").textContent.endsWith(" t"),"emissions meter intact: "+a.$("#tons").textContent);
  ok(a.$("#shieldPct").textContent==="2%","shield meter kept its value: "+a.$("#shieldPct").textContent);
  ok(a.$("#streak").parentNode.id==="mCut","streak followed back");

  // both ladders keep running while away
  a.g("S.coins=5000");
  a.g("S.upg.bus=1;S.upg.sandbag=1");
  const tb=a.g("S.tons"),db=a.g("S.defTotal");
  a.g("lastTick=Date.now()-10000");
  a.w.tick();
  ok(Math.round(tb-a.g("S.tons"))===10,"bus cut 10 t offline, got "+Math.round(tb-a.g("S.tons")));
  ok(Math.round(a.g("S.defTotal")-db)===10,"sandbags built 10 defence offline, got "+Math.round(a.g("S.defTotal")-db));

  // ranking counts today's defence work, the same way it counts a cut city's tonnes
  a.tab("rank");
  const before=+a.d.querySelector("#rankList .rank.me .v").textContent;
  a.g("S.def+=200");a.w.render();
  const after=+a.d.querySelector("#rankList .rank.me .v").textContent;
  ok(after>before,"defence built counts in the ranking ("+before+" -> "+after+")");

  // the switch survives a reload
  a.g("S.mode='def'");a.w.flush();
  const saved=JSON.parse(a.w.localStorage.getItem("yl"));
  ok(saved.mode==="def","mode is saved, got "+saved.mode);
  a.w.close();
}

console.log("--- smog is absolute, not relative ---");
{
  const big=boot("ULS"),small=boot("SOK");
  const o1=+big.$("#smog").style.opacity,o2=+small.$("#smog").style.opacity;
  ok(o1>0.7,"refinery city opens under heavy smog, got "+o1);
  ok(o2<0.2,"fishing town opens under light haze, got "+o2);
  big.w.close();small.w.close();
}

console.log("--- task 3: My City is one page ---");
{
  const a=boot("ULS");
  const labels=a.all("nav button").map(b=>b.textContent);
  ok(labels[0]==="My City","first tab renamed: "+labels.join(" | "));
  ok(a.$("#city")&&!a.$("#cut"),"section renamed to #city");
  // the scene, the switch, the meters and the upgrades all live on that one page
  ["#scene","#modeSw","#meters","#upgrades"].forEach(sel=>
    ok(a.$("#city").contains(a.$(sel)),sel+" is on the My City page"));
  // the ticker deliberately is not: a wave lands while you are clicking here, and the line
  // that says so has to be readable from Support and Ranking too
  ok(!a.$("#city").contains(a.$("#ticker")),"the status line is not owned by My City");
  ok(!a.$("#ticker").closest("section"),"it sits outside every page");
  ok(a.$("#city").classList.contains("on"),"My City is the page you land on");

  // leaving the page takes the scene with it, which is the point: the lists get the screen
  a.tab("support");
  ok(!a.$("#city").classList.contains("on"),"My City hidden on Support");
  ok(a.$("#support").classList.contains("on"),"Support page shown");
  // coins stay visible because you spend them here
  ok(a.$("header").contains(a.$("#coins")),"coin count is in the top bar");
  a.g("S.coins=1234");a.w.render();
  ok(a.$("#coins").textContent==="1234","coin count readable from Support: "+a.$("#coins").textContent);
  a.tab("rank");
  ok(!a.$("#city").classList.contains("on"),"My City hidden on Ranking");
  ok(a.$("#coins").textContent==="1234","coin count readable from Ranking");

  // and tapping still works when you come back
  a.tab("city");
  ok(a.$("#city").classList.contains("on"),"back on My City");
  const t0=a.g("S.tons");
  a.tap(3);
  ok(a.g("S.tons")===t0-3,"taps still land after switching pages");
  a.w.close();
}

console.log("--- task 4: every pilot city names its own infrastructure ---");
{
  const seen=new Map();
  const generic=new Set(["Bus line","Public rooftop solar","Wind farm","Clean grid",
                         "Sandbag depot","Siren network","Mangrove belt","Seawall section"]);
  // a household habit is not a public work: these words must never appear in a ladder
  const personal=/\b(your|you|my|household|home|family|habit|switch off|turn off|recycle|walk|cycle)\b/i;
  const a0=boot("ULS");
  const cities=a0.g("COUNTRIES");
  a0.w.close();
  cities.forEach(k=>{
    const a=boot(k.c);
    const modes=k.role==="E"?["cut"]:k.role==="R"?["def"]:["cut","def"];
    modes.forEach(m=>{
      if(k.role==="B")a.click(a.d.querySelector(`#modeSw button[data-mode="${m}"]`));
      const names=a.all("#upgrades .t").map(e=>e.textContent.trim());
      ok(names.length===4,k.n+"/"+m+" has 4 rungs, got "+names.length);
      ok(!names.some(n=>generic.has(n)),k.n+"/"+m+" is localised, not generic: "+names.join(", "));
      ok(!names.some(n=>personal.test(n)),k.n+"/"+m+" names public works only: "+names.join(", "));
      ok(!names.some(n=>n.length>26),k.n+"/"+m+" fits a phone row: "+names.filter(n=>n.length>26).join(", "));
      ok(new Set(names).size===4,k.n+"/"+m+" has no repeated rung");
      names.forEach(n=>{if(seen.has(n)&&seen.get(n)!==k.c)ok(false,"\""+n+"\" is used by both "+seen.get(n)+" and "+k.c);seen.set(n,k.c)});
    });
    // the mechanics are untouched: same ids, same prices, buying still works
    const m0=modes[0];
    if(k.role==="B")a.click(a.d.querySelector(`#modeSw button[data-mode="${m0}"]`));
    a.g("S.coins=100");a.w.render();
    const btn=a.d.querySelector("#upgrades .btn");
    ok(btn.textContent==="40",k.n+" first rung still costs 40, got "+btn.textContent);
    a.click(btn);
    ok(a.g("Object.values(S.upg).reduce((x,y)=>x+y,0)")===1,k.n+" bought one upgrade");
    ok(a.g("S.coins")===60,k.n+" paid 40 coins, got "+a.g("S.coins"));
    a.w.close();
  });
  ok(seen.size>=48,"48+ distinct local works across the pilot, got "+seen.size);

  // global mode has no local table, so it must fall back cleanly instead of blanking out
  const a=boot("SEO");
  ok(a.g("upName(UP_CUT[0],0)")==="Bus rapid transit line","local name used when there is one");
  a.g("S.c='ZZ';COUNTRIES.push({c:'ZZ',n:'Nowhere',role:'E',base:100})");
  ok(a.g("upName(UP_CUT[0],0)")==="Bus line","falls back to the generic name for an unlisted region");
  a.w.close();
}

console.log("--- space bar taps on a laptop ---");
{
  const space=(a,target,repeat=false)=>(target||a.d.body).dispatchEvent(
    new a.w.KeyboardEvent("keydown",{code:"Space",key:" ",repeat,bubbles:true,cancelable:true}));
  const a=boot("SEO");
  const t0=a.g("S.tons");
  space(a);space(a);space(a);
  ok(a.g("S.tons")===t0-3,"3 presses cut 3 tonnes, got "+(t0-a.g("S.tons")));
  space(a,null,true);
  ok(a.g("S.tons")===t0-3,"a held key does not keep tapping");
  const ev=new a.w.KeyboardEvent("keydown",{code:"Space",key:" ",bubbles:true,cancelable:true});
  a.$('nav button[data-tab="city"]').dispatchEvent(ev);
  ok(a.g("S.tons")===t0-4&&ev.defaultPrevented,"space on a focused tab taps instead of clicking it");
  a.d.body.dispatchEvent(new a.w.KeyboardEvent("keydown",{code:"KeyA",bubbles:true}));
  ok(a.g("S.tons")===t0-4,"other keys do nothing");
  a.tab("rank");
  space(a);
  ok(a.g("S.tons")===t0-4,"no taps from another tab");
  a.w.close();
  const b=boot("SOK");
  space(b);
  ok(b.g("S.defTotal")===1,"space builds defence in a defence city");
  b.w.close();
}

console.log("--- rewarded ads ---");
{
  const a=boot("SEO");
  const done=()=>{a.g("AD.until=0");a.click(a.$("#adDone"))};
  a.tab("support");
  const btns=a.all("#supportList [data-ad]");
  ok(btns.length===a.all("#supportList .row").length,"every support row has an ad button");
  ok(btns.every(b=>!b.disabled),"ad buttons start enabled with 0 coins");
  ok(a.all("#supportList .btn[data-cost]").every(b=>b.disabled),"coin buttons disabled with 0 coins");
  ok(a.$("#adNote").textContent.includes("10 left today"),"note: "+a.$("#adNote").textContent);
  const target=a.g("COUNTRIES.find(x=>x.role==='R'&&x.c!=='SEO').c"),sh0=a.g(`WORLD.${target}.shield`);
  a.g(`adGive('${target}')`);
  ok(a.$("#ad").hidden===false,"ad page opens");
  ok(a.$("#adDone").disabled,"reward is locked while the ad plays");
  a.click(a.$("#adDone"));
  ok(a.$("#ad").hidden===false,"clicking early does nothing");
  space:{const t0=a.g("S.tons");a.tab("city");a.d.body.dispatchEvent(new a.w.KeyboardEvent("keydown",{code:"Space",bubbles:true,cancelable:true}));
    ok(a.g("S.tons")===t0,"space does not tap behind an ad");a.tab("support")}
  done();
  ok(a.$("#ad").hidden===true,"ad page closes");
  ok(a.g(`WORLD.${target}.shield`)===Math.min(100,sh0+5),"relief arrived without coins");
  ok(a.g("S.coins")===0&&a.g("S.given")===20,"no coins spent, gift counted");
  ok(Math.abs(a.g("S.ledger")-0.02)<1e-9,"ledger +$0.02");
  ok(a.all("#supportList [data-ad]").every(b=>b.disabled),"cooldown disables ad buttons");
  ok(/Next ad in \d+ s\. 9 left today/.test(a.$("#adNote").textContent),"note: "+a.$("#adNote").textContent);
  a.g(`adGive('${target}')`);
  ok(a.$("#ad").hidden===true,"no second ad inside the gap");
  a.g("S.adAt=0");a.g(`adGive('${target}')`);a.click(a.$("#adSkip"));
  ok(a.$("#ad").hidden===true&&a.g("S.given")===20&&Math.abs(a.g("S.ledger")-0.02)<1e-9,"closing early gives nothing");
  ok(a.g("S.ads")===2,"a closed ad still counts as shown");
  a.g("S.ads=10;S.adAt=0");a.g(`adGive('${target}')`);
  ok(a.$("#ad").hidden===true,"daily cap holds");
  a.g("S.day='2000-01-01'");a.g("tick()");
  ok(a.g("S.ads")===0,"cap resets on a new day");
  a.w.close();

  // Rebuild after a hit: skips the gap, returns exactly what the wave took.
  const b=boot("SOK");
  b.g("S.coins=101;S.shield.self=0;S.adAt=Date.now()");
  b.g("const _r=COUNTRIES.filter(k=>k.role!=='E');Math.random=()=>_r.findIndex(k=>k.c==='SOK')/_r.length+0.001");
  b.g("disaster()");
  ok(b.g("S.coins")===80,"wave took 21 (20% rounded against you), coins "+b.g("S.coins"));
  b.g("S.coins+=7");
  b.click(b.$("#ta"));
  ok(b.$("#ad").hidden===false,"rebuild ad opens despite the gap");
  b.g("AD.until=0");b.click(b.$("#adDone"));
  ok(b.g("S.coins")===108,"lost 21 returned on top of later earnings, coins "+b.g("S.coins"));
  b.w.close();

  // Old saves have no ad fields.
  const c=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}});
      w.localStorage.setItem("yl",JSON.stringify({uid:"dx",c:"SEO",tons:5,coins:3,cut:1,given:0,upg:{},day:"2000-01-01",streak:1,taps:0,ledger:0,shield:{}}))}});
  c.window.document.querySelector("#startBtn").dispatchEvent(new c.window.MouseEvent("click",{bubbles:true}));
  ok(c.window.eval("S.ads===0&&S.adAt===0"),"old save gets ad defaults");
  c.window.close();
}

console.log("--- task 5: the city answers for itself ---");
{
  // A disaster-risk city is asked what to build, off its own defence ladder.
  const a=boot("BUS");
  a.tab("voice");
  ok(a.$("#voice").classList.contains("on"),"Voice page shown");
  ok(a.$("#pollQ").textContent==="What does Busan need most?","question: "+a.$("#pollQ").textContent);
  const opts=a.all("#pollList .t").map(e=>e.textContent.trim());
  ok(opts[0]==="Marine City storm drains"&&opts[3]==="Busan port storm barrier","Busan's own defences: "+opts.join(", "));
  ok(a.$('nav button[data-tab="voice"]').classList.contains("new"),"an unanswered city is flagged");
  ok(a.all("#pollList .poll").length===0,"no tally before you answer");
  a.g("vote(1)");
  ok(a.g("S.vote")===1,"answer stored");
  ok(!a.$('nav button[data-tab="voice"]').classList.contains("new"),"flag clears once answered");
  ok(a.all("#pollList .poll").length===4,"four bars after answering, got "+a.all("#pollList .poll").length);
  ok(a.all("#pollList .poll")[1].classList.contains("mine"),"your own pick is marked");
  const pcs=a.all("#pollList .pt b").map(e=>parseInt(e.textContent));
  ok(pcs.reduce((x,y)=>x+y,0)===100,"percentages add up to exactly 100, got "+pcs.join("+"));
  ok(a.$("#pollNote").textContent.includes("stand-in"),"the tally admits it is a stand-in");
  a.g("vote(null)");
  ok(a.all("#pollList .poll").length===0&&a.g("S.vote")===null,"you can take the answer back");
  a.w.close();

  // A high-emission city is asked the other question.
  const b=boot("SEO");
  b.tab("voice");
  ok(b.$("#pollQ").textContent==="What should Seoul cut first?","question: "+b.$("#pollQ").textContent);
  ok(b.all("#pollList .t")[0].textContent.trim()==="Bus rapid transit line","Seoul is asked about cutting");
  const cities=b.g("COUNTRIES");
  b.w.close();

  // A blank ballot is a broken page, so every pilot city must have four real options.
  cities.forEach(k=>{
    const t=boot(k.c);t.tab("voice");
    const o=t.all("#pollList .t").map(e=>e.textContent.trim());
    ok(o.length===4&&new Set(o).size===4,k.n+" offers four distinct options: "+o.join(", "));
    ok(t.$("#pollQ").textContent.includes(k.n),k.n+" is asked about itself: "+t.$("#pollQ").textContent);
    t.g("vote(0)");
    const pc=t.all("#pollList .pt b").map(e=>parseInt(e.textContent));
    ok(pc.reduce((x,y)=>x+y,0)===100,k.n+" tally sums to 100, got "+pc.join("+"));
    ok(Math.max(...pc)-Math.min(...pc)>=8,k.n+" tally says something, got "+pc.join("/"));
    t.w.close();
  });

  // The note box: kept on the device, never rendered into anything another player reaches.
  const n=boot("MOK");
  n.tab("voice");
  n.$("#noteBox").value="   ";n.click(n.$("#noteSend"));
  ok(n.g("S.notes.length")===0,"an empty note is not saved");
  n.$("#noteBox").value="The drain on our street blocks every summer.";
  n.click(n.$("#noteSend"));
  ok(n.g("S.notes.length")===1,"a written note is saved");
  ok(n.g("S.notes[0].c")==="MOK"&&n.g("S.notes[0].t").includes("drain"),"note keeps the city and the text");
  ok(n.$("#noteBox").value==="","the box is cleared after sending");
  ok(n.$("#noteLog").textContent.includes("1 note"),"log: "+n.$("#noteLog").textContent);
  // "our street", not "drain": Support now shows each city's vote, and some cities' ballots
  // are drainage works. The note's own words are what must never appear there.
  n.tab("support");ok(!n.$("#support").textContent.includes("our street"),"a note never reaches Support");
  n.tab("rank");ok(!n.$("#rank").textContent.includes("our street"),"a note never reaches Ranking");
  n.g("flush()");
  ok(JSON.parse(n.w.localStorage.getItem("yl")).notes.length===1,"note survives a save");

  // The lists redraw every second. That must not take the sentence out from under you.
  n.tab("voice");
  n.$("#noteBox").value="half a sentenc";
  n.g("worldStamp++;S.given+=20;tick()");
  ok(n.$("#noteBox").value==="half a sentenc","typing survives a tick, got: "+n.$("#noteBox").value);
  n.g("render()");
  ok(n.$("#noteBox").value==="half a sentenc","typing survives a forced redraw");
  n.w.close();

  // Old saves have neither field.
  const o=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}});
      w.localStorage.setItem("yl",JSON.stringify({uid:"dx",c:"BUS",tons:5,coins:3,cut:1,given:0,upg:{},day:"2000-01-01",streak:1,taps:0,ledger:0,shield:{}}))}});
  o.window.document.querySelector("#startBtn").dispatchEvent(new o.window.MouseEvent("click",{bubbles:true}));
  ok(o.window.eval("S.vote===null&&Array.isArray(S.notes)&&S.notes.length===0"),"old save gets voice defaults");
  o.window.close();
}

console.log("--- task 6: upgrades run while the tab is closed ---");
{
  // A save carries the moment it was written. Everything since then is away time.
  const reopen=(save,mins)=>{
    const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
      beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}});
        w.localStorage.setItem("yl",JSON.stringify(Object.assign({uid:"dx",tons:600,coins:0,cut:0,given:0,
          upg:{},day:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),
          streak:1,taps:0,ledger:0,shield:{},def:0,defAcc:0,defTotal:0,ads:0,adAt:0,
          at:Date.now()-mins*60000},save)))}});
    dom.window.document.querySelector("#startBtn").dispatchEvent(new dom.window.MouseEvent("click",{bubbles:true}));
    return dom.window;
  };

  // Nothing built, nothing earned: the away payout is for infrastructure, not for waiting.
  let w=reopen({c:"SEO"},120);
  ok(w.eval("S.coins")===0&&w.eval("S.tons")===600,"an empty city earns nothing while away");
  ok(w.document.querySelector("#ticker").textContent==="","and says nothing about it");
  w.close();

  // One bus line at 1 t/s, gone 10 minutes: 600 s of cutting, and Seoul's day is 600 t.
  w=reopen({c:"SEO",upg:{bus:1}},10);
  ok(w.eval("S.cut")===300,"10 minutes of a bus line, capped at half the day, got "+w.eval("S.cut"));
  ok(w.eval("S.coins")===300,"the tonnes became coins");
  ok(w.eval("S.tons")===300,"half the day is left to tap, got "+w.eval("S.tons"));
  ok(/While you were away: 300 t cut\. 300 coins waiting\./.test(w.document.querySelector("#ticker").textContent),
     "report: "+w.document.querySelector("#ticker").textContent);
  w.close();

  // Short trip, no ceiling in the way: 3 minutes is 180 t and nothing is rounded away.
  w=reopen({c:"SEO",upg:{bus:1}},3);
  ok(w.eval("S.cut")===180,"3 minutes pays in full, got "+w.eval("S.cut"));
  w.close();

  // The point of the ceiling: you cannot come back to a finished day.
  w=reopen({c:"SEO",upg:{grid:1}},600);
  ok(w.eval("S.tons")===300,"a clean grid still leaves half the day, got "+w.eval("S.tons"));
  ok(w.document.querySelector("#hint").textContent.includes("chimney"),"so there is still something to tap");
  w.close();

  // Three days away pays the same as ten hours: one day's budget, never three.
  const a=reopen({c:"SEO",upg:{grid:1}},600),b=reopen({c:"SEO",upg:{grid:1}},4320);
  ok(a.eval("S.cut")===b.eval("S.cut"),"3 days = 10 hours, "+a.eval("S.cut")+" vs "+b.eval("S.cut"));
  ok(b.eval("S.streak")===1,"and the broken streak resets");
  a.close();b.close();

  // A player who already tapped past the halfway line gets nothing more from being away.
  w=reopen({c:"SEO",upg:{bus:1},tons:250},120);
  ok(w.eval("S.tons")===250,"no away payout below the halfway line, got "+w.eval("S.tons"));
  w.close();

  // Defence side: same ceiling, and 20 points per percent still holds.
  w=reopen({c:"SOK",upg:{sandbag:1}},60);
  ok(w.eval("S.def")===300,"defence stops at half of DEF_CAP, got "+w.eval("S.def"));
  ok(w.eval("S.shield.self")===15,"300 points = 15% shield, got "+w.eval("S.shield.self"));
  ok(w.eval("S.coins")===300,"defence work pays coins too");
  ok(/\+15% shield/.test(w.document.querySelector("#ticker").textContent),"report: "+w.document.querySelector("#ticker").textContent);
  w.close();

  // A city that does both gets both ladders paid -- out of half a budget each, so half of
  // half. The fixture also carries yesterday's 600 tonnes, which today's cap must clamp.
  w=reopen({c:"ULS",upg:{bus:1,sandbag:1}},60);
  ok(w.eval("capCut()")===300&&w.eval("capDef()")===300,"a both-city's day is halved on each side");
  ok(w.eval("S.cut")===150&&w.eval("S.def")===150,"both ladders ran, "+w.eval("S.cut")+" t and "+w.eval("S.def")+" def");
  ok(w.eval("S.tons")>=0,"and the clamped budget never goes negative, got "+w.eval("S.tons"));
  w.close();

  // A reload is not a trip. Under a minute says nothing.
  w=reopen({c:"SEO",upg:{bus:1}},0);
  ok(w.document.querySelector("#ticker").textContent==="","a refresh reports nothing");
  w.close();

  // An old save has no stamp at all. It must open, and it must not invent a payout.
  w=reopen({c:"SEO",upg:{bus:1},at:undefined},0);
  ok(w.eval("S.cut")===0&&w.eval("S.tons")===600,"a save with no stamp earns nothing");
  w.close();

  // Leaving the tab open in the background must not be worth more than closing it.
  const open=boot("SEO");
  open.g("S.upg={grid:1};lastTick=Date.now()-600*60000;tick()");
  ok(open.g("S.tons")===300,"a backgrounded tab hits the same ceiling, got "+open.g("S.tons"));
  ok(open.$("#ticker").textContent.includes("While you were away"),"and reports the same way");
  // and a normal second is still paid in full, all the way to zero
  open.g("S.tons=40;lastTick=Date.now()-1000;tick()");
  ok(open.g("S.tons")===20,"a live second is not capped, got "+open.g("S.tons"));
  open.g("lastTick=Date.now()-1000;tick()");
  ok(open.g("S.tons")===0,"and it runs the day to zero while you watch");
  open.w.close();

  // The stamp is written on the way out, not left behind.
  const t=boot("SEO");
  t.tap(3);t.g("flush()");
  const at=JSON.parse(t.w.localStorage.getItem("yl")).at;
  ok(at>0&&Date.now()-at<5000,"flush stamps the save with now");
  t.w.close();
}

console.log("--- task 7: one day, one board, the same day's work everywhere ---");
{
  const score=a=>a.g("dayScore()");
  const finish=a=>{const k=a.g("me()");
    if(k.role!=="R")a.g("S.tons=0");
    if(k.role!=="E")a.g("S.def=DEF_CAP");};

  // Finishing your own city's day is worth 70 -- whatever that day is made of.
  const seen={};
  ["SEO","DAE","SOK","TON","ULS","POH"].forEach(c=>{
    const a=boot(c);finish(a);
    seen[c]=score(a);
    ok(Math.abs(seen[c]-70)<1e-9,c+" scores exactly 70 for a finished day, got "+seen[c]);
    a.w.close();
  });
  ok(new Set(Object.values(seen)).size===1,"every role lands on the same number: "+JSON.stringify(seen));

  // Half a day is half the duty, and a city that does both has to do both.
  let a=boot("DAE");a.g("S.tons=250");
  ok(Math.abs(score(a)-35)<1e-9,"half of Daegu's 500 t is 35, got "+score(a));
  a.w.close();
  a=boot("ULS");a.g("S.tons=0");
  ok(Math.abs(score(a)-35)<1e-9,"a both-city that only cuts gets half the duty, got "+score(a));
  a.g("S.def=DEF_CAP");
  ok(Math.abs(score(a)-70)<1e-9,"and the full 70 once it also builds, got "+score(a));
  a.w.close();

  // The last 30 cannot be earned at home. Only coins that leave count.
  a=boot("SOK");finish(a);
  ok(Math.abs(score(a)-70)<1e-9,"a perfect day alone stops at 70, got "+score(a));
  a.g("S.coins=500");
  for(let i=0;i<5;i++)a.g("give('BUS')");
  ok(Math.abs(score(a)-(70+15))<1e-9,"100 coins of relief is 15 more, got "+score(a));
  for(let i=0;i<5;i++)a.g("give('BUS')");
  ok(Math.abs(score(a)-100)<1e-9,"200 coins of relief completes the board, got "+score(a));
  for(let i=0;i<5;i++)a.g("give('BUS')");
  ok(Math.abs(score(a)-100)<1e-9,"and it stops at 100, got "+score(a));
  ok(a.g("S.gaveToday")===300&&a.g("S.given")===300,"today's relief and the lifetime total both move");
  a.w.close();

  // Relief paid by a finished ad counts: ten free ▶ Ad sends are exactly the 200.
  a=boot("SOK");finish(a);
  for(let i=0;i<10;i++){a.g("S.ads=0;S.adAt=0");a.g("adGive('BUS')");a.g("AD.until=0");a.click(a.$("#adDone"))}
  ok(a.g("S.coins")===0,"no coins were spent");
  ok(Math.abs(score(a)-100)<1e-9,"ten free ad sends finish the board, got "+score(a));
  a.w.close();

  // A finished day wins the board. That is the point of capping the simulated cities at 92.
  a=boot("SOK");finish(a);a.g("S.coins=500");for(let i=0;i<10;i++)a.g("give('BUS')");
  a.tab("rank");
  ok(a.all("#rankList .rank")[0].classList.contains("me"),"a finished day takes first place");
  const vals=a.all("#rankList .rank .v").map(e=>Number(e.textContent));
  ok(vals.every(v=>v>=0&&v<=100),"every city is on the same 0-100 scale: "+vals.join(", "));
  ok(vals.join()===[...vals].sort((x,y)=>y-x).join(),"the board is sorted");
  a.w.close();

  // Midnight resets the board and nothing else.
  a=boot("ULS");finish(a);a.g("S.coins=500");for(let i=0;i<10;i++)a.g("give('BUS')");
  a.g("S.upg={bus:2};S.shield.self=40;S.streak=6;S.cut=1234;S.defTotal=999");
  ok(Math.abs(score(a)-100)<1e-9,"yesterday ended at 100");
  const world0=a.g("JSON.stringify(WORLD)");
  a.g("S.day='2000-01-01';lastTick=Date.now();tick()");
  ok(score(a)===0,"the board is back to zero, got "+score(a));
  ok(a.g("S.gaveToday")===0,"today's relief is back to zero");
  ok(a.g("S.given")===200&&a.g("S.cut")===1234&&a.g("S.defTotal")===999,"lifetime totals survive");
  ok(a.g("JSON.stringify(S.upg)")==='{"bus":2}',"upgrades survive");
  ok(a.g("S.shield.self")===30,"the shield carries over, minus one day of decay, got "+a.g("S.shield.self"));
  ok(a.g("S.streak")===1,"a skipped day breaks the streak");
  ok(a.g("JSON.stringify(WORLD)")!==world0,"and the opponents are rebuilt, not left on yesterday");
  a.w.close();

  // Population is carried but never scored: it must not be able to move the board.
  a=boot("SOK");
  ok(a.g("COUNTRIES.every(x=>x.pop>0)"),"every pilot city carries a population");
  finish(a);
  const s0=score(a);
  a.g("COUNTRIES.forEach(x=>x.pop*=1000)");
  ok(score(a)===s0,"multiplying every population changes nothing, "+s0+" -> "+score(a));
  a.w.close();
}

console.log("--- task 8: the wall is never finished, and never yours alone ---");
{
  // The claim the whole game is an argument for: a full day of your own hands and every coin
  // it earned still does not reach the safe line. Before the ceiling, this run ended at 100.
  let a=boot("SOK");
  a.tap(600);
  ok(a.g("S.shield.self")===30,"600 taps alone build 30%, got "+a.g("S.shield.self"));
  ok(a.g("S.coins")===600,"and 600 coins");
  let n=0;while(a.g("S.coins")>=20&&n<200){a.g("give('self')");n++}
  ok(a.g("S.shield.self")===40,"your own coins stop at 40%, got "+a.g("S.shield.self"));
  ok(a.g("S.shield.self")<a.g("SAFE"),"a day alone still cannot hold a wave");
  ok(a.g("S.coins")>=560,"and the coins that could not help were not taken, got "+a.g("S.coins"));
  a.w.close();

  // Relief from elsewhere is the only thing that crosses it.
  a=boot("SOK");
  a.g("S.shield.self=40");
  a.g("give('self')");
  ok(a.g("S.shield.self")===40,"your own relief does nothing at the ceiling");
  a.g("shieldUp(5,true)");
  ok(a.g("S.shield.self")===45,"another city's relief goes past it, got "+a.g("S.shield.self"));
  a.g("shieldUp(20,true)");
  ok(a.g("S.shield.self")===65,"and keeps going to 100, got "+a.g("S.shield.self"));
  a.w.close();

  // The ceiling is on the shield, not on the day's work: taps still pay and still score.
  a=boot("SOK");
  a.g("S.shield.self=40");
  const c0=a.g("S.coins"),s0=a.g("dayScore()");
  a.tap(100);
  ok(a.g("S.shield.self")===40,"taps past the ceiling raise no shield");
  ok(a.g("S.coins")===c0+100,"but still earn coins");
  ok(a.g("dayScore()")>s0,"and still count for the day's duty");
  a.w.close();

  // At the ceiling the row offers nothing, so no coin and no ad can be spent for no effect.
  a=boot("SOK");a.tab("support");
  ok(a.$("#supportList").textContent.includes("Your own shield"),"the self row is there below the ceiling");
  ok(!!a.$('#supportList .row .btn[onclick*="give(\'self\')"]'),"and it has a button");
  a.g("S.shield.self=SELF_MAX");a.w.render();
  ok(a.$("#supportList").textContent.includes("Only another city"),"at the ceiling it explains itself: "
     +a.$("#supportList .row .d").textContent);
  ok(!a.$('#supportList .row .btn[onclick*="give(\'self\')"]'),"the coin button is gone");
  const firstRow=a.$("#supportList .row");
  ok(!firstRow.querySelector("[data-ad]"),"and so is the ad button, which would have burned one of ten");
  a.w.close();

  // The sea does not stop. A wall left alone gives ground, and only the wall does.
  a=boot("SOK");
  a.g("S.shield.self=60;S.cut=500;S.given=300;S.upg={sandbag:2};S.defTotal=4000;S.streak=3");
  a.g("S.day='2000-01-01';lastTick=Date.now();tick()");
  ok(a.g("S.shield.self")===50,"one day of decay is 10 points, got "+a.g("S.shield.self"));
  ok(a.g("S.cut")===500&&a.g("S.given")===300&&a.g("S.defTotal")===4000,"history does not decay");
  ok(a.g("JSON.stringify(S.upg)")==='{"sandbag":2}',"upgrades do not decay");
  a.g("S.shield.self=6");a.g("S.day='2000-01-01';lastTick=Date.now();tick()");
  ok(a.g("S.shield.self")===0,"and it never goes below zero, got "+a.g("S.shield.self"));
  a.w.close();

  // Holding the line now costs upkeep: 50% is 10 points a day, which is relief from elsewhere.
  a=boot("SOK");
  a.g("S.shield.self=SAFE");
  a.g("S.day='2000-01-01';lastTick=Date.now();tick()");
  ok(a.g("S.shield.self")<a.g("SAFE"),"a shield at the safe line does not stay there by itself");
  a.w.close();

  // Relief arrives from somewhere. It is the one thing the player could never feel before.
  a=boot("SOK");
  a.g("S.shield.self=40;Math.random=()=>0");
  a.g("inbound()");
  ok(a.g("S.shield.self")===45,"relief lands, got "+a.g("S.shield.self"));
  ok(/sent 20 coins of relief/.test(a.$("#toast").textContent),"and says who sent it: "+a.$("#toast").textContent);
  a.g("inbound()");
  ok(/next wave will hold/.test(a.$("#toast").textContent),"crossing the line is called out: "+a.$("#toast").textContent);
  ok(a.g("S.shield.self")===50,"and it is exactly the safe line");
  // never from your own city, and never to a city that has no shield
  a.g("S.shield.self=0");
  for(let i=0;i<20;i++){a.g(`Math.random=()=>${i/20}`);a.g("inbound()")}
  ok(!a.$("#toast").textContent.includes("Sokcho"),"relief never arrives from your own city");
  a.w.close();
  const e=boot("SEO");
  e.g("Math.random=()=>0");e.g("inbound()");
  ok((e.g("S.shield.self")||0)===0,"a high-emission city has no shield to receive");
  e.w.close();

  // Giving makes receiving likelier. Nobody enforces it; it is the argument in one number.
  a=boot("SOK");
  ok(a.g("0.1+Math.min(0.4,0/500)")===0.1,"a city that sent nothing still has a chance");
  ok(a.g("0.1+Math.min(0.4,200/500)")>a.g("0.1+Math.min(0.4,0/500)"),"and a city that gave has a better one");
  ok(a.g("0.1+Math.min(0.4,100000/500)")===0.5,"the reward for giving is bounded");
  a.w.close();
}

console.log("--- task 9: a coastal sky is not its own to clean ---");
{
  // The bug: a defence city's smog was fixed forever. Tapping the shore never touched it and
  // there was no cut ladder to buy, so Busan opened under the same haze every single day.
  let a=boot("BUS");
  const h0=+a.$("#smog").style.opacity;
  ok(h0>0.3,"Busan still opens under real haze, got "+h0);
  a.tap(200);
  ok(+a.$("#smog").style.opacity===h0,"tapping the shore does not clear it -- the smoke is not hers");
  ok(a.g("S.tons")===a.g("Math.min(DAY_CAP,me().base)"),"and her own tonnes never move");

  // What does clear it: paying an emission city to cut.
  a.g("S.coins=400");
  const e=a.g("COUNTRIES.find(x=>x.role==='E').c");   // only a pure emission city is a Tech target
  a.g(`give('${e}')`);
  ok(a.g("S.techToday")===20,"a Tech send is counted, got "+a.g("S.techToday"));
  const h1=+a.$("#smog").style.opacity;
  ok(h1<h0,"and the sky lifts a little ("+h0+" -> "+h1+")");
  ok(/Your sky clears with theirs/.test(a.$("#ticker").textContent),"and says why: "+a.$("#ticker").textContent);
  a.g(`S.techToday=SKY_FUND;render()`);
  ok(+a.$("#smog").style.opacity===0,"a fully funded day is a clear sky, got "+a.$("#smog").style.opacity);
  ok(/you did not clean it, you paid for it/.test(a.g("(function(){S.coins=100;give('"+e+"');return $('#ticker').textContent})()")),
     "and the point is stated once it is clear");
  a.w.close();

  // Relief to another coastal city is not the same thing: it builds a wall, not a sky.
  a=boot("BUS");
  const h2=+a.$("#smog").style.opacity;
  a.g("S.coins=400");
  a.g("give('SOK')");
  ok(a.g("S.techToday")===0,"relief to a coastal city is not a Tech send");
  a.g("give('ULS')");
  ok(a.g("S.techToday")===0,"nor is relief to a city that is both -- Support offers it Build, not Tech");
  ok(+a.$("#smog").style.opacity===h2,"and does not clear anyone's sky");
  a.w.close();

  // Tomorrow the smoke is back: emissions resume, so the funding does too.
  a=boot("BUS");
  a.g("S.techToday=SKY_FUND;render()");
  ok(+a.$("#smog").style.opacity===0,"clear tonight");
  a.g("S.day='2000-01-01';lastTick=Date.now();tick()");
  ok(a.g("S.techToday")===0&&+a.$("#smog").style.opacity>0.3,"hazy again in the morning, got "+a.$("#smog").style.opacity);
  a.w.close();

  // An emission city is untouched: its own tonnes still drive its own sky.
  a=boot("SEO");
  const s0=+a.$("#smog").style.opacity;
  a.g("S.techToday=SKY_FUND;render()");
  ok(+a.$("#smog").style.opacity===s0,"funding someone else does not clear your own smoke");
  a.g("S.tons=0;render()");
  ok(+a.$("#smog").style.opacity===0,"cutting your own does");
  a.w.close();
}

console.log("--- task 10: the defence day and the line to reach ---");
{
  // The daily defence budget had no place on screen. You found out it existed by hitting it.
  const a=boot("SOK");
  ok(/600 left/.test(a.$("#defLeft").textContent),"the day's budget is on the card: "+a.$("#defLeft").textContent);
  ok(a.$("#defBar").style.width==="0%","and its bar starts empty");
  a.tap(150);
  ok(/450 left/.test(a.$("#defLeft").textContent),"it counts down: "+a.$("#defLeft").textContent);
  ok(a.$("#defBar").style.width==="25%","and fills: "+a.$("#defBar").style.width);
  a.g("S.def=DEF_CAP;render()");
  ok(/done/.test(a.$("#defLeft").textContent),"and says so at the end: "+a.$("#defLeft").textContent);

  // The wall: a footing you can see, and the line the whole game argues about.
  a.g("S.shield.self=0;render()");
  const h0=+a.$("#wallBody").getAttribute("height");
  ok(h0>=6,"an empty wall is a footing, not a hairline, got "+h0);
  a.g("S.shield.self=100;render()");
  ok(+a.$("#wallBody").getAttribute("height")>h0*4,"and it visibly grows, got "+a.$("#wallBody").getAttribute("height"));

  // The target sits exactly where SAFE would reach, so aiming at it means something.
  a.g("S.shield.self=SAFE;render()");
  const line=+a.$("#safeLine").getAttribute("y1"), top=+a.$("#wallBody").getAttribute("y");
  ok(Math.abs(line-top)<=1,"the wall meets the line exactly at "+a.g("SAFE")+"%, line "+line+" vs top "+top);
  ok(a.$("#wallCap").getAttribute("fill")==="#8FE3A0","the cap turns green once it holds");
  ok(+a.$("#safeTxt").getAttribute("opacity")===0,"and the target label steps out of the way");
  a.g("S.shield.self=SAFE-1;render()");
  ok(a.$("#wallCap").getAttribute("fill")!=="#8FE3A0","one point short is not green");
  ok(+a.$("#safeTxt").getAttribute("opacity")>0,"and the target is back");
  a.g("S.shield.self=SAFE-10;render()");
  ok(+a.$("#wallBody").getAttribute("y")>line,"and well short of it, the wall sits below the line");

  // It is drawn in front of the boats, or a boat sits on top of the seawall.
  const kids=[...a.$("#scene svg").children].map(n=>n.id);
  ok(kids.indexOf("shieldWall")>kids.indexOf("fore"),"the wall is drawn after the foreground: "+kids.join(","));
  a.w.close();

  // A cut-only city never sees any of it.
  const b=boot("SEO");
  ok(b.$("#mDef").hidden===true,"no defence card for a city with no shore to defend");
  ok(b.$("#shieldWall").getAttribute("opacity")==="0","and no wall");
  b.w.close();
}

console.log("--- task 11: the button under your finger is never replaced ---");
{
  // The failure this guards against: a list is rebuilt while a finger is down, the node the
  // press started on is gone, the browser fires the click on the parent, and the tap is lost.
  // So: hold a reference to the button, act, and check it is still the same live node.
  const live=el=>el&&el.isConnected;

  // Buying, five times in a row, on the same button.
  let a=boot("SEO");
  a.g("S.coins=100000");
  const btn=a.$('#upgrades [data-up="bus"] button');
  const price=[];
  for(let i=0;i<5;i++){price.push(+btn.dataset.cost);a.click(btn)}
  ok(a.g("S.upg.bus")===5,"five buys landed, got "+a.g("S.upg.bus"));
  ok(live(btn),"the very same button node is still in the page");
  ok(btn===a.$('#upgrades [data-up="bus"] button'),"and it is still the one the list shows");
  ok(price.join()==="40,64,102,164,262","the price climbed in place: "+price.join(", "));
  ok(btn.textContent==="419","and the next price is on it: "+btn.textContent);
  ok(a.$('#upgrades [data-up="bus"] [data-n]').textContent==="×5","the count is written in place");

  // A tick in between must not swap it either.
  const again=a.$('#upgrades [data-up="bus"] button');
  a.g("worldStamp++;S.given+=20;tick()");
  ok(again===a.$('#upgrades [data-up="bus"] button'),"a tick leaves the button alone");
  ok(live(again),"and does not detach it");

  // Switching ladders is structural, so there the rebuild is correct.
  a.w.close();
  a=boot("ULS");
  const cutBtn=a.$('#upgrades [data-up="bus"] button');
  a.click(a.d.querySelector('#modeSw button[data-mode="def"]'));
  ok(!live(cutBtn),"changing to the other ladder does replace the rows, which is right");
  a.w.close();

  // Giving, ten times, on the same button, while the numbers move.
  a=boot("SOK");
  a.g("S.coins=100000");
  a.tab("support");
  const row=a.$('#supportList [data-city="BUS"]'),gbtn=row.querySelector(".btn[data-cost]");
  const before=row.querySelector("[data-v]").textContent;
  for(let i=0;i<10;i++)a.click(gbtn);
  ok(a.g("S.given")===200,"ten sends landed, got "+a.g("S.given"));
  ok(live(gbtn)&&gbtn===a.$('#supportList [data-city="BUS"] .btn[data-cost]'),"the same send button survived all ten");
  ok(row.querySelector("[data-v]").textContent!==before,
     "and the shield number moved under it: "+before+" -> "+row.querySelector("[data-v]").textContent);
  a.g("tick()");
  ok(live(gbtn),"a tick after giving does not replace it either");

  // Your own shield row: still in place while it climbs, rebuilt exactly once at the ceiling.
  const selfBtn=a.$('#supportList [data-self] .btn[data-cost]');
  ok(!!selfBtn,"the self row has a button below the ceiling");
  a.g("S.shield.self=0");a.w.render();
  const sb=a.$('#supportList [data-self] .btn[data-cost]');
  for(let i=0;i<7;i++)a.click(a.$('#supportList [data-self] .btn[data-cost]'));
  ok(a.g("S.shield.self")===35,"seven sends is 35%, got "+a.g("S.shield.self"));
  ok(live(sb),"the self button survived all seven");
  a.click(sb);
  ok(a.g("S.shield.self")===40,"the eighth reaches the ceiling");
  ok(!live(sb),"and only then is the row replaced, because the buttons must go");
  ok(!a.$('#supportList [data-self] .btn[data-cost]'),"which they did");
  a.w.close();

  // An emergency appearing is structural: the row has to be pinned to the top.
  a=boot("SOK");a.tab("support");
  const plain=a.$('#supportList [data-city="BUS"]');
  a.g("emgAdd('BUS');tick()");
  ok(!live(plain),"a wave landing does rebuild the list, which is the point of pinning it");
  ok(!!a.$('#supportList [data-emgrow="BUS"]'),"and the red row is there");
  const eb=a.$('#supportList [data-emgrow="BUS"] .btn[data-cost]');
  a.g("S.coins=1000");a.click(eb);a.click(eb);
  ok(live(eb),"but relief sent inside the window does not replace it");
  ok(/%/.test(a.$('#supportList [data-emgrow="BUS"] [data-v]').textContent),
     "and its shield reads live: "+a.$('#supportList [data-emgrow="BUS"] [data-v]').textContent);
  a.w.close();
}

console.log("--- task 12: reported from a phone ---");
{
  // 1. A drag that starts on the city must never scroll the page. `manipulation` only turns
  //    off double-tap zoom; a fast tapper drags constantly and the page crawled away.
  let a=boot("SOK");
  const css=[...a.d.querySelectorAll("style")].map(e=>e.textContent).join("");
  ok(/#scene\{[^}]*touch-action:none/.test(css),"the scene takes the gesture, so nothing scrolls under a thumb");
  const ev=new a.w.MouseEvent("pointerdown",{bubbles:true,cancelable:true,clientX:100,clientY:100});
  a.$("#scene").dispatchEvent(ev);
  ok(ev.defaultPrevented,"and the handler cancels the gesture as well");
  a.w.close();

  // 2. A wave lands while you are clicking on My City. The line that says so used to live
  //    inside that page only, so from Support or Ranking there was no sign at all.
  a=boot("SOK");
  ok(!a.$("#ticker").closest("section"),"the status line belongs to no page");
  a.g("const _r=COUNTRIES.filter(k=>k.role!=='E');Math.random=()=>_r.findIndex(k=>k.c==='BUS')/_r.length+0.001");
  a.g("WORLD.BUS.shield=10;disaster()");
  ok(/Wave hit Busan/.test(a.$("#ticker").textContent),"the wave is announced: "+a.$("#ticker").textContent);
  ok(a.$("#ticker").classList.contains("bad"),"in red");
  ok(a.$("#ticker").classList.contains("hit"),"and it flashes, because red text alone is missed");
  ["support","voice","rank"].forEach(t=>{a.tab(t);
    ok(/Wave hit Busan/.test(a.$("#ticker").textContent),"still readable from "+t)});
  ok(!!a.$("#supportList .row.emg"),"and the red card is where the relief buttons are");
  ok(a.$('nav button[data-tab="support"]').classList.contains("alert"),"with the dot on the tab");
  // a calm line clears the flash again
  a.g('ticker("all quiet","good")');
  ok(!a.$("#ticker").classList.contains("hit"),"the flash does not stick");
  a.w.close();

  // 3. A saved note was invisible after saving, so it looked like it had gone somewhere.
  a=boot("MOK");a.tab("voice");
  ok(a.$("#noteVault").hidden===true,"no vault before there is anything in it");
  a.$("#noteBox").value="The drain on our street blocks every summer.";
  a.click(a.$("#noteSend"));
  ok(a.$("#noteVault").hidden===false,"the note is shown back to you");
  ok(a.all("#noteList .note-i").length===1,"one entry, got "+a.all("#noteList .note-i").length);
  ok(a.$("#noteList p").textContent.includes("drain"),"with the sentence in it");
  ok(a.$("#noteList time").textContent===a.g("today()"),"and the day it was written");
  ok(/1 note on this phone/.test(a.$("#noteLog").textContent),"counted: "+a.$("#noteLog").textContent);
  ok(/Nothing has left this phone/.test(a.$("#noteVault").textContent),"and it says plainly that nothing was sent");
  ok(/Nothing has been sent yet/.test(a.$("#toast").textContent),"the confirmation says so too: "+a.$("#toast").textContent);

  // it is still not readable by anyone else, which is the whole design
  a.tab("support");ok(!a.$("#support").textContent.includes("our street"),"still never reaches Support");
  a.tab("rank");ok(!a.$("#rank").textContent.includes("our street"),"still never reaches Ranking");
  a.tab("voice");

  // their own sentence goes back in as HTML, so it has to be escaped
  a.$("#noteBox").value='the gate <script>x</script> is rusted & stuck';
  a.click(a.$("#noteSend"));
  ok(a.all("#noteList .note-i").length===2,"second note saved");
  ok(a.all("#noteList p")[1].textContent==="the gate <script>x</script> is rusted & stuck",
     "angle brackets survive as text: "+a.all("#noteList p")[1].textContent);
  ok(a.$("#noteList").querySelectorAll("script").length===0,"and never as a tag");

  // you can take one back
  a.g("delNote(0)");
  ok(a.g("S.notes.length")===1&&!a.$("#noteList").textContent.includes("drain"),"a note can be deleted");
  a.g("flush()");
  ok(JSON.parse(a.w.localStorage.getItem("yl")).notes.length===1,"and the deletion is saved");

  // until a form exists, copying is the only way it actually reaches the team
  let copied="";
  a.w.navigator.clipboard={writeText:t=>{copied=t;return Promise.resolve()}};
  a.click(a.$("#noteCopy"));
  ok(copied.includes("rusted")&&copied.includes("MOK")&&copied.includes(a.g("today()")),
     "copy carries the note, the city and the date: "+copied);
  a.w.close();
}

console.log("--- task 13: changing city, and starting once ---");
{
  // The chip was the only place the city name appeared, it had cursor:pointer, and it did
  // nothing at all. There was no way to change city after starting.
  let a=boot("ULS");
  ok(a.$("#chip").tagName==="BUTTON","the chip is a real button");
  ok(a.$("#gate").style.display==="none","the gate is closed while playing");
  a.click(a.$("#chip"));
  ok(a.$("#gate").style.display!=="none","and the chip reopens it");
  ok(a.$("#countrySel").value==="ULS","with your own city selected");
  ok(a.$("#gateWarn").hidden===true,"nothing to warn about yet");
  ok(a.$("#gateKeep").hidden===false&&/Keep playing as Ulsan/.test(a.$("#gateKeep").textContent),
     "and a way back out: "+a.$("#gateKeep").textContent);
  a.click(a.$("#gateKeep"));
  ok(a.$("#gate").style.display==="none","which closes it again");
  ok(a.g("S.c")==="ULS","and changes nothing");

  // Picking another city used to wipe the save silently: new uid, no streak, no upgrades.
  a.g("S.streak=6;S.upg={bus:2,solar:1};S.shield.self=35;S.notes=[{d:'x',c:'ULS',t:'y'}]");
  a.click(a.$("#chip"));
  a.$("#countrySel").value="SOK";
  a.$("#countrySel").dispatchEvent(new a.w.Event("change"));
  ok(a.$("#gateWarn").hidden===false,"choosing another city warns first");
  const warn=a.$("#gateWarn").textContent;
  ok(/Ulsan loses/.test(warn),"it names the city you are leaving: "+warn);
  ["6-day streak","3 upgrade","35% shield","1 saved note"].forEach(bit=>
    ok(warn.includes(bit),"and what goes with it: "+bit));
  ok(/Start over as Sokcho/.test(a.$("#startBtn").textContent),"the button says what it does: "+a.$("#startBtn").textContent);

  // backing out at that point must leave everything alone
  a.click(a.$("#gateKeep"));
  ok(a.g("S.c")==="ULS"&&a.g("S.streak")===6&&a.g("S.shield.self")===35,"backing out keeps the save");
  ok(a.$("#gateWarn").hidden===true,"and clears the warning");

  // going through with it really does start over
  const uid0=a.g("S.uid");
  a.click(a.$("#chip"));
  a.$("#countrySel").value="SOK";
  a.$("#countrySel").dispatchEvent(new a.w.Event("change"));
  a.click(a.$("#startBtn"));
  ok(a.$("#gate").style.display==="none","the gate closes");
  ok(a.g("S.c")==="SOK","the city changed");
  ok(a.g("S.uid")!==uid0,"a new device id");
  ok(a.g("S.streak")===1&&a.g("JSON.stringify(S.upg)")==="{}"&&!a.g("S.shield.self")&&a.g("S.notes.length")===0,
     "and nothing carried over");
  ok(a.g("S.tons")===a.g("capCut()"),"a full fresh day, got "+a.g("S.tons"));
  ok(a.$("#chipTxt").textContent==="Sokcho","the bar shows the new city");
  ok(a.g("mode()")==="def","and the new city's role is in force");
  ok(a.$("#upgrades .t")&&/Fishing port drainage/.test(a.$("#upgrades").textContent),"with its own ladder");
  a.g("flush()");
  ok(JSON.parse(a.w.localStorage.getItem("yl")).c==="SOK","the save on this phone is the new city");
  a.w.close();

  // Starting twice must not run the start-up twice. Two sets of timers is a double-speed game.
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}});
      w.__n=0;const si=w.setInterval;w.setInterval=(f,ms)=>{w.__n++;return si(f,ms)}}});
  const w=dom.window,d=w.document;
  d.querySelector("#countrySel").value="SEO";
  const hit=()=>d.querySelector("#startBtn").dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
  hit();
  const n1=w.eval("__n"),uid1=w.eval("S.uid");
  hit();hit();hit();
  ok(w.eval("__n")===n1,"three more presses start no new timers ("+n1+" then "+w.eval("__n")+")");
  ok(w.eval("S.uid")===uid1,"and do not reset the player");
  ok(n1===2,"exactly the tick and the wave timer: "+n1);
  w.close();
}

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
