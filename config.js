/**
 * CONFIG.JS
 * Глобальные настройки игры и баланс
 */

const CONFIG = {
    PLAYER: {
        speed: 6.0,
        runSpeed: 11.0,
        jumpForce: 0, // В хорроре обычно нет прыжков для реализма
        gravity: 30.0,
        height: 1.7,
        radius: 0.6
    },
    ENEMY: {
        patrolSpeed: 2.5,
        chaseSpeed: 6.8, // Быстрее игрока, но медленнее бега
        attackDamage: 35,
        viewDistance: 25,
        viewAngle: Math.PI / 2.5, // ~70 градусов
        hearingDistance: 12,
        attackRange: 1.8
    },
    WORLD: {
        cellSize: 5,
        mapWidth: 21, // Должно быть нечетным для лабиринта
        mapHeight: 21
    },
    GAME: {
        totalKeys: 5,
        flashLightIntensity: 2.0,
        saveKey: 'horror_save_v1'
    }
};

// Глобальные переменные состояния (доступны везде)
let gameState = {
    isPlaying: false,
    isPaused: false,
    health: 100,
    stamina: 100,
    keys: 0,
    startTime: 0,
    upgrades: {}
};

// Системные переменные
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let playerObj = new THREE.Object3D();
let walls = [];
let collectibles = [];
let enemySystem = null;
let audioCtx = null;
let flashlight = null;
let mapGrid = [];
