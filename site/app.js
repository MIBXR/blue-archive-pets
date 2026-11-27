import { PetPlayer, loadInstallMetadata, createInstallInstruction } from './pet-runtime.js';
import { ui, students, tracks, directions } from './copy-data.js';

const site = './';
const art = './assets/official/';
const audioRoot = './assets/audio/';
const repo = 'https://github.com/MIBXR/blue-archive-pets';
const editions = {
  hibiki: { index: '01', art: 'hibiki-cheer', version: 'v1.1', slug: 'hibiki-cheerleader-fullbody-handdrawn', defaultTrack: 'la-la-run-inst.mp3' },
  toki: { index: '02', art: 'toki-bunny', version: 'v1.0', slug: 'toki-bunny-fullbody-handdrawn', defaultTrack: 'bunny-bunny-carrot.mp3' }
};
const actions = ['idle', 'running-right', 'running-left', 'waving', 'jumping', 'failed', 'waiting', 'running', 'review'];
const get = id => document.getElementById(id);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const stage = get('stage');
const tau = Math.PI * 2;
let pet = 'hibiki';
let player;
let stageVisible = false;
let action = 'idle';
let follow = false;
let paused = motion.matches;
let direction = 8;
let travel = 0;
let lastAngle = null;
let spinTimer = 0;
let spinStamp = 0;
let cardFound = false;
let greetIndex = 0;
let speechTimer = 0;
let reactionToken = 0;
let reacting = false;
const svgNS = 'http://www.w3.org/2000/svg';

function pathFor(parent, css, definition) {
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('class', css);
  path.setAttribute('d', definition);
  parent.append(path);
}
function pointsPath(points) {
  return points.map(([x,y],i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
}
function orbitalPoint(t, rail) {
  if (pet === 'hibiki') {
    const sine = Math.sin(t);
    const cosine = Math.cos(t);
    const x = 378 + 351 * sine + rail * (4 + 5 * sine);
    const y = 324 - 72 * sine + 76 * Math.sin(2*t + .18) + 35*cosine;
    return [x, y + rail * (7.4 + 4.3 * Math.cos(2*t-.9)) + 3 * Math.sin(3*t+rail)];
  }
  const x = (312 + 21 * rail) * Math.cos(t);
  const y = (68 + 7 * rail) * Math.sin(t);
  const tilt = -.29 + .027 * rail;
  return [420 + x*Math.cos(tilt)-y*Math.sin(tilt),326 + x*Math.sin(tilt)+y*Math.cos(tilt)];
}
function drawRibbon() {
  const front = get('ribbonFront');
  const back = get('ribbonBack');
  front.replaceChildren();
  back.replaceChildren();
  const night = pet === 'toki';
  const split = night ? 0 : -1.09;
  function band(parent, start, end, frontLayer) {
    const steps = 116;
    const line = rail => Array.from({length: steps+1}, (_,i) => orbitalPoint(start + (end-start)*i/steps, rail));
    if (!night) {
      const outer = [...line(-.74),...line(.94).reverse()];
      pathFor(parent,'ribbon-skin',pointsPath(outer)+' Z');
    }
    const rails = night ? [-2.2,-1.1,-.45,.2,1.4,2.3] : [-1.32,-.78,-.38,.04,.56,1,1.4];
    rails.forEach((rail,index) => {
      pathFor(parent,'ribbon-strand'+(index === 1 || index === rails.length-1 ? ' bright' : ''),pointsPath(line(rail)));
    });
    if (!night) {
      const ties = [];
      for (let i=1;i<42;i++) {
        const t=start+(end-start)*i/42;
        const u=t + (end>start?1:-1)*.022;
        ties.push(pointsPath([orbitalPoint(t,-.78),orbitalPoint(u,.9)]));
      }
      pathFor(parent,'ribbon-ties',ties.join(' '));
      pathFor(parent,'ribbon-ticks',pointsPath(line(-1.04)));
    } else if (!frontLayer) {
      pathFor(parent,'ribbon-ticks',pointsPath(line(2.8)));
    }
  }
  band(back,split+Math.PI,split+tau,false);
  band(front,split,split+Math.PI,true);
}
const spiral = Array.from({length: 260}, (_,i) => {
  const t=i/259;
  const angle=t*tau*3.7;
  return [31+Math.cos(angle)*t*28,32+Math.sin(angle)*t*25];
});
get('polarOrbit').setAttribute('d',pointsPath(spiral));
let waveFrame = 0;
let waveLast = 0;
function wave(time) {
  if (time - waveLast > 67 || !waveLast) {
    const points = Array.from({length:105}, (_,i) => {
      const x = i/104;
      const amp = 3.5+19*Math.exp(-((x-.41)**2)/.043);
      return [112*x,30.5 + amp*Math.sin(x*27-time*.0025)*Math.cos(x*4.8-.35)];
    });
    get('waveform').setAttribute('d',pointsPath(points));
    waveLast=time;
  }
  if (pet==='toki' && stageVisible && !paused && !document.hidden) waveFrame=requestAnimationFrame(wave);
}
function refreshWave() {
  cancelAnimationFrame(waveFrame);
  waveLast=0;
  if(pet==='toki') wave(performance.now());
}
function syncStageMotion() {
  player?.setPaused(paused || document.hidden || !stageVisible);
  refreshWave();
}
new IntersectionObserver(([entry]) => {
  stageVisible = entry.isIntersecting;
  if (!stageVisible) stopSpin();
  syncStageMotion();
}).observe(stage);
document.addEventListener('visibilitychange', syncStageMotion);

const trackPicker = get('trackPicker');
const trackPopover = get('trackPopover');
const trackList = get('trackList');
let selectedTrack = editions.hibiki.defaultTrack;
const audio = new Map();
for (const [index, track] of tracks.entries()) {
  const item = get('trackOption').content.firstElementChild.cloneNode(true);
  item.dataset.track = track.file;
  item.querySelector('.track-index').textContent = String(index + 1).padStart(2, '0');
  item.querySelector('.track-name').textContent = track.title;
  if (track.option) {
    const tag = item.querySelector('.track-tag');
    tag.textContent = track.option.slice(track.title.length).replace(/^\s*·\s*/, '');
    tag.hidden = false;
  }
  trackList.append(item);
  const channel = new Audio();
  channel.preload = 'auto';
  channel.loop = true;
  channel.volume = 0;
  channel.src = audioRoot + track.file;
  audio.set(track.file, channel);
}
let musicOn = false;
let audioRun = 0;
let audioFrame = 0;
function updateMusicLabel() {
  const index = tracks.findIndex(item => item.file === selectedTrack);
  const track = tracks[index];
  const label = (musicOn ? ui.pauseMusic : ui.playMusic) + ' · ' + track.title;
  get('music').setAttribute('aria-pressed', String(musicOn));
  get('music').setAttribute('aria-label', label);
  get('music').title = label;
  get('music').querySelector('use').setAttribute('href', musicOn ? '#i-pause' : '#i-play');
  get('trackTitle').textContent = track.title;
  get('trackCounter').textContent = String(index + 1).padStart(2, '0') + ' / ' + String(tracks.length).padStart(2, '0');
  trackPicker.title = ui.chooseTrack + ' · ' + track.title;
  trackPicker.setAttribute('aria-label', trackPicker.title);
  for (const item of trackList.children) {
    item.setAttribute('aria-selected', String(item.dataset.track === selectedTrack));
  }
}
async function mixAudio() {
  const run = ++audioRun;
  cancelAnimationFrame(audioFrame);
  updateMusicLabel();
  const target = musicOn ? audio.get(selectedTrack) : null;
  if (target) {
    try { await target.play(); }
    catch {
      if (run === audioRun) { musicOn = false; mixAudio(); }
      return;
    }
  }
  if (run !== audioRun) return;
  const levels = [...audio.values()].filter(channel => !channel.paused || channel === target)
    .map(channel => [channel, channel.volume]);
  if (!levels.length) return;
  const start = performance.now();
  function fade(now) {
    let fading = false;
    for (const [channel, from] of levels) {
      const progress = Math.min(1, (now - start) / (channel === target ? 600 : 300));
      const t = progress * progress * (3 - 2 * progress);
      fading ||= progress < 1;
      channel.volume = from + ((channel === target ? .34 : 0) - from) * t;
      if (progress === 1 && channel !== target) channel.pause();
    }
    if (fading) audioFrame = requestAnimationFrame(fade);
  }
  audioFrame = requestAnimationFrame(fade);
}
get('music').addEventListener('click', () => { musicOn = !musicOn; mixAudio(); });
function setTrackMenu(open, restoreFocus = false) {
  trackPicker.setAttribute('aria-expanded', String(open));
  if (restoreFocus) trackPicker.focus({ preventScroll: true });
  trackPopover.inert = !open;
  if (open) trackList.querySelector('[aria-selected="true"]').focus({ preventScroll: true });
}
trackPicker.addEventListener('click', () => setTrackMenu(trackPopover.inert));
trackPicker.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setTrackMenu(true);
  }
});
trackList.addEventListener('click', event => {
  const item = event.target.closest('[data-track]');
  if (!item) return;
  selectedTrack = item.dataset.track;
  setTrackMenu(false, true);
  mixAudio();
});
trackList.addEventListener('keydown', event => {
  const items = [...trackList.children];
  const index = items.indexOf(document.activeElement);
  let next;
  switch (event.key) {
    case 'Tab': setTrackMenu(false, true); return;
    case 'ArrowDown': next = (index + 1) % items.length; break;
    case 'ArrowUp': next = (index + items.length - 1) % items.length; break;
    case 'Home': next = 0; break;
    case 'End': next = items.length - 1; break;
    default: return;
  }
  event.preventDefault();
  items[next].focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !trackPopover.inert) {
    event.preventDefault();
    setTrackMenu(false, true);
  }
});
document.addEventListener('pointerdown', event => {
  if (!trackPopover.inert && !trackPopover.contains(event.target) && !trackPicker.contains(event.target)) setTrackMenu(false);
});
trackPopover.addEventListener('focusout', event => {
  if (event.relatedTarget && !trackPopover.contains(event.relatedTarget) && event.relatedTarget !== trackPicker) setTrackMenu(false);
});
trackPicker.addEventListener('focusout', event => {
  if (!trackPopover.inert && event.relatedTarget && !trackPopover.contains(event.relatedTarget)) setTrackMenu(false);
});

function renderActions() {
  const list=get('actions');
  list.replaceChildren();
  actions.forEach((state,i)=>{
    const button=document.createElement('button');
    button.className='action';
    button.dataset.state=state;
    button.title=students[pet].actions[i][1];
    button.setAttribute('aria-pressed',String(!follow && action===state));
    const index=document.createElement('span');
    index.className='action-no';
    index.setAttribute('aria-hidden','true');
    index.textContent=String(i+1).padStart(2,'0');
    button.append(index,document.createTextNode(students[pet].actions[i][0]));
    list.append(button);
  });
}
function syncControls() {
  document.querySelectorAll('.action').forEach(b=>b.setAttribute('aria-pressed',String(!follow && b.dataset.state===action)));
  get('follow').setAttribute('aria-pressed',String(follow));
  get('actionCount').textContent=follow ? String(direction+1).padStart(2,'0')+' / 16' : String(actions.indexOf(action)+1).padStart(2,'0')+' / 09';
  const swept=Math.min(360,Math.round(Math.abs(travel)*360/tau));
  const orientation=pet==='toki' ? directions[direction]+' · '+swept+' / 360°' : directions[direction]+' · '+direction*22.5+'°';
  get('directionNote').textContent=follow ? orientation : '';
  get('petCanvas').setAttribute('aria-label',students[pet].short+' · '+(follow ? directions[direction] : students[pet].actions[actions.indexOf(action)][0]));
  get('pause').setAttribute('aria-pressed',String(paused));
  get('pause').setAttribute('aria-label',paused ? ui.playPet : ui.pausePet);
  get('pause').title=get('pause').getAttribute('aria-label');
  get('pause').querySelector('use').setAttribute('href',paused?'#i-play':'#i-pause');
  syncCharacterHud();
}
function stopSpin() {
  clearTimeout(spinTimer);
  spinTimer=0;
  spinStamp++;
  get('spin').disabled=false;
}
function clearReaction() {
  reactionToken++;
  reacting=false;
  clearTimeout(speechTimer);
  get('speech').hidden=true;
}
function setAction(next) {
  stopSpin();
  clearReaction();
  action=next;
  follow=false;
  lastAngle=null;
  travel=0;
  player.setState(next);
  syncControls();
}
get('actions').addEventListener('click',e=>{
  const button=e.target.closest('[data-state]');
  if(button) setAction(button.dataset.state);
});
function turn(index) {
  direction=(index+16)%16;
  player.setDirection(direction);
  syncControls();
}
function setFollow(on) {
  stopSpin();
  clearReaction();
  follow=on;
  lastAngle=null;
  travel=0;
  if(on) {
    player.prepareDirections().catch(()=>{});
    turn(8);
  } else {
    player.setState(action);
    syncControls();
  }
}
get('follow').addEventListener('click',()=>setFollow(!follow));
get('pause').addEventListener('click',()=>{
  stopSpin();
  clearReaction();
  paused=!paused;
  syncStageMotion();
  syncPreviewMotion();
  if(follow) turn(direction); else player.setState(action);
  syncControls();
});
function showCard(reopen = false) {
  if (pet !== 'toki') return;
  if (cardFound && !reopen) return;
  cardFound = true;
  syncCharacterHud();
  setTrackMenu(false);
  if (!get('callingCard').open) get('callingCard').showModal();
}
get('spin').addEventListener('click',async()=>{
  if(!follow) setFollow(true);
  clearReaction();
  const token=++spinStamp;
  get('spin').disabled=true;
  await player.prepareDirections();
  if(token!==spinStamp || pet!=='toki') return;
  const start=direction;
  travel=0;
  let step=0;
  function tick() {
    if(token!==spinStamp) return;
    step++;
    travel=step*tau/16;
    turn(start+step);
    if(step<16) spinTimer=setTimeout(tick,motion.matches ? 100 : 77);
    else { stopSpin(); lastAngle=null; syncControls(); showCard(); }
  }
  spinTimer=setTimeout(tick,65);
});
function handlePointer(e) {
  const rect=stage.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width-.5;
  const y=(e.clientY-rect.top)/rect.height-.5;
  if(!motion.matches && e.pointerType!=='touch') {
    stage.style.setProperty('--px',(x*9).toFixed(2)+'px');
    stage.style.setProperty('--py',(y*7).toFixed(2)+'px');
  }
  if(!follow || spinTimer || reacting) return;
  const petRect=get('petTouch').getBoundingClientRect();
  const dx=e.clientX-petRect.left-petRect.width/2;
  const dy=e.clientY-petRect.top-petRect.height/2;
  if(Math.hypot(dx,dy)<10) return;
  const angle=Math.atan2(dx,-dy);
  const next=(Math.round(angle/tau*16)+16)%16;
  if(pet==='toki' && lastAngle!==null && !cardFound) {
    let delta=angle-lastAngle;
    if(delta>Math.PI) delta-=tau;
    if(delta< -Math.PI) delta+=tau;
    travel+=delta;
    if(Math.abs(travel)>=tau-.04) showCard();
  }
  lastAngle=angle;
  if(next!==direction) turn(next);
  else if(pet==='toki' && !cardFound) syncControls();
}
stage.addEventListener('pointermove',handlePointer);
stage.addEventListener('pointerdown',handlePointer);
stage.addEventListener('pointerleave',()=>{
  stage.style.setProperty('--px','0px');
  stage.style.setProperty('--py','0px');
  lastAngle=null;
});
stage.addEventListener('keydown',e=>{
  if(!follow || !['ArrowLeft','ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  stopSpin();
  clearReaction();
  const step=e.key==='ArrowLeft' ? -1 : 1;
  travel+=step*tau/16;
  turn(direction+step);
  if(pet==='toki' && Math.abs(travel)>=tau-.04) showCard();
});
function react(state, words) {
  stopSpin();
  clearReaction();
  const token=reactionToken;
  reacting=true;
  const speech=get('speech');
  speech.textContent=words;
  speech.hidden=false;
  player.respond(state).then(()=>{
    if(token===reactionToken) reacting=false;
  });
  speechTimer=setTimeout(()=>{
    if(token!==reactionToken) return;
    speech.hidden=true;
    if(reacting && paused) {
      if(follow) player.setDirection(direction); else player.setState(action);
      reacting=false;
    }
  },2200);
}
function greet() {
  const student=students[pet];
  react('waving',student.greet[greetIndex++%student.greet.length]);
}
get('petTouch').addEventListener('click',greet);
get('greet').addEventListener('click',greet);

function bindCopy(root = document) {
  root.querySelectorAll('[data-copy]').forEach(el => { el.textContent = ui[el.dataset.copy]; });
  root.querySelectorAll('[data-aria]').forEach(el => el.setAttribute('aria-label', ui[el.dataset.aria]));
  root.querySelectorAll('[data-alt]').forEach(el => { el.alt = ui[el.dataset.alt]; });
}

const previews = new Map();
const visible = new Set();
const previewObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (isIntersecting) visible.add(target); else visible.delete(target);
    if (isIntersecting && !previews.has(target)) preview(target, target.closest('[data-package]').dataset.package);
    else previews.get(target)?.setPaused(paused || document.hidden || !isIntersecting);
  }
});
function preview(id, key) {
  const canvas = typeof id === 'string' ? get(id) : id;
  previews.get(canvas)?.destroy();
  const instance = new PetPlayer(canvas, { pet: key, paused: paused || document.hidden || !visible.has(canvas) });
  previews.set(canvas, instance);
  previewObserver.observe(canvas);
  return instance;
}
function syncPreviewMotion() {
  for (const [canvas, instance] of previews) instance.setPaused(paused || document.hidden || !visible.has(canvas));
  stopSignatureSpin();
}
document.addEventListener('visibilitychange', syncPreviewMotion);
motion.addEventListener('change', () => {
  paused = motion.matches;
  stopSpin();
  syncStageMotion();
  syncPreviewMotion();
  syncControls();
});

let signaturePlayer;
let signatureDirection = 8;
let signatureTimer = 0;
let signatureRun = 0;
function stopSignatureSpin() {
  signatureRun++;
  clearTimeout(signatureTimer);
  signatureTimer = 0;
  get('signaturePlay').disabled = paused || document.hidden;
}
function turnSignature(step) {
  signatureDirection = (signatureDirection + step) % 16;
  signaturePlayer.setDirection(signatureDirection);
  get('movementCode').textContent = String(signatureDirection + 1).padStart(2, '0') + ' / 16';
  get('signaturePet').setAttribute('aria-label', students.toki.signatureAlt + ' · ' + directions[signatureDirection]);
}
get('signatureNext').addEventListener('click', () => { stopSignatureSpin(); turnSignature(1); });
get('redlineToggle')?.addEventListener('click', () => {
  const chapter = get('journal');
  const btn = get('redlineToggle');
  if (!chapter || !btn) return;
  const on = chapter.classList.toggle('has-redline');
  btn.setAttribute('aria-pressed', String(on));
});
get('signaturePlay').addEventListener('click', async () => {
  if (pet === 'hibiki') {
    signaturePlayer.respond('running');
    return;
  }
  stopSignatureSpin();
  const run = signatureRun;
  get('signaturePlay').disabled = true;
  try {
    await signaturePlayer.prepareDirections();
    if (run !== signatureRun) return;
    let steps = 0;
    function tick() {
      if (run !== signatureRun) return;
      turnSignature(1);
      if (++steps < 16) signatureTimer = setTimeout(tick, 105);
      else stopSignatureSpin();
    }
    tick();
  } finally {
    if (run === signatureRun && !signatureTimer) get('signaturePlay').disabled = false;
  }
});

const BOND_POSTSCRIPTS = {
  hibiki: {
    title: '猫冢响的隐藏附言',
    text: '……对了，老师。刚才其实偷偷在花球里缝了一枚微型星形扣，只要你把桌宠领回桌面，每次举手加油的时候都会朝着你这边转哦。',
    action: 'jumping',
  },
  toki: {
    title: '飞鸟马时的机密附言',
    text: '补充一条未写入正式行动报告的私密备注：若老师今晚愿意将我留在桌面常驻，护卫优先级将自动上调至最高级。……这是 C&C 的机密，Peace，peace。',
    action: 'waving',
  },
};

function freshChat(key) {
  return { log: [], turn: 0, bond: 0, postscriptOpened: false, pending: students[key].chat.opening };
}
const chats = { hibiki: freshChat('hibiki'), toki: freshChat('toki') };
let chatPlayer;
let chatTimer = 0;
let chatVisible = false;
let chatReaction = 0;
let bondPulseTimer = 0;

function emitBondHearts(burst = false) {
  if (motion.matches) return;
  const host = get('bondSparks');
  if (!host) return;
  const offsets = burst ? ['-34px', '0px', '32px', '-16px', '18px'] : ['-18px', '16px'];
  offsets.forEach((bx, i) => {
    const el = document.createElement('span');
    el.className = 'bond-float';
    el.textContent = '♥';
    el.style.setProperty('--bx', bx);
    el.style.animationDelay = `${i * 75}ms`;
    host.append(el);
    setTimeout(() => el.remove(), 1100);
  });
}

function renderBondMeter(pulse = false) {
  const meter = get('bondMeter');
  const label = get('bondLabel');
  const ticks = get('bondTicks');
  if (!meter || !label || !ticks) return;
  const bond = Math.min(3, chats[pet].bond || 0);
  const isMax = bond >= 3;
  meter.classList.toggle('is-max', isMax);
  label.textContent = isMax ? '羁绊 MAX' : `羁绊 ${bond} / 3`;
  [...ticks.children].forEach((node, idx) => node.classList.toggle('is-filled', idx < bond));
  if (pulse) {
    clearTimeout(bondPulseTimer);
    meter.classList.remove('is-pulse');
    void meter.offsetWidth;
    meter.classList.add('is-pulse');
    bondPulseTimer = setTimeout(() => meter.classList.remove('is-pulse'), 420);
  }
}

function appendPostscriptCard() {
  const host = get('messages');
  if (!host || host.querySelector('.bond-unlock-card')) return;
  const ps = BOND_POSTSCRIPTS[pet];
  if (!ps) return;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'bond-unlock-card';
  card.id = 'bondUnlockCard';
  card.innerHTML = `<span class="bond-unlock-meta"><small><svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg>BOND RANK MAX</small><strong>${ps.title}已解锁</strong></span><span class="bond-unlock-cta"><span>拆开附言<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></span></span>`;
  card.addEventListener('click', () => {
    const chat = chats[pet];
    if (chat.postscriptOpened || chat.pending) return;
    chat.postscriptOpened = true;
    card.remove();
    chat.pending = { text: ps.text, action: ps.action, isPostscript: true };
    showTyping();
  });
  host.append(card);
  host.scrollTop = host.scrollHeight;
}

function reactToMessage(state) {
  const run = ++chatReaction;
  const label = students[pet].actions[actions.indexOf(state)][0];
  get('channelAction').textContent = label;
  get('chatPet').setAttribute('aria-label', students[pet].name + ' · ' + label);
  chatPlayer.respond(state).then(() => {
    if (run !== chatReaction) return;
    get('channelAction').textContent = students[pet].actions[0][0];
    get('chatPet').setAttribute('aria-label', students[pet].name + ' · ' + students[pet].actions[0][0]);
  });
}
function appendMessage(text, sent, isPostscript = false) {
  if (isPostscript) {
    const box = document.createElement('div');
    box.className = 'message postscript';
    const ps = BOND_POSTSCRIPTS[pet];
    box.innerHTML = `<span class="ps-tag"><svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg>${ps ? ps.title : '隐藏附言'}</span><p></p>`;
    box.querySelector('p').textContent = text;
    get('messages').append(box);
    get('messages').scrollTop = get('messages').scrollHeight;
    return;
  }
  const bubble = document.createElement('p');
  bubble.className = sent ? 'message sent' : 'message';
  bubble.textContent = text;
  get('messages').append(bubble);
  get('messages').scrollTop = get('messages').scrollHeight;
}
function renderChoices() {
  const chat = chats[pet];
  const choices = get('choices');
  choices.replaceChildren();
  const turn = students[pet].chat.turns[chat.turn];
  get('replay').hidden = Boolean(chat.pending || turn);
  if (chat.pending || !turn) {
    if (!chat.pending && !turn && chat.bond >= 3 && !chat.postscriptOpened) appendPostscriptCard();
    return;
  }
  for (const line of turn) {
    const button = get('chatReply').content.firstElementChild.cloneNode(true);
    button.querySelector('span').textContent = line.teacher;
    button.addEventListener('click', () => {
      chat.log.push({ text: line.teacher, sent: true });
      appendMessage(line.teacher, true);
      reactToMessage('waiting');
      chat.turn++;
      chat.pending = { ...line, bumpBond: true };
      showTyping();
    });
    choices.append(button);
  }
}
function deliverReply() {
  if (!chatVisible || chatTimer || !chats[pet].pending) return;
  const chat = chats[pet];
  chatTimer = setTimeout(() => {
    chatTimer = 0;
    const line = chat.pending;
    get('messages').querySelector('.typing')?.remove();
    chat.pending = null;
    chat.log.push({ text: line.text, sent: false, isPostscript: !!line.isPostscript });
    appendMessage(line.text, false, !!line.isPostscript);
    if (line.bumpBond) {
      chat.bond = Math.min(3, (chat.bond || 0) + 1);
      renderBondMeter(true);
      emitBondHearts(chat.bond >= 3);
    } else if (line.isPostscript) {
      emitBondHearts(true);
    }
    reactToMessage(line.action);
    renderChoices();
    get('messages').scrollTop = get('messages').scrollHeight;
  }, 560);
}
function showTyping() {
  const bubble = document.createElement('p');
  bubble.className = 'message typing';
  bubble.setAttribute('aria-label', students[pet].name + ui.typing);
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('i');
    dot.setAttribute('aria-hidden', 'true');
    bubble.append(dot);
  }
  get('messages').append(bubble);
  renderChoices();
  get('messages').scrollTop = get('messages').scrollHeight;
  deliverReply();
}
function renderChat() {
  clearTimeout(chatTimer);
  chatTimer = 0;
  ++chatReaction;
  chatPlayer = preview('chatPet', pet);
  get('channelAction').textContent = students[pet].actions[0][0];
  get('chatPet').setAttribute('aria-label', students[pet].name + ' · ' + students[pet].actions[0][0]);
  get('chatAvatar').src = art + editions[pet].art + '-icon.webp';
  get('messages').replaceChildren();
  renderBondMeter(false);
  for (const item of chats[pet].log) appendMessage(item.text, item.sent, !!item.isPostscript);
  if (chats[pet].pending) showTyping(); else renderChoices();
}
new IntersectionObserver(([entry]) => {
  chatVisible = entry.isIntersecting;
  if (chatVisible) deliverReply();
  else { clearTimeout(chatTimer); chatTimer = 0; }
}).observe(get('chat'));
get('replay').addEventListener('click', () => {
  chats[pet] = freshChat(pet);
  renderChat();
});

const baseUrl = new URL(site, location.href).href;
const zipFor = key => site + 'downloads/' + editions[key].slug + '-portable.zip';
const pageInstall = get('pageInstall');
const quickInstall = get('download');
let manifest;
let metadataFailed = false;
const cards = new Map();
let dockPetPlayer = null;
let dockPetKey = null;
function syncAgentDock(key, fromDrop = false) {
  const dock = get('agentDropDock');
  const title = get('dockTitle');
  const hint = get('dockHint');
  const badge = get('dockBadge');
  const canvas = get('dockPetCanvas');
  if (!dock || !canvas) return;
  const student = students[key];
  const edition = editions[key];
  if (title) title.textContent = `当前目标 · ${student.name} ${edition.version}`;
  if (hint) {
    hint.textContent = fromDrop
      ? `已拖入载入「${student.name}」，点击下方按钮即可复制指令`
      : '可直接把左侧小桌宠拖进此区，或点上方按钮切换';
  }
  if (badge) badge.textContent = fromDrop ? 'LOADED' : 'DRAG IN';
  dock.classList.toggle('is-dropped', fromDrop);

  if (dockPetKey !== key || !dockPetPlayer) {
    dockPetKey = key;
    dockPetPlayer = preview(canvas, key);
  }
  if (fromDrop) {
    dock.classList.remove('is-landed');
    void dock.offsetWidth;
    dock.classList.add('is-landed');
    dockPetPlayer?.respond(key === 'hibiki' ? 'jumping' : 'waving').catch?.(() => {});
    const copyBtn = pageInstall.querySelector('.copy-instruction');
    if (copyBtn) {
      copyBtn.classList.remove('is-drop-pulse');
      void copyBtn.offsetWidth;
      copyBtn.classList.add('is-drop-pulse');
    }
  }
}

function setupPackageDrag(card, key) {
  const avatar = card.querySelector('.package-avatar');
  if (!avatar) return;
  let dragging = false;
  let started = false;
  let startX = 0;
  let startY = 0;
  let ghost = null;
  let activePointer = null;

  function isOverDropZone(x, y) {
    const r = pageInstall.getBoundingClientRect();
    return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12;
  }

  function startGhost(x, y) {
    started = true;
    avatar.classList.add('is-drag-source');
    pageInstall.classList.add('is-drop-armed');
    const srcCanvas = avatar.querySelector('canvas');
    ghost = document.createElement('div');
    ghost.className = 'pet-drag-ghost';
    const gCanvas = document.createElement('canvas');
    gCanvas.width = srcCanvas.width;
    gCanvas.height = srcCanvas.height;
    gCanvas.getContext('2d')?.drawImage(srcCanvas, 0, 0);
    ghost.append(gCanvas);
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    document.body.append(ghost);
    const hint = get('dockHint');
    if (hint) hint.textContent = `松手即可载入「${students[key].name}」`;
  }

  function cleanup(dropped) {
    dragging = false;
    activePointer = null;
    avatar.classList.remove('is-drag-source');
    pageInstall.classList.remove('is-drop-armed', 'is-drop-hover');
    ghost?.remove();
    ghost = null;
    if (!dropped && started) {
      syncAgentDock(pageInstall.dataset.installTarget || pet, false);
    }
    started = false;
  }

  function onMove(event) {
    if (!dragging || event.pointerId !== activePointer) return;
    const dist = Math.hypot(event.clientX - startX, event.clientY - startY);
    if (!started) {
      if (dist < 6) return;
      startGhost(event.clientX, event.clientY);
    }
    if (ghost) {
      ghost.style.left = event.clientX + 'px';
      ghost.style.top = event.clientY + 'px';
    }
    pageInstall.classList.toggle('is-drop-hover', isOverDropZone(event.clientX, event.clientY));
  }

  function finish(event) {
    if (!dragging || event.pointerId !== activePointer) return;
    const over = started && isOverDropZone(event.clientX, event.clientY);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', onCancel);
    cleanup(over);
    if (over) {
      pageInstall.dataset.installTarget = key;
      renderInstaller(pageInstall);
      syncAgentDock(key, true);
    }
  }

  function onCancel() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', onCancel);
    cleanup(false);
  }

  avatar.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    dragging = true;
    started = false;
    activePointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', onCancel);
  });
}

function makePackages() {
  for (const [key, student] of Object.entries(students)) {
    const fragment = get('packageRow').content.cloneNode(true);
    bindCopy(fragment);
    const card = fragment.querySelector('article');
    const canvas = card.querySelector('canvas');
    card.dataset.package = key;
    card.querySelector('h3').textContent = student.name + ' · ' + student.outfit;
    card.querySelector('.version').textContent = editions[key].version;
    card.querySelector('.edition-note').textContent = student.editionNote;
    card.querySelector('.zip-link').href = zipFor(key);
    canvas.setAttribute('aria-label', student.downloadAlt);
    get('packages').append(fragment);
    previewObserver.observe(canvas);
    setupPackageDrag(card, key);
    cards.set(key, card);
  }
}
function renderInstaller(panel) {
  const key = panel.dataset.installTarget;
  const text = manifest ? createInstallInstruction(manifest, key, {
    activate: panel.querySelector('input').checked, baseUrl
  }) : '';
  panel.querySelector('pre').textContent = text;
  const copyButton = panel.querySelector('.copy-instruction');
  copyButton.disabled = !text;
  copyButton.classList.remove('copied');
  panel.querySelector('[data-copy-label]').textContent = ui.copy;
  panel.querySelector('.feedback').textContent = metadataFailed ? ui.installError : '';
  panel.querySelectorAll('[data-install-pet]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.installPet === key));
  });
  if (panel === pageInstall) syncAgentDock(key, false);
  if (panel === quickInstall) {
    const edition = editions[key];
    const student = students[key];
    const entry = manifest?.pets[key];
    const filename = entry?.package_file ?? edition.slug + '-portable.zip';
    get('downloadFolio').textContent = 'FILE ' + edition.index + ' // DOWNLOAD';
    get('downloadIndex').textContent = edition.index;
    get('downloadRoman').textContent = student.roman;
    get('downloadTitle').textContent = student.name;
    get('downloadEdition').textContent = student.outfit;
    get('downloadVersion').textContent = edition.version;
    get('downloadAvatar').src = art + edition.art + '-portrait.webp';
    get('downloadFilename').textContent = filename;
    get('zip').href = site + 'downloads/' + filename;
    const digest = get('downloadDigest');
    digest.hidden = !entry;
    if (entry) digest.querySelector('code').textContent = entry.package_sha256;
  }
}
function showDigest(element, value) {
  element.textContent = ui.sha + ' · ' + value;
  element.title = ui.sha + ' ' + value;
}
function bindInstaller(panel) {
  const fragment = get('installerControls').content.cloneNode(true);
  bindCopy(fragment);
  panel.querySelector('[data-installer]').append(fragment);
  const button = panel.querySelector('.copy-instruction');
  const area = panel.querySelector('pre');
  const activate = panel.querySelector('input');
  activate.id = panel === pageInstall ? 'activate' : 'quickActivate';
  activate.addEventListener('change', () => renderInstaller(panel));
  panel.dataset.installTarget = pet;
  panel.querySelectorAll('[data-install-pet]').forEach(target => {
    target.querySelector('span').textContent = students[target.dataset.installPet].name;
    target.addEventListener('click', () => {
      panel.dataset.installTarget = target.dataset.installPet;
      renderInstaller(panel);
    });
  });
  button.addEventListener('click', async () => {
    const text = area.textContent;
    try {
      await navigator.clipboard.writeText(text);
      if (text !== area.textContent) return;
      button.classList.add('copied');
      button.querySelector('[data-copy-label]').textContent = ui.copied;
      panel.querySelector('.feedback').textContent = '';
    } catch {
      if (text !== area.textContent) return;
      panel.querySelector('details').open = true;
      area.focus();
      const range = document.createRange();
      range.selectNodeContents(area);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      panel.querySelector('.feedback').textContent = ui.copyManual;
    }
  });
}
async function loadDownloads() {
  try {
    manifest = await loadInstallMetadata({ baseUrl });
    for (const [key, card] of cards) {
      const entry = manifest.pets[key];
      card.querySelector('.zip-link').href = site + 'downloads/' + entry.package_file;
      const release = card.querySelector('.release-link');
      const releaseUrl = new URL(entry.release_url);
      releaseUrl.pathname = releaseUrl.pathname.slice(0, releaseUrl.pathname.lastIndexOf('/')).replace('/releases/download/', '/releases/tag/');
      release.href = releaseUrl.href;
      release.hidden = false;
      showDigest(card.querySelector('.digest'), entry.package_sha256);
    }
  } catch {
    metadataFailed = true;
  }
  renderInstaller(pageInstall);
  renderInstaller(quickInstall);
}
document.querySelector('[data-open="download"]').addEventListener('click', () => {
  setTrackMenu(false);
  quickInstall.dataset.installTarget = pet;
  quickInstall.querySelector('details').open = false;
  renderInstaller(quickInstall);
  quickInstall.showModal();
});
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));

function switchPet(next,initial=false,suppressReveal=false) {
  if(!initial && next===pet) return;
  stopSpin();
  clearReaction();
  player?.destroy();
  pet=next;
  action='idle';
  follow=false;
  direction=8;
  travel=0;
  lastAngle=null;
  greetIndex=0;
  const student = students[pet];
  const edition = editions[pet];
  document.documentElement.dataset.mode = pet;
  document.querySelector('meta[name="theme-color"]').content = pet === 'hibiki' ? '#f5f8fc' : '#151618';
  if (!initial) {
    const url = new URL(location.href);
    url.searchParams.set('pet', pet);
    history.replaceState(null, '', url);
  }
  document.querySelectorAll('.mode').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pet === pet)));
  document.querySelectorAll('[data-student]').forEach(el => { el.textContent = student[el.dataset.student]; });
  get('version').textContent = edition.version;
  get('folioNumber').textContent = ui.file + ' ' + edition.index + ' / 02';
  get('figNo').textContent = ui.figure + ' ' + edition.index;
  get('specimenId').textContent = edition.index;
  get('journalClub').textContent = ui.academy + ' / ' + student.club;
  get('portrait').src = art + edition.art + '-portrait.webp';
  get('portrait').alt = student.portraitAlt;
  get('lobbyThumb').src = art + edition.art + '-lobby.webp';
  get('lobbyThumb').alt = student.lobbyAlt;
  get('creationLink').href = repo + '/tree/main/pets/' + edition.slug + '/creation';
  get('petTouch').setAttribute('aria-label', student.tapLabel);
  get('spin').hidden = pet !== 'toki';
  player = new PetPlayer(get('petCanvas'), { pet, paused: paused || document.hidden || !stageVisible });
  stopSignatureSpin();
  signaturePlayer = preview('signaturePet', pet);
  get('signaturePet').setAttribute('aria-label', student.signatureAlt);
  get('signatureNext').hidden = pet !== 'toki';
  get('movementCode').textContent = '06 BEATS';
  const rlSpecB = get('redlineSpecB');
  if (rlSpecB) rlSpecB.textContent = pet === 'hibiki' ? '6 BEATS · 190ms/F · 57F' : '16 DIRS · 22.5°/STEP · 105ms';
  if (pet === 'toki') {
    signatureDirection = 8;
    turnSignature(0);
  }
  renderActions();
  syncControls();
  drawRibbon();
  refreshWave();
  renderChat();
  pageInstall.dataset.installTarget = pet;
  renderInstaller(pageInstall);
  selectedTrack = edition.defaultTrack;
  mixAudio();
  const reveal = !suppressReveal && (!initial || new URLSearchParams(location.search).get('skip') !== '1');
  if (reveal && !motion.matches) {
    get('portrait').animate([{ opacity: .3, translate: '10px 0' }, { opacity: 1, translate: '0 0' }], { duration: 350, easing: 'ease-out' });
  }
}

const HIBIKI_BEAT_LABELS = ['左摆', '收拢', '右摆', '蓄力', '跃起 ★', '落地'];
let hibikiBeatIndex = -1;
let hibikiBeatTimer = 0;

bindCopy();
for (const step of ui.manualSteps) {
  const li = document.createElement('li');
  li.textContent = step;
  get('manualSteps').append(li);
}
function readPetParam() {
  const q = new URLSearchParams(location.search);
  const p = (q.get('pet') || q.get('mode') || '').toLowerCase();
  return p === 'toki' ? 'toki' : 'hibiki';
}
bindInstaller(pageInstall);
bindInstaller(quickInstall);
switchPet(readPetParam(), true);
makePackages();

let activeViewTransition = null;
function transitionPet(next) {
  if (next === pet) return;
  const root = document.documentElement;
  if (motion.matches || typeof document.startViewTransition !== 'function') {
    switchPet(next);
    return;
  }
  activeViewTransition?.skipTransition?.();
  root.dataset.wipe = next === 'toki' ? 'to-night' : 'to-day';
  root.classList.add('instant-switch');
  const vt = document.startViewTransition(() => {
    switchPet(next, false, true);
    ambientController.refresh();
    void getComputedStyle(document.body).backgroundColor;
  });
  activeViewTransition = vt;
  vt.ready.catch(() => {});
  vt.finished.catch(() => {}).finally(() => {
    if (activeViewTransition === vt) {
      activeViewTransition = null;
      root.classList.remove('instant-switch');
      delete root.dataset.wipe;
    }
  });
}

document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => transitionPet(b.dataset.pet)));
loadDownloads();

// Preload & decode all images, HD pet motion strips, and BGM tracks before entering
const decodedCache = [];
function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => { decodedCache.push(img); resolve(); };
    img.onload = () => (img.decode ? img.decode().then(done, done) : done());
    img.onerror = resolve;
    img.src = src;
  });
}

function preloadAudioChannel(channel, timeoutMs = 3500) {
  return new Promise(resolve => {
    if (channel.readyState >= 3) { resolve(); return; }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.removeEventListener('canplaythrough', finish);
      channel.removeEventListener('canplay', finish);
      channel.removeEventListener('error', finish);
      resolve();
    };
    // A gesture-gated media element can still warm the track through the HTTP cache.
    const timer = setTimeout(() => {
      fetch(channel.src).then(response => response.arrayBuffer()).then(finish, finish);
    }, timeoutMs);
    channel.addEventListener('canplaythrough', finish, { once: true });
    channel.addEventListener('canplay', finish, { once: true });
    channel.addEventListener('error', finish, { once: true });
    try { channel.load(); } catch { finish(); }
  });
}

async function preloadAllAssets(onProgress) {
  const imageUrls = new Set([
    art + 'hibiki-cheer-portrait.webp',
    art + 'toki-bunny-portrait.webp',
    art + 'hibiki-cheer-lobby.webp',
    art + 'toki-bunny-lobby.webp',
    art + 'hibiki-cheer-icon.webp',
    art + 'toki-bunny-icon.webp',
    site + 'assets/hibiki-spritesheet.png',
    site + 'assets/toki-spritesheet.png',
  ]);

  try {
    const manifestUrl = new URL(site + 'assets/motion-hd/manifest.json?v=3', location.href);
    const res = await fetch(manifestUrl.href);
    if (res.ok) {
      const manifest = await res.json();
      for (const key of ['hibiki', 'toki']) {
        const rows = manifest?.pets?.[key]?.rows || [];
        for (const r of rows) {
          if (typeof r.file === 'string') {
            const rowUrl = new URL(r.file, manifestUrl);
            rowUrl.search = manifestUrl.search;
            imageUrls.add(rowUrl.href);
          }
        }
      }
    }
  } catch {}

  const audioChannels = [...audio.values()];
  const total = imageUrls.size + audioChannels.length;
  let loaded = 0;
  const tick = () => {
    loaded += 1;
    onProgress(Math.min(1, loaded / Math.max(1, total)));
  };

  const tasks = [
    ...[...imageUrls].map(u => preloadImage(u).then(tick)),
    ...audioChannels.map(ch => preloadAudioChannel(ch, 4500).then(tick)),
  ];

  await Promise.all(tasks);
}

// Delights #4: Dual-Character Micro-Mechanic HUD (Hibiki 6-Beat Rail + Toki 360° Lock Ring)
function emitBeatSparks(peak = false) {
  if (motion.matches || pet !== 'hibiki') return;
  const host = get('petSparks');
  if (!host) return;
  const specs = peak
    ? [
        { tx: '-36px', ty: '-44px', sz: '12px', col: 'var(--signal)' },
        { tx: '38px',  ty: '-48px', sz: '13px', col: 'var(--signal)' },
        { tx: '0px',   ty: '-58px', sz: '11px', col: 'var(--orbital)' },
        { tx: '-50px', ty: '-18px', sz: '9px',  col: 'var(--orbital)' },
        { tx: '48px',  ty: '-20px', sz: '9px',  col: 'var(--signal)' },
      ]
    : [
        { tx: '-28px', ty: '-30px', sz: '8px',  col: 'var(--orbital)' },
        { tx: '30px',  ty: '-26px', sz: '8px',  col: 'var(--orbital)' },
      ];
  for (const s of specs) {
    const el = document.createElement('i');
    el.className = 'beat-spark';
    el.style.setProperty('--tx', s.tx);
    el.style.setProperty('--ty', s.ty);
    el.style.setProperty('--sz', s.sz);
    el.style.setProperty('--col', s.col);
    host.append(el);
    setTimeout(() => el.remove(), 660);
  }
}

function renderHibikiBeats(activeIdx, live) {
  const hud = get('hudHibiki');
  const note = get('hudBeatNote');
  if (!hud) return;
  hud.classList.toggle('is-live', live);
  hud.querySelectorAll('.beat-cell').forEach((cell, i) => {
    cell.classList.toggle('is-active', i === activeIdx);
  });
  if (note) {
    note.textContent = activeIdx >= 0 ? HIBIKI_BEAT_LABELS[activeIdx] : '待机';
  }
}

function stopHibikiCadence() {
  clearInterval(hibikiBeatTimer);
  hibikiBeatTimer = 0;
  hibikiBeatIndex = -1;
}

function syncHibikiCadence() {
  const shouldRun = pet === 'hibiki' && !follow && action === 'running' && !paused && !document.hidden;
  if (shouldRun) {
    if (!hibikiBeatTimer) {
      hibikiBeatIndex = 0;
      renderHibikiBeats(0, true);
      hibikiBeatTimer = setInterval(() => {
        if (pet !== 'hibiki' || follow || action !== 'running' || paused || document.hidden) {
          stopHibikiCadence();
          renderHibikiBeats(-1, false);
          return;
        }
        hibikiBeatIndex = (hibikiBeatIndex + 1) % 6;
        renderHibikiBeats(hibikiBeatIndex, true);
        if (hibikiBeatIndex === 4) emitBeatSparks(true);
      }, 190);
    }
  } else {
    stopHibikiCadence();
    renderHibikiBeats(-1, false);
  }
}

function syncCharacterHud() {
  const hud = get('characterHud');
  const hudH = get('hudHibiki');
  const hudT = get('hudToki');
  const lockRing = get('tokiLockRing');
  if (!hud || !hudH || !hudT) return;

  hud.dataset.pet = pet;
  const isToki = pet === 'toki';
  hudH.hidden = isToki;
  hudT.hidden = !isToki;

  if (!isToki) {
    if (lockRing) {
      lockRing.classList.remove('is-visible');
      lockRing.dataset.locked = 'false';
    }
    syncHibikiCadence();
    return;
  }

  stopHibikiCadence();
  const swept = cardFound ? 360 : Math.min(360, Math.round(Math.abs(travel) * 360 / tau));
  const ratio = swept / 360;
  const degOffset = (360 - swept).toFixed(1);

  hudT.classList.toggle('is-locked', cardFound);
  const miniArc = get('hudMiniArc');
  const lockFill = get('hudLockFill');
  const lockDeg = get('hudLockDeg');
  const lockLabel = get('hudLockLabel');
  const openCardBtn = get('hudOpenCard');

  if (miniArc) miniArc.setAttribute('stroke-dashoffset', degOffset);
  if (lockFill) lockFill.style.transform = `scaleX(${ratio.toFixed(4)})`;
  if (lockDeg) {
    lockDeg.textContent = String(swept).padStart(3, '0') + '°';
    lockDeg.hidden = cardFound;
  }
  if (lockLabel) lockLabel.textContent = cardFound ? '已锁定' : '360° 锁定';
  if (openCardBtn) openCardBtn.hidden = !cardFound;

  if (lockRing) {
    lockRing.classList.toggle('is-visible', follow || cardFound);
    lockRing.dataset.locked = String(cardFound);
    const arc = get('tokiLockArc');
    const ptr = get('tokiLockPointer');
    if (arc) arc.setAttribute('stroke-dashoffset', degOffset);
    if (ptr) ptr.style.transform = `rotate(${(direction * 22.5).toFixed(1)}deg)`;
  }
}

get('hudBeatTrigger')?.addEventListener('click', () => {
  if (pet !== 'hibiki') return;
  if (paused) { paused = false; syncStageMotion(); }
  setAction('running');
});
get('beatRail')?.addEventListener('click', event => {
  const cell = event.target.closest('[data-beat]');
  if (!cell || pet !== 'hibiki') return;
  const idx = Number(cell.dataset.beat);
  if (paused) { paused = false; syncStageMotion(); }
  if (follow || action !== 'running') setAction('running');
  stopHibikiCadence();
  hibikiBeatIndex = idx;
  renderHibikiBeats(idx, true);
  emitBeatSparks(idx === 4);
  if (idx === 4) {
    react('jumping', '第五拍踩准了！加油、老师！');
  }
  syncHibikiCadence();
});
get('hudLockTrigger')?.addEventListener('click', () => {
  if (pet !== 'toki') return;
  if (!follow) setFollow(true);
});
get('hudOpenCard')?.addEventListener('click', () => showCard(true));
document.addEventListener('visibilitychange', syncHibikiCadence);

// Silent background asset preloader so Day/Night swaps, HD motions, and BGM never stutter
preloadAllAssets(() => {});

// Delights #3: Ultra-Light Ambient Stardust & Pointer-Repulsion Architectural Dot-Matrix
const ambientController = (function setupAmbientField() {
  const canvas = get('ambientField');
  if (!canvas) return { refresh() {} };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { refresh() {} };

  const PALETTES = {
    hibiki: {
      gridRgb: '23, 98, 190',
      gridAlpha: 0.21,
      gridBoost: 0.36,
      dustRgb: '23, 98, 190',
      sparkRgb: '233, 183, 46',
      sparkAltRgb: '39, 113, 208',
    },
    toki: {
      gridRgb: '150, 217, 236',
      gridAlpha: 0.22,
      gridBoost: 0.38,
      dustRgb: '174, 216, 245',
      sparkRgb: '163, 167, 239',
      sparkAltRgb: '150, 217, 236',
    },
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let offsetLeft = 0;
  let offsetTop = 0;
  let gridDots = [];
  let motes = [];
  let rafId = 0;
  let lastTime = 0;

  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false, strength: 0 };

  function seedFields() {
    const mobile = window.innerWidth <= 900;
    const step = mobile ? 46 : 52;
    gridDots = [];
    const padX = ((width % step) / 2) || step / 2;
    const padY = ((height % step) / 2) || step / 2;
    for (let y = padY; y < height; y += step) {
      for (let x = padX; x < width; x += step) {
        gridDots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
      }
    }

    const count = mobile ? 22 : 44;
    const sparkCount = mobile ? 6 : 12;
    motes = [];
    for (let i = 0; i < count; i++) {
      const spark = i < sparkCount;
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        driftX: (Math.random() - 0.5) * 0.16,
        driftY: -(0.1 + Math.random() * 0.16),
        radius: spark ? 3.4 + Math.random() * 2.2 : 1.35 + Math.random() * 1.45,
        phase: Math.random() * Math.PI * 2,
        speed: 0.75 + Math.random() * 0.95,
        baseAlpha: spark ? 0.56 + Math.random() * 0.3 : 0.34 + Math.random() * 0.28,
        spark,
        alt: i % 2 === 1,
      });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    offsetLeft = rect.left;
    offsetTop = rect.top;
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedFields();
    renderFrame(performance.now(), 0);
  }

  function drawFourPointStar(x, y, r) {
    const inner = r * 0.28;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + inner, y - inner, x + r, y);
    ctx.quadraticCurveTo(x + inner, y + inner, x, y + r);
    ctx.quadraticCurveTo(x - inner, y + inner, x - r, y);
    ctx.quadraticCurveTo(x - inner, y - inner, x, y - r);
    ctx.closePath();
    ctx.fill();
  }

  function renderFrame(now, dt) {
    const pal = PALETTES[pet] || PALETTES.hibiki;
    ctx.clearRect(0, 0, width, height);

    const k = Math.min(2, dt / 16.667);
    const targetStrength = pointer.active ? 1 : 0;
    pointer.strength += (targetStrength - pointer.strength) * Math.min(1, 0.14 * (k || 1));
    if (pointer.active) {
      if (pointer.x < -900) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
      else {
        pointer.x += (pointer.tx - pointer.x) * Math.min(1, 0.28 * (k || 1));
        pointer.y += (pointer.ty - pointer.y) * Math.min(1, 0.28 * (k || 1));
      }
    }

    const repulseR = 136;
    const repulseR2 = repulseR * repulseR;
    const activeForce = pointer.strength > 0.01;

    // Layer A: Architectural micro dot-matrix with gentle pointer repulsion
    for (let i = 0; i < gridDots.length; i++) {
      const d = gridDots[i];
      let targetX = d.hx;
      let targetY = d.hy;
      let boost = 0;

      if (activeForce) {
        const dx = d.hx - pointer.x;
        const dy = d.hy - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < repulseR2 && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const falloff = 1 - dist / repulseR;
          const ease = falloff * falloff * pointer.strength;
          const push = ease * 11.5;
          targetX += (dx / dist) * push;
          targetY += (dy / dist) * push;
          boost = ease;
        }
      }

      if (dt > 0) {
        d.vx = (d.vx + (targetX - d.x) * 0.16 * k) * Math.pow(0.76, k);
        d.vy = (d.vy + (targetY - d.y) * 0.16 * k) * Math.pow(0.76, k);
        d.x += d.vx;
        d.y += d.vy;
      }

      const alpha = pal.gridAlpha + boost * pal.gridBoost;
      const radius = 1.25 + boost * 0.85;
      ctx.fillStyle = `rgba(${pal.gridRgb}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer B: Drifting stardust & 4-point halo glints
    const tSec = now * 0.001;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      if (dt > 0) {
        if (activeForce) {
          const dx = m.x - pointer.x;
          const dy = m.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < repulseR2 && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const push = (1 - dist / repulseR) * 0.34 * pointer.strength * k;
            m.vx += (dx / dist) * push;
            m.vy += (dy / dist) * push;
          }
        }
        m.vx *= Math.pow(0.92, k);
        m.vy *= Math.pow(0.92, k);
        m.x += (m.driftX + m.vx) * k;
        m.y += (m.driftY + m.vy) * k;

        if (m.y < -12) { m.y = height + 12; m.x = Math.random() * width; }
        if (m.x < -12) m.x = width + 12;
        if (m.x > width + 12) m.x = -12;
      }

      const pulse = 0.72 + 0.28 * Math.sin(tSec * m.speed + m.phase);
      const alpha = Math.min(0.95, m.baseAlpha * pulse);
      if (m.spark) {
        const col = m.alt ? pal.sparkAltRgb : pal.sparkRgb;
        ctx.fillStyle = `rgba(${col}, ${alpha.toFixed(3)})`;
        drawFourPointStar(m.x, m.y, m.radius * (0.9 + 0.18 * pulse));
      } else {
        ctx.fillStyle = `rgba(${pal.dustRgb}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function canAnimate() {
    return !document.hidden && !motion.matches && !document.querySelector('dialog[open]');
  }

  function loop(now) {
    rafId = 0;
    if (!canAnimate()) return;
    const dt = lastTime ? Math.min(48, now - lastTime) : 16.667;
    lastTime = now;
    renderFrame(now, dt);
    rafId = requestAnimationFrame(loop);
  }

  function syncLoop() {
    if (canAnimate()) {
      if (!rafId) {
        lastTime = 0;
        rafId = requestAnimationFrame(loop);
      }
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const x = event.clientX - offsetLeft;
    const y = event.clientY - offsetTop;
    if (x >= -40 && x <= width + 40 && y >= -40 && y <= height + 40) {
      pointer.tx = x;
      pointer.ty = y;
      pointer.active = true;
    } else {
      pointer.active = false;
    }
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('blur', () => { pointer.active = false; });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 90);
  });
  document.addEventListener('visibilitychange', syncLoop);
  motion.addEventListener('change', () => {
    syncLoop();
    renderFrame(performance.now(), 0);
  });
  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('close', syncLoop);
  });
  new MutationObserver(syncLoop).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

  resize();
  syncLoop();
  return {
    refresh() { renderFrame(performance.now(), 0); },
  };
})();

function setupChapters() {
  const desktop = matchMedia('(min-width: 901px)');
  const chapters = [...document.querySelectorAll('.chapter')];
  const links = [...document.querySelectorAll('.rail-links a')];
  const anchors = chapters.map(chapter => chapter.dataset.anchor);
  const titles = chapters.map(chapter => chapter.dataset.indexTitle);
  const number = index => String(index + 1).padStart(2, '0');
  function fromHash(hash) {
    const id = hash.slice(1).toLowerCase();
    if (id === 'momotalk') return 2;
    return anchors.indexOf(id);
  }
  function readLocation() {
    const hashIndex = fromHash(location.hash);
    if (hashIndex >= 0) return hashIndex;
    const chapter = new URLSearchParams(location.search).get('chapter');
    return /^[1-4]$/.test(chapter) ? Number(chapter) - 1 : 0;
  }

  let active = readLocation();
  let wanted = active;
  let wipe = null;
  let outWipe = null;
  let focusChapter = false;
  function markLinks(index) {
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function settle(index) {
    wipe?.cancel();
    wipe = null;
    outWipe?.cancel();
    outWipe = null;
    active = index;
    chapters.forEach((chapter, i) => {
      chapter.classList.toggle('is-current', i === index);
      chapter.classList.remove('is-entering');
      chapter.inert = desktop.matches && i !== index;
    });
    markLinks(index);
    get('railNumber').textContent = number(index);
    get('railTitle').textContent = titles[index];
  }
  function roll(element, value, direction, delay) {
    const outgoing = document.createElement('span');
    const incoming = document.createElement('span');
    outgoing.textContent = element.textContent;
    incoming.textContent = value;
    element.replaceChildren(outgoing, incoming);
    const timing = { duration: 440, delay, fill: 'both', easing: 'cubic-bezier(.45,0,.18,1)' };
    outgoing.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-105 * direction) + '%)' }], timing);
    incoming.animate([{ transform: 'translateY(' + (105 * direction) + '%)' }, { transform: 'translateY(0)' }], timing);
  }
  function transition() {
    if (wipe || active === wanted) return;
    const target = wanted;
    const forward = target > active;
    const from = chapters[active];
    const to = chapters[target];
    if (active === 0) stopSpin();
    if (active === 1) stopSignatureSpin();
    function finish() {
      settle(target);
      if (wanted !== target) transition();
      else if (focusChapter) {
        to.focus({ preventScroll: true });
        focusChapter = false;
      }
    }
    if (motion.matches) { finish(); return; }
    from.inert = true;
    to.classList.add('is-entering');
    const timing = { duration: 750, easing: 'cubic-bezier(.65,0,.18,1)', fill: 'both' };
    const inStart = forward ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    const outEnd = forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    wipe = to.animate([{ clipPath: inStart }, { clipPath: 'inset(0 0 0 0)' }], timing);
    outWipe = from.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: outEnd }], timing);
    markLinks(target);
    roll(get('railNumber'), number(target), forward ? 1 : -1, 70);
    roll(get('railTitle'), titles[target], forward ? 1 : -1, 155);
    wipe.onfinish = finish;
  }
  function navigate(index, record = true) {
    if (index < 0 || index >= chapters.length) return;
    if (record && index !== wanted) {
      const url = new URL(location.href);
      url.hash = anchors[index];
      url.searchParams.delete('chapter');
      history.pushState(null, '', url);
    }
    wanted = index;
    if (desktop.matches) {
      if (document.activeElement.closest('.chapter')) focusChapter = true;
      transition();
    } else {
      settle(index);
      chapters[index].scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('.chapter-rail a,.chapter-cue');
    if (!link) return;
    event.preventDefault();
    navigate(fromHash(link.hash));
  });
  function protectedScroll(target, direction) {
    if (target.closest('dialog,.track-popover,.messages,.manual[open],.instruction[open]')) return true;
    const area = target.closest('.stage-spread,.archive-spread,.comms-spread,.deploy-body');
    if (!area || area.scrollHeight <= area.clientHeight + 2) return false;
    return direction < 0 ? area.scrollTop > 1 : area.scrollTop + area.clientHeight < area.scrollHeight - 1;
  }
  const modalOpen = () => document.querySelector('dialog[open]') || !trackPopover.inert;
  document.addEventListener('keydown', event => {
    if (!desktop.matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || modalOpen()) return;
    const direction = ({ ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 })[event.key];
    if (!direction || event.target.closest('input,textarea,select,[contenteditable="true"]') || protectedScroll(event.target,direction)) return;
    event.preventDefault();
    if (!event.repeat) navigate(wanted + direction);
  });
  let wheelTime = 0;
  let wheelSum = 0;
  let wheelFired = false;
  document.addEventListener('wheel', event => {
    if (!desktop.matches || event.ctrlKey || modalOpen() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const direction = Math.sign(event.deltaY);
    if (!direction || protectedScroll(event.target, direction)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelTime > 160 || Math.sign(wheelSum) !== direction) {
      wheelSum = 0;
      wheelFired = false;
    }
    wheelTime = now;
    wheelSum += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!wheelFired && Math.abs(wheelSum) >= 32) {
      wheelFired = true;
      navigate(wanted + direction);
    }
  }, { passive: false });

  function route() { navigate(readLocation(), false); }
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (desktop.matches || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (desktop.matches) return;
      const edge = document.querySelector('.header').getBoundingClientRect().bottom + 36;
      const index = chapters.findLastIndex(chapter => chapter.getBoundingClientRect().top <= edge);
      if (index >= 0 && index !== active) settle(wanted = index);
    });
  }, { passive: true });
  desktop.addEventListener('change', () => {
    settle(wanted);
    if (!desktop.matches) chapters[wanted].scrollIntoView({ block: 'start' });
  });
  motion.addEventListener('change', () => {
    if (motion.matches && wipe) settle(wanted);
  });
  settle(active);
  if (!desktop.matches && active) chapters[active].scrollIntoView({ block: 'start' });
}
setupChapters();
