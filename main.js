class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();
        this.player = null;
        this.enemy = null;
        this.input = null;
        this.animationId = null;
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, CONFIG.GRAPHICS.fogDensity);

        // Camera
        this.camera = new THREE.PerspectiveCamera(CONFIG.PLAYER.fov, window.innerWidth/window.innerHeight, 0.1, 1000);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // False for perf
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = CONFIG.GRAPHICS.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Post Processing (Bloom)
        this.setupPostProcessing();

        // Controls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.input = new InputHandler(this.camera);
        
        // Events
        this.controls.addEventListener('lock', () => {
            if(GameState.isPlaying) GameState.isPaused = false;
        });
        this.controls.addEventListener('unlock', () => {
            if(GameState.isPlaying && !document.getElementById('pause-menu').classList.contains('hidden')) return;
            if(GameState.isPlaying) this.pause();
        });

        document.addEventListener('keydown', (e) => {
            if(e.code === 'Escape' && GameState.isPlaying && !GameState.isPaused) this.pause();
            if(e.code === 'KeyE' && GameState.isPlaying && !GameState.isPaused) this.interact();
        });

        // UI Bindings
        this.bindUI();
        SettingsManager.init();
        UIManager.setContinueButton();

        // Start Loop
        this.animate();
    }

    setupPostProcessing() {
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            CONFIG.GRAPHICS.bloomStrength,
            CONFIG.GRAPHICS.bloomRadius,
            CONFIG.GRAPHICS.bloomThreshold
        );
        
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
    }

    updateGraphics() {
        const q = GameState.settings.quality;
        if(q === 'low') {
            this.scene.fog.density = 0.06;
            this.renderer.shadowMap.enabled = false;
            bloomPass.strength = 0.5;
        } else if (q === 'high') {
            this.scene.fog.density = 0.03;
            this.renderer.shadowMap.enabled = true;
            bloomPass.strength = 2.0;
        }
    }

    startGame(loadSave = false) {
        AudioSys.init();
        AudioSys.playAmbience();

        GameState.health = 100;
        GameState.stamina = 100;
        GameState.keys = 0;
        GameState.isPlaying = true;
        GameState.isPaused = false;
        GameState.startTime = Date.now();

        if(loadSave) {
            const data = SaveSystem.load();
            if(data) {
                GameState.health = data.health;
                GameState.keys = data.keys;
                GameState.startTime = Date.now() - data.time;
            }
        }

        // Clear Scene Entities
        if(this.enemy) this.scene.remove(this.enemy.mesh);
        Level1.generate(this.scene, this.camera.position);
        
        this.player = new Player(this.camera, this.input);
        this.player.setupFlashlight(this.scene);
        
        this.enemy = new Enemy(this.scene, this.camera, wallsMeshes);

        UIManager.show('hud');
        this.controls.lock();
        UIManager.updateHUD();
    }

    pause() {
        GameState.isPaused = true;
        this.controls.unlock();
        UIManager.show('pause-menu');
    }

    resume() {
        GameState.isPaused = false;
        UIManager.show('hud');
        this.controls.lock();
    }

    interact() {
        // Check items
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), this.camera);
        const hits = ray.intersectObjects(collectibles.map(c=>c.mesh));
        
        if(hits.length && hits[0].distance < 3) {
            const item = collectibles.find(c=>c.mesh===hits[0].object);
            if(item && item.active) {
                item.active = false;
                this.scene.remove(item.mesh);
                if(item.type === 'key') {
                    GameState.keys++;
                    AudioSys.playKeyPickup();
                    UIManager.updateHUD();
                    if(GameState.keys >= CONFIG.GAME.totalKeys) this.victory();
                }
            }
        }
    }

    takeDamage(amount) {
        GameState.health -= amount;
        UIManager.updateHUD();
        // Red flash
        const overlay = document.createElement('div');
        overlay.style.position='absolute'; overlay.style.top='0'; overlay.style.left='0';
        overlay.style.width='100%'; overlay.style.height='100%';
        overlay.style.boxShadow='inset 0 0 100px red'; overlay.style.pointerEvents='none';
        document.body.appendChild(overlay);
        setTimeout(()=>overlay.remove(), 200);

        if(GameState.health <= 0) this.gameOver();
    }

    gameOver() {
        GameState.isPlaying = false;
        this.controls.unlock();
        UIManager.show('death-screen');
        SaveSystem.delete();
    }

    victory() {
        GameState.isPlaying = false;
        this.controls.unlock();
        document.getElementById('final-time').innerText = 'Time: ' + Utils.formatTime(Date.now() - GameState.startTime);
        UIManager.show('victory-screen');
        SaveSystem.delete();
    }

    saveAndQuit() {
        SaveSystem.save();
        GameState.isPlaying = false;
        this.controls.unlock();
        UIManager.show('main-menu');
        UIManager.setContinueButton();
    }

    bindUI() {
        document.getElementById('btn-new-game').onclick = () => this.startGame(false);
        document.getElementById('btn-continue').onclick = () => this.startGame(true);
        document.getElementById('btn-settings').onclick = () => UIManager.show('settings-menu');
        document.getElementById('btn-back-settings').onclick = () => UIManager.show('main-menu');
        document.getElementById('btn-exit').onclick = () => {
            window.close(); // Might not work in all browsers
            alert("Close the tab to exit.");
        };
        
        document.getElementById('btn-resume').onclick = () => this.resume();
        document.getElementById('btn-save-quit').onclick = () => this.saveAndQuit();
        
        document.getElementById('btn-respawn').onclick = () => this.startGame(false);
        document.getElementById('btn-death-menu').onclick = () => UIManager.show('main-menu');
        document.getElementById('btn-victory-menu').onclick = () => UIManager.show('main-menu');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();

        if(GameState.isPlaying && !GameState.isPaused) {
            this.player.update(delta, wallsMeshes);
            if(this.enemy) this.enemy.update(delta, time);
            
            // Animate items
            collectibles.forEach(c => {
                if(c.active) {
                    c.mesh.rotation.y += delta;
                    c.mesh.position.y = 1 + Math.sin(time*3)*0.2;
                }
            });

            // Step sounds
            if((this.input.isDown('KeyW')||this.input.isDown('KeyS')) && Math.random()<0.05) {
                AudioSys.playStep();
            }
        }

        if(this.composer) this.composer.render();
        else this.renderer.render(this.scene, this.camera);
    }
}

// Global Instance
const Game = new Game();
window.onload = () => Game.init();
