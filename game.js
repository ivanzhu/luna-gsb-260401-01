const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const livesDisplay = document.getElementById('livesDisplay');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');

class Player {
    constructor() {
        this.width = 50;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 5;
        this.bulletLevel = 1;
        this.shootCooldown = 0;
        this.shootDelay = 15;
        this.invincible = false;
        this.invincibleTime = 0;
    }

    update(keys) {
        if (keys['w'] || keys['W']) this.y -= this.speed;
        if (keys['s'] || keys['S']) this.y += this.speed;
        if (keys['a'] || keys['A']) this.x -= this.speed;
        if (keys['d'] || keys['D']) this.x += this.speed;

        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

        if (this.shootCooldown > 0) this.shootCooldown--;

        if (this.invincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return [];
        this.shootCooldown = this.shootDelay;

        const bullets = [];
        const centerX = this.x + this.width / 2;

        if (this.bulletLevel >= 1) {
            bullets.push(new Bullet(centerX - 2, this.y, -10, 'player'));
        }
        if (this.bulletLevel >= 2) {
            bullets.push(new Bullet(centerX - 15, this.y + 10, -10, 'player'));
            bullets.push(new Bullet(centerX + 11, this.y + 10, -10, 'player'));
        }
        if (this.bulletLevel >= 3) {
            bullets.push(new Bullet(centerX - 25, this.y + 20, -10, 'player', -1));
            bullets.push(new Bullet(centerX + 21, this.y + 20, -10, 'player', 1));
        }

        return bullets;
    }

    draw() {
        ctx.save();
        
        if (this.invincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = '#00a8ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 15);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0097e6';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + 10);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 25);
        ctx.lineTo(this.x + 10, this.y + this.height - 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x + 5, this.y + this.height - 5, 10, 8);
        ctx.fillRect(this.x + this.width - 15, this.y + this.height - 5, 10, 8);

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height - 25, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    hit() {
        if (this.invincible) return false;
        this.invincible = true;
        this.invincibleTime = 120;
        this.bulletLevel = Math.max(1, this.bulletLevel - 1);
        return true;
    }
}

class Bullet {
    constructor(x, y, speedY, owner, speedX = 0) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speedX = speedX;
        this.speedY = speedY;
        this.owner = owner;
        this.active = true;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        
        if (this.y < -this.height || this.y > canvas.height ||
            this.x < -this.width || this.x > canvas.width) {
            this.active = false;
        }
    }

    draw() {
        if (this.owner === 'player') {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#ff4757';
            ctx.shadowColor = '#ff4757';
            ctx.shadowBlur = 10;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(type = 'normal') {
        this.type = type;
        this.active = true;
        this.exploding = false;
        this.explosionFrame = 0;
        this.shootCooldown = 0;

        if (type === 'normal') {
            this.width = 40;
            this.height = 40;
            this.hp = 1;
            this.maxHp = 1;
            this.speed = 2 + Math.random() * 2;
            this.score = 100;
            this.color = '#ff6b6b';
        } else {
            this.width = 60;
            this.height = 55;
            this.hp = 3;
            this.maxHp = 3;
            this.speed = 1 + Math.random();
            this.score = 300;
            this.color = '#a55eea';
            this.shootDelay = 60 + Math.random() * 60;
        }

        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
    }

    update() {
        if (this.exploding) {
            this.explosionFrame++;
            if (this.explosionFrame > 20) {
                this.active = false;
            }
            return;
        }

        this.y += this.speed;
        if (this.y > canvas.height + this.height) {
            this.active = false;
        }

        if (this.type === 'strong' && this.shootCooldown <= 0 && this.y > 50) {
            this.shootCooldown = this.shootDelay;
            return true;
        }
        if (this.shootCooldown > 0) this.shootCooldown--;

        return false;
    }

    shoot() {
        return new Bullet(this.x + this.width / 2 - 2, this.y + this.height, 5, 'enemy');
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.exploding = true;
            return true;
        }
        return false;
    }

    draw() {
        if (this.exploding) {
            const size = this.explosionFrame * 4;
            const alpha = 1 - this.explosionFrame / 20;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffa502';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fffa65';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.color;
        
        if (this.type === 'normal') {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + 15);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ff4757';
            ctx.fillRect(this.x + this.width / 2 - 3, this.y, 6, 10);
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width + 10, this.y + 10);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + 20);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x - 10, this.y + 10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#8854d0';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 12, 0, Math.PI * 2);
            ctx.fill();

            const hpWidth = (this.width - 10) * (this.hp / this.maxHp);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 5, this.y - 8, this.width - 10, 5);
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(this.x + 5, this.y - 8, hpWidth, 5);
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 3;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.enemySpawnRate = 90;
        this.spawnTimer = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.keys = {};
        this.highScore = parseInt(localStorage.getItem('planeWarHighScore')) || 0;
        this.backgroundY = 0;

        this.initEvents();
        this.updateHighScoreDisplay();
    }

    initEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'Escape' && this.isRunning && !this.gameOverScreen.classList.contains('hidden') === false) {
                this.togglePause();
            }
            if (e.key === ' ') {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        startBtn.addEventListener('click', () => this.start());
        resumeBtn.addEventListener('click', () => this.togglePause());
        restartBtn.addEventListener('click', () => this.start());
    }

    start() {
        this.player = new Player();
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.enemySpawnRate = 90;
        this.spawnTimer = 0;
        this.isRunning = true;
        this.isPaused = false;

        startScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        this.updateUI();
        this.loop();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        pauseScreen.classList.toggle('hidden', !this.isPaused);
        if (!this.isPaused) {
            this.loop();
        }
    }

    gameOver() {
        this.isRunning = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('planeWarHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }

        finalScoreElement.textContent = this.score;
        gameOverScreen.classList.remove('hidden');
    }

    updateHighScoreDisplay() {
        highScoreElement.textContent = this.highScore;
    }

    updateUI() {
        scoreElement.textContent = this.score;
        livesDisplay.textContent = '❤️'.repeat(this.lives);
    }

    spawnEnemy() {
        const type = Math.random() < 0.7 ? 'normal' : 'strong';
        this.enemies.push(new Enemy(type));
    }

    checkCollision(a, b, margin = 0) {
        return (a.x + margin) < (b.x + b.width - margin) &&
               (a.x + a.width - margin) > (b.x + margin) &&
               (a.y + margin) < (b.y + b.height - margin) &&
               (a.y + a.height - margin) > (b.y + margin);
    }

    createExplosion(x, y, count = 15) {
        const colors = ['#ff6b6b', '#ffa502', '#fffa65', '#ff4757'];
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
        }
    }

    update() {
        this.gameTime++;

        this.backgroundY = (this.backgroundY + 1) % 50;

        if (this.gameTime % 1800 === 0) {
            this.enemySpawnRate = Math.max(30, this.enemySpawnRate - 5);
            if (this.player.bulletLevel < 3) {
                this.player.bulletLevel++;
            }
        }

        this.player.update(this.keys);
        if (this.keys[' ']) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
        }

        this.spawnTimer++;
        if (this.spawnTimer >= this.enemySpawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        this.bullets = this.bullets.filter(b => b.active);
        this.bullets.forEach(bullet => bullet.update());

        this.enemies = this.enemies.filter(e => e.active);
        this.enemies.forEach(enemy => {
            const shouldShoot = enemy.update();
            if (shouldShoot && !enemy.exploding) {
                this.bullets.push(enemy.shoot());
            }
        });

        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => p.update());

        this.enemies.forEach(enemy => {
            if (enemy.exploding) return;
            
            if (this.checkCollision(enemy, this.player, 18)) {
                if (this.player.hit()) {
                    enemy.hit();
                    if (enemy.hp <= 0) {
                        this.createExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2
                        );
                    }
                    this.lives--;
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        this.bullets.forEach(bullet => {
            if (bullet.owner !== 'enemy') return;
            
            if (this.checkCollision(bullet, this.player, 12)) {
                bullet.active = false;
                if (this.player.hit()) {
                    this.lives--;
                    this.createExplosion(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height / 2,
                        8
                    );
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        this.bullets.forEach(bullet => {
            if (bullet.owner !== 'player') return;
            
            this.enemies.forEach(enemy => {
                if (enemy.exploding) return;
                if (this.checkCollision(bullet, enemy, 0)) {
                    bullet.active = false;
                    if (enemy.hit()) {
                        this.score += enemy.score;
                        this.createExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2
                        );
                        this.updateUI();
                    }
                }
            });
        });
    }

    drawBackground() {
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 97) % canvas.width;
            const y = ((i * 137) + this.backgroundY * (1 + i % 3)) % canvas.height;
            const size = (i % 3) + 1;
            ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }

    draw() {
        this.drawBackground();

        this.particles.forEach(p => p.draw());
        this.bullets.forEach(bullet => bullet.draw());
        this.enemies.forEach(enemy => enemy.draw());
        this.player.draw();
    }

    loop() {
        if (!this.isRunning || this.isPaused) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.loop());
    }
}

const game = new Game();