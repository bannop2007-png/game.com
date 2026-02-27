class Room {
  constructor(scene) {
    let floorTex = new THREE.TextureLoader().load('assets/textures/floor.jpg');
    let wallTex = new THREE.TextureLoader().load('assets/textures/wall.jpg');

    // Floor
    let floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshPhongMaterial({map:floorTex}));
    floor.rotation.x = -Math.PI/2;
    scene.add(floor);

    // Walls
    let wallMat = new THREE.MeshPhongMaterial({map:wallTex});
    let wall1 = new THREE.Mesh(new THREE.BoxGeometry(50,5,1), wallMat);
    wall1.position.set(0,2.5,-25);
    scene.add(wall1);

    let wall2 = wall1.clone();
    wall2.position.set(0,2.5,25);
    scene.add(wall2);

    let wall3 = new THREE.Mesh(new THREE.BoxGeometry(1,5,50), wallMat);
    wall3.position.set(-25,2.5,0);
    scene.add(wall3);

    let wall4 = wall3.clone();
    wall4.position.set(25,2.5,0);
    scene.add(wall4);
  }
}
