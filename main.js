// Scene
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,1.5,10);
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
let light = new THREE.PointLight(0xffffff,1,15);
light.position.set(camera.position.x,camera.position.y,camera.position.z);
scene.add(light);

// Room
let room = new Room(scene);

// Player
let player = new Player(camera);

// Enemies
let enemies = [];
for(let i=0;i<5;i++){
  let e = new Enemy((Math.random()-0.5)*20, (Math.random()-0.5)*20);
  scene.add(e.mesh);
  enemies.push(e);
}

// Sounds
let ambient = new Howl({src:['assets/sounds/ambient.mp3'], loop:true, volume:0.3});
ambient.play();
let jumpscare = new Howl({src:['assets/sounds/jumpscare.mp3'], volume:1.0});

// Jump scare effect
function randomScare(){
  if(Math.random()<0.001){
    jumpscare.play();
    let flash = document.getElementById('overlay');
    flash.style.background='rgba(255,0,0,0.5)';
    setTimeout(()=>{flash.style.background='radial-gradient(circle at center, rgba(0,0,0,0) 150px, rgba(0,0,0,0.95) 300px)';},200);
  }
}

// Animate
function animate(){
  requestAnimationFrame(animate);
  player.update();
  enemies.forEach(e=>e.follow(player));
  light.position.set(camera.position.x,camera.position.y,camera.position.z);
  randomScare();
  renderer.render(scene,camera);
}
animate();

// Resize
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
