document.addEventListener('DOMContentLoaded', function() {
    const pollId = window.location.pathname.split('/').pop();
    const socket = io();
    let poll = null;
    let hasVoted = false;
    let timer = null;
    let chart = null;

    loadPoll();
    
    socket.emit('joinPoll', pollId);

    socket.on('voteUpdate', (data) => {
        console.log('接收到投票更新:', data);
        updateLiveResults(data);
    });

    socket.on('pollEnded', () => {
        showEnded();
    });

    async function loadPoll() {
        try {
            console.log('正在載入投票資料...', pollId);
            const response = await fetch(`/api/poll/${pollId}`);
            console.log('API 回應狀態:', response.status);
            
            if (!response.ok) {
                console.error('API 請求失敗:', response.status);
                showError('投票不存在或已結束');
                return;
            }

            poll = await response.json();
            console.log('投票資料:', poll);
            displayPoll();
            startTimer();
        } catch (error) {
            console.error('載入投票失敗:', error);
            showError('載入投票失敗: ' + error.message);
        }
    }

    function displayPoll() {
        console.log('開始顯示投票內容');
        console.log('投票問題:', poll.question);
        console.log('選項數量:', poll.options.length);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('voteContainer').style.display = 'block';
        
        document.getElementById('question').textContent = poll.question;
        
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        // 根據選項數量添加對應的 CSS 類別
        const optionCount = poll.options.length;
        optionsContainer.className = `options-container options-${optionCount}`;

        poll.options.forEach((option, index) => {
            console.log(`建立選項 ${index}: ${option.text}`);
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <button class="option-button" onclick="vote(${index})">
                    ${option.text}
                </button>
            `;
            optionsContainer.appendChild(optionDiv);
        });

        updateTotalVotes();
        console.log('投票內容顯示完成');
    }

    function startTimer() {
        if (!poll.active) {
            showEnded();
            return;
        }

        timer = setInterval(() => {
            poll.timeRemaining = Math.max(0, poll.timeRemaining - 1000);
            updateTimer();
            
            if (poll.timeRemaining <= 0) {
                clearInterval(timer);
                showEnded();
            }
        }, 1000);

        updateTimer();
    }

    function updateTimer() {
        const minutes = Math.floor(poll.timeRemaining / 60000);
        const seconds = Math.floor((poll.timeRemaining % 60000) / 1000);
        document.getElementById('timeRemaining').textContent = 
            `剩餘時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateTotalVotes() {
        const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
        document.getElementById('totalVotes').textContent = total;
    }

    window.vote = async function(optionIndex) {
        if (hasVoted) {
            alert('您已經投過票了！');
            return;
        }

        try {
            const response = await fetch(`/api/vote/${pollId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optionIndex })
            });

            const result = await response.json();

            if (response.ok) {
                hasVoted = true;
                showVoted();
                // 不需要重新載入，等待 Socket.io 的即時更新
            } else {
                alert(result.error || '投票失敗');
            }
        } catch (error) {
            console.error('投票失敗:', error);
            alert('投票時發生錯誤');
        }
    }

    async function loadPollForResults() {
        try {
            const response = await fetch(`/api/poll/${pollId}`);
            if (response.ok) {
                poll = await response.json();
                updateLiveResults({ options: poll.options, totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0) });
            }
        } catch (error) {
            console.error('載入結果失敗:', error);
        }
    }

    function showVoted() {
        document.getElementById('voteContainer').style.display = 'none';
        document.getElementById('votedContainer').style.display = 'block';
        
        // 初始化即時結果顯示，使用當前數據
        if (poll && poll.options) {
            const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
            if (totalVotes > 0) {
                // 確保有投票數據時立即顯示結果
                updateLiveResults({
                    options: poll.options,
                    totalVotes: totalVotes
                });
            }
        }
    }

    function showEnded() {
        clearInterval(timer);
        document.getElementById('voteContainer').style.display = 'none';
        document.getElementById('votedContainer').style.display = 'none';
        document.getElementById('endedContainer').style.display = 'block';
        
        // 3秒後跳轉到結果頁面
        setTimeout(() => {
            window.location.href = `/result/${pollId}`;
        }, 3000);
    }

    function showError(message) {
        document.getElementById('loading').textContent = message;
    }

    function updateLiveResults(data) {
        const { options, totalVotes } = data;
        poll.options = options;
        
        // 總是更新總票數顯示（即使還沒投票）
        document.getElementById('totalVotes').textContent = totalVotes;

        // 只有在已投票狀態下才更新即時結果顯示
        if (hasVoted) {
            // 更新統計
            const statsDiv = document.getElementById('liveStats');
            statsDiv.innerHTML = `
                <p><strong>總投票數: ${totalVotes}</strong></p>
                <div class="results-list">
                    ${options.map(option => `
                        <div class="result-item">
                            <span class="option-name">${option.text}</span>
                            <span class="vote-count">${option.votes} 票</span>
                            <span class="percentage">(${totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0}%)</span>
                        </div>
                    `).join('')}
                </div>
            `;

            // 更新圓餅圖
            if (totalVotes > 0) {
                updateChart(options, totalVotes);
            }
        }
    }

    function updateChart(options, totalVotes) {
        const chartContainer = document.getElementById('liveChart');
        
        if (!chart) {
            chartContainer.innerHTML = '<canvas id="liveChartCanvas"></canvas>';
            const ctx = document.getElementById('liveChartCanvas').getContext('2d');
            chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: options.map(option => option.text),
                    datasets: [{
                        data: options.map(option => option.votes),
                        backgroundColor: generateColors(options.length)
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } else {
            chart.data.datasets[0].data = options.map(option => option.votes);
            chart.update();
        }
    }

    function generateColors(count) {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];
        return colors.slice(0, count);
    }
});