// ------------------ MAIN ------------------

// Сцена и камера
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 10);

// Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Свет (фонарик)
const light = new THREE.PointLight(0xffffff, 1, 15);
light.position.set(camera.position.x, camera.position.y, camera.position.z);
scene.add(light);

// Создание комнаты
const room = new Room(scene);

// Игрок
const player = new Player(camera);

// Враги
const enemies = [];
for (let i = 0; i < 5; i++) {
  const e = new Enemy(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  );
  scene.add(e.mesh);
  enemies.push(e);
}

// Overlay для jump scare
const overlay = document.getElementById('overlay');

// Звуки
const ambient = new Howl({
  src: ['https://freesound.org/data/previews/341/341695_6244395-lq.mp3'],
  loop: true,
  volume: 0.3
});
ambient.play();

const jumpscare = new Howl({
  src: ['https://freesound.org/data/previews/331/331912_3248244-lq.mp3'],
  volume: 1.0
});

// Анимация
function animate() {
  requestAnimationFrame(animate);

  // Обновление игрока
  player.update();

  // Враги следуют за игроком
  enemies.forEach(e => e.follow(player));

  // Свет фонарика следует за игроком
  light.position.set(camera.position.x, camera.position.y, camera.position.z);

  // Случайный jump scare
  randomScare(jumpscare, overlay);

  // Рендер сцены
  renderer.render(scene, camera);
}

// Запуск анимации
animate();

// Обработка изменения размера окна
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
