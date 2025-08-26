const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const polls = new Map();
const expiredPolls = new Map(); // 保存已過期的投票，根據用戶類型清理

// 用戶類型配置
const userRetentionConfig = {
    'vip': 30 * 24 * 60 * 60 * 1000,      // VIP: 30天
    'premium': 14 * 24 * 60 * 60 * 1000,  // 高級: 14天
    'default': 7 * 24 * 60 * 60 * 1000    // 默認: 7天
};

function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/polls', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'polls.html'));
});

app.get('/api/active-polls', (req, res) => {
    const activePolls = Array.from(polls.values())
        .filter(poll => poll.active)
        .map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.voterIPs.size,
            timeRemaining: Math.max(0, poll.duration - (Date.now() - poll.startTime)),
            createdAt: poll.startTime,
            createdBy: poll.createdBy || 'anonymous',
            userType: poll.userType || 'default'
        }));
    
    res.json(activePolls);
});

// 新增 API：獲取歷史投票
app.get('/api/history-polls', (req, res) => {
    const historyPolls = Array.from(expiredPolls.values())
        .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime)) // 按結束時間排序
        .map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.voterIPs.size,
            createdAt: poll.startTime,
            endedAt: poll.endTime || poll.startTime,
            status: 'ended',
            createdBy: poll.createdBy || 'anonymous',
            userType: poll.userType || 'default'
        }));
    
    res.json(historyPolls);
});

// 新增路由：歷史投票頁面
app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// 新增 API：根據用戶 ID 獲取投票
app.get('/api/user-polls/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // 獲取活躍投票
    const activeUserPolls = Array.from(polls.values())
        .filter(poll => poll.createdBy === userId)
        .map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.voterIPs.size,
            timeRemaining: Math.max(0, poll.duration - (Date.now() - poll.startTime)),
            createdAt: poll.startTime,
            status: 'active',
            createdBy: poll.createdBy,
            userType: poll.userType
        }));
    
    // 獲取歷史投票
    const historyUserPolls = Array.from(expiredPolls.values())
        .filter(poll => poll.createdBy === userId)
        .sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))
        .map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.voterIPs.size,
            createdAt: poll.startTime,
            endedAt: poll.endTime || poll.startTime,
            status: 'ended',
            createdBy: poll.createdBy,
            userType: poll.userType
        }));
    
    res.json({
        active: activeUserPolls,
        history: historyUserPolls,
        total: activeUserPolls.length + historyUserPolls.length
    });
});

// 新增路由：用戶投票頁面
app.get('/user/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/vote/:pollId', (req, res) => {
    const pollId = req.params.pollId;
    if (polls.has(pollId)) {
        res.sendFile(path.join(__dirname, 'public', 'vote.html'));
    } else {
        res.status(404).send('投票不存在或已結束');
    }
});

app.get('/result/:pollId', (req, res) => {
    const pollId = req.params.pollId;
    if (polls.has(pollId)) {
        res.sendFile(path.join(__dirname, 'public', 'result.html'));
    } else {
        res.status(404).send('投票不存在');
    }
});

app.post('/api/create-poll', async (req, res) => {
    const { question, options, duration, createdBy, userType } = req.body;
    
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: '問題和至少兩個選項是必需的' });
    }
    
    if (!duration || duration < 1 || duration > 60) {
        return res.status(400).json({ error: '時間必須在1-60分鐘之間' });
    }
    
    const pollId = uuidv4().substring(0, 8);
    const poll = {
        id: pollId,
        question,
        options: options.map(option => ({ text: option, votes: 0 })),
        duration: duration * 60 * 1000,
        startTime: Date.now(),
        active: true,
        voterIPs: new Set(),
        createdBy: createdBy || 'anonymous',
        userType: userType || 'default'
    };
    
    polls.set(pollId, poll);
    
    setTimeout(() => {
        if (polls.has(pollId)) {
            const poll = polls.get(pollId);
            poll.active = false;
            poll.endTime = Date.now();
            
            // 將已結束的投票移至過期投票集合
            expiredPolls.set(pollId, poll);
            
            io.to(`poll_${pollId}`).emit('pollEnded');
        }
    }, poll.duration);
    
    const voteUrl = `${req.protocol}://${req.get('host')}/vote/${pollId}`;
    const qrCode = await QRCode.toDataURL(voteUrl);
    
    res.json({
        pollId,
        voteUrl,
        qrCode,
        resultUrl: `${req.protocol}://${req.get('host')}/result/${pollId}`
    });
});

app.get('/api/poll/:pollId', (req, res) => {
    const pollId = req.params.pollId;
    let poll = polls.get(pollId);
    
    // 如果活動投票中沒有，檢查過期投票
    if (!poll) {
        poll = expiredPolls.get(pollId);
    }
    
    if (!poll) {
        return res.status(404).json({ error: '投票不存在' });
    }
    
    res.json({
        id: poll.id,
        question: poll.question,
        options: poll.options,
        active: poll.active,
        timeRemaining: poll.active ? Math.max(0, poll.duration - (Date.now() - poll.startTime)) : 0
    });
});

app.post('/api/vote/:pollId', (req, res) => {
    const pollId = req.params.pollId;
    const { optionIndex } = req.body;
    const poll = polls.get(pollId);
    const clientIP = getClientIP(req);
    
    if (!poll) {
        return res.status(404).json({ error: '投票不存在' });
    }
    
    if (!poll.active) {
        return res.status(400).json({ error: '投票已結束' });
    }
    
    if (poll.voterIPs.has(clientIP)) {
        return res.status(400).json({ error: '您已經投過票了' });
    }
    
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
        return res.status(400).json({ error: '無效的選項' });
    }
    
    poll.options[optionIndex].votes++;
    poll.voterIPs.add(clientIP);
    
    io.to(`poll_${pollId}`).emit('voteUpdate', {
        options: poll.options,
        totalVotes: poll.voterIPs.size
    });
    
    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log('用戶已連接:', socket.id);
    
    socket.on('joinPoll', (pollId) => {
        socket.join(`poll_${pollId}`);
        console.log(`用戶 ${socket.id} 加入投票 ${pollId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('用戶已斷開連接:', socket.id);
    });
});

// 定期清理過期投票（每小時檢查一次）
setInterval(() => {
    const currentTime = Date.now();
    let cleanedCount = 0;
    
    for (const [pollId, poll] of expiredPolls.entries()) {
        const endTime = poll.endTime || poll.startTime;
        const userType = poll.userType || 'default';
        const retentionPeriod = userRetentionConfig[userType];
        
        // 檢查是否超過該用戶類型的保存期限
        if (currentTime - endTime > retentionPeriod) {
            expiredPolls.delete(pollId);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`已清理 ${cleanedCount} 個過期投票（根據用戶類型差異化保存）`);
    }
}, 60 * 60 * 1000); // 每小時執行一次

server.listen(PORT, () => {
    console.log(`伺服器運行在端口 ${PORT}`);
});