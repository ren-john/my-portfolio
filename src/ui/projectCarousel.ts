import { nearestSlide,targetScroll } from './carouselMath';

export function setupProjectCarousel(isReduced:()=>boolean){
  const viewport=document.querySelector<HTMLElement>('#project-gallery')!;
  const cards=Array.from(viewport.querySelectorAll<HTMLElement>('.film-card'));
  const previous=document.querySelector<HTMLButtonElement>('#project-prev')!,next=document.querySelector<HTMLButtonElement>('#project-next')!;
  const dots=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-slide]'));
  const count=document.querySelector<HTMLElement>('#project-count')!;
  const dialog=document.querySelector<HTMLDialogElement>('#project-dialog')!;
  let index=0,frame=0,dragging=false,dragged=false,startX=0,startScroll=0,lastX=0,lastTime=0,velocity=0,suppressClick=false;
  const centers=()=>cards.map(card=>card.offsetLeft+card.offsetWidth/2);
  const go=(i:number)=>{viewport.scrollTo({left:targetScroll(i,viewport.clientWidth,centers(),viewport.scrollWidth-viewport.clientWidth),behavior:isReduced()?'instant':'smooth'});};
  function update(){
    frame=0;if(!viewport.clientWidth)return;
    const c=centers();index=nearestSlide(viewport.scrollLeft,viewport.clientWidth,c);
    count.textContent=`${String(index+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
    previous.disabled=index===0;next.disabled=index===cards.length-1;
    cards.forEach((card,i)=>{const distance=(c[i]-viewport.scrollLeft-viewport.clientWidth/2)/Math.max(1,card.offsetWidth);card.style.setProperty('--tilt',`${Math.max(-24,Math.min(24,-distance*17))}deg`);card.style.setProperty('--scale',String(1-Math.min(.10,Math.abs(distance)*.06)));card.classList.toggle('is-selected',i===index);});
    dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));
  }
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  viewport.addEventListener('scroll',schedule,{passive:true});
  previous.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport)return;
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();go(event.key==='Home'?0:event.key==='End'?cards.length-1:index+(event.key==='ArrowLeft'?-1:1));}
  });
  viewport.addEventListener('pointerdown',event=>{
    suppressClick=false;
    if(event.pointerType==='touch'||event.button!==0||(event.target as HTMLElement).closest('button,a,summary'))return;
    dragging=true;dragged=false;suppressClick=false;startX=lastX=event.clientX;startScroll=viewport.scrollLeft;lastTime=event.timeStamp;velocity=0;
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const dx=event.clientX-startX;if(Math.abs(dx)>6)dragged=true;
    if(dragged){event.preventDefault();viewport.scrollLeft=startScroll-dx;velocity=(event.clientX-lastX)/Math.max(1,event.timeStamp-lastTime);}
    lastX=event.clientX;lastTime=event.timeStamp;
  });
  function finish(event:PointerEvent){
    if(!dragging)return;dragging=false;viewport.classList.remove('is-dragging');
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    if(dragged){suppressClick=true;const inertia=event.timeStamp-lastTime>90?0:velocity*140;go(nearestSlide(viewport.scrollLeft-inertia,viewport.clientWidth,centers()));}
  }
  viewport.addEventListener('pointerup',finish);viewport.addEventListener('pointercancel',finish);
  viewport.addEventListener('lostpointercapture',()=>{dragging=false;viewport.classList.remove('is-dragging');});
  viewport.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
  viewport.querySelectorAll<HTMLButtonElement>('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    const i=Number(button.dataset.project);
    const template=document.querySelector<HTMLTemplateElement>(`#project-detail-${i}`)!;
    document.querySelector('#project-dialog-title')!.textContent=cards[i].querySelector('h3')!.textContent;
    document.querySelector('#project-dialog-content')!.replaceChildren(template.content.cloneNode(true));
    dialog.showModal();dialog.scrollTop=0;
  }));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
  const observer=new ResizeObserver(()=>{update();});observer.observe(viewport);
  update();
  return {refresh(){requestAnimationFrame(()=>{go(index);update();});},select(i:number){index=i;requestAnimationFrame(()=>go(i));},close(){if(dialog.open)dialog.close();},dispose(){observer.disconnect();cancelAnimationFrame(frame);}};
}
