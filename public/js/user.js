document.addEventListener('DOMContentLoaded', function() {
    const userId = window.location.pathname.split('/')[2];
    loadUserPolls(userId);

    function loadUserPolls(userId) {
        if (!userId) {
            showError('缺少用戶 ID 參數');
            return;
        }

        document.getElementById('loadingContainer').style.display = 'block';
        document.getElementById('userContainer').style.display = 'none';
        document.getElementById('notFoundContainer').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'none';

        fetch(`/api/user-polls/${encodeURIComponent(userId)}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('用戶不存在');
                    }
                    throw new Error('載入失敗');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('loadingContainer').style.display = 'none';
                
                if (data.total === 0) {
                    document.getElementById('notFoundContainer').style.display = 'block';
                } else {
                    displayUserData(userId, data);
                }
            })
            .catch(error => {
                console.error('載入用戶投票失敗:', error);
                document.getElementById('loadingContainer').style.display = 'none';
                
                if (error.message === '用戶不存在') {
                    document.getElementById('notFoundContainer').style.display = 'block';
                } else {
                    showError(error.message || '載入用戶投票時發生錯誤');
                }
            });
    }

    function displayUserData(userId, data) {
        const userContainer = document.getElementById('userContainer');
        
        // 設置用戶名稱和統計
        document.getElementById('userNameText').textContent = userId;
        document.getElementById('activeCount').textContent = data.active.length;
        document.getElementById('historyCount').textContent = data.history.length;
        document.getElementById('totalCount').textContent = data.total;
        
        // 顯示活躍投票
        displayPolls('activePolls', 'noActivePolls', data.active);
        
        // 顯示歷史投票
        displayPolls('historyPolls', 'noHistoryPolls', data.history);
        
        userContainer.style.display = 'block';
    }

    function displayPolls(containerId, noDataId, polls) {
        const container = document.getElementById(containerId);
        const noDataElement = document.getElementById(noDataId);
        
        container.innerHTML = '';
        
        if (polls.length === 0) {
            noDataElement.style.display = 'block';
        } else {
            noDataElement.style.display = 'none';
            
            polls.forEach(poll => {
                const pollCard = createPollCard(poll);
                container.appendChild(pollCard);
            });
        }
    }

    function createPollCard(poll) {
        const card = document.createElement('div');
        card.className = `poll-card ${poll.status}`;
        
        const createdTime = new Date(poll.createdAt).toLocaleDateString('zh-TW') + ' ' + new Date(poll.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const userTypeName = getUserTypeName(poll.userType);
        
        let timeInfo = '';
        let actionButton = '';
        
        if (poll.status === 'active') {
            const timeRemaining = formatTime(poll.timeRemaining);
            timeInfo = `<div class="stat">
                <span class="stat-label">剩餘時間</span>
                <span class="stat-value">${timeRemaining}</span>
            </div>`;
            actionButton = `
                <a href="/vote/${poll.id}" class="btn-primary" target="_blank">參與投票</a>
                <a href="/result/${poll.id}" class="btn-secondary" target="_blank">查看結果</a>
            `;
        } else {
            const endedTime = new Date(poll.endedAt).toLocaleDateString('zh-TW') + ' ' + new Date(poll.endedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            timeInfo = `<div class="stat">
                <span class="stat-label">結束時間</span>
                <span class="stat-value">${endedTime}</span>
            </div>`;
            actionButton = `<a href="/result/${poll.id}" class="btn-primary" target="_blank">查看結果</a>`;
        }

        card.innerHTML = `
            <div class="poll-header">
                <h3 class="poll-question">${poll.question}</h3>
                <div class="poll-badges">
                    <span class="poll-status ${poll.status}">${poll.status === 'active' ? '進行中' : '已結束'}</span>
                    <span class="user-type-badge ${poll.userType}">${userTypeName}</span>
                </div>
            </div>
            <div class="poll-info">
                <div class="poll-stats">
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
                        <span class="stat-value">${createdTime}</span>
                    </div>
                    ${timeInfo}
                </div>
                <div class="poll-actions">
                    ${actionButton}
                </div>
            </div>
        `;

        return card;
    }

    function getUserTypeName(userType) {
        const typeMap = {
            'default': '一般用戶',
            'premium': '高級用戶',
            'vip': 'VIP用戶'
        };
        return typeMap[userType] || '一般用戶';
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorContainer').style.display = 'block';
    }

    // 定期更新活躍投票的倒數時間
    setInterval(() => {
        const activeCards = document.querySelectorAll('#activePolls .poll-card.active');
        activeCards.forEach(card => {
            const timeElement = card.querySelector('.poll-stats .stat:last-child .stat-value');
            if (timeElement && timeElement.textContent.includes(':')) {
                // 這是一個簡單的倒數，實際應該從伺服器獲取最新數據
                // 這裡只是視覺效果，真實時間以伺服器為準
            }
        });
    }, 1000);
});