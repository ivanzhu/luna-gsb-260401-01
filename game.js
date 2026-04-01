class Bullet {
    constructor(x, y, level = 1) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = 10;
        this.level = level;
    }

    update() {
        this.y -= this.speed;
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    isOutOfBounds() {
        return this.y < -this.height;
    }
}

class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 12;
        this.speed = 5;
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ff0066');
        gradient.addColorStop(1, '#ff0000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isOutOfBounds() {
        return this.y > 640 + this.height;
    }
}

class Enemy {
    constructor(x, type = 'normal') {
        this.x = x;
        this.y = -50;
        this.type = type;
        this.shootCooldown = 60 + Math.floor(Math.random() * 60);
        
        if (type === 'normal') {
            this.width = 40;
            this.height = 30;
            this.health = 1;
            this.maxHealth = 1;
            this.speed = 2 + Math.random() * 2;
            this.score = 100;
            this.color = '#ff4757';
        } else {
            this.width = 60;
            this.height = 45;
            this.health = 3;
            this.maxHealth = 3;
            this.speed = 1 + Math.random();
            this.score = 300;
            this.color = '#9b59b6';
        }
    }

    update() {
        this.y += this.speed;
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot() {
        if (this.shootCooldown > 0 || this.y < 0) return null;
        
        this.shootCooldown = this.type === 'strong' ? 80 : 120;
        return new EnemyBullet(this.x, this.y + this.height);
    }

    draw(ctx) {
        ctx.save();
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x - this.width / 2, this.y);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillRect(this.x - this.width / 2, this.y + this.height * 0.5, this.width, this.height * 0.15);
        
        ctx.beginPath();
        ctx.moveTo(this.x - this.width * 0.7, this.y + this.height * 0.6);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height * 0.35);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.7, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height * 0.35);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height * 0.4, this.width * 0.12, this.height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const flameHeight = 8 + Math.random() * 6;
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y - flameHeight);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y);
        ctx.lineTo(this.x, this.y - flameHeight);
        ctx.lineTo(this.x + 6, this.y);
        ctx.closePath();
        ctx.fill();
        
        if (this.type === 'strong') {
            const healthWidth = this.width * (this.health / this.maxHealth);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - this.width / 2, this.y + this.height + 5, this.width, 4);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x - this.width / 2, this.y + this.height + 5, healthWidth, 4);
        }
        
        ctx.restore();
    }

    isOutOfBounds() {
        return this.y > 640 + this.height;
    }

    hit() {
        this.health--;
        return this.health <= 0;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 40;
        this.alpha = 1;
    }

    update() {
        this.radius += 3;
        this.alpha -= 0.08;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    isDone() {
        return this.alpha <= 0;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 60;
        this.speed = 6;
        this.lives = 3;
        this.bulletLevel = 1;
        this.shootCooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
    }

    update(keys, canvasWidth, canvasHeight) {
        if (keys['w'] || keys['W']) {
            this.y = Math.max(this.height / 2, this.y - this.speed);
        }
        if (keys['s'] || keys['S']) {
            this.y = Math.min(canvasHeight - this.height / 2, this.y + this.speed);
        }
        if (keys['a'] || keys['A']) {
            this.x = Math.max(this.width / 2, this.x - this.speed);
        }
        if (keys['d'] || keys['D']) {
            this.x = Math.min(canvasWidth - this.width / 2, this.x + this.speed);
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return [];
        
        this.shootCooldown = 10;
        const bullets = [];

        if (this.bulletLevel === 1) {
            bullets.push(new Bullet(this.x, this.y - this.height / 2, 1));
        } else if (this.bulletLevel === 2) {
            bullets.push(new Bullet(this.x - 10, this.y - this.height / 2, 2));
            bullets.push(new Bullet(this.x + 10, this.y - this.height / 2, 2));
        } else {
            bullets.push(new Bullet(this.x, this.y - this.height / 2, 3));
            bullets.push(new Bullet(this.x - 15, this.y - this.height / 2 + 10, 3));
            bullets.push(new Bullet(this.x + 15, this.y - this.height / 2 + 10, 3));
        }

        return bullets;
    }

    draw(ctx) {
        ctx.save();
        
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = '#00d9ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 4, this.y + this.height / 3);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height / 3);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = '#00d9ff';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width * 0.15, this.height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const flameHeight = 15 + Math.random() * 10;
        const gradient = ctx.createLinearGradient(this.x, this.y + this.height / 3, this.x, this.y + this.height / 3 + flameHeight);
        gradient.addColorStop(0, '#00d9ff');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y + this.height / 3);
        ctx.lineTo(this.x, this.y + this.height / 3 + flameHeight);
        ctx.lineTo(this.x + 8, this.y + this.height / 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    takeDamage() {
        if (this.invincible) return false;
        
        this.lives--;
        this.invincible = true;
        this.invincibleTimer = 120;
        this.bulletLevel = Math.max(1, this.bulletLevel - 1);
        
        return true;
    }

    upgradeBullet() {
        this.bulletLevel = Math.min(3, this.bulletLevel + 1);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.keys = {};
        this.running = false;
        this.paused = false;
        this.score = 0;
        this.gameTime = 0;
        this.enemySpawnTimer = 0;
        this.backgroundOffset = 0;

        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.explosions = [];

        this.highScore = parseInt(localStorage.getItem('planeWarHighScore')) || 0;

        this.init();
    }

    init() {
        document.getElementById('highScore').textContent = this.highScore;

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Escape' && this.running) {
                this.togglePause();
            }
            
            if (e.key === ' ') {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.start());
    }

    start() {
        this.running = true;
        this.paused = false;
        this.score = 0;
        this.gameTime = 0;
        this.enemySpawnTimer = 0;

        this.player = new Player(this.width / 2, this.height - 80);
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.explosions = [];

        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';

        this.updateUI();
        this.gameLoop();
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseScreen').style.display = this.paused ? 'flex' : 'none';
        
        if (!this.paused) {
            this.gameLoop();
        }
    }

    gameOver() {
        this.running = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('planeWarHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    spawnEnemy() {
        const spawnRate = Math.max(30, 90 - Math.floor(this.gameTime / 300) * 5);
        
        if (this.enemySpawnTimer <= 0) {
            const x = 50 + Math.random() * (this.width - 100);
            const type = Math.random() < 0.2 ? 'strong' : 'normal';
            this.enemies.push(new Enemy(x, type));
            this.enemySpawnTimer = spawnRate;
        }
        
        this.enemySpawnTimer--;
    }

    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(i, 1);
                    
                    if (enemy.hit()) {
                        this.score += enemy.score;
                        this.explosions.push(new Explosion(enemy.x, enemy.y));
                        this.enemies.splice(j, 1);
                        
                        if (this.score > 0 && this.score % 1000 === 0) {
                            this.player.upgradeBullet();
                        }
                    }
                    break;
                }
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (this.checkCollision(this.player, enemy)) {
                this.explosions.push(new Explosion(enemy.x, enemy.y));
                this.enemies.splice(i, 1);
                
                if (this.player.takeDamage()) {
                    this.updateUI();
                    
                    if (this.player.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (this.checkCollision(this.player, bullet)) {
                this.enemyBullets.splice(i, 1);
                
                if (this.player.takeDamage()) {
                    this.updateUI();
                    
                    if (this.player.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                }
            }
        }
    }

    checkCollision(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 3 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 3;
    }

    update() {
        this.gameTime++;
        this.backgroundOffset = (this.backgroundOffset + 2) % this.height;

        this.player.update(this.keys, this.width, this.height);

        if (this.keys[' ']) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
        }

        this.spawnEnemy();

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].isOutOfBounds()) {
                this.bullets.splice(i, 1);
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();
            
            const bullet = this.enemies[i].shoot();
            if (bullet) {
                this.enemyBullets.push(bullet);
            }
            
            if (this.enemies[i].isOutOfBounds()) {
                this.enemies.splice(i, 1);
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].update();
            if (this.enemyBullets[i].isOutOfBounds()) {
                this.enemyBullets.splice(i, 1);
            }
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            if (this.explosions[i].isDone()) {
                this.explosions.splice(i, 1);
            }
        }

        this.checkCollisions();
        this.updateUI();
    }

    drawBackground() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 73) % this.width;
            const y = ((i * 137) + this.backgroundOffset) % this.height;
            const size = (i % 3) + 1;
            this.ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }

    draw() {
        this.drawBackground();

        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        for (const bullet of this.enemyBullets) {
            bullet.draw(this.ctx);
        }

        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        for (const explosion of this.explosions) {
            explosion.draw(this.ctx);
        }

        this.player.draw(this.ctx);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = '❤'.repeat(this.player.lives);
    }

    gameLoop() {
        if (!this.running || this.paused) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
