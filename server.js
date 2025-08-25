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
            createdAt: poll.startTime
        }));
    
    res.json(activePolls);
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
    const { question, options, duration } = req.body;
    
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
        voterIPs: new Set()
    };
    
    polls.set(pollId, poll);
    
    setTimeout(() => {
        if (polls.has(pollId)) {
            polls.get(pollId).active = false;
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
    const poll = polls.get(pollId);
    
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

server.listen(PORT, () => {
    console.log(`伺服器運行在端口 ${PORT}`);
});