const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
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

  // ranking counts defence
  a.tab("rank");
  const before=+a.d.querySelector("#rankList .rank.me .v").textContent;
  a.g("S.defTotal+=2000");a.w.render();
  const after=+a.d.querySelector("#rankList .rank.me .v").textContent;
  ok(after>before,"shield raised counts in the ranking ("+before+" -> "+after+")");

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
  // the scene, the switch, the meters, the ticker and the upgrades all live on that one page
  ["#scene","#modeSw","#meters","#ticker","#upgrades"].forEach(sel=>
    ok(a.$("#city").contains(a.$(sel)),sel+" is on the My City page"));
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

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
