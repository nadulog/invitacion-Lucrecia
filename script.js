const eventDate = new Date('2026-11-14T20:30:00-03:00');
const welcome=document.querySelector('#welcome');
const backgroundMusic=document.querySelector('#background-music');
const audioControl=document.querySelector('.audio-control');
document.body.style.overflow='hidden';

function closeWelcome(playMusic){
  audioControl.hidden=false;
  if(playMusic){backgroundMusic.volume=.7;backgroundMusic.play().catch(()=>{});}
  welcome.classList.add('is-closing');
  document.body.style.overflow='';
  setTimeout(()=>welcome.remove(),780);
}
document.querySelector('.welcome-music').addEventListener('click',()=>closeWelcome(true));
document.querySelector('.welcome-silent').addEventListener('click',()=>closeWelcome(false));
audioControl.addEventListener('click',()=>{
  if(backgroundMusic.paused){backgroundMusic.play().catch(()=>{})}else{backgroundMusic.pause()}
});
function syncAudioControl(){
  const playing=!backgroundMusic.paused;
  audioControl.classList.toggle('is-playing',playing);
  audioControl.setAttribute('aria-pressed',String(playing));
  audioControl.setAttribute('aria-label',playing?'Pausar música':'Reproducir música');
}
backgroundMusic.addEventListener('play',syncAudioControl);
backgroundMusic.addEventListener('pause',syncAudioControl);
const fields = {days:document.querySelector('#days'),hours:document.querySelector('#hours'),minutes:document.querySelector('#minutes'),seconds:document.querySelector('#seconds')};
function updateCountdown(){
  const remaining=Math.max(0,eventDate-Date.now());
  const values={days:Math.floor(remaining/86400000),hours:Math.floor(remaining/3600000)%24,minutes:Math.floor(remaining/60000)%60,seconds:Math.floor(remaining/1000)%60};
  Object.entries(values).forEach(([key,value])=>fields[key].textContent=String(value).padStart(2,'0'));
}
updateCountdown();setInterval(updateCountdown,1000);

const dateSection=document.querySelector('.date-reveal');
const scratchCanvas=document.querySelector('.date-cover');
const scratchSource=document.querySelector('#scratch-source');
const scratchContext=scratchCanvas.getContext('2d',{willReadFrequently:true});
let scratching=false;
const scratchedZones=new Set();
let sparkleTick=0;

function prepareScratch(){
  scratchCanvas.width=942;
  scratchCanvas.height=1674;
  scratchContext.globalCompositeOperation='source-over';
  scratchContext.drawImage(scratchSource,0,0,scratchCanvas.width,scratchCanvas.height);
}
if(scratchSource.complete)prepareScratch();else scratchSource.addEventListener('load',prepareScratch,{once:true});

function scratchAt(event){
  if(!scratching)return;
  dateSection.classList.add('scratching');
  const rect=scratchCanvas.getBoundingClientRect();
  const x=(event.clientX-rect.left)*(scratchCanvas.width/rect.width);
  const y=(event.clientY-rect.top)*(scratchCanvas.height/rect.height);
  scratchContext.globalCompositeOperation='destination-out';
  scratchContext.beginPath();
  scratchContext.arc(x,y,scratchCanvas.width*.09,0,Math.PI*2);
  scratchContext.fill();
  const zoneX=Math.max(0,Math.min(7,Math.floor(x/(scratchCanvas.width/8))));
  const zoneY=Math.max(0,Math.min(11,Math.floor(y/(scratchCanvas.height/12))));
  scratchedZones.add(`${zoneX}-${zoneY}`);
  if(++sparkleTick%2===0)makeSparkles(event.clientX-rect.left,event.clientY-rect.top);
  if(scratchedZones.size>=38){scratching=false;dateSection.classList.add('revealed');unlockDateScroll()}
}

function makeSparkles(x,y){
  const layer=document.querySelector('.scratch-sparkles');
  for(let i=0;i<3;i++){
    const spark=document.createElement('b');
    spark.style.left=`${x+(Math.random()-.5)*24}px`;spark.style.top=`${y+(Math.random()-.5)*24}px`;
    spark.style.setProperty('--dx',`${(Math.random()-.5)*40}px`);spark.style.setProperty('--dy',`${(Math.random()-.5)*40}px`);
    layer.append(spark);setTimeout(()=>spark.remove(),850);
  }
}
scratchCanvas.addEventListener('pointerdown',event=>{scratching=true;scratchCanvas.setPointerCapture(event.pointerId);scratchAt(event)});
scratchCanvas.addEventListener('pointermove',scratchAt);
scratchCanvas.addEventListener('pointerup',()=>scratching=false);
scratchCanvas.addEventListener('pointercancel',()=>scratching=false);
dateSection.addEventListener('wheel',event=>{if(!dateSection.classList.contains('revealed'))event.preventDefault()},{passive:false});

let lockedScrollY=0;
let dateScrollLocked=false;
function lockDateScroll(){
  if(dateScrollLocked||dateSection.classList.contains('revealed'))return;
  const previousBehavior=document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior='auto';
  lockedScrollY=Math.round(window.scrollY+dateSection.getBoundingClientRect().top);
  window.scrollTo(0,lockedScrollY);
  document.documentElement.style.scrollBehavior=previousBehavior;
  document.body.style.position='fixed';
  document.body.style.top=`-${lockedScrollY}px`;
  document.body.style.left='0';
  document.body.style.right='0';
  dateScrollLocked=true;
}
function unlockDateScroll(){
  if(!dateScrollLocked)return;
  document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';
  const previousBehavior=document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior='auto';
  window.scrollTo(0,lockedScrollY);
  document.documentElement.style.scrollBehavior=previousBehavior;
  dateScrollLocked=false;
}
new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting&&!dateSection.classList.contains('revealed'))setTimeout(lockDateScroll,80);
},{threshold:.62}).observe(dateSection);

function bindModal(triggerSelector,modalId){
  const modal=document.querySelector(modalId);
  document.querySelector(triggerSelector).addEventListener('click',()=>{modal.showModal();document.body.classList.add('modal-open')});
  modal.querySelector('.modal-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  modal.addEventListener('close',()=>document.body.classList.remove('modal-open'));
}
bindModal('.location-open','#location-modal');
bindModal('.gift-open','#gift-modal');

document.querySelector('.copy-alias').addEventListener('click',async e=>{
  const alias=e.currentTarget.dataset.alias;
  try{await navigator.clipboard.writeText(alias)}catch{const area=document.createElement('textarea');area.value=alias;document.body.append(area);area.select();document.execCommand('copy');area.remove()}
  const toast=document.querySelector('.copy-toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800);
});

const musicPanel=document.querySelector('.music-panel');
new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting)musicPanel.classList.add('music-active');
},{threshold:.4}).observe(musicPanel);
document.querySelector('.music-link').addEventListener('click',event=>{
  event.preventDefault();
  const destination=event.currentTarget.href;
  musicPanel.classList.add('sending');
  setTimeout(()=>{window.open(destination,'_blank','noopener');musicPanel.classList.remove('sending')},680);
});
