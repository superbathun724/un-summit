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
const dom=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
  beforeParse(w){w.Element.prototype.animate=()=>({cancel(){},pause(){}});}});
const w=dom.window,d=w.document;
const g=e=>w.eval(e);                       // top-level let/const live in the global lexical scope
const $=s=>d.querySelector(s);
const click=el=>el.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
const tab=n=>click(d.querySelector(`nav button[data-tab="${n}"]`));
w.addEventListener("error",e=>{fails++;console.log("  JS ERROR: "+e.message)});

console.log("--- base flow ---");
$("#countrySel").value="ULS";
click($("#startBtn"));
ok($("#gate").style.display==="none","gate hidden");
ok($("#chipTxt").textContent==="Ulsan","city = Ulsan, got "+$("#chipTxt").textContent);
const tons0=g("S.tons");

for(let i=0;i<45;i++)$("#scene").dispatchEvent(new w.MouseEvent("pointerdown",{bubbles:true,clientX:100,clientY:100}));
ok(g("S.tons")===tons0-45,"45 taps cut 45 t, got "+(tons0-g("S.tons")));
ok(g("S.coins")===45,"45 coins, got "+g("S.coins"));
ok($("#tons").textContent===Math.round(tons0-45)+" t","meter shows "+$("#tons").textContent);

tab("city");
const buyBtn=d.querySelector("#upgrades .btn");
ok(!buyBtn.disabled,"bus affordable at 45 coins");
click(buyBtn);
ok(g("S.upg.bus")===1,"bought bus");
ok(g("S.coins")===5,"coins 45-40=5, got "+g("S.coins"));

g("S.coins=200");w.render();
tab("support");
ok(d.querySelectorAll("#supportList .row").length>0,"support rows rendered");
const given0=g("S.given");
click([...d.querySelectorAll("#supportList .btn[data-cost]")][1]);
ok(g("S.given")===given0+20,"given +20, got "+(g("S.given")-given0));

tab("rank");
ok(d.querySelectorAll("#rankList .rank").length===12,"12 rank rows, got "+d.querySelectorAll("#rankList .rank").length);
ok(!!d.querySelector("#rankList .rank.me"),"my city highlighted");

console.log("--- task 1: live disaster ---");
const risk=g("COUNTRIES.filter(x=>x.role!=='E')");
const firstRisk=risk[1];                    // index 1 = not the player's own city
ok(firstRisk.c!==g("S.c"),"test victim is another city");
g(`WORLD['${firstRisk.c}'].shield=20`);
const realRandom=w.Math.random;w.Math.random=()=>1/risk.length+0.001;
w.disaster();
w.Math.random=realRandom;
ok(g("EMG.length")===1,"1 emergency raised, got "+g("EMG.length"));
ok(g("EMG[0].c")===firstRisk.c,"emergency on "+firstRisk.n+", got "+g("EMG[0].c"));
ok(d.querySelector('nav button[data-tab="support"]').classList.contains("alert"),"red dot on Support tab");
ok($("#ticker").textContent.includes("double"),"ticker: "+$("#ticker").textContent);

tab("support");
const first=d.querySelector("#supportList .row");
ok(first.classList.contains("emg"),"emergency row pinned first");
ok(first.textContent.includes("was hit"),"row says was hit");
ok(first.textContent.includes("double"),"row says relief counts double");
const clock=first.querySelector(".clock");
ok(!!clock&&/^[0-3]:[0-5]\d$/.test(clock.textContent),"clock format, got "+(clock&&clock.textContent));
ok([...d.querySelectorAll("#supportList .row")].filter(r=>r.textContent.includes(firstRisk.n)).length===1,"victim listed once");

g(`EMG[0].until=Date.now()+95000`);
w.emgClocks();
ok(clock.textContent==="1:35","clock updates in place, got "+clock.textContent);

const shBefore=g(`WORLD['${firstRisk.c}'].shield`);
g("S.coins=200");
click(first.querySelector(".btn"));
ok(g(`WORLD['${firstRisk.c}'].shield`)===shBefore+10,"emergency relief = +10%, got +"+(g(`WORLD['${firstRisk.c}'].shield`)-shBefore));

tab("support");
const normal=[...d.querySelectorAll("#supportList .row")].find(r=>{
  const oc=r.querySelector(".btn").getAttribute("onclick");
  const m=oc&&oc.match(/give\('(\w+)'\)/);
  return !r.classList.contains("emg")&&m&&m[1]!=="self"&&g("COUNTRIES").find(x=>x.c===m[1]).role!=="E";
});
const nm=normal.querySelector(".btn").getAttribute("onclick").match(/give\('(\w+)'\)/)[1];
const nBefore=g(`WORLD['${nm}'].shield`);
click(normal.querySelector(".btn"));
ok(g(`WORLD['${nm}'].shield`)===nBefore+5,"normal relief = +5%, got +"+(g(`WORLD['${nm}'].shield`)-nBefore));

g("EMG[0].until=Date.now()-1");
w.tick();
ok(g("EMG.length")===0,"emergency expires");
ok(!d.querySelector('nav button[data-tab="support"]').classList.contains("alert"),"dot cleared");
tab("support");
ok(!d.querySelector("#supportList .row").classList.contains("emg"),"pinned row removed");
ok([...d.querySelectorAll("#supportList .row")].filter(r=>r.textContent.includes(firstRisk.n)).length===1,"victim back in normal list");

// the player's own city: row must target the self shield
w.emgAdd(g("S.c"));
tab("support");
const mineRow=d.querySelector("#supportList .row.emg");
ok(mineRow.textContent.includes("Your city"),"own-city row reads 'Your city'");
ok(mineRow.querySelector(".btn").getAttribute("onclick").includes("give('self')"),"own-city row funds the self shield");
ok(!d.querySelector("#supportList .row:not(.emg)").textContent.includes("Your own shield"),"no duplicate self row while pinned");
const selfBefore=g("S.shield.self||0");
g("S.coins=200");
click(mineRow.querySelector(".btn"));
ok(g("S.shield.self")===selfBefore+10,"own-city emergency relief = +10%, got +"+(g("S.shield.self")-selfBefore));
g("EMG.length=0");w.worldStamp=0;w.tick();

w.emgAdd("BUS");w.emgAdd("GAN");w.emgAdd("SOK");w.emgAdd("JEJ");
ok(g("EMG.length")===3,"max 3 concurrent, got "+g("EMG.length"));
w.emgAdd("JEJ");
ok(g("EMG.length")===3,"re-hit refreshes instead of stacking, got "+g("EMG.length"));
tab("support");
ok(d.querySelectorAll("#supportList .row.emg").length===3,"3 pinned rows, got "+d.querySelectorAll("#supportList .row.emg").length);
w.emgClocks();
ok([...d.querySelectorAll(".clock")].every(c=>/^[0-3]:[0-5]\d$/.test(c.textContent)),"all clocks tick");

console.log("--- the link itself ---");
{
  // A pilot that spreads by one pasted link. If the head is wrong, the link is a bare URL
  // in every chat app and nobody taps it.
  const d2=new JSDOM(html).window.document;
  const meta=(sel,at)=>{const e=d2.querySelector(sel);return e?e.getAttribute(at||"content"):null};
  ok((meta('meta[name="description"]')||"").length>60,"a real page description is set");
  // The brand blue from the slides, so the phone's browser bar, the splash and the deck agree.
  const brand=(read("styles.css").match(/--brand:\s*(#[0-9A-Fa-f]{6})/)||[])[1];
  ok(brand==="#0F4C9C","the brand colour is the one from the presentation, got "+brand);
  ok(meta('meta[name="theme-color"]').toUpperCase()===brand,"the phone browser bar matches it");
  ok(/--paper:\s*#F8FAFC/i.test(read("styles.css")),"and the page sits on the near-white from the slides");
  ok(/--mist:\s*#E4ECF5/i.test(read("styles.css")),"with the light-blue surfaces");
  ok(meta('link[rel="icon"]',"href")==="icon.svg","an icon is declared");
  ok(meta('link[rel="apple-touch-icon"]',"href")==="icon-180.png","and one iOS can use");
  ok(meta('link[rel="manifest"]',"href")==="manifest.webmanifest","the manifest is linked");
  ["og:type","og:site_name","og:title","og:description","og:url","og:image","og:image:alt"]
    .forEach(k=>ok((meta(`meta[property="${k}"]`)||"").length>0,k+" is set"));
  ok(meta('meta[name="twitter:card"]')==="summary_large_image","the card is the big one");

  // og:image must be absolute, and must sit under og:url -- the single mistake that is easy
  // to make here is editing one of the two after the deploy and forgetting the other.
  const url=meta('meta[property="og:url"]'),img=meta('meta[property="og:image"]');
  ok(/^https:\/\//.test(img),"og:image is absolute, which scrapers require: "+img);
  ok(url.endsWith("/"),"og:url ends in a slash: "+url);
  ok(img===url+"og.png","og:image sits under og:url ("+url+" vs "+img+")");
  ok(+meta('meta[property="og:image:width"]')===1200&&+meta('meta[property="og:image:height"]')===630,
     "and its declared size is the 1200x630 the file actually is");

  // The files those tags point at have to exist, or the card is a broken image.
  ["og.png","icon.svg","icon-180.png","icon-192.png","icon-512.png","manifest.webmanifest"]
    .forEach(f=>ok(fs.existsSync(path.join(dir,f)),f+" is in the repo"));

  const mf=JSON.parse(read("manifest.webmanifest"));
  ok(mf.start_url==="./"&&mf.scope==="./","the manifest uses relative paths, so any repo name works");
  ok(mf.display==="standalone","added to a home screen it opens without browser chrome");
  ok(mf.theme_color===meta('meta[name="theme-color"]'),"and its theme colour agrees with the page");
  ok(mf.background_color===mf.theme_color,"and the splash does not flash a different colour");
  ok(mf.icons.some(i=>i.purpose==="maskable"),"one icon is maskable for Android");
  mf.icons.forEach(i=>ok(fs.existsSync(path.join(dir,i.src)),"manifest icon exists: "+i.src));
}

console.log("--- what the app claims about its own numbers ---");
{
  // The gate told every player the city roles came from public data. They did not, and a
  // summit judge asking "which data?" is the cheapest question in the room to lose on.
  // The claim is now tied to a flag, and this checks the two cannot drift apart.
  const app=read("app.js"),rm=read("README.md");
  const m=/const DATA_SOURCED=(true|false);/.exec(app);
  ok(!!m,"the build says whether its numbers are sourced");
  const sourced=m[1]==="true";
  const d3=new JSDOM(html,{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true,
    beforeParse(w){w.Element.prototype.animate=()=>({cancel(){}})}}).window.document;
  const why=d3.querySelector("#gateWhy").textContent;
  ok(why.length>80,"the gate explains the roles: "+why.slice(0,50)+"...");
  if(sourced){
    ok(/public data/.test(why),"a sourced build may say so");
    // README carries a source table with a year per field; an em dash means it is still blank
    const tbl=(rm.match(/\| *`?role[\s\S]*?\n\n/)||[""])[0];
    ok(!/\|\s*—\s*\|/.test(tbl),"and every source year is filled in, not left as a dash");
  }else{
    ok(!/public data/.test(why),"an unsourced build must not claim public data: "+why);
    ok(/not replaced them with published figures/.test(why),"it says plainly what they are");
    ok(/placeholder/i.test(rm),"and README still calls the data a placeholder");
  }
}

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
