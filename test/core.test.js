const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
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

console.log(fails?`\n${fails} FAILED, ${passes} passed`:`\nALL ${passes} CHECKS PASSED`);
process.exit(fails?1:0);
