// ------------------ ROOM ------------------
class Room {
  constructor(scene) {
    // Пол
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshPhongMaterial({ color: 0x111111 }) // тёмный пол
    );
    floor.rotation.x = -Math.PI / 2; // повернуть горизонтально
    scene.add(floor);

    // Стены
   const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshPhongMaterial({ color: 0x444444 }) // не черный, а темно-серый
);

const wallMat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    // Позиционируем стены
    walls[0].position.set(0, 2.5, -25);
    walls[1].position.set(0, 2.5, 25);
    walls[2].position.set(-25, 2.5, 0);
    walls[3].position.set(25, 2.5, 0);

    walls.forEach(w => scene.add(w));
  }
}
