const SettingsManager = {
    init: () => {
        // Load saved settings
        const saved = SaveSystem.load();
        if (saved && saved.settings) {
            GameState.settings = { ...GameState.settings, ...saved.settings };
        }

        // Bind UI
        document.getElementById('set-quality').value = GameState.settings.quality;
        document.getElementById('set-sensitivity').value = GameState.settings.sensitivity;
        document.getElementById('set-volume').value = GameState.settings.volume;

        // Listeners
        document.getElementById('set-quality').addEventListener('change', (e) => {
            GameState.settings.quality = e.target.value;
            // Trigger graphics update in main.js via event or direct call
            if(window.Game) Game.updateGraphics();
        });

        document.getElementById('set-sensitivity').addEventListener('input', (e) => {
            GameState.settings.sensitivity = parseFloat(e.target.value);
        });

        document.getElementById('set-volume').addEventListener('input', (e) => {
            GameState.settings.volume = parseFloat(e.target.value);
            AudioSys.setVolume(GameState.settings.volume);
        });
    }
};
