class Player {
    constructor(camera, input) {
        this.camera = camera;
        this.input = input;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.canJump = false;
        this.object = new THREE.Object3D();
        this.object.position.y = CONFIG.PLAYER.height;
        this.flashlight = null;
    }

    setupFlashlight(scene) {
        this.flashlight = new THREE.SpotLight(0xffffff, CONFIG.GAME.flashLightIntensity);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.angle = Math.PI / 6;
        this.flashlight.penumbra = 0.5;
        this.flashlight.distance = CONFIG.GAME.flashLightRange;
        this.flashlight.castShadow = true;
        this.flashlight.target.position.set(0, 0, -1);
        
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        scene.add(this.camera);
    }

    update(delta, walls) {
        if (!GameState.isPlaying || GameState.isPaused) return;

        // Friction
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= CONFIG.PLAYER.gravity * delta;

        // Input Direction
        this.direction.z = Number(this.input.isDown('KeyW')) - Number(this.input.isDown('KeyS'));
        this.direction.x = Number(this.input.isDown('KeyD')) - Number(this.input.isDown('KeyA'));
        this.direction.normalize();

        // Speed & Stamina
        const isRunning = this.input.isDown('ShiftLeft') && (this.direction.length() > 0);
        let speed = CONFIG.PLAYER.speed;

        if (isRunning) {
            if (GameState.stamina > 0) {
                speed = CONFIG.PLAYER.runSpeed;
                GameState.stamina -= 20 * delta;
            } else {
                isRunning = false; // Exhausted
            }
        } else {
            GameState.stamina = Math.min(100, GameState.stamina + 15 * delta);
        }
        if (GameState.stamina < 0) GameState.stamina = 0;

        // Apply Movement
        if (this.input.isDown('KeyW') || this.input.isDown('KeyS')) 
            this.velocity.z -= this.direction.z * speed * 10.0 * delta;
        if (this.input.isDown('KeyA') || this.input.isDown('KeyD')) 
            this.velocity.x -= this.direction.x * speed * 10.0 * delta;

        // Move Camera (PointerLockControls moves the camera object)
        // We simulate physics on a separate object and sync camera? 
        // Simpler: Move camera directly but handle collisions
        
        const oldPos = this.camera.position.clone();
        
        // Forward/Back
        this.camera.translateX(-this.velocity.x * delta);
        this.camera.translateZ(-this.velocity.z * delta);
        
        // Simple Wall Collision (Push back if inside)
        // In a real engine, use Raycasts. Here we check grid or simple bounds.
        // For this demo, we rely on the maze generation being wide enough, 
        // but let's add a basic boundary check if needed.
        
        // Floor
        if (this.camera.position.y < CONFIG.PLAYER.height) {
            this.velocity.y = 0;
            this.camera.position.y = CONFIG.PLAYER.height;
            this.canJump = true;
        }
        
        this.camera.position.y += this.velocity.y * delta;

        // Sync object
        this.object.position.copy(this.camera.position);
    }
}
