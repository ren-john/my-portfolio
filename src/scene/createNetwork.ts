import * as THREE from 'three';
import { clusterCenters, seededRandom } from './networkLayout';

export function createNetwork(stage: HTMLElement) {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
  const labels = Array.from(stage.querySelectorAll<HTMLAnchorElement>('[data-cluster]'));
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'low-power' });
  renderer.debug.onShaderError=()=>{canvas.hidden=true;stage.classList.add('network-fallback');};
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8,8,5,-5,.1,100); camera.position.z=20;
  const root = new THREE.Group(); scene.add(root);
  let centers: number[][]=[];
  let objects: THREE.Object3D[]=[];
  let materials: THREE.Material[]=[];
  let geometries: THREE.BufferGeometry[]=[];
  const lineMaterials: THREE.LineBasicMaterial[]=[];
  let active=-1, frame=0, time=0, last=0, enabled=true, visible=true, disposed=false;
  const pointer = new THREE.Vector2(), target = new THREE.Vector2();
  const uniforms={uTime:{value:0},uActive:{value:-1},uRatio:{value:renderer.getPixelRatio()}};
  function clearGeometry(){
    objects.forEach(o=>root.remove(o)); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    objects=[];geometries=[];materials=[];lineMaterials.length=0;
  }
  function lines(vertices:number[],opacity:number){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const m=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity,depthWrite:false});
    const object=new THREE.LineSegments(g,m);root.add(object);objects.push(object);geometries.push(g);materials.push(m);return m;
  }
  function rebuild(){
    if(disposed)return;
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.left=-5*w/h;camera.right=5*w/h;camera.updateProjectionMatrix();
    clearGeometry();centers=clusterCenters(w,h);
    const random=seededRandom(71241),positions:number[]=[],sizes:number[]=[],clusters:number[]=[],seeds:number[]=[];
    const radius=Math.min(1.25,10*w/h*.145);
    for(let cluster=0;cluster<5;cluster++){
      const center=centers[cluster],nodes:number[][]=[];
      for(let i=0;i<145;i++){
        const angle=random()*Math.PI*2,z=random()*2-1,r=radius*Math.pow(random(),.6);
        const ring=Math.sqrt(1-z*z);
        const p=[center[0]+Math.cos(angle)*ring*r,center[1]+Math.sin(angle)*ring*r,center[2]+z*r*.65];
        nodes.push(p);positions.push(...p);sizes.push(.8+random()*3.1);clusters.push(cluster);seeds.push(random()*30);
      }
      const edges:number[]=[]; const pairs=new Set<string>();
      nodes.forEach((p,i)=>{
        const nearest=nodes.map((q,j)=>({j,d:(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2})).filter(v=>v.j!==i).sort((a,b)=>a.d-b.d).slice(0,3);
        nearest.forEach(({j,d})=>{const key=[Math.min(i,j),Math.max(i,j)].join(':');if(d<radius*radius*.75&&!pairs.has(key)){pairs.add(key);edges.push(...p,...nodes[j]);}});
      });
      lineMaterials.push(lines(edges,.12));
    }
    // Fine bridges make the five interactive areas read as one connected network.
    const bridges:number[]=[];
    [[0,1],[1,2],[0,3],[3,4],[4,2],[1,4],[1,3]].forEach(([a,b])=>bridges.push(...centers[a],...centers[b]));
    lines(bridges,.15);
    for(let i=0;i<650;i++){
      positions.push((random()-.5)*10*w/h,(random()-.5)*10,-2-random()*4);
      sizes.push(.4+random()*.8);clusters.push(-1);seeds.push(random()*30);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));g.setAttribute('aCluster',new THREE.Float32BufferAttribute(clusters,1));g.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
    const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute float aSize,aCluster,aSeed;uniform float uTime,uActive,uRatio;varying float vAlpha;
      void main(){vec3 p=position;float selected=step(-.5,aCluster)*(1.-step(.1,abs(aCluster-uActive)));float star=1.-step(-.5,aCluster);
      float pulse=.7+.3*sin(uTime*.7+aSeed);vAlpha=mix(.42,.86,pulse)*mix(1.,1.7,selected)*(1.-star*.55);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=(aSize+selected*1.3)*uRatio;}`,
      fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.12,.5,d))*vAlpha;if(alpha<.01)discard;gl_FragColor=vec4(vec3(.9),alpha);}`});
    const points=new THREE.Points(g,material);root.add(points);objects.push(points);geometries.push(g);materials.push(material);
    draw();wake();
  }
  const projection=new THREE.Vector3();
  function draw(){
    if(disposed)return;
    uniforms.uTime.value=time;uniforms.uActive.value=active;
    pointer.lerp(enabled?target:new THREE.Vector2(),.045);
    root.rotation.set(enabled?pointer.y*.025:0,enabled?pointer.x*.035:0,0);
    root.updateMatrixWorld(true);
    centers.forEach((p,i)=>{
      projection.set(p[0],p[1],p[2]).applyMatrix4(root.matrixWorld).project(camera);
      labels[i].style.left=`${(projection.x*.5+.5)*100}%`;labels[i].style.top=`${(-projection.y*.5+.5)*100}%`;
      labels[i].classList.toggle('is-active',active===i);
      lineMaterials[i].opacity=active===i?.38:.12;
    });
    renderer.render(scene,camera);
  }
  function tick(now:number){frame=0;if(disposed||document.hidden||!visible)return;const delta=Math.min(64,last?now-last:16);last=now;if(enabled)time+=delta/1000;draw();if(enabled)wake();}
  function wake(){if(!frame&&!disposed&&!document.hidden&&visible)frame=requestAnimationFrame(tick);}
  const handlers: (()=>void)[]=[];
  labels.forEach((label,i)=>{
    const enter=()=>{active=i;wake();}; const leave=()=>{active=-1;wake();};
    label.addEventListener('pointerenter',enter);label.addEventListener('focus',enter);label.addEventListener('pointerleave',leave);label.addEventListener('blur',leave);
    handlers.push(()=>{label.removeEventListener('pointerenter',enter);label.removeEventListener('focus',enter);label.removeEventListener('pointerleave',leave);label.removeEventListener('blur',leave);});
  });
  const move=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const b=stage.getBoundingClientRect();target.set((event.clientX-b.left)/b.width-.5,(event.clientY-b.top)/b.height-.5);};
  const leave=()=>target.set(0,0);
  stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);
  const onVisibility=()=>{last=0;wake();};document.addEventListener('visibilitychange',onVisibility);
  const lost=(event:Event)=>{event.preventDefault();enabled=false;canvas.hidden=true;stage.classList.add('network-fallback');};
  canvas.addEventListener('webglcontextlost',lost);
  const resizeObserver=new ResizeObserver(rebuild);resizeObserver.observe(stage);rebuild();
  return {setMotion(value:boolean){enabled=value;wake();},setVisible(value:boolean){visible=value;last=0;if(value)wake();},dispose(){disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();handlers.forEach(fn=>fn());clearGeometry();renderer.dispose();stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('webglcontextlost',lost);}};
}
