class Enemy {
  constructor(x, z) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1,1,1),
      new THREE.MeshPhongMaterial({color:0x880000})
    );
    this.mesh.position.set(x,0.5,z);
    this.speed = 0.02;
  }

  follow(player) {
    let dx = player.camera.position.x - this.mesh.position.x;
    let dz = player.camera.position.z - this.mesh.position.z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    if(dist>0.5){
      this.mesh.position.x += dx/dist * this.speed;
      this.mesh.position.z += dz/dist * this.speed;
    }
  }
}
