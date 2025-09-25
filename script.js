class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.gameMessage = document.getElementById('gameMessage');
        this.startMessage = document.getElementById('startMessage');
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game state
        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.gameRunning = false;
        this.gameStarted = false;
        this.isPaused = false;
        
        this.updateHighScoreDisplay();
        this.generateFood();
        this.setupEventListeners();
        this.showStartScreen();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameStarted || !this.gameRunning) {
                    this.startGame();
                } else if (this.isPaused) {
                    this.resumeGame();
                }
            } else if (e.code === 'KeyP' && this.gameRunning) {
                this.togglePause();
            } else if (this.gameRunning && !this.isPaused) {
                this.handleInput(e);
            }
        });
    }
    
    handleInput(e) {
        const LEFT_KEY = ['ArrowLeft', 'KeyA'];
        const RIGHT_KEY = ['ArrowRight', 'KeyD'];
        const UP_KEY = ['ArrowUp', 'KeyW'];
        const DOWN_KEY = ['ArrowDown', 'KeyS'];
        
        if (LEFT_KEY.includes(e.code) && this.dx !== 1) {
            this.dx = -1;
            this.dy = 0;
        } else if (UP_KEY.includes(e.code) && this.dy !== 1) {
            this.dx = 0;
            this.dy = -1;
        } else if (RIGHT_KEY.includes(e.code) && this.dx !== -1) {
            this.dx = 1;
            this.dy = 0;
        } else if (DOWN_KEY.includes(e.code) && this.dy !== -1) {
            this.dx = 0;
            this.dy = 1;
        }
    }
    
    startGame() {
        this.snake = [{x: 10, y: 10}];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameRunning = true;
        this.gameStarted = true;
        this.isPaused = false;
        this.updateScore();
        this.generateFood();
        this.hideOverlay();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showPauseScreen();
        } else {
            this.hideOverlay();
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        this.hideOverlay();
    }
    
    showStartScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.startMessage.classList.remove('hidden');
        this.gameMessage.classList.add('hidden');
    }
    
    showGameOverScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.gameMessage.classList.remove('hidden');
        this.startMessage.classList.add('hidden');
        this.gameMessage.innerHTML = `
            <h2>GAME OVER</h2>
            <p>Final Score: ${this.score}</p>
            <p>Press SPACE to restart</p>
        `;
    }
    
    showPauseScreen() {
        this.gameOverlay.classList.remove('hidden');
        this.gameMessage.classList.remove('hidden');
        this.startMessage.classList.add('hidden');
        this.gameMessage.innerHTML = `
            <h2>PAUSED</h2>
            <p>Press SPACE to continue</p>
        `;
    }
    
    hideOverlay() {
        this.gameOverlay.classList.add('hidden');
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        for (let segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                this.generateFood();
                return;
            }
        }
    }
    
    update() {
        if (!this.gameRunning || this.isPaused) return;
        
        // Don't move if no direction is set (snake hasn't started moving yet)
        if (this.dx === 0 && this.dy === 0) return;
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.generateFood();
            this.playEatSound();
        } else {
            this.snake.pop();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.updateHighScore();
        this.showGameOverScreen();
        this.playGameOverSound();
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
    }
    
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }
    
    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
    
    draw() {
        // Clear canvas with retro grid effect
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid
        this.ctx.strokeStyle = '#003300';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw food with glow effect
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        
        // Reset shadow for snake
        this.ctx.shadowBlur = 0;
        
        // Draw snake with gradient and glow
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#00ff41';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = '#00ff41';
            } else {
                // Snake body with gradient effect
                const intensity = Math.max(0.3, 1 - (index * 0.1));
                this.ctx.fillStyle = `rgba(0, 255, 65, ${intensity})`;
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#00ff41';
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    // Simple sound effects using Web Audio API
    playEatSound() {
        this.playTone(800, 0.1);
    }
    
    playGameOverSound() {
        this.playTone(200, 0.5);
    }
    
    playTone(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // Fallback if Web Audio API is not supported
            console.log('Audio not supported');
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        setTimeout(() => this.gameLoop(), 150); // Game speed
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});