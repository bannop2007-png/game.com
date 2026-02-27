// === Three.js ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 15);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Свет ===
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(10,20,10);
scene.add(directional);

// === Cannon.js ===
const world = new CANNON.World();
world.gravity.set(0,-9.82,0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// === Земля ===
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(new CANNON.Box(new CANNON.Vec3(50,0.1,50)));
groundBody.position.set(0,-0.1,0);
world.addBody(groundBody);

const groundGeo = new THREE.PlaneGeometry(100,100);
const groundMat = new THREE.MeshPhongMaterial({color:0x00aa00});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI/2;
scene.add(groundMesh);

// === Машина ===
const carBody = new CANNON.Body({ mass: 1, linearDamping: 0.5, angularDamping: 0.5 });
carBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5,0.25,1)));
carBody.position.set(0,1,0);
world.addBody(carBody);

const carGeo = new THREE.BoxGeometry(1,0.5,2);
const carMat = new THREE.MeshPhongMaterial({color:0xff0000});
const carMesh = new THREE.Mesh(carGeo, carMat);
scene.add(carMesh);

// === HUD ===
const speedometer = document.getElementById('speed');

// === Управление WASD ===
const keys = { w:false, s:false, a:false, d:false };
window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key]=true; });
window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key]=false; });

// === Анимация ===
function animate(){
    requestAnimationFrame(animate);

    const force = 200;
    if(keys.w) carBody.applyLocalForce(new CANNON.Vec3(0,0,-force), new CANNON.Vec3(0,0,0));
    if(keys.s) carBody.applyLocalForce(new CANNON.Vec3(0,0,force), new CANNON.Vec3(0,0,0));
    if(keys.a) carBody.angularVelocity.y = 1;
    if(keys.d) carBody.angularVelocity.y = -1;

    world.step(1/60);

    carMesh.position.copy(carBody.position);
    carMesh.quaternion.copy(carBody.quaternion);

    camera.position.x = carMesh.position.x + 5;
    camera.position.y = carMesh.position.y + 5;
    camera.position.z = carMesh.position.z + 10;
    camera.lookAt(carMesh.position);

    speedometer.innerText = Math.round(carBody.velocity.length() * 3.6);

    renderer.render(scene,camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
