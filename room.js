class Room {
  constructor(scene) {
    const floorTex = new THREE.TextureLoader().load('assets/textures/floor.jpg');
    const wallTex = new THREE.TextureLoader().load('assets/textures/wall.jpg');

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50,50),
      new THREE.MeshPhongMaterial({map: floorTex})
    );
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    const wallMat = new THREE.MeshPhongMaterial({map: wallTex});
    const walls = [
      new THREE.Mesh(new THREE.BoxGeometry(50,5,1), wallMat),
      new THREE.Mesh(new THREE.BoxGeometry(50,5,1), wallMat),
      new THREE.Mesh(new THREE.BoxGeometry(1,5,50), wallMat),
      new THREE.Mesh(new THREE.BoxGeometry(1,5,50), wallMat)
    ];
    walls[0].position.set(0,2.5,-25);
    walls[1].position.set(0,2.5,25);
    walls[2].position.set(-25,2.5,0);
    walls[3].position.set(25,2.5,0);
    walls.forEach(w=>scene.add(w));
  }
}
