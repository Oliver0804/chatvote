document.addEventListener('DOMContentLoaded', function() {
    const pollForm = document.getElementById('pollForm');
    const addOptionBtn = document.getElementById('addOption');
    const optionsContainer = document.getElementById('optionsContainer');
    const createForm = document.getElementById('createForm');
    const resultContainer = document.getElementById('resultContainer');

    addOptionBtn.addEventListener('click', addOption);
    pollForm.addEventListener('submit', createPoll);

    function addOption() {
        const optionCount = optionsContainer.children.length + 1;
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <input type="text" placeholder="選項 ${optionCount}" required>
            <button type="button" class="btn-remove" onclick="removeOption(this)">❌</button>
        `;
        optionsContainer.appendChild(optionDiv);
        updateRemoveButtons();
    }

    window.removeOption = function(button) {
        button.parentElement.remove();
        updateRemoveButtons();
        updatePlaceholders();
    }

    function updateRemoveButtons() {
        const options = optionsContainer.children;
        for (let i = 0; i < options.length; i++) {
            const removeBtn = options[i].querySelector('.btn-remove');
            removeBtn.style.display = options.length > 2 ? 'block' : 'none';
        }
    }

    function updatePlaceholders() {
        const inputs = optionsContainer.querySelectorAll('input');
        inputs.forEach((input, index) => {
            input.placeholder = `選項 ${index + 1}`;
        });
    }

    async function createPoll(e) {
        e.preventDefault();
        
        const question = document.getElementById('question').value.trim();
        const duration = parseInt(document.getElementById('duration').value);
        const optionInputs = optionsContainer.querySelectorAll('input');
        const options = Array.from(optionInputs).map(input => input.value.trim()).filter(option => option);

        if (options.length < 2) {
            alert('至少需要兩個選項');
            return;
        }

        try {
            const response = await fetch('/api/create-poll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    options,
                    duration
                })
            });

            const result = await response.json();

            if (response.ok) {
                showResult(result);
            } else {
                alert(result.error || '建立投票失敗');
            }
        } catch (error) {
            console.error('錯誤:', error);
            alert('建立投票時發生錯誤');
        }
    }

    function showResult(result) {
        createForm.style.display = 'none';
        resultContainer.style.display = 'block';

        document.getElementById('qrCode').src = result.qrCode;
        document.getElementById('voteUrl').value = result.voteUrl;
        document.getElementById('resultLink').href = result.resultUrl;
    }

    window.copyUrl = function() {
        const urlInput = document.getElementById('voteUrl');
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        const copyBtn = document.querySelector('.btn-copy');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已複製！';
        copyBtn.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
        }, 2000);
    }

    window.createAnother = function() {
        resultContainer.style.display = 'none';
        createForm.style.display = 'block';
        pollForm.reset();
        
        // 重設選項為預設的兩個
        optionsContainer.innerHTML = `
            <div class="option-input">
                <input type="text" placeholder="選項 1" required>
                <button type="button" class="btn-remove" onclick="removeOption(this)" style="display: none;">❌</button>
            </div>
            <div class="option-input">
                <input type="text" placeholder="選項 2" required>
                <button type="button" class="btn-remove" onclick="removeOption(this)" style="display: none;">❌</button>
            </div>
        `;
    }
});