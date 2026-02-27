const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,1.5,10);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff,1,15);
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

const room = new Room(scene);
const player = new Player(camera);

const enemies = [];
for(let i=0;i<5;i++){
  const e = new Enemy((Math.random()-0.5)*20,(Math.random()-0.5)*20);
  scene.add(e.mesh);
  enemies.push(e);
}

const ambient = new Howl({src:['assets/sounds/ambient.mp3'], loop:true, volume:0.3});
ambient.play();
const jumpscare = new Howl({src:['assets/sounds/jumpscare.mp3'], volume:1.0});
const overlay = document.getElementById('overlay');

function animate(){
  requestAnimationFrame(animate);
  player.update();
  enemies.forEach(e=>e.follow(player));
  light.position.set(camera.position.x,camera.position.y,camera.position.z);
  randomScare(jumpscare, overlay);
  renderer.render(scene,camera);
}

animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
