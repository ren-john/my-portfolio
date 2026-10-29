import { resolvePage, type Page } from './scene/networkLayout';
import { setupProjectCarousel } from './ui/projectCarousel';

const $ = <T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
document.body.classList.add('app-ready');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let manuallyStatic=false;
try{manuallyStatic=localStorage.getItem('portfolio-static')==='true';}catch{/* Optional storage. */}
const staticMode=()=>manuallyStatic||reducedMotion.matches;
const motionButton=$<HTMLButtonElement>('#motion-toggle');
const carousel=setupProjectCarousel(staticMode);
let network:ReturnType<typeof import('./scene/createNetwork').createNetwork>|undefined;
let loading=false;
let page:Page='home';

async function loadNetwork(){
  if(network||loading)return;loading=true;
  try{
    const {createNetwork}=await import('./scene/createNetwork');
    network=createNetwork($('#network-stage'));
    network.setMotion(!staticMode());network.setVisible(page==='home');
  }catch(error){
    console.error('Network visualization unavailable; navigation remains accessible.',error);
    $('#network-canvas').hidden=true;$('#network-stage').classList.add('network-fallback');
  }finally{loading=false;}
}
const titles:Record<Page,string>={home:'Neural map',about:'About',projects:'Projects',skills:'Skills',education:'Education',contact:'Contact'};
function showPage(moveFocus=true){
  page=resolvePage(location.hash);
  if(!['home','about','projects','skills','education','contact','intro','babycue','inventory',''].includes(location.hash.replace(/^#\/?/,'')))history.replaceState(null,'','#home');
  document.querySelectorAll<HTMLElement>('[data-page]').forEach(view=>{view.hidden=view.dataset.page!==page;});
  $('.story-layout').hidden=page==='home';$('.site-footer').hidden=page==='home';
  document.body.dataset.view=page;
  document.title=`${titles[page]} — AI / ML Portfolio`;
  document.querySelectorAll<HTMLAnchorElement>('.site-header nav a').forEach(link=>{
    if(resolvePage(link.hash)===page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  carousel.close();
  if(page==='projects'){
    carousel.refresh();
    if(location.hash==='#babycue')carousel.select(1);
    if(location.hash==='#inventory')carousel.select(2);
  }
  if(page==='home')void loadNetwork();
  network?.setVisible(page==='home');
  window.scrollTo({top:0,behavior:'instant'});
  if(moveFocus){
    const heading=document.querySelector<HTMLElement>(`[data-page="${page}"] h1,[data-page="${page}"] h2`);
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
}
function syncMotion(){
  const off=staticMode();document.body.classList.toggle('static-mode',off);
  motionButton.setAttribute('aria-pressed',String(off));motionButton.disabled=reducedMotion.matches;
  motionButton.title=reducedMotion.matches?'Reduced motion is enabled in your system settings':off?'Turn on network motion':'Turn off network motion';
  motionButton.setAttribute('aria-label',motionButton.title);$('.motion-label').textContent=off?'Motion off':'Motion on';
  network?.setMotion(!off);
}
motionButton.addEventListener('click',()=>{if(reducedMotion.matches)return;manuallyStatic=!manuallyStatic;try{localStorage.setItem('portfolio-static',String(manuallyStatic));}catch{}syncMotion();});
reducedMotion.addEventListener('change',syncMotion);
window.addEventListener('hashchange',()=>showPage());
window.addEventListener('pageshow',()=>showPage(false));
$('#year').textContent=String(new Date().getFullYear());
syncMotion();showPage(false);
window.addEventListener('pagehide',event=>{if(!event.persisted){network?.dispose();carousel.dispose();}});
