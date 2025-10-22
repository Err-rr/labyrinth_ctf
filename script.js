        // Obfuscated security data
        const _s = atob('TDRieVIxbnRoXyQzY3IzdCE=');
        const _r = atob('TUFaRS0xNzA0MDY3MjAwLWEzZjk=');
        const _f1 = atob('RUhBWHtt');
        const _f2 = atob('NHozX3J1');
        const _f3 = atob('bm4zcl9m');
        const _f4 = atob('MHVuZF90');
        const _f5 = atob('aDNfYjRj');
        const _f6 = atob('a2QwMHJz');
        const _f7 = atob('fQ==');

        const getSecurityKey = () => _s;
        const getResetCode = () => _r;
        const getFlag = () => _f1+_f2+_f3+_f4+_f5+_f6+_f7;

        const ROBOTS_TXT = `User-agent: *
Disallow: /.backup_configs_2024/
Disallow: /admin.php
Disallow: /internal/
Allow: /

# Automated scanner detection enabled
# Last updated: 2024-01-01`;

        const BACKUP_CONFIG = {
            version: "2.3.0",
            database: {
                host: "internal-db-01.maze.local",
                port: 5432,
                name: "labyrinth_prod"
            },
            security: {
                hmac_key_fragment: "L4byR1nth_",
                token_version: "v1",
                algorithm: "SHA256"
            },
            admin: {
                reset_code_format: "MAZE-{timestamp}-{hash_short}",
                default_reset: "MAZE-1704067200-a3f9"
            },
            notes: "Token format: {sessionId}:{seed}:{score}:{timestamp}:{hmac}"
        };

        const HIDDEN_METADATA = {
            exif_comment: "Hint: Admin reset uses timestamp 1704067200",
            creator: "MazeGen 2.3",
            server_key_suffix: "$3cr3t!"
        };

        class MazeGame {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.sessionId = this.generateSessionId();
                this.seed = Math.floor(Math.random() * 999999);
                this.playerX = 0;
                this.playerY = 0;
                this.steps = 0;
                this.score = 0;
                this.cellSize = 30;
                this.viewSize = 15;
                this.mazeCache = new Map();
                
                this.ensureValidSpawn();
                this.init();
            }

            ensureValidSpawn() {
                let attempts = 0;
                while (this.getCellType(0, 0) !== 'path' && attempts < 100) {
                    this.seed = Math.floor(Math.random() * 999999);
                    this.mazeCache.clear();
                    attempts++;
                }
                
                if (this.getCellType(0, 0) !== 'path') {
                    this.mazeCache.set('0,0', 'path');
                }
            }

            init() {
                this.resizeCanvas();
                this.render();
                this.updateStats();
                window.addEventListener('resize', () => this.resizeCanvas());
                
                document.addEventListener('keydown', (e) => {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                        switch(e.key) {
                            case 'ArrowUp': this.move(0, -1); break;
                            case 'ArrowDown': this.move(0, 1); break;
                            case 'ArrowLeft': this.move(-1, 0); break;
                            case 'ArrowRight': this.move(1, 0); break;
                        }
                    }
                });
            }

            generateSessionId() {
                return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            }

            resizeCanvas() {
                const parent = this.canvas.parentElement;
                this.canvas.width = parent.clientWidth - 40;
                this.canvas.height = parent.clientHeight - 40;
                this.render();
            }

            getCellType(x, y) {
                const key = `${x},${y}`;
                if (this.mazeCache.has(key)) return this.mazeCache.get(key);
                
                let hash = this.seed ^ (x * 374761393) ^ (y * 668265263);
                hash = (hash ^ (hash >>> 13)) * 1274126177;
                hash = hash ^ (hash >>> 16);
                
                const type = Math.abs(hash) % 100 < 35 ? 'wall' : 'path';
                this.mazeCache.set(key, type);
                return type;
            }

            move(dx, dy) {
                const newX = this.playerX + dx;
                const newY = this.playerY + dy;
                
                if (this.getCellType(newX, newY) === 'path') {
                    this.playerX = newX;
                    this.playerY = newY;
                    this.steps++;
                    this.score += Math.floor(Math.random() * 10) + 1;
                    this.updateStats();
                    this.render();
                }
            }

            render() {
                const w = this.canvas.width;
                const h = this.canvas.height;
                
                this.ctx.fillStyle = '#0a0e17';
                this.ctx.fillRect(0, 0, w, h);

                const startX = this.playerX - Math.floor(this.viewSize / 2);
                const startY = this.playerY - Math.floor(this.viewSize / 2);

                for (let y = 0; y < this.viewSize; y++) {
                    for (let x = 0; x < this.viewSize; x++) {
                        const worldX = startX + x;
                        const worldY = startY + y;
                        const cellType = this.getCellType(worldX, worldY);
                        
                        const screenX = x * this.cellSize + (w - this.viewSize * this.cellSize) / 2;
                        const screenY = y * this.cellSize + (h - this.viewSize * this.cellSize) / 2;

                        if (cellType === 'wall') {
                            this.ctx.fillStyle = '#1e3a5f';
                            this.ctx.fillRect(screenX, screenY, this.cellSize - 2, this.cellSize - 2);
                        } else {
                            this.ctx.fillStyle = '#0f1419';
                            this.ctx.fillRect(screenX, screenY, this.cellSize - 2, this.cellSize - 2);
                        }
                    }
                }

                const playerScreenX = Math.floor(this.viewSize / 2) * this.cellSize + (w - this.viewSize * this.cellSize) / 2;
                const playerScreenY = Math.floor(this.viewSize / 2) * this.cellSize + (h - this.viewSize * this.cellSize) / 2;
                
                this.ctx.fillStyle = '#10b981';
                this.ctx.beginPath();
                this.ctx.arc(
                    playerScreenX + this.cellSize / 2,
                    playerScreenY + this.cellSize / 2,
                    this.cellSize / 3,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }

            updateStats() {
                document.getElementById('sessionId').textContent = this.sessionId.substring(0, 12) + '...';
                document.getElementById('mazeSeed').textContent = this.seed;
                document.getElementById('position').textContent = `${this.playerX}, ${this.playerY}`;
                document.getElementById('steps').textContent = this.steps;
                document.getElementById('score').textContent = this.score;
            }

            computeHash(message, key) {
                let hash = 0;
                const combined = key + message + key;
                for (let i = 0; i < combined.length; i++) {
                    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
                    hash = hash & hash;
                }
                return Math.abs(hash).toString(16).padStart(16, '0');
            }

            generateToken() {
                const data = `${this.sessionId}:${this.seed}:${this.score}:${Date.now()}`;
                return data + ':' + this.computeHash(data, getSecurityKey());
            }
        }

        class AdminPanel {
            constructor(game) {
                this.game = game;
                this.isAuthenticated = false;
                this.initEventListeners();
            }

            initEventListeners() {
                document.addEventListener('keydown', (e) => {
                    if (e.key === '`' || e.key === '~') {
                        this.togglePanel();
                    }
                });

                document.getElementById('closeAdmin').addEventListener('click', () => {
                    this.hidePanel();
                });

                document.getElementById('loginBtn').addEventListener('click', () => {
                    this.handleLogin();
                });

                document.getElementById('submitTokenBtn').addEventListener('click', () => {
                    this.handleTokenSubmit();
                });

                document.getElementById('adminUser').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleLogin();
                });
                document.getElementById('adminPass').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleLogin();
                });
                document.getElementById('tokenInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleTokenSubmit();
                });
            }

            togglePanel() {
                const panel = document.getElementById('adminPanel');
                panel.classList.toggle('hidden');
            }

            hidePanel() {
                document.getElementById('adminPanel').classList.add('hidden');
            }

            showPanel() {
                document.getElementById('adminPanel').classList.remove('hidden');
            }

            handleLogin() {
                const username = document.getElementById('adminUser').value;
                const password = document.getElementById('adminPass').value;
                const msgEl = document.getElementById('adminMsg');

                if (username === 'admin' && password === getResetCode()) {
                    this.isAuthenticated = true;
                    msgEl.textContent = 'Authentication successful';
                    msgEl.className = 'message success';
                    
                    document.getElementById('loginForm').classList.add('hidden');
                    document.getElementById('tokenForm').classList.remove('hidden');
                } else {
                    msgEl.textContent = 'Invalid credentials';
                    msgEl.className = 'message error';
                }
            }

            handleTokenSubmit() {
                if (!this.isAuthenticated) {
                    this.showTokenMessage('Unauthorized', 'error');
                    return;
                }

                const token = document.getElementById('tokenInput').value;
                const parts = token.split(':');

                if (parts.length === 5) {
                    const [sessId, seed, score, timestamp, hmac] = parts;
                    const reconstructed = `${sessId}:${seed}:${score}:${timestamp}`;
                    const expectedHmac = this.game.computeHash(reconstructed, getSecurityKey());
                    
                    if (hmac === expectedHmac) {
                        this.showTokenMessage('🎉 ' + getFlag(), 'success');
                    } else {
                        this.showTokenMessage('Invalid token signature', 'error');
                    }
                } else {
                    this.showTokenMessage('Invalid token format', 'error');
                }
            }

            showTokenMessage(message, type) {
                const msgEl = document.getElementById('tokenMsg');
                msgEl.textContent = message;
                msgEl.className = `message ${type}`;
            }
        }

        class GameControls {
            constructor(game) {
                this.game = game;
                this.initControls();
            }

            initControls() {
                const buttons = document.querySelectorAll('.control-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const direction = btn.getAttribute('data-direction');
                        this.handleDirection(direction);
                    });
                });
            }

            handleDirection(direction) {
                switch(direction) {
                    case 'up':
                        this.game.move(0, -1);
                        break;
                    case 'down':
                        this.game.move(0, 1);
                        break;
                    case 'left':
                        this.game.move(-1, 0);
                        break;
                    case 'right':
                        this.game.move(1, 0);
                        break;
                }
            }
        }

        window.getRobotsTxt = function() {
            return ROBOTS_TXT;
        };

        window.getBackupConfig = function() {
            return BACKUP_CONFIG;
        };

        window.getMetadata = function() {
            return HIDDEN_METADATA;
        };

        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('gameCanvas');
            const game = new MazeGame(canvas);
            const controls = new GameControls(game);
            const adminPanel = new AdminPanel(game);

            setTimeout(() => {
                console.log('%cLabyrinth v2.3.1', 'color:#22d3ee;font-size:12px');
                console.log('%cYou must get: RobotsTxt, BackupConfig, Metadata', 'color:#f59e0b;font-size:14px;font-weight:bold');
                console.log('Full Session ID:', game.sessionId);
            }, 1500);

            window.game = game;
        });
