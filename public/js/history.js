document.addEventListener('DOMContentLoaded', function() {
    loadHistory();

    function loadHistory() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('historyList').style.display = 'none';
        document.getElementById('noHistory').style.display = 'none';

        fetch('/api/history-polls')
            .then(response => response.json())
            .then(history => {
                document.getElementById('loading').style.display = 'none';
                
                if (history.length === 0) {
                    document.getElementById('noHistory').style.display = 'block';
                } else {
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

        const createdTime = new Date(poll.createdAt).toLocaleString('zh-TW');
        const endedTime = new Date(poll.endedAt).toLocaleString('zh-TW');

        card.innerHTML = `
            <div class="poll-header">
                <h3 class="poll-question">${poll.question}</h3>
                <span class="poll-status ended">已結束</span>
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

    window.refreshHistory = function() {
        loadHistory();
    }
});