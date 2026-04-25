class InputHandler {
    constructor(camera) {
        this.camera = camera;
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Mouse look handled by PointerLockControls internally, 
        // but we listen for clicks for interaction
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && GameState.isPlaying && !GameState.isPaused) {
                // Left click action (e.g., flash toggle if needed)
            }
        });
    }

    isDown(code) { return !!this.keys[code]; }
}
