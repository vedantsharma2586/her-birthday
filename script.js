// Screens order
const screens = ['screen-loading','screen-intro','screen-wish','screen-moments','screen-letter'];
let current = 0;

function show(i){
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById(screens[i]);
  if (!next || next === prev) return;
  if (prev) prev.classList.remove('active');
  next.classList.add('active');
  current = i;

  // Make music audible from the 2nd screen
  if (i === 1) ensureAudibleFromIntro();
}
function next(){ show(Math.min(current + 1, screens.length - 1)); }

// Personalize via ?name=Name
const params = new URLSearchParams(location.search);
const theirName = params.get('name') || 'Madam Jii';
['name-slot','name-slot-2','name-slot-3'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.textContent = theirName;
});

// Auto advance: Loading → Intro
let loadTimer = setTimeout(() => next(), 2200);
document.getElementById('screen-loading')?.addEventListener('click', () => {
  clearTimeout(loadTimer); next();
});

// Buttons
document.getElementById('btn-start')?.addEventListener('click', () => {
  splashConfetti();
  next(); // go to Wish
});
document.getElementById('btn-moments')?.addEventListener('click', () => next());
document.getElementById('btn-letter')?.addEventListener('click', () => next());

// Modal + letter
const modal = document.getElementById('letter-modal');
const openLetter = document.getElementById('letter-card');
const closeModal = document.getElementById('close-modal');
const letterText = document.getElementById('letter-text');

openLetter?.addEventListener('click', async () => {
  modal.hidden = false;
  letterText.textContent = '';
  typeWriter(letterText, letterTemplate(theirName), 14);
  splashConfetti();
  // If music somehow isn't audible yet, make it audible now
  makeAudibleNow();
});
closeModal?.addEventListener('click', () => modal.hidden = true);
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) modal.hidden = true; });

// Share + extra confetti
document.getElementById('share-btn')?.addEventListener('click', async () => {
  const shareData = { title: `Happy Birthday, ${theirName}!`, text: `A small surprise for you ✨`, url: location.href };
  if (navigator.share) { try { await navigator.share(shareData); } catch{} }
  else {
    try { await navigator.clipboard.writeText(location.href); alert('Link copied!'); }
    catch { alert(location.href); }
  }
});
document.getElementById('confetti-btn')?.addEventListener('click', splashConfetti);

// Confetti
function splashConfetti(){
  if (!window.confetti) return alert('🎉🎉🎉');
  const duration = 900;
  const end = Date.now() + duration;
  const colors = ['#ff6b6b','#ffd166','#06d6a0','#118ab2','#9b6bff'];
  (function frame(){
    window.confetti({ particleCount: 3, angle: 60, spread: 70, startVelocity: 50, origin: {x:0}, colors });
    window.confetti({ particleCount: 3, angle: 120, spread: 70, startVelocity: 50, origin: {x:1}, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Typewriter
function typeWriter(el, text, speed = 18){
  let i = 0;
  const timer = setInterval(() => {
    el.textContent += text.charAt(i++);
    if (i >= text.length) clearInterval(timer);
  }, speed);
}
function letterTemplate(name){
  return `Happy Birthday, ${name}! 💖

Today is all about you — your smile, your kindness, and the little moments that make you, you.
Thank you for being a light to everyone around you.

I hope this year brings you new adventures, gentle days, and the comfort of people who care.
No matter where life takes us, I’m always cheering for you. ✨

Keep shining, keep laughing, and keep being your beautiful self.
Here’s to more memories together. 🎂🎈

With lots of love,
— Me`;
}

// ===== Moments Carousel (square images) =====
(function initMoments(){
  const photos = [
    'photo1.jpg',
    'photo2.jpg',
    'photo3.jpg',
    'photo4.jpg',
    'photo5.jpg'
  ];

  const stage = document.getElementById('car-stage');
  const dotsWrap = document.getElementById('car-dots');
  const prevBtn = document.getElementById('car-prev');
  const nextBtn = document.getElementById('car-next');
  if (!stage || !photos.length) return;

  const slides = photos.map((src, i) => {
    const img = document.createElement('img');
    img.src = src; img.alt = `Moment ${i + 1}`; img.loading='lazy'; img.decoding='async';
    img.addEventListener('error', () => { img.src = `https://picsum.photos/seed/bday-${i}/800/800`; }); // square fallback
    stage.appendChild(img); return img;
  });

  const dots = photos.map((_, i) => {
    const b = document.createElement('button'); b.type='button';
    b.setAttribute('aria-label', `Go to photo ${i + 1}`);
    b.addEventListener('click', () => go(i)); dotsWrap.appendChild(b); return b;
  });

  let index = 0;
  function render(){
    slides.forEach((el, i) => { el.classList.toggle('active', i === index); el.setAttribute('aria-hidden', i===index?'false':'true'); });
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function go(i){ index = (i + slides.length) % slides.length; render(); }
  function next(){ go(index + 1); }
  function prev(){ go(index - 1); }
  render();

  stage.addEventListener('click',(e)=>{ const r=stage.getBoundingClientRect(); const x=e.clientX-r.left; x < r.width/2 ? prev():next(); });
  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  document.addEventListener('keydown',(e)=>{
    const active = document.getElementById('screen-moments')?.classList.contains('active');
    if(!active) return;
    if(e.key==='ArrowLeft') prev();
    if(e.key==='ArrowRight') next();
  });

  let startX=0,startY=0;
  stage.addEventListener('touchstart',(e)=>{ const t=e.touches[0]; startX=t.clientX; startY=t.clientY; },{passive:true});
  stage.addEventListener('touchend',(e)=>{
    const t=e.changedTouches[0];
    const dx=t.clientX-startX, dy=t.clientY-startY;
    if(Math.abs(dx)>28 && Math.abs(dy)<40){ dx<0?next():prev(); }
  });
})();

// ===== Music: autoplay muted, unmute on screen 2 =====
const audio = document.getElementById('bg-music');
const audioToggle = document.getElementById('audio-toggle');
let isPlaying = false;

function updateAudioUI(){
  const audible = isPlaying && !audio.muted && !audio.paused;
  audioToggle.setAttribute('aria-pressed', audible ? 'true' : 'false');
  audioToggle.textContent = audible ? '🔊' : '🔈';
  audioToggle.title = audible ? 'Mute' : 'Unmute';
}

// Try to start (muted) ASAP
window.addEventListener('load', async () => {
  if (!audio) return;
  audio.volume = 0.85;
  try { await audio.play(); isPlaying = !audio.paused; } catch { isPlaying = false; }
  updateAudioUI();
});

// Make music audible immediately (or as soon as allowed)
function makeAudibleNow(){
  audio.muted = false;
  audio.play().then(() => { isPlaying = true; updateAudioUI(); }).catch(() => {});
}

// Called when screen 2 appears
function ensureAudibleFromIntro(){
  // Try to unmute right away
  makeAudibleNow();

  // Fallback: unmute on first touch/click on screen 2
  const introEl = document.getElementById('screen-intro');
  if (!introEl) return;
  const handler = () => { makeAudibleNow(); };
  introEl.addEventListener('pointerdown', handler, { once: true });
}

// Toggle button
audioToggle.addEventListener('click', async () => {
  if (audio.paused || audio.muted) {
    audio.muted = false;
    try { await audio.play(); isPlaying = true; } catch {}
  } else {
    audio.pause();
    isPlaying = false;
  }
  updateAudioUI();
});