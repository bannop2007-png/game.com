// === Инициализация Three.js ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,5,10);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === Освещение ===
const light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
scene.add(light);

// === Cannon.js физика ===
const world = new CANNON.World();
world.gravity.set(0,-9.82,0);

// === Земля ===
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(new CANNON.Box(new CANNON.Vec3(50,0.1,50)));
groundBody.position.set(0,-0.1,0);
world.addBody(groundBody);

const groundGeo = new THREE.PlaneGeometry(100,100);
const groundMat = new THREE.MeshLambertMaterial({color:0x7cfc00});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI/2;
scene.add(groundMesh);

// === Машина ===
const carBody = new CANNON.Body({ mass: 1 });
carBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5,0.25,1)));
carBody.position.set(0,1,0);
world.addBody(carBody);

const carGeo = new THREE.BoxGeometry(1,0.5,2);
const carMat = new THREE.MeshBasicMaterial({color:0xff0000});
const carMesh = new THREE.Mesh(carGeo, carMat);
scene.add(carMesh);

// === HUD скорость ===
const speedometer = document.getElementById('speed');

// === Управление WASD ===
const keys = { w:false, s:false, a:false, d:false };
window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key]=true; });
window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key]=false; });

// === Анимация и физика ===
function animate(){
    requestAnimationFrame(animate);

    // Управление машиной
    const force = 20;
    if(keys.w) carBody.velocity.z = -force;
    if(keys.s) carBody.velocity.z = force;
    if(keys.a) carBody.angularVelocity.y = 1;
    if(keys.d) carBody.angularVelocity.y = -1;

    // Обновляем скорость в HUD
    const speed = Math.round(carBody.velocity.length() * 3.6);
    speedometer.innerText = speed;

    // Шаг физики
    world.step(1/60);

    // Синхронизация Three.js и Cannon.js
    carMesh.position.copy(carBody.position);
    carMesh.quaternion.copy(carBody.quaternion);

    renderer.render(scene,camera);
}
animate();

// === Подстройка под размер окна ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
