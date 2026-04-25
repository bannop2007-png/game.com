/**
 * GAME_CORE.JS - Исправленная версия
 */

// --- INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.035);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, document.body);
    
    controls.addEventListener('lock', () => {
        if(gameState.isPlaying) gameState.isPaused = false;
        updateUI();
    });
    controls.addEventListener('unlock', () => {
        if(gameState.isPlaying && !document.getElementById('pause-menu').classList.contains('hidden')) return;
        if(gameState.isPlaying) pauseGame();
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambient);

    flashlight = new THREE.SpotLight(0xffffff, CONFIG.GAME.flashLightIntensity, 40, Math.PI/6, 0.5, 1);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    loadSettings();
    checkSave();
    animate();
}

// --- WORLD GENERATION ---
function generateWorld() {
    walls.forEach(w => scene.remove(w));
    collectibles.forEach(c => scene.remove(c.mesh));
    if(enemySystem && enemySystem.mesh) scene.remove(enemySystem.mesh);
    walls = [];
    collectibles = [];

    const w = CONFIG.WORLD.mapWidth;
    const h = CONFIG.WORLD.mapHeight;
    mapGrid = Array(h).fill().map(() => Array(w).fill(1));
    
    const stack = [{x:1, y:1}];
    mapGrid[1][1] = 0;

    while(stack.length) {
        const cur = stack[stack.length-1];
        const dirs = [[0,-2],[0,2],[-2,0],[2,0]];
        const neighbors = [];
        
        for(let d of dirs) {
            const nx = cur.x + d[0], ny = cur.y + d[1];
            if(nx>0 && nx<w-1 && ny>0 && ny<h-1 && mapGrid[ny][nx]===1) {
                neighbors.push({x:nx, y:ny, dx:d[0]/2, dy:d[1]/2});
            }
        }

        if(neighbors.length) {
            const next = neighbors[Math.floor(Math.random()*neighbors.length)];
            mapGrid[next.y][next.x] = 0;
            mapGrid[cur.y+next.dy][cur.x+next.dx] = 0;
            stack.push({x:next.x, y:next.y});
        } else {
            stack.pop();
        }
    }

    const geo = new THREE.BoxGeometry(CONFIG.WORLD.cellSize, 4, CONFIG.WORLD.cellSize);
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

    for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
            if(mapGrid[y][x] === 1) {
                const wall = new THREE.Mesh(geo, mat);
                wall.position.set(
                    x*CONFIG.WORLD.cellSize - (w*CONFIG.WORLD.cellSize)/2,
                    2,
                    y*CONFIG.WORLD.cellSize - (h*CONFIG.WORLD.cellSize)/2
                );
                wall.castShadow = true;
                wall.receiveShadow = true;
                scene.add(wall);
                walls.push(wall);
            }
        }
    }

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(w*CONFIG.WORLD.cellSize, h*CONFIG.WORLD.cellSize),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    scene.add(floor);

    playerObj.position.set(
        1*CONFIG.WORLD.cellSize - (w*CONFIG.WORLD.cellSize)/2,
        CONFIG.PLAYER.height,
        1*CONFIG.WORLD.cellSize - (h*CONFIG.WORLD.cellSize)/2
    );
    camera.position.copy(playerObj.position);

    spawnItems('key', CONFIG.GAME.totalKeys);
    spawnItems('coin', 10);

    enemySystem = new EnemySystem(scene, camera, walls);
    
    let ex, ez, attempts = 0;
    do {
        const gx = Math.floor(Math.random()*w);
        const gy = Math.floor(Math.random()*h);
        if(mapGrid[gy][gx]===0) {
            ex = gx*CONFIG.WORLD.cellSize - (w*CONFIG.WORLD.cellSize)/2;
            ez = gy*CONFIG.WORLD.cellSize - (h*CONFIG.WORLD.cellSize)/2;
        }
        attempts++;
    } while((!ex || Math.sqrt(Math.pow(ex-playerObj.position.x,2)+Math.pow(ez-playerObj.position.z,2)) < 15) && attempts < 100);
    
    if(ex) enemySystem.mesh.position.set(ex, 0, ez);
}

function spawnItems(type, count) {
    let placed = 0;
    while(placed < count) {
        const gx = Math.floor(Math.random()*CONFIG.WORLD.mapWidth);
        const gy = Math.floor(Math.random()*CONFIG.WORLD.mapHeight);
        if(mapGrid[gy][gx]===0) {
            const dist = Math.sqrt(Math.pow(gx-1,2)+Math.pow(gy-1,2));
            if(dist > 6) {
                const geo = type==='key' ? new THREE.TorusKnotGeometry(0.3,0.1,32,8) : new THREE.CylinderGeometry(0.2,0.2,0.1,16);
                const mat = new THREE.MeshStandardMaterial({ 
                    color: type==='key'?0xffd700:0xc0c0c0, 
                    emissive: type==='key'?0xaa6600:0x000000,
                    emissiveIntensity: type==='key'?0.6:0
                });
                const mesh = new THREE.Mesh(geo, mat);
                const x = gx*CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapWidth*CONFIG.WORLD.cellSize)/2;
                const z = gy*CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapHeight*CONFIG.WORLD.cellSize)/2;
                mesh.position.set(x, 1, z);
                mesh.castShadow = true;
                scene.add(mesh);
                collectibles.push({mesh, type, active:true});
                placed++;
            }
        }
    }
}

// --- INPUT & LOGIC ---
let moveF=false, moveB=false, moveL=false, moveR=false, isRun=false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

function onKeyDown(e) {
    switch(e.code) {
        case 'KeyW': moveF=true; break;
        case 'KeyS': moveB=true; break;
        case 'KeyA': moveL=true; break;
        case 'KeyD': moveR=true; break;
        case 'ShiftLeft': isRun=true; break;
        case 'KeyF': toggleFlashlight(); break;
        case 'KeyE': interact(); break;
        case 'Escape': 
            if(gameState.isPlaying && !gameState.isPaused) pauseGame();
            else if(gameState.isPaused) resumeGame();
            break;
    }
}

function onKeyUp(e) {
    switch(e.code) {
        case 'KeyW': moveF=false; break;
        case 'KeyS': moveB=false; break;
        case 'KeyA': moveL=false; break;
        case 'KeyD': moveR=false; break;
        case 'ShiftLeft': isRun=false; break;
    }
}

function toggleFlashlight() {
    if(flashlight) flashlight.intensity = flashlight.intensity > 0 ? 0 : CONFIG.GAME.flashLightIntensity;
}

function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const targets = collectibles.filter(c=>c.active).map(c=>c.mesh);
    const hits = ray.intersectObjects(targets);
    
    if(hits.length && hits[0].distance < 3) {
        const item = collectibles.find(c=>c.mesh===hits[0].object);
        if(item) collectItem(item);
    }
}

function collectItem(item) {
    item.active = false;
    scene.remove(item.mesh);
    if(item.type === 'key') {
        gameState.keys++;
        showMessage("KEY FOUND!");
        if(gameState.keys >= CONFIG.GAME.totalKeys) victory();
    }
    updateUI();
}

function takeDamage(amount) {
    gameState.health -= amount;
    const overlay = document.getElementById('damage-overlay');
    overlay.style.opacity = 0.8;
    setTimeout(()=>overlay.style.opacity=0, 200);
    
    if(gameState.health <= 0) gameOver("Caught by the Stalker");
    updateUI();
}

// --- GAME FLOW ---
function startGame() {
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();

    gameState.health = 100;
    gameState.stamina = 100;
    gameState.keys = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.startTime = Date.now();

    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    generateWorld();
    controls.lock();
    updateUI();
}

function pauseGame() {
    gameState.isPaused = true;
    controls.unlock();
    document.getElementById('pause-menu').classList.remove('hidden');
}

function resumeGame() {
    gameState.isPaused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    controls.lock();
}

function saveGame() {
    const data = {
        health: gameState.health,
        keys: gameState.keys,
        time: Date.now(),
        settings: {
            sensitivity: document.getElementById('sens-slider').value,
            volume: document.getElementById('vol-slider').value
        }
    };
    localStorage.setItem(CONFIG.GAME.saveKey, JSON.stringify(data));
    showMessage("GAME SAVED");
}

function saveAndQuit() {
    saveGame();
    showMainMenu();
}

function checkSave() {
    const save = localStorage.getItem(CONFIG.GAME.saveKey);
    if(save) {
        document.getElementById('continue-btn').disabled = false;
    }
}

function loadGame() {
    const saveStr = localStorage.getItem(CONFIG.GAME.saveKey);
    if(!saveStr) return;
    const data = JSON.parse(saveStr);
    
    gameState.health = data.health || 100;
    gameState.keys = data.keys || 0;
    
    if(data.settings) {
        document.getElementById('sens-slider').value = data.settings.sensitivity;
        document.getElementById('vol-slider').value = data.settings.volume;
    }

    startGame();
    showMessage("GAME LOADED");
}

function showMainMenu() {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function resetGame() {
    localStorage.removeItem(CONFIG.GAME.saveKey);
    startGame();
}

function gameOver(reason) {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('death-reason').innerText = reason;
}

function victory() {
    gameState.isPlaying = false;
    controls.unlock();
    document.getElementById('victory-screen').classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
}

function showMessage(text) {
    const el = document.getElementById('message-area');
    el.innerText = text;
    el.style.opacity = 1;
    setTimeout(()=>el.style.opacity=0, 2000);
}

function updateUI() {
    document.getElementById('health-fill').style.width = gameState.health + '%';
    document.getElementById('stamina-fill').style.width = gameState.stamina + '%';
    document.getElementById('keys-count').innerText = gameState.keys;
}

function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- SETTINGS ---
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function saveSettings() {
    const sens = document.getElementById('sens-slider').value;
    const vol = document.getElementById('vol-slider').value;
    localStorage.setItem('horror_settings', JSON.stringify({sens, vol}));
    // Apply sensitivity logic here if needed
}

function loadSettings() {
    const saved = localStorage.getItem('horror_settings');
    if(saved) {
        const {sens, vol} = JSON.parse(saved);
        document.getElementById('sens-slider').value = sens;
        document.getElementById('vol-slider').value = vol;
    }
}

// --- AUDIO SYSTEM ---
function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    const vol = parseFloat(document.getElementById('vol-slider').value) || 0.5;

    if (type === 'scare') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gain.gain.setValueAtTime(0.3 * vol, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'heartbeat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
        gain.gain.setValueAtTime(0.2 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0.05 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();

    if(gameState.isPlaying && !gameState.isPaused && controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveF) - Number(moveB);
        direction.x = Number(moveR) - Number(moveL);
        direction.normalize();

        const speed = isRun ? CONFIG.PLAYER.runSpeed : CONFIG.PLAYER.speed;
        
        if(isRun && direction.length()>0) {
            gameState.stamina -= 20*delta;
            if(gameState.stamina<=0) { gameState.stamina=0; isRun=false; }
        } else {
            gameState.stamina = Math.min(100, gameState.stamina+15*delta);
        }

        if(moveF || moveB) velocity.z -= direction.z * speed * 10.0 * delta;
        if(moveL || moveR) velocity.x -= direction.x * speed * 10.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        playerObj.position.copy(camera.position);
        
        if((moveF||moveB||moveL||moveR) && Math.random()<0.1) playSound('step');

        if(enemySystem) enemySystem.update(delta, time);

        collectibles.forEach(c => {
            if(c.active) {
                c.mesh.rotation.y += delta;
                c.mesh.position.y = 1 + Math.sin(time*3)*0.2;
            }
        });

        updateUI();
    }

    renderer.render(scene, camera);
}

// Start
init();
