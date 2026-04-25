let mapGrid = [];
let wallsMeshes = [];
let collectibles = [];

const Level1 = {
    generate: (scene, playerStartPos) => {
        // Clear old
        wallsMeshes.forEach(w => scene.remove(w));
        collectibles.forEach(c => scene.remove(c.mesh));
        wallsMeshes = [];
        collectibles = [];

        const w = CONFIG.WORLD.mapWidth;
        const h = CONFIG.WORLD.mapHeight;
        mapGrid = Array(h).fill().map(() => Array(w).fill(1));

        // Maze Gen
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
            } else stack.pop();
        }

        // Build Walls
        const geo = new THREE.BoxGeometry(CONFIG.WORLD.cellSize, CONFIG.WORLD.wallHeight, CONFIG.WORLD.cellSize);
        const mat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        
        for(let y=0; y<h; y++) {
            for(let x=0; x<w; x++) {
                if(mapGrid[y][x] === 1) {
                    const wall = new THREE.Mesh(geo, mat);
                    wall.position.set(
                        x*CONFIG.WORLD.cellSize - (w*CONFIG.WORLD.cellSize)/2,
                        CONFIG.WORLD.wallHeight/2,
                        y*CONFIG.WORLD.cellSize - (h*CONFIG.WORLD.cellSize)/2
                    );
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    scene.add(wall);
                    wallsMeshes.push(wall);
                }
            }
        }

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(w*CONFIG.WORLD.cellSize, h*CONFIG.WORLD.cellSize),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
        );
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Player Start
        playerStartPos.set(
            1*CONFIG.WORLD.cellSize - (w*CONFIG.WORLD.cellSize)/2,
            CONFIG.PLAYER.height,
            1*CONFIG.WORLD.cellSize - (h*CONFIG.WORLD.cellSize)/2
        );

        // Items
        Level1.spawnItems(scene, 'key', CONFIG.GAME.totalKeys);
        Level1.spawnItems(scene, 'coin', 10);
    },

    spawnItems: (scene, type, count) => {
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
};
