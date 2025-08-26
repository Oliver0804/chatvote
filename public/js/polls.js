document.addEventListener('DOMContentLoaded', function() {
    loadActivePolls();
    
    // 每30秒自動更新一次
    setInterval(loadActivePolls, 30000);
});

async function loadActivePolls() {
    try {
        const response = await fetch('/api/active-polls');
        const polls = await response.json();
        
        document.getElementById('loading').style.display = 'none';
        
        if (polls.length === 0) {
            document.getElementById('noPolls').style.display = 'block';
            document.getElementById('pollsList').style.display = 'none';
        } else {
            document.getElementById('noPolls').style.display = 'none';
            document.getElementById('pollsList').style.display = 'block';
            displayPolls(polls);
        }
    } catch (error) {
        console.error('載入投票列表失敗:', error);
        document.getElementById('loading').textContent = '載入失敗，請稍後再試';
    }
}

function displayPolls(polls) {
    const pollsList = document.getElementById('pollsList');
    
    // 按剩餘時間排序（剩餘時間多的在前）
    polls.sort((a, b) => b.timeRemaining - a.timeRemaining);
    
    pollsList.innerHTML = polls.map(poll => `
        <div class="poll-card">
            <div class="poll-header">
                <h3 class="poll-question">${poll.question}</h3>
                <div class="poll-badges">
                    <span class="time-remaining">${formatTimeRemaining(poll.timeRemaining)}</span>
                    <span class="user-type-badge ${poll.userType || 'default'}">${getUserTypeName(poll.userType)}</span>
                </div>
            </div>
            <div class="poll-stats">
                <div class="stat">
                    <span class="stat-label">創建者</span>
                    <span class="stat-value">
                        ${poll.createdBy === 'anonymous' ? 
                            '匿名用戶' : 
                            `<a href="/user/${encodeURIComponent(poll.createdBy)}" class="user-link">${poll.createdBy}</a>`
                        }
                    </span>
                </div>
                <div class="stat">
                    <span class="stat-label">選項數量</span>
                    <span class="stat-value">${poll.optionCount}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">總投票數</span>
                    <span class="stat-value">${poll.totalVotes}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">建立時間</span>
                    <span class="stat-value">${formatCreatedTime(poll.createdAt)}</span>
                </div>
            </div>
            <div class="poll-actions">
                <a href="/vote/${poll.id}" class="btn-primary">參與投票</a>
                <a href="/result/${poll.id}" class="btn-secondary">查看結果</a>
            </div>
        </div>
    `).join('');
}

function formatTimeRemaining(timeMs) {
    if (timeMs <= 0) return '已結束';
    
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    if (minutes > 0) {
        return `${minutes} 分 ${seconds} 秒`;
    } else {
        return `${seconds} 秒`;
    }
}

function formatCreatedTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
        return '剛剛';
    } else if (diffMins < 60) {
        return `${diffMins} 分鐘前`;
    } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) {
            return `${diffHours} 小時前`;
        } else {
            return date.toLocaleDateString('zh-TW', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}

function getUserTypeName(userType) {
    const typeMap = {
        'default': '一般用戶',
        'premium': '高級用戶',
        'vip': 'VIP用戶'
    };
    return typeMap[userType] || '一般用戶';
}

function refreshPolls() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('pollsList').style.display = 'none';
    document.getElementById('noPolls').style.display = 'none';
    loadActivePolls();
}