const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let score = 0;
let speed = 5;
let roadOffset = 0;

const laneCount = 3;
const laneWidth = canvas.width / laneCount;

const player = {
    width: 40,
    height: 80,
    lane: 1
};

let enemies = [];

function drawRoad() {
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Боковые линии
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, 0, 5, canvas.height);
    ctx.fillRect(canvas.width - 10, 0, 5, canvas.height);

    // Разметка
    ctx.fillStyle = "white";
    for (let i = -40; i < canvas.height; i += 60) {
        ctx.fillRect(canvas.width / 3 - 2, i + roadOffset, 4, 30);
        ctx.fillRect((canvas.width / 3) * 2 - 2, i + roadOffset, 4, 30);
    }

    roadOffset += speed;
    if (roadOffset > 60) roadOffset = 0;
}

function drawCar(x, y, color) {
    // Тень
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + 5, y + 5, player.width, player.height);

    // Корпус
    ctx.fillStyle = color;
    ctx.fillRect(x, y, player.width, player.height);

    // Стекло
    ctx.fillStyle = "#111";
    ctx.fillRect(x + 8, y + 10, player.width - 16, 20);

    // Фары
    ctx.fillStyle = "yellow";
    ctx.fillRect(x + 5, y, 8, 8);
    ctx.fillRect(x + player.width - 13, y, 8, 8);
}

function createEnemy() {
    enemies.push({
        lane: Math.floor(Math.random() * laneCount),
        y: -100
    });
}

function update() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();

    const playerX = player.lane * laneWidth + laneWidth / 2 - player.width / 2;
    const playerY = canvas.height - 120;

    drawCar(playerX, playerY, "#00ff88");

    enemies.forEach(enemy => {
        enemy.y += speed;
        const enemyX = enemy.lane * laneWidth + laneWidth / 2 - player.width / 2;
        drawCar(enemyX, enemy.y, "#ff2d2d");

        if (
            enemy.lane === player.lane &&
            enemy.y + player.height > playerY &&
            enemy.y < playerY + player.height
        ) {
            gameOver();
        }
    });

    enemies = enemies.filter(e => e.y < canvas.height + 100);

    score++;
    speed += 0.001;

    document.getElementById("score").textContent = "Счёт: " + score;

    requestAnimationFrame(update);
}

function gameOver() {
    gameRunning = false;

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("💥 GAME OVER", 100, 250);
    ctx.font = "20px Arial";
    ctx.fillText("Счёт: " + score, 150, 290);
}

document.addEventListener("keydown", e => {
    if (!gameRunning) return;

    if (e.key === "ArrowLeft" && player.lane > 0) {
        player.lane--;
    }

    if (e.key === "ArrowRight" && player.lane < laneCount - 1) {
        player.lane++;
    }
});

document.getElementById("startBtn").onclick = () => {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("ui").style.display = "block";

    score = 0;
    speed = 5;
    enemies = [];
    gameRunning = true;

    update();
};

document.getElementById("restartBtn").onclick = () => {
    score = 0;
    speed = 5;
    enemies = [];
    gameRunning = true;
    update();
};

setInterval(() => {
    if (gameRunning) createEnemy();
}, 1000);