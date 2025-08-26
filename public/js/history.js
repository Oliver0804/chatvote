document.addEventListener('DOMContentLoaded', function() {
    loadHistory();

    function loadHistory() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('historyList').style.display = 'none';
        document.getElementById('noHistory').style.display = 'none';

        fetch('/api/history-polls')
            .then(response => {
                console.log('歷史投票 API 回應狀態:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(history => {
                console.log('收到歷史投票數據:', history);
                document.getElementById('loading').style.display = 'none';
                
                if (!history || history.length === 0) {
                    console.log('沒有歷史投票數據');
                    document.getElementById('noHistory').style.display = 'block';
                } else {
                    console.log('顯示歷史投票:', history.length, '筆');
                    displayHistory(history);
                }
            })
            .catch(error => {
                console.error('載入歷史投票失敗:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('noHistory').style.display = 'block';
            });
    }

    function displayHistory(history) {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        history.forEach(poll => {
            const pollCard = createHistoryCard(poll);
            historyList.appendChild(pollCard);
        });

        historyList.style.display = 'block';
    }

    function createHistoryCard(poll) {
        const card = document.createElement('div');
        card.className = 'poll-card ended';

        const createdTime = new Date(poll.createdAt).toLocaleDateString('zh-TW') + ' ' + new Date(poll.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const endedTime = new Date(poll.endedAt).toLocaleDateString('zh-TW') + ' ' + new Date(poll.endedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="poll-header">
                <h3 class="poll-question">${poll.question}</h3>
                <div class="poll-badges">
                    <span class="poll-status ended">已結束</span>
                    <span class="user-type-badge ${poll.userType || 'default'}">${getUserTypeName(poll.userType)}</span>
                </div>
            </div>
            <div class="poll-info">
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
                        <span class="stat-label">投票結果</span>
                        <span class="stat-value">${poll.winnerOption || '無投票'} ${poll.winnerVotes > 0 ? `(${poll.winnerVotes}票)` : ''}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">結束時間</span>
                        <span class="stat-value">${endedTime}</span>
                    </div>
                </div>
                <div class="poll-actions">
                    <a href="/result/${poll.id}" class="btn-primary" target="_blank">查看結果</a>
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

    window.refreshHistory = function() {
        loadHistory();
    }
});