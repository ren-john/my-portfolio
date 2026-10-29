import * as THREE from 'three';
import type { StoryState } from '../story/evaluateStory';
import { buildPortraitParticles, type FaceData } from './portraitParticles';
import { headingTargets } from './textParticles';

export async function createScene(stage: HTMLElement, onFailure: () => void) {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
  const portrait = stage.querySelector<HTMLImageElement>('img')!;
  const response = await fetch(`${import.meta.env.BASE_URL}data/face-landmarks.json`);
  if (!response.ok) throw new Error('Face depth could not be loaded');
  const face = await response.json() as FaceData;
  if (face.count !== 478 || face.points.some(p => p.some(n => !Number.isFinite(n)))) throw new Error('Invalid face depth');
  await portrait.decode();
  const raster = document.createElement('canvas');
  raster.width = portrait.naturalWidth; raster.height = portrait.naturalHeight;
  const context = raster.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Portrait sampling is unavailable');
  context.drawImage(portrait, 0, 0);
  const data = buildPortraitParticles(context.getImageData(0, 0, raster.width, raster.height), face);
  if (data.count < 1000) throw new Error('Not enough portrait particles');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.debug.onShaderError = () => queueMicrotask(onFailure);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2.2, -2.2, .01, 50);
  camera.position.z = 8;
  const group = new THREE.Group(); scene.add(group);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('aTone', new THREE.BufferAttribute(data.tones, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(data.count * 3), 3));
  const pointer = new THREE.Vector2(10, 10);
  const pointerTarget = new THREE.Vector2(10, 10);
  const uniforms = {
    uTime: { value: 0 }, uOpacity: { value: 0 }, uMorph: { value: 0 }, uScatter: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() }, uViewportScale: { value: 1 },
    uPointer: { value: pointer }, uPointerStrength: { value: 0 },
    uFormation: { value: 0 }, uPortraitScale: { value: 3.5 },
  };
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aTone; attribute vec3 aSeed; attribute float aSize; attribute vec3 aTarget;
      uniform float uTime, uMorph, uScatter, uPixelRatio, uViewportScale, uPointerStrength;
      uniform vec2 uPointer;
      uniform float uFormation, uPortraitScale;
      varying float vTone, vFade;
      void main(){
        vec3 p=position;
        p.z*=uMorph;
        p*=uPortraitScale;
        float t=uTime;
        vec3 drift=vec3(sin(t*.48+aSeed.x*24.+p.y*7.),cos(t*.39+aSeed.y*19.+p.x*8.),sin(t*.36+aSeed.z*21.));
        float dust=step(.94,aSeed.z);
        p=mix(p,aTarget,uFormation);
        p+=drift*(.004+dust*.022)*uMorph*(1.-uFormation);
        // A broad flowing plume links the centered portrait to the left-aligned heading.
        vec3 burst=vec3((aSeed.x-.5)*5.5 + sin(aSeed.y*6.28)*1.2,
          (aSeed.y-.5)*2.2 + cos(aSeed.x*6.28)*.8,(aSeed.z-.5)*1.2);
        p+=burst*uScatter;
        p.y+=sin(t*.55+aSeed.x*12.)*uScatter*.06;
        vec2 away=p.xy-uPointer;
        float influence=exp(-dot(away,away)*8.)*uPointerStrength*uMorph*(1.-uFormation);
        p.xy+=normalize(away+vec2(.0001))*influence*.055;
        p.z+=influence*.08;
        float shimmer=.78+.22*sin(t*(.7+aSeed.y*.6)+aSeed.x*40.);
        vTone=mix(aTone*shimmer,.9,uFormation);
        vFade=(1.-uScatter*.3)*(1.-dust*.2*(1.-uFormation));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
        gl_PointSize=clamp(aSize*(1.05+aTone*.8)*uPixelRatio*uViewportScale, .8, 4.6);
      }`,
    fragmentShader: `
      uniform float uOpacity;
      varying float vTone, vFade;
      void main(){
        float radius=length(gl_PointCoord-.5);
        float core=1.-smoothstep(.12,.45,radius);
        float halo=(1.-smoothstep(.2,.5,radius))*.15;
        float alpha=(core+halo)*uOpacity*vFade*(.12+vTone*.88);
        if(alpha<.009) discard;
        vec3 silver=mix(vec3(.3),vec3(.97),pow(vTone,.6));
        gl_FragColor=vec4(silver,alpha);
        #include <colorspace_fragment>
      }`,
  });
  const particles = new THREE.Points(geometry, pointMaterial);
  particles.frustumCulled = false;
  particles.renderOrder = 2;
  group.add(particles);
  const ratio = raster.width / raster.height;
  for (let i = 0; i < data.rgba.length; i += 4) {
    const gray = Math.round(data.rgba[i] * .2126 + data.rgba[i + 1] * .7152 + data.rgba[i + 2] * .0722);
    data.rgba[i] = data.rgba[i + 1] = data.rgba[i + 2] = gray;
  }
  const texture = new THREE.DataTexture(data.rgba, raster.width, raster.height, THREE.RGBAFormat);
  texture.flipY = true; texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  const photoGeometry = new THREE.PlaneGeometry(ratio, 1);
  const photoMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const photo = new THREE.Mesh(photoGeometry, photoMaterial);
  photo.renderOrder = 1; group.add(photo);
  let photoHeight = 3.5, disposed = false, pointerActive = false, current: StoryState | undefined;
  let lastTime = 0;

  function resize() {
    if (disposed) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.left = -2.2 * w / h; camera.right = 2.2 * w / h; camera.updateProjectionMatrix();
    photoHeight = Math.min(3.8, (4.4 * w / h) * .88 / ratio);
    uniforms.uViewportScale.value = Math.min(1, w / 460);
    const targets = headingTargets(document.querySelector<HTMLElement>('#opening-heading')!, stage, data.count);
    const targetAttribute = geometry.getAttribute('aTarget') as THREE.BufferAttribute;
    targetAttribute.copyArray(targets);
    targetAttribute.needsUpdate = true;
    if (current) draw(current, lastTime);
  }
  function draw(state: StoryState, time = 0) {
    if (disposed) return;
    current = state; lastTime = time;
    pointer.lerp(pointerTarget, .085);
    uniforms.uPointerStrength.value += ((pointerActive ? 1 : 0) - uniforms.uPointerStrength.value) * .08;
    uniforms.uTime.value = time; uniforms.uMorph.value = state.morph;
    uniforms.uScatter.value = state.scatter; uniforms.uOpacity.value = state.pointOpacity;
    uniforms.uFormation.value = state.formation;
    uniforms.uPortraitScale.value = photoHeight;
    photo.scale.setScalar(photoHeight);
    group.rotation.set(0, 0, 0);
    photoMaterial.opacity = state.portraitOpacity;
    photo.visible = state.portraitOpacity > .001; particles.visible = state.pointOpacity > .001;
    renderer.render(scene, camera);
    stage.dataset.particles = String(data.count);
    stage.dataset.yaw = (group.rotation.y * 180 / Math.PI).toFixed(2);
    stage.dataset.drawCalls = String(renderer.info.render.calls);
  }
  function onPointer(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    pointerTarget.set(((event.clientX - rect.left) / rect.width - .5) * (camera.right - camera.left),
      (.5 - (event.clientY - rect.top) / rect.height) * 4.4);
    if (!pointerActive) pointer.copy(pointerTarget);
    pointerActive = true;
  }
  const onLeave = () => { pointerActive = false; };
  function contextLost(event: Event) { event.preventDefault(); onFailure(); }
  canvas.addEventListener('webglcontextlost', contextLost);
  stage.addEventListener('pointermove', onPointer); stage.addEventListener('pointerleave', onLeave);
  const observer = new ResizeObserver(resize); observer.observe(stage); resize();
  return { draw, resize, particleCount: data.count, dispose() {
    disposed = true; observer.disconnect();
    canvas.removeEventListener('webglcontextlost', contextLost);
    stage.removeEventListener('pointermove', onPointer); stage.removeEventListener('pointerleave', onLeave);
    geometry.dispose(); pointMaterial.dispose(); photoGeometry.dispose(); photoMaterial.dispose(); texture.dispose(); renderer.dispose();
  } };
}
