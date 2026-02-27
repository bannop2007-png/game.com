// ------------------ UTILS ------------------

// Функция случайного jump scare
// Прыгает с шансом 0.1% на каждом кадре
// При срабатывании воспроизводит звук и красный flash на overlay
function randomScare(jumpscare, overlay){
  if(Math.random() < 0.001){
    jumpscare.play(); // звук jump scare
    overlay.style.background = 'rgba(255,0,0,0.5)';
    setTimeout(() => {
      overlay.style.background = 'radial-gradient(circle at center, rgba(0,0,0,0) 150px, rgba(0,0,0,0.95) 300px)';
    }, 200);
  }
}

// Генератор случайного числа в диапазоне [min, max)
function randomRange(min, max){
  return Math.random() * (max - min) + min;
}

// Проверка столкновения игрока с врагом
function checkCollision(playerPos, enemyPos, distance=0.5){
  const dx = playerPos.x - enemyPos.x;
  const dz = playerPos.z - enemyPos.z;
  return Math.sqrt(dx*dx + dz*dz) < distance;
}
