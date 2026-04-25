const SaveSystem = {
    save: () => {
        const data = {
            health: GameState.health,
            keys: GameState.keys,
            time: Date.now() - GameState.startTime,
            settings: GameState.settings
        };
        localStorage.setItem(CONFIG.GAME.saveKey, JSON.stringify(data));
        console.log('Game Saved');
        return true;
    },

    load: () => {
        const raw = localStorage.getItem(CONFIG.GAME.saveKey);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            GameState.health = data.health;
            GameState.keys = data.keys;
            GameState.settings = { ...GameState.settings, ...data.settings };
            return data;
        } catch (e) {
            console.error('Save file corrupted');
            return null;
        }
    },

    hasSave: () => !!localStorage.getItem(CONFIG.GAME.saveKey),

    delete: () => localStorage.removeItem(CONFIG.GAME.saveKey)
};
