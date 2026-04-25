const CONFIG = {
    PLAYER: {
        speed: 6.0,
        runSpeed: 11.0,
        jumpForce: 0, // No jump for horror realism
        gravity: 30.0,
        height: 1.7,
        radius: 0.6,
        fov: 75
    },
    ENEMY: {
        patrolSpeed: 2.5,
        chaseSpeed: 7.2, // Faster than walk, slower than run
        attackDamage: 35,
        viewDistance: 25,
        viewAngle: Math.PI / 2.5,
        hearingDistance: 12,
        attackRange: 1.8,
        stunTime: 2.0
    },
    WORLD: {
        cellSize: 5,
        mapWidth: 21,
        mapHeight: 21,
        wallHeight: 4
    },
    GAME: {
        totalKeys: 5,
        flashLightIntensity: 2.5,
        flashLightRange: 40,
        saveKey: 'abyss_save_v1'
    },
    GRAPHICS: {
        shadows: true,
        fogDensity: 0.04,
        bloomStrength: 1.5,
        bloomRadius: 0.4,
        bloomThreshold: 0.85
    }
};

// Global State
const GameState = {
    isPlaying: false,
    isPaused: false,
    health: 100,
    stamina: 100,
    keys: 0,
    startTime: 0,
    settings: {
        quality: 'medium',
        sensitivity: 1.5,
        volume: 0.8
    }
};
