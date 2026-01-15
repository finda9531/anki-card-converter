const dropZone = document.getElementById('drop-zone');
const convertBtn = document.getElementById('convert-btn');
const statusText = document.getElementById('status-text');
const downloadLink = document.getElementById('download-link');
const inputSection = document.getElementById('input-section');
const deckNameInput = document.getElementById('deck-name-input');

let currentFileContent = "";

// ドラッグ＆ドロップ処理
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; 
    input.accept = '.txt';
    input.onchange = e => { if (e.target.files.length > 0) handleFile(e.target.files[0]); };
    input.click();
});

function handleFile(file) {
    if (!file.name.endsWith('.txt')) { alert('txtファイルのみ対応です'); return; }
    
    const fileNameWithoutExt = file.name.replace(/\.txt$/i, "");
    const reader = new FileReader();
    
    reader.onload = e => {
        currentFileContent = e.target.result;
        dropZone.innerHTML = `<span style="font-size:1.2em">📄</span><br>${file.name}`;
        inputSection.style.display = 'block';
        deckNameInput.value = fileNameWithoutExt;
        deckNameInput.focus();
        convertBtn.disabled = false;
        statusText.innerText = "";
        downloadLink.style.display = 'none';
    };
    reader.readAsText(file);
}

function formatToHtml(text) {
    const lines = text.trim().split(/\r\n|\r|\n/);
    if (lines.length <= 1) return text.trim();
    return lines[0] + '<br><small style="font-size:0.8em; color:#777;">' + lines.slice(1).join('<br>') + '</small>';
}

function sanitizeFileName(input) {
    return input.replace(/[\\/:*?"<>|]/g, "").trim() || "AnkiDeck";
}

convertBtn.addEventListener('click', () => {
    if (!currentFileContent) return;
    
    const safeFileName = sanitizeFileName(deckNameInput.value);
    const cards = currentFileContent.split('===');
    let csvContent = ""; 
    let count = 0;

    cards.forEach(card => {
        if (!card.trim()) return;
        const parts = card.split('---');
        if (parts.length >= 2) {
            const front = `"${formatToHtml(parts[0]).replace(/"/g, '""')}"`;
            const back = `"${formatToHtml(parts[1]).replace(/"/g, '""')}"`;
            csvContent += `${front},${back}\n`;
            count++;
        }
    });

    if (count === 0) {
        statusText.innerText = "有効なカードが見つかりませんでした。";
        return;
    }

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    downloadLink.href = url;
    downloadLink.download = `${safeFileName}.csv`;
    downloadLink.style.display = 'inline-block';
    statusText.innerText = `${count}枚のカードデータを生成しました。`;
    convertBtn.disabled = true;
});
