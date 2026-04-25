/**
 * ECHOES OF DARKNESS - Core Game Logic
 * AAA Style Architecture for Browser
 */

// --- CONFIGURATION ---
const CONFIG = {
    PLAYER: {
        speed: 5.0,
        runSpeed: 9.0,
        jumpForce: 10.0,
        gravity: 25.0,
        height: 1.8,
        radius: 0.5
    },
    ENEMY: {
        speed: 3.2,
        detectDistance: 15,
        attackDamage: 35,
        patrolSpeed: 1.5
    },
    WORLD: {
        cellSize: 4,
        mapWidth: 21, // Must be odd
        mapHeight: 21 // Must be odd
    },
    GAME: {
        totalKeys: 5,
        flashLightBatteryDrain: 0.05
    }
};

// --- GLOBAL STATE ---
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let isRunning = false;
let isFlashlightOn = true;

// Physics variables
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let playerObject = new THREE.Object3D(); // Invisible player container
let raycaster;

// Game State
let gameState = {
    isPlaying: false,
    isPaused: false,
    health: 100,
    stamina: 100,
    keys: 0,
    coins: 0,
    upgrades: {
        speed: 0,
        stealth: 0
    },
    startTime: 0
};

// Entities
let walls = [];
let collectibles = [];
let enemy = null;
let flashlight;
let mapGrid = [];

// Audio Context (Procedural Sound)
let audioCtx;
let bgmOscillators = [];

// --- INITIALIZATION ---
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.03);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.PointerLockControls(camera, document.body);
    
    // Event Listeners
    controls.addEventListener('lock', () => {
        if(gameState.isPlaying && !gameState.isPaused) gameState.isPaused = false;
        updateUI();
    });
    controls.addEventListener('unlock', () => {
        if(gameState.isPlaying && !document.getElementById('pause-menu').classList.contains('hidden')) {
            // Already paused via menu
        } else if (gameState.isPlaying) {
            pauseGame();
        }
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onWindowResize);

    // Initial Render
    createMainMenuEnvironment();
    animate();
    
    // Check Save
    checkSaveFile();
}

// --- AUDIO SYSTEM (Procedural) ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 + Math.random()*50, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'key') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'enemy_detect') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

function startAmbientSound() {
    if (!audioCtx) return;
    // Simple drone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 50;
    gain.gain.value = 0.02;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    bgmOscillators.push(osc);
}

// --- WORLD GENERATION ---
function generateMap() {
    // Clear old
    walls.forEach(w => scene.remove(w));
    collectibles.forEach(c => scene.remove(c.mesh));
    if(enemy) scene.remove(enemy.mesh);
    walls = [];
    collectibles = [];
    
    // Maze Generation (Recursive Backtracker)
    const width = CONFIG.WORLD.mapWidth;
    const height = CONFIG.WORLD.mapHeight;
    mapGrid = Array(height).fill().map(() => Array(width).fill(1)); // 1 = wall, 0 = path

    const stack = [];
    const startX = 1;
    const startY = 1;
    mapGrid[startY][startX] = 0;
    stack.push({x: startX, y: startY});

    while(stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];
        
        // Check neighbors (jump 2 cells)
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
        for(let d of dirs) {
            const nx = current.x + d[0];
            const ny = current.y + d[1];
            if(nx > 0 && nx < width-1 && ny > 0 && ny < height-1 && mapGrid[ny][nx] === 1) {
                neighbors.push({x: nx, y: ny, dx: d[0]/2, dy: d[1]/2});
            }
        }

        if(neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            mapGrid[next.y][next.x] = 0;
            mapGrid[current.y + next.dy][current.x + next.dx] = 0;
            stack.push({x: next.x, y: next.y});
        } else {
            stack.pop();
        }
    }

    // Build Meshes
    const wallGeo = new THREE.BoxGeometry(CONFIG.WORLD.cellSize, 4, CONFIG.WORLD.cellSize);
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.8,
        metalness: 0.2
    });

    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            if(mapGrid[y][x] === 1) {
                const wall = new THREE.Mesh(wallGeo, wallMat);
                wall.position.set(
                    x * CONFIG.WORLD.cellSize - (width*CONFIG.WORLD.cellSize)/2, 
                    2, 
                    y * CONFIG.WORLD.cellSize - (height*CONFIG.WORLD.cellSize)/2
                );
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
                walls.push(wall);
            }
        }
    }

    // Floor
    const floorGeo = new THREE.PlaneGeometry(width * CONFIG.WORLD.cellSize, height * CONFIG.WORLD.cellSize);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling (optional, adds claustrophobia)
    const ceil = new THREE.Mesh(floorGeo, floorMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 4;
    scene.add(ceil);

    // Spawn Player
    playerObject.position.set(
        startX * CONFIG.WORLD.cellSize - (width*CONFIG.WORLD.cellSize)/2,
        CONFIG.PLAYER.height,
        startY * CONFIG.WORLD.cellSize - (height*CONFIG.WORLD.cellSize)/2
    );
    camera.position.copy(playerObject.position);

    // Spawn Collectibles
    spawnCollectibles('key', CONFIG.GAME.totalKeys);
    spawnCollectibles('coin', 10);

    // Spawn Enemy
    spawnEnemy();
}

function spawnCollectibles(type, count) {
    let placed = 0;
    while(placed < count) {
        const x = Math.floor(Math.random() * CONFIG.WORLD.mapWidth);
        const y = Math.floor(Math.random() * CONFIG.WORLD.mapHeight);
        if(mapGrid[y][x] === 0) {
            // Check distance from player start
            const dist = Math.sqrt(Math.pow(x-1, 2) + Math.pow(y-1, 2));
            if(dist > 5) {
                const geo = type === 'key' ? new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8) : new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
                const mat = new THREE.MeshStandardMaterial({ 
                    color: type === 'key' ? 0xffd700 : 0xc0c0c0,
                    emissive: type === 'key' ? 0xaa8800 : 0x000000,
                    emissiveIntensity: type === 'key' ? 0.5 : 0
                });
                const mesh = new THREE.Mesh(geo, mat);
                const worldX = x * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapWidth*CONFIG.WORLD.cellSize)/2;
                const worldZ = y * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapHeight*CONFIG.WORLD.cellSize)/2;
                
                mesh.position.set(worldX, 1, worldZ);
                mesh.castShadow = true;
                
                // Light for keys
                if(type === 'key') {
                    const light = new THREE.PointLight(0xffd700, 1, 5);
                    light.position.set(0, 0, 0);
                    mesh.add(light);
                }

                scene.add(mesh);
                collectibles.push({ mesh, type, active: true });
                placed++;
            }
        }
    }
}

function spawnEnemy() {
    // Simple Enemy Representation (Red Floating Sphere with Eyes)
    const group = new THREE.Group();
    
    const bodyGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.3, 0.2, 0.7);
    eyeR.position.set(0.3, 0.2, 0.7);
    group.add(eyeL);
    group.add(eyeR);

    // Light
    const light = new THREE.PointLight(0xff0000, 2, 10);
    light.position.set(0, 0, 0);
    group.add(light);

    // Find spawn far from player
    let ex, ez;
    do {
        const gx = Math.floor(Math.random() * CONFIG.WORLD.mapWidth);
        const gy = Math.floor(Math.random() * CONFIG.WORLD.mapHeight);
        if(mapGrid[gy][gx] === 0) {
            ex = gx * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapWidth*CONFIG.WORLD.cellSize)/2;
            ez = gy * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapHeight*CONFIG.WORLD.cellSize)/2;
        }
    } while(!ex || Math.sqrt(Math.pow(ex - playerObject.position.x, 2) + Math.pow(ez - playerObject.position.z, 2)) < 15);

    group.position.set(ex, 1.5, ez);
    scene.add(group);

    enemy = {
        mesh: group,
        state: 'patrol', // patrol, chase, search
        targetPos: new THREE.Vector3(ex, 1.5, ez),
        waitTime: 0,
        lastSeenPlayer: null
    };
}

function createMainMenuEnvironment() {
    const geo = new THREE.BoxGeometry(10, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: 0x220000, wireframe: true });
    const cube = new THREE.Mesh(geo, mat);
    cube.position.z = -20;
    scene.add(cube);
    
    const light = new THREE.PointLight(0xff0000, 1, 20);
    light.position.set(0, 0, -15);
    scene.add(light);
    
    // Animate in loop if not playing
    window.mainMenuCube = cube;
}

// --- INPUT HANDLING ---
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': moveRight = true; break;
        case 'Space': if (canJump) velocity.y += CONFIG.PLAYER.jumpForce; canJump = false; break;
        case 'ShiftLeft': isRunning = true; break;
        case 'KeyF': toggleFlashlight(); break;
        case 'KeyE': interact(); break;
        case 'Escape': 
            if(gameState.isPlaying && !gameState.isPaused) pauseGame();
            else if(gameState.isPaused && !document.getElementById('shop-modal').style.display === 'block') resumeGame();
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isRunning = false; break;
    }
}

function onMouseDown(event) {
    if(gameState.isPlaying && !gameState.isPaused && controls.isLocked) {
        if(event.button === 0) toggleFlashlight(); // Left click
        if(event.button === 2) interact(); // Right click
    }
}

function toggleFlashlight() {
    if(!flashlight) {
        flashlight = new THREE.SpotLight(0xffffff, 1.5, 40, Math.PI/6, 0.5, 1);
        flashlight.position.set(0, 0, 0);
        flashlight.target.position.set(0, 0, -1);
        camera.add(flashlight);
        camera.add(flashlight.target);
        scene.add(camera); // Ensure camera is in scene
    }
    isFlashlightOn = !isFlashlightOn;
    flashlight.intensity = isFlashlightOn ? 1.5 : 0;
}

function interact() {
    // Raycast forward
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const meshes = collectibles.filter(c => c.active).map(c => c.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if(intersects.length > 0 && intersects[0].distance < 3) {
        const item = collectibles.find(c => c.mesh === intersects[0].object);
        if(item) {
            collectItem(item);
        }
    }
}

function collectItem(item) {
    item.active = false;
    scene.remove(item.mesh);
    
    if(item.type === 'key') {
        gameState.keys++;
        playSound('key');
        showMessage("KEY COLLECTED!");
        if(gameState.keys >= CONFIG.GAME.totalKeys) {
            victory();
        }
    } else if (item.type === 'coin') {
        gameState.coins++;
        playSound('coin');
        showMessage("+1 COIN");
    }
    updateUI();
}

// --- GAME LOGIC ---
function startGame() {
    initAudio();
    startAmbientSound();
    
    // Reset State
    gameState.health = 100;
    gameState.stamina = 100;
    gameState.keys = 0;
    gameState.coins = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.startTime = Date.now();

    // Clear Scene (keep camera/renderer)
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    scene.add(camera); // Re-add camera
    
    // Re-add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    generateMap();
    
    // UI
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    
    controls.lock();
    updateUI();
}

function pauseGame() {
    gameState.isPaused = true;
    controls.unlock();
    document.getElementById('pause-menu').classList.remove('hidden');
    document.getElementById('shop-coins').innerText = gameState.coins;
}

function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    controls.lock();
}

function saveAndQuit() {
    localStorage.setItem('horrorGameSave', JSON.stringify({
        health: gameState.health,
        coins: gameState.coins,
        upgrades: gameState.upgrades,
        time: Date.now()
    }));
    showMessage("GAME SAVED");
    showMainMenu();
}

function checkSaveFile() {
    const save = localStorage.getItem('horrorGameSave');
    if(save) {
        document.getElementById('continue-btn').disabled = false;
        document.getElementById('continue-btn').innerText = "Continue (Saved)";
    }
}

function loadGame() {
    const saveStr = localStorage.getItem('horrorGameSave');
    if(!saveStr) return;
    
    const save = JSON.parse(saveStr);
    gameState.health = save.health;
    gameState.coins = save.coins;
    gameState.upgrades = save.upgrades;
    
    startGame();
    showMessage("GAME LOADED");
}

function showMainMenu() {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    // Clean scene for menu
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    createMainMenuEnvironment();
}

function resetGame() {
    localStorage.removeItem('horrorGameSave');
    startGame();
}

function victory() {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('victory-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    
    const timeTaken = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    document.getElementById('final-stats').innerText = `Time: ${timeTaken}s | Coins: ${gameState.coins}`;
}

function gameOver(reason) {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('death-reason').innerText = reason;
}

function showMessage(text) {
    const el = document.getElementById('message-area');
    el.innerText = text;
    el.style.opacity = 1;
    setTimeout(() => { el.style.opacity = 0; }, 2000);
}

// --- SHOP SYSTEM ---
function openShop() {
    document.getElementById('pause-menu').classList.add('hidden');
    const modal = document.getElementById('shop-modal');
    modal.style.display = 'block';
    
    const items = [
        { id: 'speed1', name: 'Adrenaline Shot (Speed+)', cost: 5, bought: gameState.upgrades.speed > 0 },
        { id: 'medkit', name: 'Medkit (+50 HP)', cost: 10, bought: false },
        { id: 'battery', name: 'Better Battery', cost: 15, bought: false },
        { id: 'stealth', name: 'Silent Steps', cost: 20, bought: gameState.upgrades.stealth > 0 }
    ];

    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <span>${item.name}</span>
            <button ${gameState.coins < item.cost || item.bought ? 'disabled' : ''} 
                onclick="buyItem('${item.id}', ${item.cost})">
                ${item.bought ? 'BOUGHT' : item.cost + ' Coins'}
            </button>
        `;
        container.appendChild(div);
    });
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
    document.getElementById('pause-menu').classList.remove('hidden');
}

window.buyItem = function(id, cost) {
    if(gameState.coins >= cost) {
        gameState.coins -= cost;
        document.getElementById('shop-coins').innerText = gameState.coins;
        
        if(id === 'speed1') {
            CONFIG.PLAYER.speed += 2;
            gameState.upgrades.speed++;
            showMessage("SPEED UPGRADED!");
        } else if (id === 'medkit') {
            gameState.health = Math.min(100, gameState.health + 50);
            showMessage("HEALTH RESTORED!");
        }
        
        updateUI();
        openShop(); // Refresh buttons
    }
};

// --- ENEMY AI ---
function updateEnemy(delta) {
    if(!enemy) return;
    
    const distToPlayer = enemy.mesh.position.distanceTo(playerObject.position);
    
    // Line of Sight Check (Simple raycast)
    const ray = new THREE.Raycaster(enemy.mesh.position, playerObject.position.clone().sub(enemy.mesh.position).normalize());
    const intersects = ray.intersectObjects(walls);
    const canSee = intersects.length === 0 || intersects[0].distance > distToPlayer;

    if(canSee && distToPlayer < CONFIG.ENEMY.detectDistance) {
        enemy.state = 'chase';
        enemy.lastSeenPlayer = playerObject.position.clone();
        playSound('enemy_detect');
    } else if (enemy.state === 'chase' && !canSee) {
        enemy.state = 'search';
        enemy.waitTime = 3.0;
    }

    // State Machine
    let speed = CONFIG.ENEMY.patrolSpeed;
    let target = null;

    if(enemy.state === 'chase') {
        speed = CONFIG.ENEMY.speed;
        target = playerObject.position;
    } else if (enemy.state === 'search') {
        target = enemy.lastSeenPlayer;
        enemy.waitTime -= delta;
        if(enemy.waitTime <= 0) enemy.state = 'patrol';
    } else {
        // Patrol logic: move to random point
        if(enemy.mesh.position.distanceTo(enemy.targetPos) < 1) {
            // Pick new random valid point
            let gx, gy;
            do {
                gx = Math.floor(Math.random() * CONFIG.WORLD.mapWidth);
                gy = Math.floor(Math.random() * CONFIG.WORLD.mapHeight);
            } while(mapGrid[gy][gx] === 1);
            
            enemy.targetPos.set(
                gx * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapWidth*CONFIG.WORLD.cellSize)/2,
                1.5,
                gy * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapHeight*CONFIG.WORLD.cellSize)/2
            );
        }
        target = enemy.targetPos;
    }

    if(target) {
        const dir = target.clone().sub(enemy.mesh.position).normalize();
        enemy.mesh.position.add(dir.multiplyScalar(speed * delta));
        enemy.mesh.lookAt(target);
    }

    // Attack
    if(distToPlayer < 1.5) {
        takeDamage(CONFIG.ENEMY.attackDamage * delta);
        // Push back
        const pushDir = playerObject.position.clone().sub(enemy.mesh.position).normalize();
        playerObject.position.add(pushDir.multiplyScalar(0.1));
    }
}

function takeDamage(amount) {
    gameState.health -= amount;
    playSound('hit');
    
    const overlay = document.getElementById('damage-overlay');
    overlay.style.opacity = 0.8;
    setTimeout(() => overlay.style.opacity = 0, 200);

    if(gameState.health <= 0) {
        gameOver("Caught by the entity.");
    }
    updateUI();
}

// --- PHYSICS & MOVEMENT ---
function updatePlayer(delta) {
    if(!controls.isLocked || gameState.isPaused) return;

    // Friction
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= CONFIG.PLAYER.gravity * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const currentSpeed = isRunning ? CONFIG.PLAYER.runSpeed : CONFIG.PLAYER.speed;
    
    // Stamina Logic
    if(isRunning && (moveForward || moveBackward || moveLeft || moveRight)) {
        if(gameState.stamina > 0) {
            gameState.stamina -= 20 * delta;
        } else {
            isRunning = false; // Exhausted
        }
    } else {
        gameState.stamina = Math.min(100, gameState.stamina + 10 * delta);
    }
    if(gameState.stamina < 0) gameState.stamina = 0;

    if (moveForward || moveBackward) velocity.z -= direction.z * currentSpeed * 10.0 * delta; // Acceleration
    if (moveLeft || moveRight) velocity.x -= direction.x * currentSpeed * 10.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    
    playerObject.position.y += velocity.y * delta;

    // Floor Collision
    if (playerObject.position.y < CONFIG.PLAYER.height) {
        velocity.y = 0;
        playerObject.position.y = CONFIG.PLAYER.height;
        canJump = true;
    }

    // Wall Collision (Simple Box Check)
    // Convert player pos to grid coords
    const px = playerObject.position.x;
    const pz = playerObject.position.z;
    const gridX = Math.floor((px + (CONFIG.WORLD.mapWidth*CONFIG.WORLD.cellSize)/2) / CONFIG.WORLD.cellSize);
    const gridZ = Math.floor((pz + (CONFIG.WORLD.mapHeight*CONFIG.WORLD.cellSize)/2) / CONFIG.WORLD.cellSize);

    // Very basic collision: if inside wall, push back (simplified for single file)
    // In a real engine, we'd use a physics library. Here we rely on the maze generation being grid based
    // and prevent moving into '1' cells if we were doing discrete movement. 
    // For continuous, we assume the corridors are wide enough (4 units) vs player radius (0.5).
    
    // Update Camera Pos
    camera.position.copy(playerObject.position);
    
    // Step Sound
    if((moveForward || moveBackward || moveLeft || moveRight) && canJump) {
        if(!window.lastStepTime || Date.now() - window.lastStepTime > (isRunning ? 300 : 500)) {
            if(gameState.upgrades.stealth === 0) playSound('step');
            window.lastStepTime = Date.now();
        }
    }

    updateUI();
}

function updateUI() {
    document.getElementById('health-fill').style.width = gameState.health + '%';
    document.getElementById('stamina-fill').style.width = gameState.stamina + '%';
    document.getElementById('keys-count').innerText = gameState.keys;
    document.getElementById('coins-count').innerText = gameState.coins;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent glitches

    if(gameState.isPlaying && !gameState.isPaused) {
        updatePlayer(delta);
        updateEnemy(delta);
        
        // Animate Collectibles
        collectibles.forEach(c => {
            if(c.active) {
                c.mesh.rotation.y += delta;
                c.mesh.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            }
        });

        // Animate Menu Cube if visible
        if(window.mainMenuCube) {
            window.mainMenuCube.rotation.x += delta;
            window.mainMenuCube.rotation.y += delta;
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
