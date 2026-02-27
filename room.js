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
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x222222 }); // тёмные стены

    const walls = [
      new THREE.Mesh(new THREE.BoxGeometry(50, 5, 1), wallMat), // передняя стена
      new THREE.Mesh(new THREE.BoxGeometry(50, 5, 1), wallMat), // задняя стена
      new THREE.Mesh(new THREE.BoxGeometry(1, 5, 50), wallMat), // левая стена
      new THREE.Mesh(new THREE.BoxGeometry(1, 5, 50), wallMat)  // правая стена
    ];

    // Позиционируем стены
    walls[0].position.set(0, 2.5, -25);
    walls[1].position.set(0, 2.5, 25);
    walls[2].position.set(-25, 2.5, 0);
    walls[3].position.set(25, 2.5, 0);

    walls.forEach(w => scene.add(w));
  }
}
