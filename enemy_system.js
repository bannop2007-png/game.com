/**
 * ENEMY_SYSTEM.JS
 * Содержит: Модель монстра, AI (FSM), Анимации, Звуки страха
 */

class EnemySystem {
    constructor(scene, playerCamera, walls) {
        this.scene = scene;
        this.player = playerCamera; // Используем камеру как позицию игрока
        this.walls = walls;
        
        this.mesh = new THREE.Group();
        this.parts = {};
        this.state = 'PATROL'; // PATROL, CHASE, ATTACK, LOST
        this.patrolPoints = [];
        this.currentPointIdx = 0;
        this.waitTime = 0;
        this.lastKnownPos = null;
        
        this.createModel();
        this.generatePatrolPoints();
        scene.add(this.mesh);
    }

    createModel() {
        // Материалы
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.3 });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });

        // Торс (вытянутый)
        const torsoGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        this.parts.torso = new THREE.Mesh(torsoGeo, skinMat);
        this.parts.torso.position.y = 1.6;
        this.parts.torso.castShadow = true;
        this.mesh.add(this.parts.torso);

        // Голова (удлиненная)
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        this.parts.head = new THREE.Mesh(headGeo, skinMat);
        this.parts.head.position.set(0, 2.4, 0);
        this.parts.head.scale.set(1, 1.4, 0.8);
        this.parts.head.castShadow = true;
        this.mesh.add(this.parts.head);

        // Глаза (светящиеся, разные)
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat);
        eyeL.position.set(-0.15, 2.45, 0.28);
        this.mesh.add(eyeL);
        
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), glowMat);
        eyeR.position.set(0.16, 2.42, 0.29);
        this.mesh.add(eyeR);

        // Руки (очень длинные)
        const armGeo = new THREE.CylinderGeometry(0.09, 0.07, 1.5, 8);
        this.parts.armL = new THREE.Mesh(armGeo, skinMat);
        this.parts.armL.position.set(-0.55, 1.7, 0.3);
        this.parts.armL.rotation.x = Math.PI / 3;
        this.parts.armL.castShadow = true;
        this.mesh.add(this.parts.armL);

        this.parts.armR = new THREE.Mesh(armGeo, skinMat);
        this.parts.armR.position.set(0.55, 1.7, 0.3);
        this.parts.armR.rotation.x = Math.PI / 3;
        this.parts.armR.castShadow = true;
        this.mesh.add(this.parts.armR);

        // Ноги
        const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 1.0, 8);
        this.parts.legL = new THREE.Mesh(legGeo, skinMat);
        this.parts.legL.position.set(-0.2, 0.8, 0);
        this.mesh.add(this.parts.legL);

        this.parts.legR = new THREE.Mesh(legGeo, skinMat);
        this.parts.legR.position.set(0.2, 0.8, 0);
        this.mesh.add(this.parts.legR);

        // Свет от монстра
        const light = new THREE.PointLight(0xff0000, 1.5, 10);
        light.position.set(0, 2, 0);
        this.mesh.add(light);
    }

    generatePatrolPoints() {
        // Генерируем точки в пустых клетках лабиринта
        for(let i=0; i<8; i++) {
            let gx, gy;
            do {
                gx = Math.floor(Math.random() * CONFIG.WORLD.mapWidth);
                gy = Math.floor(Math.random() * CONFIG.WORLD.mapHeight);
            } while(mapGrid[gy][gx] === 1); // 1 = стена
            
            const x = gx * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapWidth * CONFIG.WORLD.cellSize)/2;
            const z = gy * CONFIG.WORLD.cellSize - (CONFIG.WORLD.mapHeight * CONFIG.WORLD.cellSize)/2;
            this.patrolPoints.push(new THREE.Vector3(x, 0, z));
        }
    }

    update(delta, time) {
        const pos = this.mesh.position;
        const playerPos = this.player.position;
        const dist = pos.distanceTo(playerPos);

        // Проверка видимости
        const canSee = this.checkLineOfSight(pos, playerPos);
        const inCone = this.checkViewCone(pos, playerPos);

        // Машина состояний
        if (this.state === 'PATROL' || this.state === 'LOST') {
            if (canSee && inCone && dist < CONFIG.ENEMY.viewDistance) {
                this.setState('CHASE');
            } else {
                this.updatePatrol(delta, time);
            }
        } 
        else if (this.state === 'CHASE') {
            if (canSee && inCone) {
                this.chasePlayer(delta, time);
                this.lastKnownPos = playerPos.clone();
            } else {
                this.lastKnownPos = playerPos.clone();
                this.setState('LOST');
            }

            if (dist < CONFIG.ENEMY.attackRange) {
                this.setState('ATTACK');
            }
        }
        else if (this.state === 'ATTACK') {
            this.animateAttack(time);
            if (dist > CONFIG.ENEMY.attackRange * 1.5) {
                this.setState('CHASE');
            } else {
                // Наносим урон
                if (Math.random() < 0.05) takeDamage(CONFIG.ENEMY.attackDamage * 0.1);
            }
        }

        // Поворот к игроку если близко
        if (dist < 15) {
            this.mesh.lookAt(playerPos.x, pos.y, playerPos.z);
        }

        // Обновление эффектов страха
        updateHorrorEffects(dist, this.player);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        if (newState === 'CHASE') playSound('scare');
    }

    checkLineOfSight(start, end) {
        const dir = end.clone().sub(start).normalize();
        const ray = new THREE.Raycaster(start, dir);
        const intersects = ray.intersectObjects(this.walls);
        if (intersects.length > 0) {
            return intersects[0].distance > start.distanceTo(end);
        }
        return true;
    }

    checkViewCone(start, end) {
        const forward = new THREE.Vector3();
        this.mesh.getWorldDirection(forward);
        const toPlayer = end.clone().sub(start).normalize();
        const angle = forward.angleTo(toPlayer);
        return angle < CONFIG.ENEMY.viewAngle / 2;
    }

    updatePatrol(delta, time) {
        this.animateIdle(time);
        const target = this.patrolPoints[this.currentPointIdx];
        const dist = this.mesh.position.distanceTo(target);

        if (dist < 1.5) {
            this.waitTime -= delta;
            if (this.waitTime <= 0) {
                this.currentPointIdx = (this.currentPointIdx + 1) % this.patrolPoints.length;
                this.waitTime = 2 + Math.random() * 3;
            }
        } else {
            this.moveTo(target, delta, CONFIG.ENEMY.patrolSpeed);
            this.animateWalk(time, 1);
        }
    }

    chasePlayer(delta, time) {
        this.moveTo(this.player.position, delta, CONFIG.ENEMY.chaseSpeed);
        this.animateWalk(time, 2.5);
    }

    moveTo(target, delta, speed) {
        const dir = target.clone().sub(this.mesh.position);
        dir.y = 0;
        dir.normalize();
        this.mesh.position.add(dir.multiplyScalar(speed * delta));
    }

    animateIdle(time) {
        if(!this.parts.torso) return;
        this.parts.torso.scale.y = 1 + Math.sin(time * 2) * 0.02;
        this.parts.head.rotation.z = Math.sin(time * 1.5) * 0.03;
        this.parts.armL.rotation.z = Math.sin(time) * 0.05;
        this.parts.armR.rotation.z = -Math.sin(time) * 0.05;
    }

    animateWalk(time, speedMult) {
        const cycle = time * speedMult * 2;
        this.parts.legL.rotation.x = Math.sin(cycle) * 0.6;
        this.parts.legR.rotation.x = Math.sin(cycle + Math.PI) * 0.6;
        this.parts.armL.rotation.x = Math.sin(cycle + Math.PI) * 0.4 + 1.0;
        this.parts.armR.rotation.x = Math.sin(cycle) * 0.4 + 1.0;
        this.mesh.position.y = Math.abs(Math.sin(cycle)) * 0.1;
    }

    animateAttack(time) {
        const lunge = Math.sin(time * 15) * 0.15;
        this.parts.armL.rotation.x = -1.2;
        this.parts.armR.rotation.x = -1.2;
        this.parts.torso.position.z = lunge;
    }
}

// --- HORROR EFFECTS & AUDIO ---

function updateHorrorEffects(dist, camera) {
    // Виньетка
    const intensity = Math.max(0, (15 - dist) / 15);
    document.getElementById('vignette').style.boxShadow = `inset 0 0 ${100 + intensity*100}px ${intensity*50}px black`;
    
    // Тряска камеры
    if (dist < 6) {
        const shake = (6 - dist) * 0.015;
        camera.position.x += (Math.random() - 0.5) * shake;
