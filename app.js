/* ---------- data (sample; production pulls from a server) ---------- */
// Are the roles and numbers below taken from published statistics yet? They are not.
// While this is false the first screen must NOT tell players they came from public data --
// it said exactly that, to everyone, from the first build. At a summit where the whole
// argument is "the data says who emits and who drowns", being asked "which data?" and having
// no answer costs more than any feature here is worth.
// Flip this in the same commit that replaces the numbers, and fill in the year column in
// README. A test checks the claim and the flag agree, so they cannot drift apart again.
const DATA_SOURCED=false;
// role: E = high-emission, R = disaster-risk, B = both. base = starting daily tonnes (relative scale)
// ---- PILOT MODE: Korean cities. Switch REGIONS to COUNTRIES_GLOBAL when going global (see HANDOVER.md) ----
const REGIONS_KOREA = [
 // pop = thousands of residents. PLACEHOLDER, like role and base: replace with KOSIS figures
 // and write the year in README. Nothing scores on it yet -- the ranking is a per-player
 // average, so population cancels out. It is here so that the day a server can count real
 // participants, "what share of this city turned up" is a formula change, not a migration.
 {c:"ULS",n:"Ulsan",role:"B",base:900,pop:1100},
 {c:"POH",n:"Pohang",role:"B",base:700,pop:490},
 {c:"YEO",n:"Yeosu",role:"B",base:650,pop:270},
 {c:"INC",n:"Incheon",role:"E",base:800,pop:3000},
 {c:"SEO",n:"Seoul",role:"E",base:850,pop:9400},
 {c:"DAE",n:"Daegu",role:"E",base:500,pop:2370},
 {c:"BUS",n:"Busan",role:"R",base:300,pop:3290},
 {c:"GAN",n:"Gangneung",role:"R",base:80,pop:210},
 {c:"SOK",n:"Sokcho",role:"R",base:60,pop:82},
 {c:"JEJ",n:"Jeju",role:"R",base:90,pop:490},
 {c:"TON",n:"Tongyeong",role:"R",base:50,pop:120},
 {c:"MOK",n:"Mokpo",role:"R",base:70,pop:215},
];
const COUNTRIES_GLOBAL = [
 {c:"KR",n:"Korea",role:"B",base:900,tz:["Asia/Seoul"]},
 {c:"JP",n:"Japan",role:"B",base:850,tz:["Asia/Tokyo"]},
 {c:"US",n:"United States",role:"E",base:1500,tz:["America/New_York","America/Chicago","America/Denver","America/Los_Angeles"]},
 {c:"CN",n:"China",role:"B",base:1400,tz:["Asia/Shanghai"]},
 {c:"IN",n:"India",role:"B",base:700,tz:["Asia/Kolkata"]},
 {c:"DE",n:"Germany",role:"E",base:800,tz:["Europe/Berlin"]},
 {c:"AU",n:"Australia",role:"E",base:1100,tz:["Australia/Sydney"]},
 {c:"NP",n:"Nepal",role:"R",base:60,tz:["Asia/Kathmandu"]},
 {c:"BD",n:"Bangladesh",role:"R",base:80,tz:["Asia/Dhaka"]},
 {c:"PH",n:"Philippines",role:"R",base:120,tz:["Asia/Manila"]},
 {c:"ID",n:"Indonesia",role:"B",base:400,tz:["Asia/Jakarta"]},
 {c:"VN",n:"Viet Nam",role:"R",base:250,tz:["Asia/Ho_Chi_Minh"]},
 {c:"FJ",n:"Fiji",role:"R",base:40,tz:["Pacific/Fiji"]},
 {c:"MV",n:"Maldives",role:"R",base:30,tz:["Indian/Maldives"]},
];
const COUNTRIES = REGIONS_KOREA;
const ROLE_LABEL={E:"High-emission",R:"Disaster-risk",B:"Emits & at risk"};
// Two ladders, one per job. A high-emission city only ever sees the first, a disaster-risk city
// only the second, a "both" city switches between them. Ids never collide, so a both-city keeps
// what it bought in either mode and both ladders keep running while it is away.
const UP_CUT=[
 {id:"bus",n:"Bus line",d:"Cuts 1 t / sec",cost:40,rate:1},
 {id:"solar",n:"Public rooftop solar",d:"Cuts 3 t / sec",cost:150,rate:3},
 {id:"wind",n:"Wind farm",d:"Cuts 8 t / sec, turns a chimney into a turbine",cost:500,rate:8},
 {id:"grid",n:"Clean grid",d:"Cuts 20 t / sec",cost:1500,rate:20},
];
const UP_DEF=[
 {id:"sandbag",n:"Sandbag depot",d:"Builds 1 defence / sec",cost:40,rate:1},
 {id:"siren",n:"Siren network",d:"Builds 3 defence / sec",cost:150,rate:3},
 {id:"mangrove",n:"Mangrove belt",d:"Builds 8 defence / sec",cost:500,rate:8},
 {id:"seawall",n:"Seawall section",d:"Builds 20 defence / sec",cost:1500,rate:20},
];
// What each city would actually build, in its own geography and its own industry. Public works
// only: a council budget line, never a household habit. Nobody is asked to take the bus here --
// the city lays the bus line. Costs and rates are shared; only the name is local, so the ladder
// stays balanced and a player switching cities is not learning a new game.
// A region with no entry falls back to the generic names above. That is what global mode uses.
const LOCAL={
 ULS:{cut:["Industrial belt bus line","Refinery rooftop solar","Floating offshore wind","Complex-wide clean grid"],
      def:["Taehwa river levee","Industrial zone sirens","Ulsan bay tidal flats","Onsan port storm barrier"]},
 POH:{cut:["Steelworks shuttle line","Mill roof solar array","Yeongil bay wind farm","Electric arc furnace grid"],
      def:["Naengcheon floodwall","Quake and flood sirens","Yeongil bay dune belt","Steelworks storm gate"]},
 YEO:{cut:["Complex shuttle line","Plant roof solar array","Yeosu offshore wind","Complex clean grid"],
      def:["Island village seawall","Coastal siren network","Gamak bay tidal flats","Yeosu port storm barrier"]},
 INC:{cut:["Port shuttle bus line","Warehouse roof solar","Incheon offshore wind","Metropolitan clean grid"]},
 SEO:{cut:["Bus rapid transit line","Public building solar","Wind power purchase deal","Clean district heating"]},
 DAE:{cut:["Urban rail feeder line","Solar City rooftop array","Highland wind farm","Industrial park clean grid"]},
 BUS:{def:["Marine City storm drains","Port tsunami sirens","Nakdong estuary flats","Busan port storm barrier"]},
 GAN:{def:["Gyeongpo drainage works","East coast tsunami sirens","Coastal pine windbreak","Anmok shore revetment"]},
 SOK:{def:["Fishing port drainage","Tsunami siren tower","Cheongchoho lagoon buffer","Sokcho port breakwater"]},
 JEJ:{def:["Village stone wall repair","Island typhoon sirens","Coastal dune and pine belt","Harbour wave breakers"]},
 TON:{def:["Island jetty repair","Island siren relay","Hansan bay tidal flats","Fishing port breakwater"]},
 MOK:{def:["Low-lying district pumps","High-tide warning sirens","Estuary tidal flat belt","Yeongsan floodgate"]},
};
const FACTS=[
 "Sea level has risen about 20 cm since 1900. Every centimetre pushes a tsunami further inland.",
 "The countries most exposed to climate disasters emit under 1% of global CO2.",
 "A single city bus can replace around 40 private cars on the road.",
 "Tsunami early-warning speakers cost less than one day of a mid-size coal plant's fuel.",
 "Mangrove belts can cut wave energy by more than half before it reaches shore.",
 "In 2007, over a million volunteers cleaned Korea's Taean coast with no one ordering them to.",
 "UN climate agreements have no enforcement power. Compliance is voluntary. So is this game.",
 "Industrial ports are the most exposed part of a coastline and the most expensive to lose.",
];

/* ---------- state ---------- */
const DAY_CAP=600;                // tonnes per day per player (anti-bot, keeps it a daily habit)
const DEF_CAP=600;                // defence points per day, same ceiling as tonnes
// A city that does both jobs used to get two full budgets -- 600 tonnes AND 600 defence --
// so Ulsan tapped 1200 times a day and earned twice the coins of Sokcho for the same effort,
// and could send twice the relief. Each side gets half instead. The total is 600 taps either
// way, and a finished day is still a finished day: both halves full is duty 1.0, still 70.
function capCut(){const k=me(),c=Math.min(DAY_CAP,k.base);return k.role==="B"?Math.round(c/2):c}
function capDef(){return me().role==="B"?DEF_CAP/2:DEF_CAP}
const DEF_PER_PCT=20;             // 20 points = 1% shield, so a full day of tapping alone reaches 30%.
const SAFE=50;                    // a shield at or above this holds a wave
// The line the game is an argument about. Your own hands and your own coins stop at SELF_MAX;
// only another city's relief crosses it. Before this, they did not: 20 of your own coins bought
// +5%, so a day's 600 coins bought +150% and a player alone was safe by the first evening --
// the opposite of what the whole thing claims.
const SELF_MAX=40;
// And it is never finished. The sea does not stop rising, so a wall left alone gives ground.
// Holding 50% costs upkeep every day, which is what makes relief from elsewhere worth sending
// more than once.
const SHIELD_DECAY=10;
// A coastal town cannot clean its own air. The smoke is not its own, so tapping the shore
// will never move it -- and until now nothing else could either: half the pilot cities sat
// under a haze that was fixed for good. Its sky clears when the emission cities cut, which
// is what a Tech send pays for. 300 coins is half a day's tapping, so a day's work buys you
// a clear sky and still leaves something for your own wall.
const SKY_FUND=300;
let S={uid:null,c:null,tons:0,coins:0,cut:0,given:0,upg:{},day:null,streak:0,taps:0,ledger:0,shield:{},
       mode:"cut",def:0,defAcc:0,defTotal:0,ads:0,adAt:0,vote:null,notes:[],at:0,gaveToday:0,techToday:0};
// Rewarded ads only, never forced. The player opens each one. The caps keep it from becoming
// an ad-watching loop and sit inside what ad networks allow for rewarded web ads.
const AD_SEC=5;                   // stand-in length. A real rewarded ad runs 15-30 s.
const AD_GAP_MS=60000;            // one ad a minute at most
const AD_DAY=10;                  // ads per player per day
const AD_USD=0.02;                // what one finished ad adds to the ledger (estimate)
const store={
  get(){try{return JSON.parse(localStorage.getItem("yl")||"null")}catch(e){return null}},
  set(v){try{localStorage.setItem("yl",JSON.stringify(v))}catch(e){}}
};
// The player's calendar day, not UTC's. On UTC the day flipped at 09:00 in Korea and a
// session after midnight still counted as yesterday, so the streak never moved.
function today(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function uid(){return "d"+Math.random().toString(36).slice(2,10)}

/* ---------- live disasters (in memory only: a 3-minute event, not a save) ---------- */
const EMG_MS=180000, EMG_MAX=3;
let EMG=[];
function emgFind(c){return EMG.find(e=>e.c===c)}
function emgAdd(c){
  const ex=emgFind(c);
  if(ex)ex.until=Date.now()+EMG_MS;
  else{EMG.push({c,until:Date.now()+EMG_MS});if(EMG.length>EMG_MAX)EMG.shift()}
  worldStamp++;
}
function emgSweep(){const n=EMG.length;EMG=EMG.filter(e=>e.until>Date.now());if(EMG.length!==n)worldStamp++}
function emgDot(){$('nav button[data-tab="support"]').classList.toggle("alert",EMG.length>0)}
// Only the seconds change every tick. Rebuilding the row would replace the button a finger
// is already on, so the clock is the one thing written in place.
function emgClocks(){const now=Date.now();document.querySelectorAll("[data-emg]").forEach(el=>{
  const e=emgFind(el.dataset.emg);const s=e?Math.max(0,Math.ceil((e.until-now)/1000)):0;
  el.textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0")})}
function emgRow(e){
  const x=COUNTRIES.find(y=>y.c===e.c),mine=x.c===S.c;
  return `<div class="row emg" data-emgrow="${e.c}"><div><div class="t">${mine?"Your city":x.n} was hit <span class="tag SOS">LIVE</span></div>`+
    `<div class="d">Shield <span data-v></span>. Relief counts double for <span class="clock" data-emg="${e.c}">3:00</span></div></div>`+
    `<div class="bg"><button class="btn coin" data-cost="20" onclick="give('${mine?"self":e.c}')">20 &rarr; +10%</button>${adBtn(mine?"self":e.c)}</div></div>`;
}

/* ---------- the daily board ---------- */
// One day's work is the same size in every city. Finish what your own city asks of you and
// you have 70 -- Daegu's 500 t, Sokcho's 600 defence and Ulsan's both are all worth exactly
// that. Role and size leave the score.
//
// The last 30 cannot be earned at home. It only comes from coins sent somewhere else, so
// nobody tops this board alone: the same thing the shield ceiling says, said again in points.
// 200 is ten sends of 20, which is also exactly ten free ▶ Ad sends -- a player with no coins
// at all can still finish that half, on the one path that makes real donation money.
//
// Per player, never per city total. That is how population is handled: a town of 80,000 and a
// capital of 9 million are on the same scale because the total is never used. Ranking by sums
// would put Seoul on top on day one and every small city would quit, which is the opposite of
// section 4's "Ulsan must not be alone on the board".
const DUTY=70, RELIEF=30, RELIEF_FULL=200;
function dayScore(){
  const k=me(),cap=capCut();
  const c=cap>0?Math.min(1,(cap-S.tons)/cap):0, d=Math.min(1,S.def/capDef());
  const done=k.role==="E"?c:k.role==="R"?d:(c+d)/2;
  return DUTY*done+RELIEF*Math.min(1,(S.gaveToday||0)/RELIEF_FULL);
}

/* ---------- simulated world (seeded by date so it looks alive and consistent) ---------- */
function seed(str){let h=0;for(const ch of str)h=(h*31+ch.charCodeAt(0))>>>0;return()=>{h=(h*1664525+1013904223)>>>0;return h/4294967296}}
let WORLD={};
function buildWorld(){
  const r=seed(today());
  // Top out at 92: a player who finishes the day and sends 200 coins scores 100 and takes
  // first place. The board has to be winnable by doing the thing the game asks for.
  COUNTRIES.forEach(k=>{WORLD[k.c]={cut:Math.round(r()*300)/10,given:Math.round(r()*120),
    shield:Math.round(r()*70),score:Math.round((15+r()*77)*10)/10}});
}

/* ---------- init ---------- */
const $=s=>document.querySelector(s);
$("#gateWhy").textContent=DATA_SOURCED
  ?"Pick your city. Its role comes from public data, not from us: industrial cities cut emissions, coastal cities build protection, and some do both."
  :"Pick your city. Industrial cities cut emissions, coastal cities build protection, and some do both. These roles are our own first estimate — we have not replaced them with published figures yet.";
const sel=$("#countrySel");
COUNTRIES.forEach(k=>{const o=document.createElement("option");o.value=k.c;o.textContent=`${k.n} — ${ROLE_LABEL[k.role]}`;sel.appendChild(o)});
(function guessCountry(){
  // Prototype: guess from device time zone. Production: server-side geo-IP, never GPS.
  let tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||""}catch(e){}
  const k=COUNTRIES.find(x=>x.tz&&x.tz.includes(tz));
  sel.value=k?k.c:"ULS";
})();
const saved=store.get();
// A save can name a city this build does not have (older version, or global mode). Ignore it, never crash.
const savedCity=saved&&COUNTRIES.find(x=>x.c===saved.c);
if(savedCity)sel.value=saved.c;
// A blank state to fall back to when a player starts over as another city. The literal above
// gets mutated from the first tap onward, so the shape is kept before anything touches it.
const BLANK=JSON.stringify(S);
let started=false;

// The chip is the only place the city name appears, so it is where people press to change it.
// It reopens the gate rather than inventing a second picker.
$("#chip").onclick=()=>{if(!started)return;sel.value=S.c;gateSync();$("#gate").style.display=""};
sel.onchange=gateSync;
// Says what the button is about to do, before it is pressed. Switching city is not undoable:
// this phone holds one save, and the game is one city per device on purpose.
function gateSync(){
  const c=sel.value,x=COUNTRIES.find(y=>y.c===c);
  const cur=started?S.c:(savedCity?saved.c:null);
  const leaving=cur&&cur!==c, mine=COUNTRIES.find(y=>y.c===cur);
  $("#gateKeep").hidden=!started;
  if(started)$("#gateKeep").textContent="Keep playing as "+me().n;
  $("#gateWarn").hidden=!leaving;
  if(leaving){
    const st=started?S:saved, bits=[];
    if(st.streak>1)bits.push(`a ${st.streak}-day streak`);
    const up=Object.values(st.upg||{}).reduce((a,b)=>a+b,0);
    if(up)bits.push(`${up} upgrade${up>1?"s":""}`);
    if((st.shield||{}).self)bits.push(`a ${st.shield.self}% shield`);
    if(st.notes&&st.notes.length)bits.push(`${st.notes.length} saved note${st.notes.length>1?"s":""}`);
    $("#gateWarn").textContent=`Starting over as ${x.n} clears this phone. ${mine?mine.n:"Your city"} loses `
      +(bits.length?bits.join(", ")+" — none of it comes back.":"everything saved here.");
  }
  $("#startBtn").textContent=leaving?`Start over as ${x.n}`
    :(started?`Keep playing as ${x.n}`
    :(savedCity&&saved.c===c?"Continue as "+x.n:"Play as this city"));
}
$("#gateKeep").onclick=()=>{$("#gate").style.display="none";sel.value=S.c;gateSync()};
gateSync();
$("#startBtn").onclick=()=>{
  const c=sel.value;
  // Reopened mid-game. Same city: just close. Different city: wipe and rebuild, but never
  // run the start-up again -- a second set of timers would double the clock.
  if(started){
    $("#gate").style.display="none";
    if(c===S.c){gateSync();return}
    S=Object.assign(JSON.parse(BLANK),{uid:uid(),c});
    EMG=[];worldStamp++;listSig="";
    rollDay();buildWorld();scenery();lastTick=Date.now();
    render();ticker("");flush();gateSync();
    toast("Starting over as "+me().n+".");
    return;
  }
  started=true;
  if(savedCity&&saved.c===c){S=Object.assign({},S,saved,{upg:saved.upg||{},shield:saved.shield||{},notes:saved.notes||[]})}else{S.uid=uid();S.c=c}
  const k=me();
  rollDay();
  // A save can carry more of today's budget than today allows: written by an older build, or
  // by this city before a "both" city's budget was halved. Left alone, the meter bar computes
  // a negative width and the sky never clears.
  S.tons=Math.min(S.tons,capCut());
  S.def=Math.min(S.def,capDef());
  // S.at is the last moment this save was written. Everything since then is away time.
  // rollDay() runs first on purpose: a player gone for three days comes back to one fresh
  // day's budget, never three, and the away payout is drawn from that day.
  const gone=S.at?Math.min(86400,Math.round((Date.now()-S.at)/1000)):0;
  const back=gone>=AWAY_MIN?awayPay(gone):"";
  buildWorld();
  scenery();
  $("#gate").style.display="none";
  lastTick=Date.now();
  render();if(back)ticker(back,"good");fact("Your role: "+ROLE_LABEL[k.role]+". "+(k.role==="E"?"Cut tonnes, then send coins where the waves land.":k.role==="R"?"Build your shield with coins, yours or a stranger's.":"You cut and you build. Most countries do."));
  setInterval(tick,1000);setInterval(disaster,45000);
  gateSync();
};
function me(){return COUNTRIES.find(x=>x.c===S.c)}
// The role decides what a tap means. Only a "both" city gets to choose.
function mode(){const r=me().role;return r==="E"?"cut":r==="R"?"def":(S.mode==="def"?"def":"cut")}
function upSet(){return mode()==="def"?UP_DEF:UP_CUT}
function upName(u,i){const L=LOCAL[S.c],a=L&&L[mode()];return (a&&a[i])||u.n}
// Every change to the shield goes through here. `others` is true only for relief that came
// from another city -- that is the only thing allowed past SELF_MAX.
function shieldUp(pct,others){
  const now=S.shield.self||0, top=others?100:SELF_MAX;
  if(now>=top)return 0;
  const up=Math.min(pct,top-now);
  S.shield.self=now+up;
  return up;
}

// Defence points buy shield percent. Returns how much today's budget actually accepted.
function addDef(n){
  n=Math.min(n,capDef()-S.def);
  if(n<=0)return 0;
  S.def+=n;S.defTotal+=n;S.defAcc+=n;S.coins+=n;
  const up=Math.floor(S.defAcc/DEF_PER_PCT);
  if(up){S.defAcc-=up*DEF_PER_PCT;shieldUp(up,false)}
  return n;
}
// A phone keeps the tab alive for days. The day has to roll over without a reload.
function rollDay(){
  if(S.day===today())return false;
  const wasYesterday=S.day&&(new Date(today())-new Date(S.day))/864e5===1;
  S.streak=wasYesterday?S.streak+1:1;
  S.day=today();S.tons=capCut();S.taps=0;S.def=0;S.ads=0;S.gaveToday=0;S.techToday=0;
  // The sea keeps rising, so yesterday's wall is not today's wall. Nothing else decays --
  // tonnes cut and coins given are history and history does not un-happen.
  if(S.shield.self)S.shield.self=Math.max(0,S.shield.self-SHIELD_DECAY);
  // Only the board resets. Lifetime cut, coins given, the streak, the upgrades and the shield
  // all carry over -- a day is a fresh race, not a wiped city. The simulated world is rebuilt
  // here too: it used to be built once at start, so a tab left open past midnight kept
  // yesterday's opponents while the player's own score started again at zero.
  buildWorld();
  return true;
}

// Time the player was not here: the tab was closed, or the phone slept for hours. The
// upgrades still ran -- "they keep building while you're away" is a lie the second the tab
// is shut, and a daily game nobody has a reason to reopen is not a daily game.
//
// Two ceilings, both on purpose. Never more than one day's budget, because the daily cap is
// what keeps this a habit instead of a bot farm. And never more than HALF of it: come back
// to a finished day and there is nothing left to tap, which is exactly the reason to open
// the app. What a city builds works without you. It does not do your share.
const AWAY_MIN=60, AWAY_SHARE=0.5;
function awayPay(sec){
  let cr=0,dr=0;
  UP_CUT.forEach(u=>cr+=(S.upg[u.id]||0)*u.rate);
  UP_DEF.forEach(u=>dr+=(S.upg[u.id]||0)*u.rate);
  const cap=capCut(),sh0=S.shield.self||0;
  const cut=Math.max(0,Math.min(cr*sec,S.tons-cap*(1-AWAY_SHARE)));
  const def=Math.max(0,Math.min(dr*sec,capDef()*AWAY_SHARE-S.def));
  if(cut>0){S.tons-=cut;S.cut+=cut;S.coins+=cut}
  const got=def>0?addDef(def):0;
  if(cut<=0&&got<=0)return "";
  const p=[];
  if(cut>0)p.push(`${Math.round(cut)} t cut`);
  if(got>0)p.push(`+${(S.shield.self||0)-sh0}% shield`);
  return `While you were away: ${p.join(", ")}. ${Math.round(cut+got)} coins waiting.`;
}

/* ---------- core loop ---------- */
$("#scene").addEventListener("pointerdown",e=>{
  e.preventDefault();
  const r=$("#scene").getBoundingClientRect();
  tap(e.clientX-r.left,e.clientY-r.top);
});
// Space taps on a laptop. It lands on a random chimney (or the wall), so it looks like a tap.
// Held keys repeat, which would be an autoclicker; only fresh presses count.
document.addEventListener("keydown",e=>{
  if(e.code!=="Space"||e.repeat||!S.c||AD||!$("#city").classList.contains("on"))return;
  if(e.target.closest("input,select,textarea"))return;
  // A focused button (the tab you just clicked) would also fire on Space. Take the key from it.
  e.preventDefault();if(e.target.closest("button"))e.target.blur();
  const r=$("#scene").getBoundingClientRect();
  const el=mode()==="def"?$("#wallBody"):[...document.querySelectorAll(".stack")][Math.random()*4|0];
  const b=el.getBoundingClientRect();
  tap(b.left-r.left+Math.random()*b.width,(mode()==="def"?b.top:b.top+4)-r.top);
});
function tap(x,y){
  if(mode()==="def"){
    if(S.def>=capDef()){toast("Today's defence work is done. Come back tomorrow, or send coins.");return}
    const was=S.shield.self||0;
    addDef(1);S.taps++;
    puff(x,y,"+1","def");
    if((S.shield.self||0)>was)pop(x+10,y-46,"+1% shield","up");
  }else{
    if(S.tons<=0){toast("Today's emissions are gone. Come back tomorrow, or send coins.");return}
    S.tons-=1;S.cut+=1;S.coins+=1;S.taps++;
    puff(x,y,"\u22121 t","cut");
  }
  if(S.taps%25===0)fact(FACTS[(S.taps/25-1)%FACTS.length]);
  renderTop();affordable();save();
}
let lastTick=Date.now();
function tick(){
  // Timers stop while the screen is off. Pay out the real elapsed time instead of 1 s,
  // so "upgrades cut while you're away" is true on a phone. The daily cap still bounds it.
  const now=Date.now();
  const dt=Math.max(0,Math.min(86400,Math.round((now-lastTick)/1000)));
  lastTick=now;
  let msg=rollDay()?`New day. Emissions are back. ${S.streak}-day streak.`:"";
  // A phone that slept for an hour reports dt=3600. That is away time by another name, and
  // it must pay the same as a closed tab -- otherwise leaving the tab open is worth more.
  if(dt>=AWAY_MIN){const m=awayPay(dt);if(m){msg=msg?msg+" "+m:m;save()}}
  else if(dt>0){
    let cr=0,dr=0;
    UP_CUT.forEach(u=>cr+=(S.upg[u.id]||0)*u.rate);
    UP_DEF.forEach(u=>dr+=(S.upg[u.id]||0)*u.rate);
    if(cr>0&&S.tons>0){const a=Math.min(cr*dt,S.tons);S.tons-=a;S.cut+=a;S.coins+=a;save()}
    if(dr>0&&addDef(dr*dt)>0)save();
  }
  if(msg)ticker(msg,"good");
  // world moves a little
  for(const c in WORLD){WORLD[c].cut+=Math.random()*0.05}
  emgSweep();renderTop();renderLists();emgClocks();adSync();
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&S.c)tick()});
// Somebody else's coins landing on your wall. Simulated, like the rest of the world, but it
// is the moment the whole presentation is about -- and until now the player never once had it
// happen to them. The chance rises with what you sent out today: cities that give, receive.
// Not a rule anyone enforces. That is the point.
function inbound(){
  if(me().role==="E"||(S.shield.self||0)>=100)return;
  const p=0.1+Math.min(0.4,(S.gaveToday||0)/500);
  if(Math.random()>p)return;
  const from=COUNTRIES.filter(x=>x.c!==S.c);
  const x=from[Math.floor(Math.random()*from.length)];
  const up=shieldUp(5,true);
  if(!up)return;
  const crossed=(S.shield.self||0)>=SAFE&&(S.shield.self||0)-up<SAFE;
  toast(crossed
    ?`${x.n} sent relief. Your shield is ${S.shield.self}% and the next wave will hold. You could not have got here alone.`
    :`${x.n} sent 20 coins of relief. +${up}% shield.`);
  refresh();save();
}

function disaster(){
  inbound();
  const risk=COUNTRIES.filter(k=>k.role!=="E");
  const k=risk[Math.floor(Math.random()*risk.length)];
  const sh=k.c===S.c?(S.shield.self||0):WORLD[k.c].shield;
  const scene=$("#scene");
  if(k.c===S.c){$("#wave").classList.add("on");setTimeout(()=>$("#wave").classList.remove("on"),2000)}
  if(sh>=SAFE){ticker(`Wave hit ${k.n}. Shield held. ${sh}% funded.`,"good")}
  else{
    ticker(`Wave hit ${k.n}. Shield only ${sh}%. Relief counts double for 3 minutes — see Support.`,"bad",true);
    emgAdd(k.c);
    if(k.c===S.c){const lost=S.coins-Math.floor(S.coins*0.8);S.coins-=lost;scene.classList.add("shake");setTimeout(()=>scene.classList.remove("shake"),600);
      // The wave is not the player's timing, so this ad skips the one-a-minute gap. The daily cap still holds.
      toast("Your city was hit. Watch an ad to rebuild it free — the ad money goes to the public ledger, not to us.",
        ()=>watchAd(`Reward: the ${lost} coins the wave took, back.`,()=>{S.coins+=lost},true),"Watch ad")}
  }
  renderTop();renderLists();emgClocks();
}

/* ---------- scenery: one backdrop per city ---------- */
// Terrain and public structures only, same rule as LOCAL: no company plants, no named seas, and no
// landmark drawn closely enough to be someone's design. A region with no entry keeps the plain city.
const R=(x,y,w,h,f,a="")=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${a}/>`;
const P=(d,f,a="")=>`<path d="${d}" fill="${f}"${a}/>`;
const L=(d,c,w=1.5,a="")=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"${a}/>`;
const at=(x,y,body,cls="",st="")=>`<g${cls?` class="${cls}"`:""}${st?` style="${st}"`:""}><g transform="translate(${x},${y})">${body}</g></g>`;
const ridge=(pts,f)=>P(`M-100 214L${pts} 520 214Z`,f);
const cloud=(x,y,d)=>at(x,y,`<ellipse rx="22" ry="8" fill="#fff" opacity=".8"/><ellipse cx="12" cy="-5" rx="13" ry="8" fill="#fff" opacity=".8"/>`,"drift",`animation-duration:${d}s`);
const boat=(x,y,d=0,c="#e8eef2")=>at(x,y,P("M-14 0H14L10 6H-10Z","#c8553d")+R(-7,-7,9,7,c)+L("M5-7V-17","#555",1),"bob",`animation-delay:-${d}s`);
const birds=(x,y,d=0)=>at(x,y,L("M0 0q4-4 8 0q4-4 8 0M14-10q3-3 6 0q3-3 6 0","#34495e",1.2),"fly",`animation-delay:-${d}s`);
const ship=(y,sec,d=0)=>at(0,y,P("M0 0H70L64 10H6Z","#2c3e50")+R(10,-8,14,8,"#c0392b")+R(24,-8,14,8,"#2980b9")+R(38,-8,14,8,"#e6a23c")+R(54,-15,9,15,"#ecf0f1"),"cross",`animation-duration:${sec}s;animation-delay:-${d}s`);
const train=(y,sec,c,n=4)=>at(0,y,[...Array(n)].map((_,i)=>R(i*21,0,19,8,c)+R(i*21+3,2,13,2,"#2c3e50")).join(""),"cross",`animation-duration:${sec}s`);
const tanks=(xs,y=210)=>xs.map(x=>R(x-11,y-14,22,14,"#dfe6ea")+`<ellipse cx="${x}" cy="${y-14}" rx="11" ry="3" fill="#b0bec5"/>`).join("");
const pines=(xs,y=210,s=1)=>xs.map(x=>P(`M${x} ${y}l${6*s}-${20*s}l${6*s} ${20*s}Z`,"#2f5d3a")).join("");
const isle=(x,y,w,h,f)=>P(`M${x} ${y}Q${x+w/2} ${y-h*2} ${x+w} ${y}Z`,f);
const aCrane=x=>L(`M${x} 214L${x+10} 150L${x+20} 214M${x-20} 150H${x+46}`,"#d9534f",3)+at(x+36,151,L("M0 0V26","#333",1)+R(-4,26,8,5,"#333"),"sway");
const stayed=(x1,x2,y,px,h)=>R(x1,y,x2-x1,3,"#e8eef2")+R(px-2,y-h,4,h+14,"#e8eef2")+
  L([1,2,3,4].map(k=>`M${px} ${y-h+4}L${px-k*(px-x1)/4.5} ${y}M${px} ${y-h+4}L${px+k*(x2-px)/4.5} ${y}`).join(""),"#e8eef2",.8);
const lamps=(pts,c="#ffe28a")=>pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="1.6" fill="${c}" class="blink" style="animation-delay:-${i*.4}s"/>`).join("");
const LAND="#8aa46a";
const SCENES={
 ULS:{sky:["#9fbfd3","#e3e6dc"],
   back:ridge("-100 170 0 150 70 128 150 150 230 138 320 156 420 140","#9fb2c0")+
     R(262,92,6,120,"#e5b23a")+R(392,92,6,120,"#e5b23a")+R(252,84,156,10,"#e5b23a")+at(325,94,L("M0 0V44","#333",1)+R(-5,44,10,6,"#333"),"sway"),
   fore:tanks([186,210])+ship(262,30,8)+at(340,252,P("M0 0q-6-10-12-12q6 0 12 6q6-6 12-6q-6 2-12 12Z","#2c4a63"),"bob")+boat(90,250,1)},
 POH:{sky:["#f3b48a","#fde6c8"],
   back:`<circle cx="70" cy="96" r="16" fill="#ffd27a"/>`+ridge("-100 180 60 165 180 172 300 160 420 176","#b9a79a")+R(-100,150,620,64,"#ff9a4d",' opacity=".25" class="glow"'),
   fore:R(112,118,22,92,"#5d4037")+P("M110 118L123 104L136 118Z","#4e342e")+`<ellipse cx="123" cy="104" rx="9" ry="4" fill="#ff8a3d" class="glow"/>`+boat(60,248,0)+boat(210,262,1.3)+boat(360,252,.6)},
 YEO:{sky:["#46508a","#f0b48a"],lit:1,
   back:`<circle cx="360" cy="70" r="9" fill="#fdf1c7"/>`+isle(-40,214,160,34,"#5a6b8c")+isle(250,214,200,26,"#5a6b8c")+
     R(-100,168,620,3,"#dfe6ee")+R(88,110,5,104,"#dfe6ee")+R(328,110,5,104,"#dfe6ee")+L("M-100 150Q-6 204 90 112Q210 196 330 112Q426 204 520 150","#dfe6ee",1.4)+
     lamps([[10,168],[50,168],[130,168],[170,168],[210,168],[250,168],[290,168],[370,168],[410,168]]),
   fore:tanks([185,207,392])+boat(120,254,.4,"#ffe28a")+boat(300,266,1.7,"#ffe28a")},
 INC:{sky:["#8ec6e6","#dbeef8"],
   back:isle(-60,214,180,20,"#8fa9b8")+aCrane(378)+at(0,62,P("M0 0H26L32-3L26 2H0ZM10 0L16-7H19L16 0ZM10 2L16 8H19L16 2Z","#fff"),"cross","animation-duration:17s"),
   fore:stayed(-100,520,250,260,40)+ship(282,26)+boat(60,270,.8)},
 SEO:{sky:["#86c1e4","#dcedf6"],water:"#3f7fae",shore:["#6a9a5a",12],
   back:ridge("-100 160 -20 130 20 112 50 126 90 96 130 128 170 118 210 136 270 124 330 104 380 128 440 120","#8aa0ae")+
     ridge("-100 184 60 176 130 170 200 150 260 172 340 180","#7c9a7a")+R(159,78,4,72,"#eceff1")+R(155,92,12,8,"#eceff1")+R(160,60,2,18,"#eceff1"),
   fore:R(-100,288,620,20,"#6a9a5a")+R(-100,234,620,3,"#b0bec5")+L("M0 237v7M60 237v7M120 237v7M180 237v7M240 237v7M300 237v7M360 237v7M420 237v7","#90a4ae",2)+
     train(226,12,"#dfe6ea",5)+birds(60,70,2)},
 DAE:{sky:["#8cc3e0","#f1e2c4"],water:LAND,
   back:ridge("-100 150 -20 128 40 140 110 98 170 132 250 120 310 140 380 110 440 136","#7f9a86")+
     R(38,100,3,70,"#eceff1")+R(34,110,11,7,"#eceff1")+ridge("-100 196 50 170 120 190","#6f8c78"),
   fore:R(-100,222,620,4,"#cfd8dc")+L("M20 226v6M100 226v6M180 226v6M260 226v6M340 226v6","#b0bec5",3)+train(214,14,"#e8eef2",3)+
     L("M-100 280Q60 264 200 276T520 270","#6aaed6",6)+
     [40,90,150,270,330,390].map((x,i)=>`<circle cx="${x}" cy="${250+i%2*14}" r="9" fill="#4f7d3a"/><circle cx="${x-3}" cy="${248+i%2*14}" r="1.8" fill="#d9483b"/><circle cx="${x+4}" cy="${252+i%2*14}" r="1.8" fill="#d9483b"/>`).join("")},
 BUS:{sky:["#7fc0e8","#d8eef8"],
   back:ridge("-100 150 -10 118 60 132 120 102 200 130 260 110 330 128 400 104 460 130","#6f9477")+
     [...Array(26)].map((_,i)=>R(i*17-8,112+(i*7%5)*7+Math.abs(i-7)%5*3,7,6,["#f3efe6","#e7b7a3","#bcd4e6"][i%3])).join("")+aCrane(300)+aCrane(360),
   fore:ship(262,24,5)+boat(250,250,.5)+birds(150,86,4)},
 GAN:{sky:["#78bde6","#e2f2fa"],shore:["#e9d8a6",10],line:"town",
   back:ridge("-100 150 -30 118 40 134 100 92 170 124 240 100 310 128 380 96 450 126","#7d95ad")+
     ridge("-100 170 40 150 130 164 220 146 300 162 420 150","#5e7c6a")+pines([-2,22,64,112,158,200,246,290,332,376,414],210,1.6),
   fore:L("M-20 242q20-5 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0","#fff",1.5,' class="shim"')+boat(310,262,.3)+birds(80,80)+birds(250,60,5)},
 SOK:{sky:["#8fc3e3","#e6f2f8"],line:"town",
   back:ridge("-100 170 -40 150 0 104 20 124 40 84 60 110 80 70 104 102 126 88 150 120 190 110 230 140 300 150 360 132 440 156","#b8c2c9")+
     ridge("-100 190 30 172 90 184 160 168 240 184","#8a9aa6"),
   fore:R(350,240,90,5,"#9aa5ad")+R(396,210,9,30,"#f5f5f5")+R(395,204,11,6,"#c0392b")+P("M400 206L340 196V216Z","#fff6c4",' class="blink" opacity=".7"')+
     boat(90,256,0,"#ffe28a")+boat(170,268,1.1,"#ffe28a")+L("M70 246h40M150 258h40","#ffe28a",1,' stroke-dasharray="2 5"')+birds(220,76,3)},
 JEJ:{sky:["#83c6ea","#e4f4fb"],water:"#1d7a8c",line:"town",
   back:P("M-100 214Q60 206 150 120Q210 70 270 120Q360 206 520 214Z","#6d8b74")+cloud(190,98,11)+
     isle(20,214,70,18,"#7f9e7c")+isle(330,214,80,22,"#7f9e7c")+
     [16,70,128,238,300,366].map(x=>`<circle cx="${x}" cy="200" r="8" fill="#3f6f3a"/><circle cx="${x-2}" cy="198" r="1.8" fill="#f39c12"/><circle cx="${x+3}" cy="202" r="1.8" fill="#f39c12"/>`).join(""),
   fore:L("M-20 246q20-5 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0","#dff3f5",1.5,' class="shim"')+boat(260,262,.9)},
 TON:{sky:["#7fc2e9","#def0f9"],line:"town",
   back:ridge("-100 190 120 176 240 160 320 136 370 110 430 130","#6f9a78")+L("M240 170L360 122","#555",1)+
     at(240,171,L("M0 0V-3","#555",1)+R(-5,0,10,8,"#e74c3c"),"cable"),
   fore:isle(20,246,70,10,"#5f8f68")+isle(320,242,90,12,"#5f8f68")+L("M120 256h90M120 266h90M120 276h90","#f5f5f5",2,' stroke-dasharray="1 7" class="shim"')+
     boat(250,262,.2)+boat(70,280,1.4)+boat(380,272,.7)+birds(180,70,1)},
 MOK:{sky:["#8cc0dd","#f0e6cf"],shore:["#9b8a6c",18],line:"town",
   back:ridge("-100 196 -30 170 -10 150 10 160 26 132 44 150 60 138 84 164 130 186","#8d8a7e")+stayed(160,520,180,330,62),
   fore:L("M30 234h30M150 238h40M300 233h26","#c9dbe6",1.5,' class="shim"')+boat(200,262,.5)+boat(330,270,1.5)+birds(100,90,2)+birds(260,250,6)},
};
function skyline(kind,lit,o){
  if(kind==="town")return [...Array(10)].map((_,i)=>{const j=i+o,x=i*44-6,w=30+j%3*6,h=20+j*7%4*7,y=210-h;
    return R(x,y,w,h,["#e8e2d6","#d9d4c7","#efe9dc"][j%3])+R(x+w/2-3,y+h-9,6,9,"#7a6a58")+P(`M${x-3} ${y}L${x+w/2} ${y-11}L${x+w+3} ${y}Z`,["#2e6fa8","#c0573e","#3d7d6b"][j%3])}).join("");
  // Metro towers stay below the ridgeline so the mountains and landmarks behind them still read.
  const H=[50,78,40,96,58,84,104,52,88,62,74];
  const B=kind==="metro"
    ?[-10,24,64,98,146,182,224,276,312,356,392].map((x,i)=>{const h=H[(i+o)%11];return[x,210-h,[30,34,28,40,30,36,46,30,38,30,36][i],h]})
    :[[30,150,46,60],[90,120,60,90],[170,140,40,70],[225,105,70,105],[310,150,50,60],[375,130,30,80]];
  return B.map((b,i)=>R(...b,["#3d4a55","#4a5966","#56677a"][i%3])+
    (lit?lamps([[b[0]+8,b[1]+12],[b[0]+b[2]-10,b[1]+26],[b[0]+14,b[1]+40]],"#ffd76a"):"")).join("");
}
const METRO=["INC","SEO","DAE","BUS"];
function scenery(){
  const s=SCENES[S.c]||{},sk=s.sky||["#7FC4E8","#d4ecf7"];
  $("#backdrop").innerHTML=`<defs><linearGradient id="skyG" gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="215">`+
    `<stop offset="0" stop-color="${sk[0]}"/><stop offset="1" stop-color="${sk[1]}"/></linearGradient></defs>`+
    R(-100,-200,620,432,"url(#skyG)")+cloud(40,62,17)+cloud(250,48,21)+(s.back||"")+
    R(-100,228,620,120,s.water||"#1F5F8B")+(s.shore?R(-100,228,620,s.shore[1],s.shore[0]):"")+
    (s.water===LAND?"":L("M30 252h24M140 264h30M260 250h20M350 274h26","#9cc7e4",1.5,' class="shim"'));
  $("#skyline").innerHTML=skyline(s.line||(METRO.includes(S.c)?"metro":"ind"),s.lit,Math.max(0,COUNTRIES.findIndex(x=>x.c===S.c))*3);
  $("#fore").innerHTML=s.fore||"";
  // A fishing town has no chimneys to shut. Its taps go to the shore.
  $("#stacks").style.display=me().role==="R"?"none":"";
}

/* ---------- render ---------- */
// Split on purpose: a tap only touches the scene and the meters. Rebuilding the three
// lists on every tap made taps feel slow on cheap Android phones.
function render(){renderTop();renderLists(true)}
// After anything that only moves numbers. renderLists() rebuilds a list only when its
// signature says the set of rows changed; otherwise syncRows() writes the new values in.
function refresh(){renderTop();renderLists()}
function renderTop(){
  const k=me(),m=mode(),cap=capCut(),sh=S.shield.self||0;
  $("#chip").className="chip role-"+k.role;$("#chipTxt").textContent=k.n;
  $("#modeSw").hidden=k.role!=="B";
  document.querySelectorAll("#modeSw button").forEach(b=>b.classList.toggle("on",b.dataset.mode===m));
  // One card per job the city actually has. A "both" city sees both and the live one is outlined.
  $("#mCut").hidden=k.role==="R";
  $("#mDef").hidden=k.role==="E";
  $("#mCut").classList.toggle("active",k.role==="B"&&m==="cut");
  $("#mDef").classList.toggle("active",k.role==="B"&&m==="def");
  $("#tons").textContent=Math.round(S.tons)+" t";
  $("#tonsBar").style.width=(100-100*S.tons/cap)+"%";
  $("#shieldPct").textContent=sh+"%";
  $("#defLbl").textContent=sh>=SELF_MAX?`Your shield · yours stops at ${SELF_MAX}%`:"Your shield";
  $("#shieldBar").style.width=sh+"%";
  $("#coins").textContent=Math.floor(S.coins);
  $("#streak").textContent=S.streak>1?`${S.streak}-day streak`:"";
  const host=$(m==="def"?"#mDef":"#mCut");
  if($("#streak").parentNode!==host)host.appendChild($("#streak"));
  // Smog is absolute, not a fraction of the city's own day: a fishing town at 60 t must not
  // open under the same brown sky as a refinery city at 900 t.
  // Same absolute scale as before -- a fishing town must never open under a refinery sky --
  // but what is left of it now depends on who is supposed to be cutting. An emission city
  // clears its own; a coastal city clears its own by paying for someone else's.
  const left=k.role==="R"?1-Math.min(1,(S.techToday||0)/SKY_FUND):S.tons/cap;
  $("#smog").style.opacity=Math.max(0,left*Math.min(1,k.base/DAY_CAP)*0.95);
  $("#turbines").setAttribute("opacity",S.upg.wind?1:0);
  document.querySelectorAll(".stack").forEach((s,i)=>s.style.opacity=(S.upg.wind&&i<3)?0:1);
  // The day's defence budget, which had no place on screen at all: a defence player could
  // only find out it existed by hitting it.
  const dleft=Math.max(0,capDef()-S.def);
  $("#defLeft").textContent=dleft>0?`Today's defence: ${Math.round(dleft)} left`:"Today's defence: done";
  $("#defBar").style.width=(100*S.def/capDef())+"%";
  // 0.35 and a floor of 6, so an empty wall is a footing you can see blocks land on rather
  // than a 4px hairline under a sign telling you to raise it.
  // Anchored at 248, out in the water. The old wall sat at 232 and grew up into the dark
  // ground band, so at any useful height it read as part of the shore and the target line
  // landed on top of the buildings. Against the sea it is a breakwater and you can see it.
  const FOOT=288, RISE=0.30;
  const h=Math.max(6,Math.round(sh*RISE)), sy=FOOT-SAFE*RISE, held=sh>=SAFE;
  $("#wallBody").setAttribute("y",FOOT-h);$("#wallBody").setAttribute("height",h);
  $("#wallCap").setAttribute("y",FOOT-3-h);
  $("#wallCap").setAttribute("fill",held?"#8FE3A0":"#dbe9f1");
  // The line the whole game argues about, drawn where it actually is.
  $("#safeLine").setAttribute("y1",sy);$("#safeLine").setAttribute("y2",sy);
  $("#safeLine").setAttribute("opacity",held?.3:.95);
  $("#safeTxt").setAttribute("y",sy-5);
  $("#safeTxt").setAttribute("opacity",held?0:.95);
  $("#safeTxt").textContent=`${SAFE}% holds a wave`;
  $("#shieldWall").setAttribute("opacity",(m==="def"||held)?1:0);
  $("#hint").textContent=m==="def"
    ?(S.def>=capDef()?"Today's work is done. Now go to Support.":"Tap the shore to raise the seawall")
    :(S.tons<=0?"Clean air. Now go to Support.":"Tap the city to shut a chimney");
  $("#ledger").textContent="$"+S.ledger.toFixed(2);
}
let listSig="",worldStamp=0;
function renderLists(force){
  const k=me();
  const tab=$("nav button.on").dataset.tab;
  // This signature answers one question only: which rows should exist? Never what they say.
  // Rebuilding a list replaces the very button a finger is already down on, the browser then
  // fires the click on the parent, and the tap is gone -- every second or third press on a
  // cheap Android. Every number in these lists is written in place by syncRows() instead.
  // Ranking is the exception: it reorders, so it has to be rebuilt. It has no buttons.
  const sig=tab==="voice"?["voice",S.vote,S.notes.length].join("|")
    :tab==="city"?["city",mode()].join("|")
    :tab==="rank"?["rank",Math.round(dayScore()*10),worldStamp].join("|")
    :["support",worldStamp,k.role,(S.shield.self||0)>=SELF_MAX?1:0].join("|");
  if(force||sig!==listSig){
  listSig=sig;
  if(tab==="city"){
  $("#cityNote").textContent=mode()==="def"
    ?"Upgrades keep building while you're away. A siren and a mangrove belt work at 3 a.m. too. The haze over your city is not yours — send Tech coins to an industrial city and watch it lift."
    :"Upgrades cut emissions for you while you're away. Real cities do the same: one bus line replaces hundreds of cars every day.";
  // No numbers in here. The count and the price are written in by syncRows() afterwards, so
  // buying never has to replace the button the finger is still on.
  $("#upgrades").innerHTML=upSet().map((u,i)=>
    `<div class="row" data-up="${u.id}"><div><div class="t">${upName(u,i)} <span class="tag" data-n hidden></span></div><div class="d">${u.d}</div></div><button class="btn coin" data-cost="0" onclick="buy('${u.id}')"></button></div>`).join("");
  }
  else if(tab==="voice"){renderVoice()}
  else if(tab==="support"){
  const targets=COUNTRIES.filter(x=>x.c!==S.c&&!emgFind(x.c));
  // At the ceiling the row keeps no buttons at all. A coin button that does nothing would
  // still take the coins, and an ▶ Ad button would burn one of the ten for no reward.
  const sh=S.shield.self||0, capped=sh>=SELF_MAX;
  const selfRow=(k.role!=="E"&&!emgFind(S.c))?`<div class="row" data-self><div><div class="t">Your own shield <span class="tag R" data-v></span></div><div class="d">${capped
      ?`Your own work stops here. Only another city's relief reaches ${SAFE}%.`
      :`Seawall + early warning. Your own coins raise this to ${SELF_MAX}%; a wave holds at ${SAFE}%.`}</div></div>${capped
      ?""
      :`<div class="bg"><button class="btn" data-cost="20" onclick="give('self')">20 → +5%</button>${adBtn("self")}</div>`}</div>`:"";
  $("#supportList").innerHTML=EMG.map(emgRow).join("")+selfRow+targets.map(x=>{const isR=x.role!=="E";
    return `<div class="row" data-city="${x.c}"><div><div class="t">${x.n} <span class="tag ${x.role}">${ROLE_LABEL[x.role]}</span></div><div class="d" data-v></div></div><div class="bg"><button class="btn" data-cost="20" onclick="give('${x.c}')">${isR?"Build":"Tech"} 20</button>${adBtn(x.c)}</div></div>`}).join("");
  }
  else{
  const rows=COUNTRIES.map(x=>{const mine=x.c===S.c;return{x,score:mine?dayScore():WORLD[x.c].score,me:mine}}).sort((a,b)=>b.score-a.score);
  $("#rankList").innerHTML=rows.map((r,i)=>`<div class="rank${r.me?" me":""}"><span class="n">${i+1}</span><span>${r.x.n}<span class="tag ${r.x.role}">${ROLE_LABEL[r.x.role]}</span></span><span class="v">${r.score.toFixed(1)}</span></div>`).join("");
  }
  }
  emgDot();voiceDot();syncRows();
}
const upCost=(u,n)=>Math.round(u.cost*Math.pow(1.6,n));
// Write today's numbers into the rows that are already on screen. This is the whole point of
// the split: a price, a count, a shield percentage and an affordability state all change
// constantly, and not one of them is worth losing a tap over.
function syncRows(){
  const tab=$("nav button.on").dataset.tab;
  if(tab==="city"){
    const set=upSet();
    document.querySelectorAll("#upgrades [data-up]").forEach(r=>{
      const u=set.find(y=>y.id===r.dataset.up);if(!u)return;
      const n=S.upg[u.id]||0,tag=r.querySelector("[data-n]"),b=r.querySelector("button");
      // Emptied, not just hidden: a hidden node still contributes to textContent, and the
      // row label is read as text in a few places.
      tag.hidden=!n;tag.textContent=n?"×"+n:"";
      b.dataset.cost=upCost(u,n);b.textContent=upCost(u,n);
    });
  }else if(tab==="support"){
    document.querySelectorAll("#supportList [data-city]").forEach(r=>{
      const x=COUNTRIES.find(y=>y.c===r.dataset.city),w=WORLD[r.dataset.city];
      r.querySelector("[data-v]").textContent=x.role!=="E"?`Shield ${w.shield}%`:`Clean-up ${Math.min(100,Math.round(w.cut*3))}%`;
    });
    document.querySelectorAll("#supportList [data-emgrow]").forEach(r=>{
      const c=r.dataset.emgrow;
      r.querySelector("[data-v]").textContent=(c===S.c?(S.shield.self||0):WORLD[c].shield)+"%";
    });
    const self=$("#supportList [data-self] [data-v]");
    if(self)self.textContent=(S.shield.self||0)+"%";
  }
  affordable();
}
// Grey a button out or bring it back without replacing the node.
function affordable(){document.querySelectorAll("section.on .btn[data-cost]").forEach(b=>{b.disabled=S.coins<+b.dataset.cost});adSync()}

/* ---------- voice: the city answers for itself ---------- */
// This is not a board and must never become one. Players cannot read each other here:
// the poll is four fixed choices, and anything written goes to the team, not into the game.
// A service for under-18s with no moderator on duty cannot host a feed, and a static site
// could not carry one anyway. What comes back is the point -- the game is the means, the
// resilience these players ask for is the end.
function pollSet(){
  const k=me(),lane=k.role==="E"?"cut":"def",a=(LOCAL[S.c]||{})[lane];
  return {lane,
    q:k.role==="E"?`What should ${k.n} cut first?`:`What does ${k.n} need most?`,
    opts:(lane==="def"?UP_DEF:UP_CUT).map((u,i)=>(a&&a[i])||u.n)};
}
// Stand-in counts, seeded by the city so they hold still between visits. Labelled as a
// stand-in on screen: a made-up number presented as a real tally is the one thing that
// would not survive being asked about.
function pollCounts(){
  const r=seed(S.c+"poll"),c=[0,0,0,0].map(()=>8+Math.round(r()*84));
  if(S.vote!=null)c[S.vote]++;
  return c;
}
// Four rounded shares add up to 99 or 101 often enough that someone will notice on a slide.
// Push the rounding error onto the largest share, where one point does not change the reading.
function pollPct(c,tot){
  const p=c.map(v=>Math.round(v/tot*100)),d=100-p.reduce((a,b)=>a+b,0);
  if(d)p[p.indexOf(Math.max(...p))]+=d;
  return p;
}
function renderVoice(){
  const p=pollSet(),c=pollCounts(),tot=c.reduce((a,b)=>a+b,0),voted=S.vote!=null,pc=pollPct(c,tot);
  $("#pollQ").textContent=p.q;
  $("#pollList").innerHTML=voted
    ? p.opts.map((n,i)=>
        `<div class="poll${i===S.vote?" mine":""}"><div class="pt"><span>${n}${i===S.vote?' <span class="tag">your answer</span>':""}</span><b>${pc[i]}%</b></div><div class="pb"><i style="width:${pc[i]}%"></i></div></div>`).join("")
      +`<div class="row"><div><div class="d">You can change your answer any time.</div></div><button class="btn" onclick="vote(null)">Change</button></div>`
    : p.opts.map((n,i)=>`<div class="row"><div><div class="t">${n}</div></div><button class="btn" onclick="vote(${i})">Pick</button></div>`).join("");
  $("#pollNote").textContent=voted
    ?`${tot} answers so far. The tally is a stand-in until the server is connected; your own answer is saved on this phone.`
    :"Pick one. Nobody is asked to be right — this is what the city itself would fund first.";
  // The notes were write-only: you typed one, it vanished, and there was no way to tell
  // whether anything had happened to it. They live on this phone, so show them.
  const n=S.notes.length;
  $("#noteVault").hidden=!n;
  $("#noteLog").textContent=n===1?"1 note on this phone":`${n} notes on this phone`;
  $("#noteList").innerHTML=S.notes.map((x,i)=>
    `<div class="note-i"><time>${esc(x.d)}</time><p>${esc(x.t)}</p><button onclick="delNote(${i})" aria-label="delete">×</button></div>`).join("");
}
// Their own text goes back into the page as HTML. It is their own phone and their own
// sentence, but a stray < still breaks the list, so it is escaped like anything else.
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
function delNote(i){S.notes.splice(i,1);save();renderVoice()}
// Until a form exists this is the only way a note actually reaches the team: the player
// copies it and pastes it into whatever the class already uses. Good enough for a two-week
// school test, and it needs no server and no account.
function copyNotes(){
  const t=S.notes.map(x=>`${x.d} ${x.c}: ${x.t}`).join("\n");
  if(!t)return;
  const ok=()=>toast("Copied. Paste it wherever the class is collecting these."),
        hand=()=>{
          const a=document.createElement("textarea");
          a.value=t;a.style.cssText="position:fixed;top:0;opacity:0";
          document.body.appendChild(a);a.select();
          let done=false;try{done=document.execCommand("copy")}catch(e){}
          a.remove();done?ok():toast("Copy did not work on this browser. Read them out instead.");
        };
  try{navigator.clipboard.writeText(t).then(ok,hand)}catch(e){hand()}
}
function vote(i){S.vote=i;save();renderVoice();voiceDot();
  if(i!=null)toast("Answer saved. It is counted for your city, never shown with anything about you.")}
// Stand-in, same shape as watchAd(): connecting the real form later changes this one function.
function sendNote(){
  const b=$("#noteBox"),t=b.value.trim();
  if(t.length<4){toast("Write a line first.");return}
  S.notes.push({d:today(),c:S.c,t:t.slice(0,300)});
  b.value="";save();renderVoice();
  toast("Saved on this phone. Nothing has been sent yet — it waits below until the team collects it.");
}
function voiceDot(){const b=$('nav button[data-tab="voice"]');if(b)b.classList.toggle("new",!!S.c&&S.vote==null)}
$("#noteSend").onclick=sendNote;
$("#noteCopy").onclick=copyNotes;

/* ---------- rewarded ads ---------- */
let AD=null;
function adBtn(c){return `<button class="btn ad" data-ad onclick="adGive('${c}')">&#9654; Ad</button>`}
function adWait(){return Math.max(0,Math.ceil((S.adAt+AD_GAP_MS-Date.now())/1000))}
// Same rule as the cooldown clock: sync in place, never rebuild the list for it.
function adSync(){
  const left=AD_DAY-S.ads,w=adWait(),ok=left>0&&w===0;
  document.querySelectorAll("section.on [data-ad]").forEach(b=>{b.disabled=!ok});
  const n=$("#adNote");if(!n||!S.c)return;
  n.textContent="No coins? ▶ Ad sends 20 for free. The ad money goes to that city. "+
    (left<=0?"No ads left today.":w?`Next ad in ${w} s. ${left} left today.`:`${left} left today.`);
}
function adGive(c){
  const key=c==="self"?S.c:c,x=COUNTRIES.find(y=>y.c===key);
  watchAd(`Reward: 20 coins of relief for ${c==="self"?"your own shield":x.n}${emgFind(key)?", counted double":""}.`,()=>give(c,true));
}
function watchAd(label,reward,urgent){
  if(AD)return;
  if(S.ads>=AD_DAY){toast("That's all the ads for today. Coins still work.");return}
  if(!urgent&&adWait()){toast(`Next ad in ${adWait()} s.`);return}
  // An ad counts when it is shown, not when it is finished. That is what the caps are about.
  S.ads++;S.adAt=Date.now();save();
  AD={until:Date.now()+AD_SEC*1000,reward,iv:setInterval(adClock,250)};
  $("#adFor").textContent=label;$("#adLeft").textContent=`${AD_DAY-S.ads} left today`;
  $("#ad").hidden=false;adClock();
}
function adClock(){
  if(!AD)return;
  const s=Math.max(0,Math.ceil((AD.until-Date.now())/1000)),b=$("#adDone");
  b.disabled=s>0;b.textContent=s>0?`Reward in ${s} s`:"Claim reward";
}
function adClose(done){
  if(!AD)return;
  clearInterval(AD.iv);const r=AD.reward;AD=null;$("#ad").hidden=true;
  if(done){S.ledger+=AD_USD;r()}
  render();save();
}
$("#adDone").onclick=()=>{if(AD&&Date.now()>=AD.until)adClose(true)};
$("#adSkip").onclick=()=>adClose(false);

// The price is worked out here rather than passed in from the button. The button is no
// longer rebuilt on every purchase, so a baked-in price would go stale on the second buy.
function buy(id){
  const u=upSet().find(y=>y.id===id);if(!u)return;
  const n=S.upg[id]||0,cost=upCost(u,n);
  if(S.coins<cost)return;
  S.coins-=cost;S.upg[id]=n+1;
  refresh();save();
  if(id==="wind"&&S.upg.wind===1)toast("Three chimneys became turbines. The sky clears a little faster now.");
}
// free = paid by a finished ad instead of the player's coins. Everything else is the same.
function give(c,free){if(!free&&S.coins<20)return;
  if(c==="self"&&(S.shield.self||0)>=SELF_MAX){
    toast(`Your own work stops at ${SELF_MAX}%. The last stretch to ${SAFE}% only comes from another city.`);return}
  const key=c==="self"?S.c:c, dbl=!!emgFind(key), step=dbl?10:5;
  if(!free)S.coins-=20;S.given+=20;S.gaveToday=(S.gaveToday||0)+20;
  if(c==="self"){shieldUp(step,false)}
  else{const x=COUNTRIES.find(y=>y.c===c);
    if(x.role!=="E"){const was=WORLD[c].shield;WORLD[c].shield=Math.min(100,was+step);
      if(was<SAFE&&WORLD[c].shield>=SAFE)toast(`${x.n}'s shield just reached 50%. The next wave there will hold.`)}
    else{WORLD[c].cut+=dbl?4:2;
      S.techToday+=20;
      if(me().role==="R"){const pc=Math.round(100*Math.min(1,S.techToday/SKY_FUND));
        ticker(pc>=100?`${x.n} is cutting. Your sky is clear today — you did not clean it, you paid for it.`
                      :`${x.n} is cutting. Your sky clears with theirs: ${pc}% of today's smoke funded.`,"good")}}}
  if(dbl)toast("Relief doubled. It arrived while the water was still there.");
  // No worldStamp here any more: nothing about which rows exist has changed, only what they
  // say, and syncRows() says it. Crossing SELF_MAX does change the self row, and the support
  // signature carries that, so refresh() rebuilds exactly then and not otherwise.
  refresh();save()}
// localStorage writes are synchronous. One per tap stutters on a phone, so batch them
// and always flush when the browser is backgrounded or the tab is closed.
// Both guard on S.c: before the player presses Play, S is still the blank starting object.
// Opening the link and closing the tab from the gate screen must not overwrite a real save.
let saveT=null;
function save(){if(S.c&&saveT===null)saveT=setTimeout(flush,600)}
function flush(){clearTimeout(saveT);saveT=null;if(S.c){S.at=Date.now();store.set(S)}}
addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});
addEventListener("pagehide",flush);

/* ---------- fx ---------- */
function puff(x,y,label,kind){const p=document.createElement("div");p.className="puff"+(kind==="def"?" brick":"");
  p.style.left=x-9+"px";p.style.top=y-9+"px";$("#scene").appendChild(p);setTimeout(()=>p.remove(),900);
  pop(x+10,y-20,label,kind)}
function pop(x,y,label,kind){const q=document.createElement("div");q.className="pop"+(kind==="def"||kind==="up"?" "+kind:"");
  q.textContent=label;q.style.left=x+"px";q.style.top=y+"px";$("#scene").appendChild(q);setTimeout(()=>q.remove(),700)}
let tt;function toast(msg,action,label){const t=$("#toast");t.style.display="block";t.innerHTML=msg+(action?` <button class="btn coin" style="margin-top:8px;display:block" id="ta">${label}</button>`:"");
  if(action)$("#ta").onclick=()=>{action();t.style.display="none"};clearTimeout(tt);tt=setTimeout(()=>t.style.display="none",action?12000:4500)}
function fact(m){toast(m)}
function ticker(m,cls,flash){const t=$("#ticker");t.textContent=m;t.className=(cls||"")+(flash?" hit":"")}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));b.classList.add("on");document.querySelectorAll("section").forEach(s=>s.classList.toggle("on",s.id===b.dataset.tab));if(S.c)renderLists(true)});
document.querySelectorAll("#modeSw button").forEach(b=>b.onclick=()=>{
  if(!S.c||mode()===b.dataset.mode)return;
  S.mode=b.dataset.mode;render();save();
  ticker(S.mode==="def"?"Defence mode. Taps raise your seawall.":"Cut mode. Taps shut chimneys.");
});
document.querySelectorAll(".rotor").forEach((r,i)=>{r.style.transformOrigin="0 0";r.animate([{transform:"rotate(0deg)"},{transform:"rotate(360deg)"}],{duration:2500+i*400,iterations:Infinity})});
