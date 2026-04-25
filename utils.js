const Utils = {
    randomRange: (min, max) => Math.random() * (max - min) + min,
    
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    
    lerp: (start, end, t) => start * (1 - t) + end * t,
    
    formatTime: (ms) => {
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    // Простая проверка дистанции
    distance2D: (v1, v2) => Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.z - v2.z, 2))
};
