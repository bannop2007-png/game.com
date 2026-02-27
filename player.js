class Player {
  constructor(camera) {
    this.camera = camera;
    this.speed = 0.12;
    this.keys = {};
    document.addEventListener('keydown', e => this.keys[e.key.toLowerCase()]=true);
    document.addEventListener('keyup', e => this.keys[e.key.toLowerCase()]=false);
  }

  update() {
    if(this.keys['w']) this.camera.position.z -= this.speed;
    if(this.keys['s']) this.camera.position.z += this.speed;
    if(this.keys['a']) this.camera.position.x -= this.speed;
    if(this.keys['d']) this.camera.position.x += this.speed;
  }
}
