const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const {
    testConnection,
    createPoll,
    getPoll,
    updatePollVote,
    getActivePolls,
    getHistoryPolls,
    getUserPolls,
    cleanupExpiredPolls,
    updateExpiredPolls
} = require('./lib/supabase');

const app = express();

// 信任 Cloudflare 代理
app.set('trust proxy', true);

// Cloudflare 代理設定
app.use((req, res, next) => {
    // 記錄來源以便調試
    if (req.get('host') === 'vote.bashcat.net') {
        console.log(`正式域名訪問: ${req.get('x-forwarded-proto')}://${req.get('host')}${req.originalUrl}`);
    }
    next();
});
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Supabase 替代了內存存儲，數據現在持久化在數據庫中

function getClientIP(req) {
    // 在Docker環境中，真實IP通常在X-Forwarded-For或X-Real-IP中
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // X-Forwarded-For 可能包含多個IP，取第一個（原始客戶端IP）
        return forwardedFor.split(',')[0].trim();
    }
    
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp;
    }
    
    // 其他可能的代理頭
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    
    // 直接連接的情況
    const remoteAddr = req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // 清理IPv6映射的IPv4地址
    if (remoteAddr && remoteAddr.startsWith('::ffff:')) {
        return remoteAddr.substring(7);
    }
    
    return remoteAddr || 'unknown';
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/polls', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'polls.html'));
});

app.get('/api/active-polls', async (req, res) => {
    try {
        const activePolls = await getActivePolls();
        
        const formattedPolls = activePolls.map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.total_votes || 0,
            timeRemaining: Math.max(0, new Date(poll.expires_at) - Date.now()),
            createdAt: new Date(poll.created_at).getTime(),
            createdBy: poll.created_by || 'anonymous',
            userType: poll.user_type || 'default'
        }));
        
        res.json(formattedPolls);
    } catch (error) {
        console.error('獲取活躍投票失敗:', error);
        res.status(500).json({ error: '無法獲取活躍投票' });
    }
});

// 新增 API：獲取歷史投票
app.get('/api/history-polls', async (req, res) => {
    try {
        const historyPolls = await getHistoryPolls();
        
        const formattedPolls = historyPolls.map(poll => {
            // 計算最高票選項
            let winnerOption = '無投票';
            let maxVotes = 0;
            
            // console.log('處理投票:', poll.id, 'options:', poll.options, 'votes:', poll.votes);
            
            if (poll.options && poll.votes) {
                // 處理不同的選項格式
                const options = Array.isArray(poll.options) ? poll.options : [];
                
                options.forEach((option, index) => {
                    // 選項可能是字串或物件
                    const optionText = typeof option === 'string' ? option : (option.text || option);
                    const votes = parseInt(poll.votes[optionText] || 0);
                    
                    if (votes > maxVotes) {
                        maxVotes = votes;
                        winnerOption = optionText;
                    }
                });
            }
            
            return {
                id: poll.id,
                question: poll.question,
                optionCount: (poll.options || []).length,
                totalVotes: poll.total_votes || 0,
                createdAt: new Date(poll.created_at).getTime(),
                endedAt: new Date(poll.expires_at).getTime(),
                status: 'ended',
                createdBy: poll.created_by || 'anonymous',
                userType: poll.user_type || 'default',
                winnerOption: winnerOption,
                winnerVotes: maxVotes
            };
        });
        
        res.json(formattedPolls);
    } catch (error) {
        console.error('獲取歷史投票失敗:', error);
        res.status(500).json({ error: '無法獲取歷史投票' });
    }
});

// 新增路由：歷史投票頁面
app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// 新增 API：根據用戶 ID 獲取投票
app.get('/api/user-polls/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userPolls = await getUserPolls(userId);
        
        // 格式化活躍投票
        const activeUserPolls = userPolls.active.map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.total_votes || 0,
            timeRemaining: Math.max(0, new Date(poll.expires_at) - Date.now()),
            createdAt: new Date(poll.created_at).getTime(),
            status: 'active',
            createdBy: poll.created_by,
            userType: poll.user_type
        }));
        
        // 格式化歷史投票
        const historyUserPolls = userPolls.history.map(poll => ({
            id: poll.id,
            question: poll.question,
            optionCount: poll.options.length,
            totalVotes: poll.total_votes || 0,
            createdAt: new Date(poll.created_at).getTime(),
            endedAt: new Date(poll.expires_at).getTime(),
            status: 'ended',
            createdBy: poll.created_by,
            userType: poll.user_type
        }));
        
        res.json({
            active: activeUserPolls,
            history: historyUserPolls,
            total: userPolls.total
        });
    } catch (error) {
        console.error('獲取用戶投票失敗:', error);
        res.status(500).json({ error: '無法獲取用戶投票' });
    }
});

// 新增路由：用戶投票頁面
app.get('/user/:userId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/vote/:pollId', async (req, res) => {
    const pollId = req.params.pollId;
    const poll = await getPoll(pollId);
    
    if (poll) {
        res.sendFile(path.join(__dirname, 'public', 'vote.html'));
    } else {
        res.status(404).send('投票不存在或已結束');
    }
});

app.get('/result/:pollId', async (req, res) => {
    const pollId = req.params.pollId;
    const poll = await getPoll(pollId);
    
    if (poll) {
        res.sendFile(path.join(__dirname, 'public', 'result.html'));
    } else {
        res.status(404).send('投票不存在');
    }
});

app.post('/api/create-poll', async (req, res) => {
    try {
        const { question, options, duration, createdBy, userType } = req.body;
        
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ error: '問題和至少兩個選項是必需的' });
        }
        
        if (!duration || duration < 1 || duration > 60) {
            return res.status(400).json({ error: '時間必須在1-60分鐘之間' });
        }
        
        // 準備投票數據
        const pollData = {
            question,
            options: options.map(option => ({ text: option, votes: 0 })),
            votes: options.reduce((acc, option) => {
                acc[option] = 0;
                return acc;
            }, {}),
            duration_minutes: duration,
            created_by: createdBy || 'anonymous',
            user_type: userType || 'default'
        };
        
        // 創建投票到 Supabase
        const poll = await createPoll(pollData);
        
        if (!poll) {
            return res.status(500).json({ error: '創建投票失敗' });
        }
        
        // 設定定時器來發送結束通知
        setTimeout(async () => {
            try {
                await updateExpiredPolls();
                io.to(`poll_${poll.id}`).emit('pollEnded');
            } catch (error) {
                console.error('更新過期投票狀態失敗:', error);
            }
        }, duration * 60 * 1000);
        
        const voteUrl = `${req.protocol}://${req.get('host')}/vote/${poll.id}`;
        const qrCode = await QRCode.toDataURL(voteUrl);
        
        res.json({
            pollId: poll.id,
            voteUrl,
            qrCode,
            resultUrl: `${req.protocol}://${req.get('host')}/result/${poll.id}`
        });
    } catch (error) {
        console.error('創建投票異常:', error);
        res.status(500).json({ error: '創建投票失敗' });
    }
});

app.get('/api/poll/:pollId', async (req, res) => {
    try {
        const pollId = req.params.pollId;
        const poll = await getPoll(pollId);
        
        if (!poll) {
            return res.status(404).json({ error: '投票不存在' });
        }
        
        const isActive = poll.is_active && new Date(poll.expires_at) > new Date();
        const timeRemaining = isActive ? Math.max(0, new Date(poll.expires_at) - Date.now()) : 0;
        
        // 確保選項數據包含正確投票數（處理舊數據兼容性）
        const formattedOptions = poll.options.map(option => {
            const optionText = option.text;
            // 如果option.votes為0或不存在，優先使用poll.votes中的數據
            const votes = (option.votes && option.votes > 0) ? option.votes : (poll.votes && poll.votes[optionText] ? poll.votes[optionText] : 0);
            return {
                text: optionText,
                votes: parseInt(votes) || 0
            };
        });

        res.json({
            id: poll.id,
            question: poll.question,
            options: formattedOptions,
            active: isActive,
            timeRemaining
        });
    } catch (error) {
        console.error('獲取投票失敗:', error);
        res.status(500).json({ error: '無法獲取投票資訊' });
    }
});

app.post('/api/vote/:pollId', async (req, res) => {
    try {
        const pollId = req.params.pollId;
        const { optionIndex } = req.body;
        const clientIP = getClientIP(req);
        
        const poll = await getPoll(pollId);
        
        if (!poll) {
            return res.status(404).json({ error: '投票不存在' });
        }
        
        const isActive = poll.is_active && new Date(poll.expires_at) > new Date();
        if (!isActive) {
            return res.status(400).json({ error: '投票已結束' });
        }
        
        if (poll.voter_ips && poll.voter_ips.includes(clientIP)) {
            return res.status(400).json({ error: '您已經投過票了' });
        }
        
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ error: '無效的選項' });
        }
        
        // 更新投票數據
        const selectedOption = poll.options[optionIndex].text;
        const newVotes = { ...poll.votes };
        newVotes[selectedOption] = (newVotes[selectedOption] || 0) + 1;
        
        const updatedPoll = await updatePollVote(pollId, newVotes, clientIP);
        
        if (!updatedPoll) {
            return res.status(500).json({ error: '投票更新失敗' });
        }
        
        // 計算總投票數
        const totalVotes = updatedPoll.voter_ips.length;
        
        // 格式化選項數據以符合前端期待的格式
        const formattedOptions = updatedPoll.options.map(option => ({
            text: option.text,
            votes: newVotes[option.text] || 0
        }));
        
        io.to(`poll_${pollId}`).emit('voteUpdate', {
            options: formattedOptions,
            totalVotes
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('投票異常:', error);
        if (error.message === '該IP已經投過票了') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: '投票失敗' });
        }
    }
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

// 定期清理過期投票和更新狀態（每小時檢查一次）
setInterval(async () => {
    try {
        // 更新過期投票的狀態
        await updateExpiredPolls();
        
        // 清理根據用戶類型保存期限的投票
        await cleanupExpiredPolls();
    } catch (error) {
        console.error('定期清理任務失敗:', error);
    }
}, 60 * 60 * 1000); // 每小時執行一次

// 啟動服務器並測試數據庫連接
server.listen(PORT, async () => {
    console.log(`🚀 ChatVote 服務器運行在端口 ${PORT}`);
    
    // 測試 Supabase 連接
    const isConnected = await testConnection();
    if (isConnected) {
        console.log('🗄️ Supabase 數據庫連接正常');
        
        // 啟動後執行一次過期狀態更新
        try {
            await updateExpiredPolls();
            console.log('📋 過期投票狀態已更新');
        } catch (error) {
            console.error('⚠️ 初始化過期投票狀態更新失敗:', error);
        }
    } else {
        console.error('❌ Supabase 連接失敗，請檢查環境變數配置');
        console.log('💡 請確保 .env 文件包含正確的 SUPABASE_URL 和 SUPABASE_ANON_KEY');
    }
});