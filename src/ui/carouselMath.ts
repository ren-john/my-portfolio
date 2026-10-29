export function nearestSlide(scrollLeft:number, viewportWidth:number, centers:number[]){
  const middle=scrollLeft+viewportWidth/2;
  return centers.reduce((best,value,i)=>Math.abs(value-middle)<Math.abs(centers[best]-middle)?i:best,0);
}
export function targetScroll(index:number,viewportWidth:number,centers:number[],maxScroll:number){
  return Math.max(0,Math.min(maxScroll,centers[Math.max(0,Math.min(index,centers.length-1))]-viewportWidth/2));
}
