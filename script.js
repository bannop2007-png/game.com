let balance = 1000;
let users = 1;
let level = 1;
let isCrashed = false;

// Загрузка из памяти
if (localStorage.getItem("pyramidData")) {
    const data = JSON.parse(localStorage.getItem("pyramidData"));
    balance = data.balance;
    users = data.users;
    level = data.level;
    isCrashed = data.isCrashed;
}

function saveGame() {
    localStorage.setItem("pyramidData", JSON.stringify({
        balance,
        users,
        level,
        isCrashed
    }));
}

function updateUI() {
    document.getElementById("balance").textContent = Math.floor(balance);
    document.getElementById("users").textContent = users;
    document.getElementById("level").textContent = level;
}

function log(text) {
    const li = document.createElement("li");
    li.textContent = text;
    document.getElementById("logList").prepend(li);
}

// Инвестирование
function invest() {
    if (isCrashed) return log("Система разрушена!");

    if (balance >= 100) {
        balance -= 100;
        users += Math.floor(Math.random() * 3) + 1;
        log("Ты инвестировал 100$ и привлек новых участников");
    } else {
        log("Недостаточно денег!");
    }

    checkSystem();
    updateUI();
    saveGame();
}

// Привлечение участников
function addUsers() {
    if (isCrashed) return log("Система разрушена!");

    let newUsers = Math.floor(Math.random() * 5);
    users += newUsers;
    log("Новых участников: +" + newUsers);

    checkSystem();
    updateUI();
    saveGame();
}

// Вывод денег
function withdraw() {
    if (isCrashed) return log("Нельзя вывести — система рухнула!");

    let profit = users * 10;
    balance += profit;
    log("Ты вывел " + profit + "$");

    updateUI();
    saveGame();
}

// Проверка системы (рост или крах)
function checkSystem() {
    // Рост уровня
    if (users > level * 10) {
        level++;
        log("Уровень повышен!");
    }

    // Шанс краха
    let crashChance = Math.random();

    if (crashChance < 0.1 && users < 20) {
        crash();
    } else if (crashChance < 0.05) {
        crash();
    } else {
        document.getElementById("status").textContent = "Система растет 📈";
        document.getElementById("status").style.color = "#22c55e";
    }
}

// Крах системы
function crash() {
    isCrashed = true;
    document.getElementById("status").textContent = "💥 СИСТЕМА РУХНУЛА!";
    document.getElementById("status").style.color = "red";
    log("Все потеряно! Пирамида разрушилась.");
}

// Авто-события (каждые 5 сек)
setInterval(() => {
    if (isCrashed) return;

    let event = Math.random();

    if (event < 0.3) {
        users += 2;
        log("Приток участников 📈");
    } else if (event < 0.6) {
        users -= 1;
        log("Участники уходят 📉");
    }

    checkSystem();
    updateUI();
    saveGame();
}, 5000);

// Старт
updateUI();
