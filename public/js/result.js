document.addEventListener('DOMContentLoaded', function() {
    const pollId = window.location.pathname.split('/').pop();
    const socket = io();
    let poll = null;
    let chart = null;

    loadPoll();
    
    socket.emit('joinPoll', pollId);

    socket.on('voteUpdate', (data) => {
        updateResults(data);
    });

    socket.on('pollEnded', () => {
        if (poll) {
            poll.active = false;
            updateStatusBadge();
        }
    });

    async function loadPoll() {
        try {
            const response = await fetch(`/api/poll/${pollId}`);
            if (!response.ok) {
                showNotFound();
                return;
            }

            poll = await response.json();
            console.log('載入的投票數據:', poll);
            displayResults();
        } catch (error) {
            console.error('載入投票失敗:', error);
            showNotFound();
        }
    }

    function displayResults() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('resultContainer').style.display = 'block';
        
        document.getElementById('question').textContent = poll.question;
        document.getElementById('resultUrl').value = window.location.href;
        
        updateStatusBadge();
        // 使用服務器返回的格式化選項數據（已包含正確投票數）
        const formattedOptions = poll.options;
        const totalVotes = formattedOptions.reduce((sum, option) => sum + (option.votes || 0), 0);
        
        console.log('接收到的選項數據:', poll.options);
        console.log('計算總投票數:', totalVotes);
        
        updateResults({
            options: formattedOptions,
            totalVotes: totalVotes
        });
    }

    function updateStatusBadge() {
        const statusBadge = document.getElementById('statusBadge');
        if (poll.active) {
            statusBadge.textContent = '進行中';
            statusBadge.className = 'status-badge active';
        } else {
            statusBadge.textContent = '已結束';
            statusBadge.className = 'status-badge ended';
        }
    }

    function updateResults(data) {
        const { options, totalVotes } = data;
        poll.options = options;

        // 更新總票數
        document.getElementById('totalVotes').textContent = `總投票數: ${totalVotes}`;

        // 更新表格
        updateResultsTable(options, totalVotes);

        // 更新圓餅圖
        updateChart(options, totalVotes);
    }

    function updateResultsTable(options, totalVotes) {
        const tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        // 按票數排序
        const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);

        sortedOptions.forEach((option, index) => {
            const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
            const row = document.createElement('tr');
            
            if (index === 0 && option.votes > 0) {
                row.className = 'winner';
            }

            row.innerHTML = `
                <td>
                    <div class="option-cell">
                        <span class="rank">#${index + 1}</span>
                        <span class="option-text">${option.text}</span>
                    </div>
                </td>
                <td class="vote-count">${option.votes}</td>
                <td class="percentage">${percentage}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateChart(options, totalVotes) {
        console.log('更新圓餅圖 - 選項:', options, '總票數:', totalVotes);
        
        if (totalVotes === 0) {
            console.log('總票數為0，顯示暫無數據');
            const canvas = document.getElementById('pieChart');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暫無投票數據', canvas.width / 2, canvas.height / 2);
            return;
        }

        if (!chart) {
            const canvas = document.getElementById('pieChart');
            
            if (!canvas) {
                console.error('找不到 pieChart 元素！');
                return;
            }
            
            if (typeof Chart === 'undefined') {
                console.error('Chart.js 未加載！');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            try {
                chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: options.map(option => option.text),
                    datasets: [{
                        data: options.map(option => option.votes),
                        backgroundColor: generateColors(options.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
            
            // 強制重繪圓餅圖，解決桌面模式顯示問題
            setTimeout(() => {
                if (chart) {
                    chart.resize();
                }
            }, 100);
            } catch (error) {
                console.error('創建 Chart 時發生錯誤:', error);
                return;
            }
        } else {
            chart.data.labels = options.map(option => option.text);
            chart.data.datasets[0].data = options.map(option => option.votes);
            chart.data.datasets[0].backgroundColor = generateColors(options.length);
            chart.update();
        }
    }

    function generateColors(count) {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#8B5CF6', '#10B981',
            '#F59E0B', '#EF4444', '#84CC16', '#06B6D4'
        ];
        return colors.slice(0, count);
    }

    function showNotFound() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('notFoundContainer').style.display = 'block';
    }

    window.copyResultUrl = function() {
        const urlInput = document.getElementById('resultUrl');
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            const copyBtn = document.querySelector('.btn-copy');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '已複製！';
            copyBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        } catch (err) {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製連結');
        }
    }
});