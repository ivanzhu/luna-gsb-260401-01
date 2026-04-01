const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 720;

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('planeWarHighScore') || 0;
let gameState = 'start';
let animationId = null;
let lastTime = 0;
let enemySpawnTimer = 0;
let difficultyTimer = 0;
let enemySpawnRate = 1500;
let backgroundOffset = 0;

const keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
    space: false
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let explosions = [];
let lastBulletTime = 0;

class Player {
    constructor() {
        this.width = 60;
        this.height = 70;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 30;
        this.speed = 6;
        this.bulletLevel = 1;
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    update() {
        if (keys.w || keys.arrowup) {
            this.y = Math.max(0, this.y - this.speed);
        }
        if (keys.s || keys.arrowdown) {
            this.y = Math.min(canvas.height - this.height, this.y + this.speed);
        }
        if (keys.a || keys.arrowleft) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (keys.d || keys.arrowright) {
            this.x = Math.min(canvas.width - this.width, this.x + this.speed);
        }

        if (this.invincible) {
            this.invincibleTimer -= 16;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    draw() {
        ctx.save();
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 20);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 25, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height + 15 + Math.random() * 5);
        ctx.lineTo(this.x + this.width - 15, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    shoot() {
        const now = Date.now();
        if (now - lastBulletTime > 200) {
            lastBulletTime = now;
            if (this.bulletLevel === 1) {
                bullets.push(new Bullet(this.x + this.width / 2 - 3, this.y, 0, -10, '#ffff00'));
            } else if (this.bulletLevel === 2) {
                bullets.push(new Bullet(this.x + 10, this.y + 20, 0, -10, '#ffff00'));
                bullets.push(new Bullet(this.x + this.width - 16, this.y + 20, 0, -10, '#ffff00'));
            } else {
                bullets.push(new Bullet(this.x + this.width / 2 - 3, this.y, 0, -10, '#ffff00'));
                bullets.push(new Bullet(this.x + 10, this.y + 20, -1, -10, '#ffff00'));
                bullets.push(new Bullet(this.x + this.width - 16, this.y + 20, 1, -10, '#ffff00'));
            }
        }
    }

    takeDamage() {
        if (!this.invincible) {
            lives--;
            updateLivesDisplay();
            this.invincible = true;
            this.invincibleTimer = 2000;
            if (lives <= 0) {
                endGame();
            }
        }
    }
}

class Bullet {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 15;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    isOffScreen() {
        return this.y < -this.height || this.y > canvas.height || this.x < -this.width || this.x > canvas.width;
    }
}

class Enemy {
    constructor(type = 'normal') {
        this.type = type;
        if (type === 'normal') {
            this.width = 50;
            this.height = 50;
            this.health = 1;
            this.maxHealth = 1;
            this.speed = 2 + Math.random() * 2;
            this.score = 10;
            this.color = '#ff4444';
            this.shootRate = 2000 + Math.random() * 1000;
        } else {
            this.width = 70;
            this.height = 70;
            this.health = 3;
            this.maxHealth = 3;
            this.speed = 1 + Math.random();
            this.score = 50;
            this.color = '#ff8800';
            this.shootRate = 1000 + Math.random() * 500;
        }
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.lastShootTime = Date.now();
    }

    update() {
        this.y += this.speed;
        
        const now = Date.now();
        if (now - this.lastShootTime > this.shootRate && this.y > 50) {
            this.shoot();
            this.lastShootTime = now;
        }
    }

    shoot() {
        const bulletX = this.x + this.width / 2 - 4;
        const bulletY = this.y + this.height;
        enemyBullets.push(new Bullet(bulletX, bulletY, 0, 5, '#ff0066'));
        
        if (this.type === 'strong') {
            enemyBullets.push(new Bullet(bulletX - 15, bulletY + 10, -1, 5, '#ff0066'));
            enemyBullets.push(new Bullet(bulletX + 15, bulletY + 10, 1, 5, '#ff0066'));
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y + 20);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
        ctx.fill();
        
        if (this.type === 'strong') {
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, Math.PI * 2);
            ctx.fill();
            
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y - 10, barWidth * healthPercent, barHeight);
        }
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    takeDamage() {
        this.health--;
        return this.health <= 0;
    }
}

class Explosion {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxSize = size * 2;
        this.alpha = 1;
        this.growing = true;
    }

    update() {
        if (this.growing) {
            this.size += 3;
            if (this.size >= this.maxSize) {
                this.growing = false;
            }
        } else {
            this.alpha -= 0.05;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isDone() {
        return this.alpha <= 0;
    }
}

let player = new Player();

function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
}

function updateLivesDisplay() {
    document.getElementById('lives').textContent = '❤'.repeat(lives);
}

function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = highScore;
}

function drawBackground() {
    backgroundOffset += 1;
    if (backgroundOffset >= canvas.height) {
        backgroundOffset = 0;
    }
    
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 97) % canvas.width;
        const y = (i * 137 + backgroundOffset) % canvas.height;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + (i % 3) * 0.2;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}

function spawnEnemy() {
    const type = Math.random() > 0.75 ? 'strong' : 'normal';
    enemies.push(new Enemy(type));
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    player.update();
    player.draw();

    if (keys.space) {
        player.shoot();
    }

    bullets = bullets.filter(bullet => {
        bullet.update();
        bullet.draw();
        return !bullet.isOffScreen();
    });

    enemyBullets = enemyBullets.filter(bullet => {
        bullet.update();
        bullet.draw();
        
        if (checkCollision(bullet, player)) {
            player.takeDamage();
            explosions.push(new Explosion(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 20));
            return false;
        }
        
        return !bullet.isOffScreen();
    });

    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    difficultyTimer += deltaTime;
    if (difficultyTimer >= 10000) {
        enemySpawnRate = Math.max(500, enemySpawnRate - 100);
        difficultyTimer = 0;
    }

    enemies = enemies.filter(enemy => {
        enemy.update();
        enemy.draw();

        if (checkCollision(player, enemy)) {
            player.takeDamage();
            explosions.push(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2));
            return false;
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
            if (checkCollision(bullets[i], enemy)) {
                bullets.splice(i, 1);
                if (enemy.takeDamage()) {
                    score += enemy.score;
                    updateScoreDisplay();
                    explosions.push(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2));
                    
                    if (score >= 500 && player.bulletLevel < 2) {
                        player.bulletLevel = 2;
                    } else if (score >= 1500 && player.bulletLevel < 3) {
                        player.bulletLevel = 3;
                    }
                    
                    return false;
                }
            }
        }

        return !enemy.isOffScreen();
    });

    explosions = explosions.filter(explosion => {
        explosion.update();
        explosion.draw();
        return !explosion.isDone();
    });

    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    explosions = [];
    enemySpawnTimer = 0;
    difficultyTimer = 0;
    enemySpawnRate = 1500;
    player = new Player();
    updateScoreDisplay();
    updateLivesDisplay();
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState = 'gameOver';
    cancelAnimationFrame(animationId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('planeWarHighScore', highScore);
        updateHighScoreDisplay();
    }
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        cancelAnimationFrame(animationId);
        document.getElementById('pauseScreen').style.display = 'flex';
    }
}

function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseScreen').style.display = 'none';
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
    if (e.key === ' ') {
        keys.space = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
        keys.arrowup = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
        keys.arrowdown = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowLeft') {
        keys.arrowleft = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowRight') {
        keys.arrowright = true;
        e.preventDefault();
    }
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
    if (e.key === ' ') {
        keys.space = false;
    }
    if (e.key === 'ArrowUp') {
        keys.arrowup = false;
    }
    if (e.key === 'ArrowDown') {
        keys.arrowdown = false;
    }
    if (e.key === 'ArrowLeft') {
        keys.arrowleft = false;
    }
    if (e.key === 'ArrowRight') {
        keys.arrowright = false;
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

updateHighScoreDisplay();
ctx.fillStyle = '#0a0a1a';
ctx.fillRect(0, 0, canvas.width, canvas.height);