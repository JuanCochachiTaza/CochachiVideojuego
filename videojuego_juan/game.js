document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const gameBoard = document.getElementById('game-board');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const gameOverScreen = document.getElementById('game-over');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('high-score');
    const levelDisplay = document.getElementById('level');
    const finalScoreDisplay = document.getElementById('final-score');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');

    // Variables del juego
    let player;
    let obstacles = [];
    let gameInterval;
    let obstacleInterval;
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let gameActive = false;
    let currentLevel = 1; // 1: Fácil, 2: Medio, 3: Difícil
    const boardWidth = 400;
    const boardHeight = 400;
    const playerSize = 30;
    const minObstacleSize = 30;
    const maxObstacleSize = 60;
    
    // Configuraciones por nivel
    const levelSettings = {
        1: { // Fácil
            name: "Fácil",
            obstacleSpeed: 4,
            obstacleFrequency: 300,
            playerSpeed: 12,
            color: "#4CAF50",
            maxObstacles: 3,
            obstacleTypes: 1 // Solo cuadrados
        },
        2: { // Medio
            name: "Medio",
            obstacleSpeed: 7,
            obstacleFrequency: 200,
            playerSpeed: 14,
            color: "#FFA000",
            maxObstacles: 5,
            obstacleTypes: 2 // Cuadrados y círculos
        },
        3: { // Difícil
            name: "Difícil",
            obstacleSpeed: 9,
            obstacleFrequency: 100,
            playerSpeed: 12,
            color: "#d32f2f",
            maxObstacles: 7,
            obstacleTypes: 3 // Cuadrados, círculos y triángulos
        }
    };

    // Inicializar el juego
    function initGame() {
        // Limpiar el tablero
        gameBoard.innerHTML = '';
        obstacles = [];
        score = 0;
        scoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
        levelDisplay.textContent = `${currentLevel} (${levelSettings[currentLevel].name})`;
        
        // Crear jugador
        player = document.createElement('div');
        player.classList.add('player');
        player.style.left = `${boardWidth / 2 - playerSize / 2}px`;
        player.style.top = `${boardHeight - playerSize - 10}px`;
        player.style.backgroundColor = levelSettings[currentLevel].color;
        gameBoard.appendChild(player);
        
        gameActive = true;
        gameOverScreen.classList.add('hidden');
    }

    // Mover al jugador
    function movePlayer(event) {
        if (!gameActive) return;
        
        const key = event.key;
        const currentLeft = parseInt(player.style.left);
        const currentTop = parseInt(player.style.top);
        const playerSpeed = levelSettings[currentLevel].playerSpeed;
        
        switch(key) {
            case 'ArrowUp':
                if (currentTop > 10) {
                    player.style.top = `${currentTop - playerSpeed}px`;
                }
                break;
            case 'ArrowDown':
                if (currentTop < boardHeight - playerSize - 10) {
                    player.style.top = `${currentTop + playerSpeed}px`;
                }
                break;
            case 'ArrowLeft':
                if (currentLeft > 10) {
                    player.style.left = `${currentLeft - playerSpeed}px`;
                }
                break;
            case 'ArrowRight':
                if (currentLeft < boardWidth - playerSize - 10) {
                    player.style.left = `${currentLeft + playerSpeed}px`;
                }
                break;
        }
        
        // Verificar colisiones después de cada movimiento
        checkCollisions();
    }

    // Crear obstáculos
    function createObstacle() {
        if (!gameActive || obstacles.length >= levelSettings[currentLevel].maxObstacles) return;
        
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        
        // Tipo de obstáculo según el nivel
        const obstacleType = Math.floor(Math.random() * levelSettings[currentLevel].obstacleTypes) + 1;
        
        // Tamaño aleatorio dentro de los límites
        const size = Math.floor(Math.random() * (maxObstacleSize - minObstacleSize)) + minObstacleSize;
        
        // Posición aleatoria en la parte superior
        const randomX = Math.floor(Math.random() * (boardWidth - size));
        
        // Configurar propiedades según el tipo
        switch(obstacleType) {
            case 1: // Cuadrado
                obstacle.style.width = `${size}px`;
                obstacle.style.height = `${size}px`;
                obstacle.style.borderRadius = '5px';
                obstacle.style.backgroundColor = '#f44336';
                break;
            case 2: // Círculo
                obstacle.style.width = `${size}px`;
                obstacle.style.height = `${size}px`;
                obstacle.style.borderRadius = '50%';
                obstacle.style.backgroundColor = '#9C27B0';
                break;
            case 3: // Triángulo
                obstacle.style.width = '0';
                obstacle.style.height = '0';
                obstacle.style.borderLeft = `${size/2}px solid transparent`;
                obstacle.style.borderRight = `${size/2}px solid transparent`;
                obstacle.style.borderBottom = `${size}px solid #2196F3`;
                obstacle.style.backgroundColor = 'transparent';
                break;
        }
        
        obstacle.style.left = `${randomX}px`;
        obstacle.style.top = `-${size}px`;
        
        // Añadir atributo de tipo para colisiones
        obstacle.setAttribute('data-type', obstacleType);
        obstacle.setAttribute('data-size', size);
        
        gameBoard.appendChild(obstacle);
        obstacles.push(obstacle);
    }

    // Mover obstáculos
    function moveObstacles() {
        const obstacleSpeed = levelSettings[currentLevel].obstacleSpeed;
        
        obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(obstacle.style.top);
            const size = parseInt(obstacle.getAttribute('data-size'));
            obstacle.style.top = `${currentTop + obstacleSpeed}px`;
            
            // Eliminar obstáculos que salieron del tablero
            if (currentTop > boardHeight) {
                obstacle.remove();
                obstacles.splice(index, 1);
                increaseScore();
            }
        });
        
        // Verificar colisiones
        checkCollisions();
    }

    // Verificar colisiones
    function checkCollisions() {
        const playerRect = player.getBoundingClientRect();
        
        for (const obstacle of obstacles) {
            const obstacleRect = obstacle.getBoundingClientRect();
            const obstacleType = obstacle.getAttribute('data-type');
            
            // Detección de colisión simple para todos los tipos
            if (
                playerRect.left < obstacleRect.right &&
                playerRect.right > obstacleRect.left &&
                playerRect.top < obstacleRect.bottom &&
                playerRect.bottom > obstacleRect.top
            ) {
                // Colisión detectada
                gameOver();
                return;
            }
        }
    }

    // Aumentar puntuación
    function increaseScore() {
        score++;
        scoreDisplay.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('highScore', highScore);
        }
        
        // Cambiar de nivel según la puntuación
        updateLevel();
    }

    // Actualizar nivel según la puntuación
    function updateLevel() {
        let newLevel = currentLevel;
        
        if (score >= 30 && currentLevel < 3) {
            newLevel = 3; // Difícil
        } else if (score >= 15 && currentLevel < 2) {
            newLevel = 2; // Medio
        }
        
        if (newLevel !== currentLevel) {
            currentLevel = newLevel;
            levelDisplay.textContent = `${currentLevel} (${levelSettings[currentLevel].name})`;
            player.style.backgroundColor = levelSettings[currentLevel].color;
            
            // Reiniciar intervalos con la nueva dificultad
            clearInterval(gameInterval);
            clearInterval(obstacleInterval);
            
            gameInterval = setInterval(moveObstacles, 50);
            obstacleInterval = setInterval(createObstacle, levelSettings[currentLevel].obstacleFrequency);
        }
    }

    // Game Over
    function gameOver() {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(obstacleInterval);
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    // Iniciar el juego
    function startGame() {
        initGame();
        
        // Intervalo para mover obstáculos
        gameInterval = setInterval(moveObstacles, 50);
        
        // Intervalo para crear nuevos obstáculos
        obstacleInterval = setInterval(createObstacle, levelSettings[currentLevel].obstacleFrequency);
    }

    // Cambiar nivel de dificultad
    function setDifficulty(level) {
        currentLevel = level;
        levelDisplay.textContent = `${currentLevel} (${levelSettings[currentLevel].name})`;
        
        // Actualizar botones activos
        easyBtn.classList.remove('active');
        mediumBtn.classList.remove('active');
        hardBtn.classList.remove('active');
        
        if (level === 1) easyBtn.classList.add('active');
        if (level === 2) mediumBtn.classList.add('active');
        if (level === 3) hardBtn.classList.add('active');
    }

    // Event listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    easyBtn.addEventListener('click', () => setDifficulty(1));
    mediumBtn.addEventListener('click', () => setDifficulty(2));
    hardBtn.addEventListener('click', () => setDifficulty(3));
    document.addEventListener('keydown', movePlayer);
    
    // Inicializar con dificultad fácil
    setDifficulty(1);
});
