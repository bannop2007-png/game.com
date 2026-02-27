// ------------------ PLAYER ------------------
class Player {
  constructor(camera) {
    this.camera = camera;  // камера, за которой движется игрок
    this.speed = 0.12;     // скорость движения
    this.keys = {};        // объект для отслеживания нажатых клавиш

    // События клавиатуры
    document.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
  }

  // Метод обновления позиции камеры по нажатым клавишам
  update() {
    if (this.keys['w']) this.camera.position.z -= this.speed;
    if (this.keys['s']) this.camera.position.z += this.speed;
    if (this.keys['a']) this.camera.position.x -= this.speed;
    if (this.keys['d']) this.camera.position.x += this.speed;
  }
}
