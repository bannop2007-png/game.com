// ------------------ ENEMY ------------------
class Enemy {
  constructor(x, z) {
    // Создаём визуальный куб для врага
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0x880000 })
    );
    this.mesh.position.set(x, 0.5, z); // стартовая позиция врага
    this.speed = 0.03;                 // скорость движения
  }

  // Метод преследования игрока
  follow(player) {
    const dx = player.camera.position.x - this.mesh.position.x;
    const dz = player.camera.position.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Двигается к игроку, если расстояние больше минимального
    if (dist > 0.5) {
      this.mesh.position.x += (dx / dist) * this.speed;
      this.mesh.position.z += (dz / dist) * this.speed;
    }
  }
}
