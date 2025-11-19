// ===== カスタム絵文字管理 =====
let customEmojis = [];

// カスタム絵文字をロード
async function loadCustomEmojis() {
    try {
        const response = await fetch('../custom-emojis/emojis.json');
        if (response.ok) {
            const data = await response.json();
            customEmojis = data.emojis || [];
            renderEmojiPalette();
        }
    } catch (error) {
        console.log('カスタム絵文字が見つかりません');
        customEmojis = [];
    }
}

// 絵文字パレットを描画
function renderEmojiPalette() {
    const palette = document.getElementById('emojiPalette');
    if (!palette) return;
    
    if (customEmojis.length === 0) {
        palette.innerHTML = '<p class="empty-emoji">カスタム絵文字がまだありません</p>';
        return;
    }
    
    palette.innerHTML = customEmojis.map(emoji => `
        <button class="emoji-item" 
                data-name="${emoji.name}" 
                data-code=":${emoji.name}:"
                title="${emoji.name}">
            <img src="${emoji.data}" alt=":${emoji.name}:">
            <span class="emoji-name">:${emoji.name}:</span>
        </button>
    `).join('');
    
    // 絵文字クリックイベント
    document.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.currentTarget.dataset.code;
            insertEmojiToText(code);
        });
    });
}

// テキストエリアに絵文字を挿入
function insertEmojiToText(emojiCode) {
    const textarea = document.getElementById('postText');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + emojiCode + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emojiCode.length;
}

// 絵文字を追加
async function addCustomEmoji() {
    const fileInput = document.getElementById('emojiFile');
    const nameInput = document.getElementById('emojiName');
    
    if (!fileInput.files[0] || !nameInput.value.trim()) {
        showMessage('ファイルと名前を入力してください', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // 同名チェック
    if (customEmojis.some(e => e.name === name)) {
        showMessage('同じ名前の絵文字が既に存在します', 'error');
        return;
    }
    
    // ファイルサイズチェック（500KB以下）
    if (file.size > 500 * 1024) {
        showMessage('ファイルサイズは500KB以下にしてください', 'error');
        return;
    }
    
    // 画像をBase64に変換
    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            // 24x24pxにリサイズ
            const canvas = document.createElement('canvas');
            canvas.width = 24;
            canvas.height = 24;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 24, 24);
            
            const resizedData = canvas.toDataURL('image/png');
            
            // 絵文字データを追加
            customEmojis.push({
                name: name,
                data: resizedData
            });
            
            // ローカルストレージに保存
            await saveCustomEmojis();
            
            // UI更新
            renderEmojiPalette();
            renderEmojiList();
            
            // フォームをクリア
            fileInput.value = '';
            nameInput.value = '';
            
            showMessage(`絵文字「:${name}:」を追加しました`, 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 絵文字を削除
async function deleteCustomEmoji(name) {
    if (!confirm(`絵文字「:${name}:」を削除しますか？`)) return;
    
    customEmojis = customEmojis.filter(e => e.name !== name);
    await saveCustomEmojis();
    
    renderEmojiPalette();
    renderEmojiList();
    
    showMessage(`絵文字「:${name}:」を削除しました`, 'success');
}

// 絵文字一覧を描画（管理画面用）
function renderEmojiList() {
    const list = document.getElementById('emojiList');
    if (!list) return;
    
    if (customEmojis.length === 0) {
        list.innerHTML = '<p class="empty-emoji">カスタム絵文字がまだありません</p>';
        return;
    }
    
    list.innerHTML = customEmojis.map(emoji => `
        <div class="emoji-list-item">
            <img src="${emoji.data}" alt=":${emoji.name}:">
            <span>:${emoji.name}:</span>
            <button onclick="deleteCustomEmoji('${emoji.name}')" class="delete-emoji-btn">
                削除
            </button>
        </div>
    `).join('');
}

// カスタム絵文字を保存
async function saveCustomEmojis() {
    // ローカルストレージに保存
    localStorage.setItem('customEmojis', JSON.stringify({ emojis: customEmojis }));
    
    // GitHub同期が有効な場合は同期
    if (githubConfig && githubConfig.token && githubConfig.repo) {
        try {
            await syncCustomEmojisToGithub();
        } catch (error) {
            console.error('GitHub同期エラー:', error);
        }
    }
}

// GitHubに同期
async function syncCustomEmojisToGithub() {
    if (!githubConfig.repo || !githubConfig.token) return;
    
    const content = JSON.stringify({ emojis: customEmojis }, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    // ファイルの現在のSHAを取得
    let fileSha = null;
    try {
        const getResponse = await fetch(
            `https://api.github.com/repos/${githubConfig.repo}/contents/custom-emojis/emojis.json?ref=${githubConfig.branch}`,
            {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            fileSha = fileData.sha;
        }
    } catch (error) {
        console.log('既存ファイルなし、新規作成します');
    }
    
    // ファイルを更新または作成
    const response = await fetch(
        `https://api.github.com/repos/${githubConfig.repo}/contents/custom-emojis/emojis.json`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Update custom emojis',
                content: encodedContent,
                branch: githubConfig.branch,
                sha: fileSha
            })
        }
    );
    
    if (!response.ok) {
        throw new Error('GitHub同期に失敗しました');
    }
}

// テキスト内の絵文字コードを画像に置換
function replaceEmojisInText(text) {
    if (!customEmojis || customEmojis.length === 0) return text;
    
    customEmojis.forEach(emoji => {
        const regex = new RegExp(`:${emoji.name}:`, 'g');
        text = text.replace(regex, `<img src="${emoji.data}" class="inline-emoji" alt=":${emoji.name}:" title=":${emoji.name}:">`);
    });
    
    return text;
}

// 初期化時にカスタム絵文字をロード
document.addEventListener('DOMContentLoaded', () => {
    // ローカルストレージから読み込み
    const saved = localStorage.getItem('customEmojis');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            customEmojis = data.emojis || [];
        } catch (error) {
            console.error('カスタム絵文字の読み込みエラー:', error);
        }
    }
    
    // GitHubから最新を取得（非同期）
    loadCustomEmojis();
});
