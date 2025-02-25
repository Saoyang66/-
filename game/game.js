// 游戏基础配置
// 在config中添加moveVector
// 修改玩家速度
const config = {
    canvas: null,
    ctx: null,
    player: {
        x: 0, y: 0,
        size: 30,
        speed: 2 // 将速度从5改为2
    },
    points: [],
    score: 0,
    moveVector: { x: 0, y: 0 }, // 移动向量
    bombs: 0, // 当前拥有的炸弹数量
    maxBombs: 5, // 炸弹上限
    isThrowing: false, // 是否正在投掷炸弹
    explosions: [] // 存储爆炸效果
};



// 添加炸弹投掷功能
document.addEventListener('click', (e) => {
    if (config.isThrowing && config.bombs > 0) {
        // 添加画布位置计算
        const rect = config.canvas.getBoundingClientRect();
        const scaleX = config.canvas.width / rect.width;
        const scaleY = config.canvas.height / rect.height;
        
        config.explosions.push({
            x: (e.clientX - rect.left) * scaleX, // 修正后的X坐标
            y: (e.clientY - rect.top) * scaleY,  // 修正后的Y坐标
            radius: 0
        });
        config.isThrowing = false;
        config.bombs--;
    }
});

// 修改投掷炸弹按钮点击事件
document.getElementById('throwBombBtn').addEventListener('click', (e) => {
    e.stopPropagation(); // 添加这行阻止事件冒泡
    if (config.bombs > 0) {
        config.isThrowing = true;
    }
});

// 在gameLoop中添加提示信息显示
function gameLoop() {
    config.ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);

    // 绘制玩家和光点
    config.ctx.fillStyle = 'black';
    config.ctx.font = '24px Arial';
    config.ctx.fillText(`分数: ${config.score}`, 20, 40);

    // 新增：根据移动向量更新位置
    config.player.x += config.moveVector.x * config.player.speed;
    config.player.y += config.moveVector.y * config.player.speed;
    
    // 保持原有的边界检测
    config.player.x = Math.max(config.player.size, 
        Math.min(config.canvas.width - config.player.size, config.player.x));
    config.player.y = Math.max(config.player.size,
        Math.min(config.canvas.height - config.player.size, config.player.y));
    
    // 绘制玩家
    config.ctx.fillStyle = '#2ecc71';
    config.ctx.beginPath();
    config.ctx.arc(config.player.x, config.player.y, config.player.size, 0, Math.PI*2);
    config.ctx.fill();
    
    // 绘制光点
    config.points.forEach((point, index) => {
        config.ctx.fillStyle = {
            normal: '#3498db',
            golden: '#f1c40f',
            red: '#e74c3c'
        }[point.type];
        
        config.ctx.beginPath();
        config.ctx.arc(point.x, point.y, point.size, 0, Math.PI*2);
        config.ctx.fill();
    });
    
    // 检查碰撞
    config.points = config.points.filter(point => {
        const dx = point.x - config.player.x;
        const dy = point.y - config.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.player.size + point.size) {
            if (point.type === 'normal') config.score += 1;
            else if (point.type === 'golden') config.score += 5;
            else if (point.type === 'red') config.bombs += 1; // 红色小球增加炸弹
            return false;
        }
        return true;
    });

    // 处理爆炸效果
    config.explosions = config.explosions.filter(explosion => {
        explosion.radius += 1; // 爆炸半径逐渐增大
        if (explosion.radius > 100) return false; // 最大半径为100
        
        config.ctx.beginPath();
        config.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        config.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        config.ctx.stroke();
        return true;
    });

    // 将分数和炸弹显示移到所有元素绘制之后
    // 绘制提示信息
    if (config.isThrowing) {
        config.ctx.fillStyle = 'red';
        config.ctx.font = '24px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.fillText('请点击屏幕投掷炸弹', config.canvas.width / 2, 40);
    }

    // 绘制分数和炸弹数量（添加背景增强可视性）
    config.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // 半透明白色背景
    config.ctx.fillRect(10, 10, 200, 80);
    
    config.ctx.fillStyle = 'black';
    config.ctx.font = '24px Arial';
    config.ctx.textAlign = 'left';
    config.ctx.fillText(`分数: ${config.score}`, 20, 40);
    config.ctx.fillText(`炸弹: ${config.bombs}/${config.maxBombs}`, 20, 80);

    requestAnimationFrame(gameLoop);
}



// 修改碰撞检测
config.points = config.points.filter(point => {
    const dx = point.x - config.player.x;
    const dy = point.y - config.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < config.player.size + point.size) {
        if (point.type === 'normal') config.score += 1;
        else if (point.type === 'golden') config.score += 5;
        else if (point.type === 'red' && config.bombs < config.maxBombs) {
            config.bombs += 1; // 红色小球增加炸弹，不超过上限
        }
        return false;
    }
    return true;
});

// 初始化虚拟摇杆（需要nipplejs库）
// 初始化虚拟摇杆
function initJoystick() {
    // 确保nipplejs已经加载
    if (typeof nipplejs === 'undefined') {
        console.error('Nipplejs not loaded');
        return;
    }

    const manager = nipplejs.create({
        color: "black",
        zone: document.getElementById('joystick'),
        mode: 'static',
        position: { left: '50%', top: '50%' }
    });

    // 添加摇杆移动限制
    // 修改摇杆移动事件处理
    manager.on('move', (evt, nipple) => {
        const maxDistance = 50;
        const force = Math.min(nipple.distance, maxDistance);
        const angle = nipple.angle.radian;
        
        // 计算标准化移动向量
        config.moveVector.x = Math.cos(angle) * (force / maxDistance);
        config.moveVector.y = -Math.sin(angle) * (force / maxDistance); // 保持Y轴反向
    });

    // 添加摇杆释放事件
    manager.on('end', () => {
        config.moveVector.x = 0;
        config.moveVector.y = 0;
    });

    // 删除initJoystick中的gameLoop定义


// 添加结束事件
manager.on('end', () => {
    // 摇杆释放后的处理（可选）
});
}

// 启动游戏
// 修改启动游戏事件
document.getElementById('startBtn').addEventListener('click', () => {
    // 隐藏开始菜单
    document.getElementById('startMenu').style.display = 'none';
    // 显示投掷炸弹按钮
    document.getElementById('throwBombBtn').style.display = 'block';
    
    // 添加init函数
    function init() {
        config.canvas = document.getElementById('gameCanvas');
        config.ctx = config.canvas.getContext('2d');
        
        // 设置画布尺寸
        const resize = () => {
            config.canvas.width = window.innerWidth;
            config.canvas.height = window.innerHeight;
            config.player.x = config.canvas.width / 2;
            config.player.y = config.canvas.height / 2;
        };
        window.addEventListener('resize', resize);
        resize();
    
        // 生成随机光点
        setInterval(createPoint, 2000);
    
        // 开始游戏循环
        gameLoop();
    }

    init(); // 先调用init初始化画布
    initJoystick(); // 然后初始化摇杆
});

// 将createPoint函数移到init函数之前
function createPoint() {
    const types = ['normal', 'golden', 'red'];
    const type = types[Math.floor(Math.random() * 3)];
    
    config.points.push({
        x: Math.random() * config.canvas.width,
        y: Math.random() * config.canvas.height,
        size: 15,
        type: type,
        lifespan: 5000 // 5秒后消失
    });
}