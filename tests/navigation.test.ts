import test from 'node:test';
import assert from 'node:assert/strict';
import {clusterCenters,destinations,resolvePage,seededRandom} from '../src/scene/networkLayout.ts';
import {nearestSlide,targetScroll} from '../src/ui/carouselMath.ts';
import {readFileSync} from 'node:fs';

test('every network cluster resolves to a distinct portfolio page',()=>{
  assert.equal(new Set(destinations).size,5);
  for(const destination of destinations)assert.equal(resolvePage(`#${destination}`),destination);
  assert.equal(resolvePage('#/projects'),'projects');
  assert.equal(resolvePage('#babycue'),'projects');
  assert.equal(resolvePage('#inventory'),'projects');
  assert.equal(resolvePage('#intro'),'about');
  assert.equal(resolvePage('#missing'),'home');
  assert.equal(resolvePage(''),'home');
});
test('cluster centers stay inside desktop and mobile stages with separate hit areas',()=>{
  for(const [w,h] of [[1440,600],[768,600],[390,530],[360,530]]){
    const centers=clusterCenters(w,h),width=10*w/h;
    for(const [x,y,z] of centers){assert.ok(Math.abs(x)<width/2);assert.ok(Math.abs(y)<5);assert.ok(Number.isFinite(z));}
    for(let a=0;a<centers.length;a++)for(let b=a+1;b<centers.length;b++){
      const dx=(centers[a][0]-centers[b][0])/width*w,dy=(centers[a][1]-centers[b][1])/10*h;
      assert.ok(Math.hypot(dx,dy)>120,'Cluster button centers must not overlap');
    }
  }
});
test('carousel picks the closest card and clamps controls at both ends',()=>{
  const centers=[400,850,1300,1750,2200,2650,3100];
  assert.equal(nearestSlide(0,800,centers),0);
  assert.equal(nearestSlide(900,800,centers),2);
  assert.equal(targetScroll(-4,800,centers,2700),0);
  assert.equal(targetScroll(3,800,centers,2700),1350);
  assert.equal(targetScroll(99,800,centers,2700),2700);
  assert.equal(nearestSlide(2600,800,centers),6);
});
test('network regeneration is deterministic with finite normalized randomness',()=>{
  const a=seededRandom(71241),b=seededRandom(71241);
  for(let i=0;i<1000;i++){const n=a();assert.equal(n,b());assert.ok(n>=0&&n<1);}
});
test('all seven projects retain their notes in the continuous portfolio',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(let i=0;i<7;i++){
    assert.equal(html.split(`data-project="${i}"`).length-1,1);
    assert.equal(html.split(`id="project-detail-${i}"`).length-1,1);
  }
  assert.equal([...html.matchAll(/data-page="/g)].length,6);
  for(const destination of destinations)assert.ok(html.includes(`data-page="${destination}"`));
  assert.ok(html.includes('Renmar John Morales'));
  assert.ok(html.includes('./images/portrait-refined.png'));
  assert.ok(!html.includes('id="network-canvas"'));
  for(const destination of ['home',...destinations]){
    assert.ok(html.includes(`id="${destination}"`));
  }
});
