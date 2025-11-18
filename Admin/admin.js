// ===== グローバル変数 =====
let posts = [];
let currentFilter = null;
let selectedImages = [];
let reactionsData = {}; // リアクションデータのキャッシュ
let githubConfig = {
    repo: '',
    branch: 'main',
    token: ''
};

// リアクションの種類
const REACTIONS = [
    { emoji: 'iine', name: 'いいね', image: '../stamps/iine.png' },
    { emoji: 'suki', name: 'すき', image: '../stamps/suki.png' },
    { emoji: 'omedetou', name: 'おめでと', image: '../stamps/omedetou.png' },
    { emoji: 'gannbare', name: 'がんば', image: '../stamps/gannbare.png' },
    { emoji: 'otukare', name: 'おつかれ', image: '../stamps/otukare.png' },
    { emoji: 'kitai', name: '期待', image: '../stamps/kitai.png' },
    { emoji: 'wakaru', name: 'わかる', image: '../stamps/wakaru.png' }
];

// トリミング関連
let cropImage = null;
let cropCanvas = null;
let cropCtx = null;
let cropStart = null;
let cropEnd = null;
let isCropping = false;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadGithubConfig();
    loadSettings();
    loadLocalPosts();
    setupEventListeners();
    checkGithubConnection();
});

// ===== GitHub設定読み込み =====
function loadGithubConfig() {
    const saved = localStorage.getItem('githubConfig');
    if (saved) {
        githubConfig = JSON.parse(saved);
        document.getElementById('repoInput').value = githubConfig.repo || '';
        document.getElementById('branchInput').value = githubConfig.branch || 'main';
        document.getElementById('tokenInput').value = githubConfig.token || '';
    }
}

// ===== GitHub設定保存 =====
function saveGithubConfig() {
    githubConfig.repo = document.getElementById('repoInput').value.trim();
    githubConfig.branch = document.getElementById('branchInput').value.trim() || 'main';
    githubConfig.token = document.getElementById('tokenInput').value.trim();
    
    if (!githubConfig.repo || !githubConfig.token) {
        showMessage('リポジトリ名とトークンを入力してください', 'error');
        return;
    }
    
    localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
    showMessage('GitHub設定を保存しました', 'success');
    checkGithubConnection();
    closeModal('settingsModal');
}

// ===== GitHub接続確認 =====
async function checkGithubConnection() {
    const statusEl = document.getElementById('authStatus');
    
    if (!githubConfig.repo || !githubConfig.token) {
        statusEl.className = 'auth-status disconnected';
        statusEl.textContent = '⚠️ GitHub設定が未設定です。設定画面から設定してください。';
        return;
    }
    
    statusEl.className = 'auth-status loading';
    statusEl.textContent = '🔄 GitHub接続確認中...';
    
    try {
        const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            statusEl.className = 'auth-status connected';
            statusEl.textContent = `✅ GitHub接続成功: ${githubConfig.repo}`;
            await syncWithGithub();
        } else {
            statusEl.className = 'auth-status disconnected';
            statusEl.textContent = '❌ GitHub接続失敗。設定を確認してください。';
        }
    } catch (error) {
        statusEl.className = 'auth-status disconnected';
        statusEl.textContent = '❌ GitHub接続エラー: ' + error.message;
    }
}

// ===== GitHubと同期 =====
async function syncWithGithub() {
    try {
        const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/posts.json?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const contentDecoded = decodeURIComponent(escape(atob(data.content)));
            const content = JSON.parse(contentDecoded);
            posts = content.posts || [];
            saveLocalPosts();
            renderTimeline();
            updateHashtagList();
        } else {
            // posts.jsonが存在しない場合は新規作成
            posts = [];
            renderTimeline();
        }
    } catch (error) {
        console.log('GitHubからのデータ取得失敗:', error);
        loadLocalPosts();
    }
}

// ===== ローカルストレージに保存 =====
function saveLocalPosts() {
    localStorage.setItem('posts', JSON.stringify(posts));
}

// ===== ローカルストレージから読み込み =====
function loadLocalPosts() {
    const saved = localStorage.getItem('posts');
    if (saved) {
        posts = JSON.parse(saved);
        renderTimeline();
        updateHashtagList();
    }
}

// ===== GitHubにpush =====
async function pushToGithub() {
    if (!githubConfig.repo || !githubConfig.token) {
        showMessage('GitHub設定が未設定です', 'error');
        return false;
    }
    
    try {
        // 既存のposts.jsonを取得
        let sha = null;
        const getResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/posts.json?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }
        
        // posts.jsonを更新
        const jsonString = JSON.stringify({ posts }, null, 2);
        const content = btoa(unescape(encodeURIComponent(jsonString)));
        
        const putResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/posts.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update posts.json - ${new Date().toISOString()}`,
                content: content,
                sha: sha,
                branch: githubConfig.branch
            })
        });
        
        if (putResponse.ok) {
            return true;
        } else {
            const error = await putResponse.json();
            throw new Error(error.message || 'GitHub pushに失敗しました');
        }
    } catch (error) {
        console.error('GitHub push error:', error);
        showMessage('GitHubへのpushに失敗: ' + error.message, 'error');
        return false;
    }
}

// ===== 投稿処理 =====
async function createPost() {
    const text = document.getElementById('postText').value.trim();
    
    if (!text && selectedImages.length === 0) {
        showMessage('投稿内容を入力してください', 'error');
        return;
    }
    
    const postBtn = document.getElementById('postBtn');
    postBtn.disabled = true;
    postBtn.textContent = '投稿中...';
    
    try {
        // ハッシュタグ抽出
        const hashtags = extractHashtags(text);
        
        // 投稿データ作成
        const post = {
            id: Date.now().toString(),
            text: text,
            timestamp: new Date().toISOString(),
            images: selectedImages,
            hashtags: hashtags,
            userIcon: getUserIcon()
        };
        
        // 投稿を先頭に追加
        posts.unshift(post);
        
        // ローカルに保存
        saveLocalPosts();
        
        // GitHubにpush
        const success = await pushToGithub();
        
        if (success) {
            showMessage('投稿しました！', 'success');
            
            // フォームリセット
            document.getElementById('postText').value = '';
            selectedImages = [];
            document.getElementById('imagePreview').innerHTML = '';
            
            // タイムライン更新
            renderTimeline();
            updateHashtagList();
        } else {
            // push失敗した場合は投稿を取り消し
            posts.shift();
            saveLocalPosts();
            renderTimeline();
        }
    } catch (error) {
        showMessage('投稿に失敗しました: ' + error.message, 'error');
        posts.shift();
        saveLocalPosts();
        renderTimeline();
    } finally {
        postBtn.disabled = false;
        postBtn.textContent = '投稿';
    }
}

// ===== 投稿削除 =====
async function deletePost(postId) {
    if (!confirm('この投稿を削除しますか？')) {
        return;
    }
    
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return;
    
    // 投稿を削除
    posts.splice(index, 1);
    
    // ローカルに保存
    saveLocalPosts();
    
    // GitHubにpush
    const success = await pushToGithub();
    
    if (success) {
        showMessage('投稿を削除しました', 'success');
        renderTimeline();
        updateHashtagList();
    } else {
        showMessage('削除に失敗しました', 'error');
    }
}

// ===== ハッシュタグ抽出 =====
function extractHashtags(text) {
    const matches = text.match(/#([^\s#]+)/g);
    if (!matches) return [];
    return matches.map(tag => tag.replace('#', ''));
}

// ===== 画像選択 =====
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = event.target.result;
                selectedImages.push(img);
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }
    });
    
    e.target.value = '';
}

// ===== 画像プレビュー更新 =====
function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = selectedImages.map((img, index) => `
        <div class="preview-item">
            <img src="${img}" alt="プレビュー">
            <button class="preview-remove" onclick="removeImage(${index})">×</button>
        </div>
    `).join('');
}

// ===== 画像削除 =====
function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

// ===== タイムライン表示 =====
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    
    if (posts.length === 0) {
        showEmptyState();
        return;
    }
    
    let filteredPosts = posts;
    
    if (currentFilter) {
        filteredPosts = posts.filter(post => 
            post.hashtags && post.hashtags.includes(currentFilter)
        );
    }
    
    if (filteredPosts.length === 0) {
        timeline.innerHTML = '<div class="empty-state"><p>該当する投稿がありません</p></div>';
        return;
    }
    
    timeline.innerHTML = filteredPosts.map(post => createPostHTML(post)).join('');
    
    // ハッシュタグクリックイベント
    document.querySelectorAll('.hashtag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const hashtag = e.target.textContent.replace('#', '');
            filterByHashtag(hashtag);
        });
    });
    
    // リアクション数を読み込み
    filteredPosts.forEach(post => {
        loadReactions(post.id);
    });
}

// ===== 投稿HTML生成 =====
function createPostHTML(post) {
    const time = new Date(post.timestamp);
    const formattedTime = formatDate(time);
    const textWithLinks = linkifyText(post.text);
    
    let imagesHTML = '';
    if (post.images && post.images.length > 0) {
        const imageClass = post.images.length === 1 ? 'single' : 
                          post.images.length === 2 ? 'double' : 'multi';
        imagesHTML = `
            <div class="post-images ${imageClass}">
                ${post.images.map(img => `
                    <img src="${img}" alt="投稿画像" class="post-image">
                `).join('')}
            </div>
        `;
    }
    
    // リアクション表示（管理画面では閲覧のみ）
    const reactionsHTML = `
        <div class="post-reactions-admin">
            ${REACTIONS.map(reaction => `
                <span class="reaction-display" id="count-${post.id}-${reaction.emoji}">
                    ${reaction.image 
                        ? `<img src="${reaction.image}" class="reaction-emoji-img" alt="${reaction.name}">` 
                        : `<span class="reaction-emoji">${reaction.emoji}</span>`
                    }
                    <span class="reaction-count">0</span>
                </span>
            `).join('')}
        </div>
    `;
    
    return `
        <div class="post-item" data-id="${post.id}">
            <img src="${post.userIcon || '../Default-icon.png'}" alt="アイコン" class="user-icon">
            <div class="post-content">
                <div class="post-header">
                    <span class="post-time">${formattedTime}</span>
                </div>
                <div class="post-text">${textWithLinks}</div>
                ${imagesHTML}
                ${reactionsHTML}
                <div class="post-actions">
                    <button class="action-btn-icon" onclick="copyPostText('${post.id}')" title="コピー">
                        <img src="../icon-copy.png" alt="コピー">
                    </button>
                    ${post.images && post.images.length > 0 ? `
                        <button class="action-btn-icon" onclick="downloadImages('${post.id}')" title="画像保存">
                            <img src="../icon-download.png" alt="画像保存">
                        </button>
                    ` : ''}
                    <button class="action-btn-icon action-btn-delete" onclick="deletePost('${post.id}')" title="削除">
                        <img src="../icon-delete.png" alt="削除">
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===== テキストをリンク化 =====
function linkifyText(text) {
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="post-url" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/#([^\s#]+)/g, '<span class="hashtag">#$1</span>');
    return text;
}

// ===== 日付フォーマット =====
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    if (year === now.getFullYear()) {
        return `${month}月${day}日 ${hour}:${minute}`;
    }
    
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

// ===== 空状態表示 =====
function showEmptyState() {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = `
        <div class="empty-state">
            <img src="../logo.png" alt="Ambrose＊Starlit" style="width: 120px; opacity: 0.5; margin-bottom: 16px;">
            <p>まだ投稿がありません</p>
            <p style="font-size: 0.9rem; color: var(--theme-text-light);">上のフォームから投稿してみましょう！</p>
        </div>
    `;
}

// ===== 投稿テキストコピー =====
function copyPostText(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    navigator.clipboard.writeText(post.text).then(() => {
        showMessage('テキストをコピーしました', 'success');
    }).catch(() => {
        showMessage('コピーに失敗しました', 'error');
    });
}

// ===== 画像ダウンロード =====
function downloadImages(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.images) return;
    
    post.images.forEach((img, index) => {
        const link = document.createElement('a');
        link.href = img;
        link.download = `image_${postId}_${index + 1}.png`;
        link.click();
    });
    
    showMessage('画像をダウンロードしました', 'success');
}

// ===== ハッシュタグリスト更新 =====
function updateHashtagList() {
    const hashtagList = document.getElementById('hashtagList');
    const hashtags = new Set();
    
    posts.forEach(post => {
        if (post.hashtags) {
            post.hashtags.forEach(tag => hashtags.add(tag));
        }
    });
    
    if (hashtags.size === 0) {
        hashtagList.innerHTML = '<p style="color: var(--theme-text-light); text-align: center;">ハッシュタグがありません</p>';
        return;
    }
    
    hashtagList.innerHTML = Array.from(hashtags)
        .map(tag => `<div class="hashtag-item" data-tag="${tag}">#${tag}</div>`)
        .join('');
    
    document.querySelectorAll('.hashtag-item').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.dataset.tag;
            filterByHashtag(tag);
            closeModal('searchModal');
        });
    });
}

// ===== ハッシュタグフィルター =====
function filterByHashtag(hashtag) {
    currentFilter = hashtag;
    renderTimeline();
    
    const header = document.querySelector('.header-content');
    let filterBadge = header.querySelector('.filter-badge');
    
    if (!filterBadge) {
        filterBadge = document.createElement('div');
        filterBadge.className = 'filter-badge';
        header.appendChild(filterBadge);
    }
    
    filterBadge.innerHTML = `
        #${hashtag}
        <button onclick="clearFilter()" style="margin-left: 8px; background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">×</button>
    `;
    filterBadge.style.cssText = `
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.3);
        padding: 4px 12px;
        border-radius: 20px;
        color: white;
        font-size: 0.9rem;
        margin-left: 12px;
    `;
}

// ===== フィルタークリア =====
function clearFilter() {
    currentFilter = null;
    renderTimeline();
    
    const filterBadge = document.querySelector('.filter-badge');
    if (filterBadge) {
        filterBadge.remove();
    }
}

// ===== ユーザーアイコン取得 =====
function getUserIcon() {
    return localStorage.getItem('userIcon') || '../Default-icon.png';
}

// ===== メッセージ表示 =====
function showMessage(message, type) {
    const existingMessage = document.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = type === 'error' ? 'error-message' : 'success-message';
    messageEl.textContent = message;
    
    const timeline = document.getElementById('timeline');
    timeline.parentElement.insertBefore(messageEl, timeline);
    
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

// ===== イベントリスナー設定 =====
function setupEventListeners() {
    // 公開ページを見る
    document.getElementById('viewPublicBtn').addEventListener('click', () => {
        window.open('../index.html', '_blank');
    });
    
    // 投稿ボタン
    document.getElementById('postBtn').addEventListener('click', createPost);
    
    // 画像選択
    document.getElementById('imageInput').addEventListener('change', handleImageSelect);
    
    // GitHub設定保存
    document.getElementById('saveGithubBtn').addEventListener('click', saveGithubConfig);
    
    // ヘルプボタン
    document.getElementById('helpBtn').addEventListener('click', () => {
        openModal('helpModal');
    });
    
    // 検索ボタン
    document.getElementById('searchBtn').addEventListener('click', () => {
        openModal('searchModal');
    });
    
    // 設定ボタン
    document.getElementById('settingsBtn').addEventListener('click', () => {
        openModal('settingsModal');
    });
    
    // フィルタークリア
    document.getElementById('clearFilterBtn').addEventListener('click', () => {
        clearFilter();
        closeModal('searchModal');
    });
    
    // ハッシュタグ検索
    document.getElementById('hashtagSearch').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase().replace('#', '');
        document.querySelectorAll('.hashtag-item').forEach(item => {
            const tag = item.dataset.tag.toLowerCase();
            item.style.display = tag.includes(search) ? '' : 'none';
        });
    });
    
    // モーダル閉じる
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // モーダル外クリック
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // アイコン変更
    document.getElementById('iconInput').addEventListener('change', handleIconChange);
    document.getElementById('cropConfirmBtn').addEventListener('click', confirmCrop);
    document.getElementById('cropCancelBtn').addEventListener('click', cancelCrop);
    
    // 背景画像選択
    document.querySelectorAll('.bg-pattern-item').forEach(item => {
        item.addEventListener('click', () => {
            selectBackground(item.dataset.bg);
        });
    });
    
    // カスタム背景
    document.getElementById('bgInput').addEventListener('change', handleCustomBackground);
    
    // 背景透明度
    document.getElementById('bgOpacityCheck').addEventListener('change', (e) => {
        document.body.classList.toggle('bg-clear', !e.target.checked);
        localStorage.setItem('bgOpacity', e.target.checked ? 'true' : 'false');
    });
    
    // テーマ変更
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        changeTheme(e.target.value);
    });
    
    // 初期アイコン表示
    document.getElementById('currentUserIcon').src = getUserIcon();
}

// ===== アイコン変更処理 =====
function handleIconChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        cropImage = new Image();
        cropImage.onload = () => {
            showCropArea();
        };
        cropImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function showCropArea() {
    const cropArea = document.getElementById('iconCropArea');
    cropCanvas = document.getElementById('iconCropCanvas');
    cropCtx = cropCanvas.getContext('2d');
    
    const maxWidth = 500;
    const scale = Math.min(1, maxWidth / cropImage.width);
    cropCanvas.width = cropImage.width * scale;
    cropCanvas.height = cropImage.height * scale;
    
    cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
    
    cropArea.style.display = 'block';
    
    // マウスイベント
    cropCanvas.addEventListener('mousedown', startCrop);
    cropCanvas.addEventListener('mousemove', updateCrop);
    cropCanvas.addEventListener('mouseup', endCrop);
    
    // タッチイベント
    cropCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = cropCanvas.getBoundingClientRect();
        startCrop({
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
    });
    
    cropCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = cropCanvas.getBoundingClientRect();
        updateCrop({
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
    });
    
    cropCanvas.addEventListener('touchend', endCrop);
}

function startCrop(e) {
    isCropping = true;
    cropStart = { x: e.offsetX, y: e.offsetY };
    cropEnd = { x: e.offsetX, y: e.offsetY };
}

function updateCrop(e) {
    if (!isCropping) return;
    
    cropEnd = { x: e.offsetX, y: e.offsetY };
    
    cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.drawImage(cropImage, 0, 0, cropCanvas.width, cropCanvas.height);
    
    const size = Math.min(
        Math.abs(cropEnd.x - cropStart.x),
        Math.abs(cropEnd.y - cropStart.y)
    );
    
    const x = cropEnd.x > cropStart.x ? cropStart.x : cropStart.x - size;
    const y = cropEnd.y > cropStart.y ? cropStart.y : cropStart.y - size;
    
    cropCtx.strokeStyle = 'var(--theme-primary)';
    cropCtx.lineWidth = 3;
    cropCtx.strokeRect(x, y, size, size);
    
    cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    cropCtx.fillRect(0, 0, cropCanvas.width, y);
    cropCtx.fillRect(0, y, x, size);
    cropCtx.fillRect(x + size, y, cropCanvas.width - x - size, size);
    cropCtx.fillRect(0, y + size, cropCanvas.width, cropCanvas.height - y - size);
}

function endCrop() {
    isCropping = false;
}

function confirmCrop() {
    if (!cropStart || !cropEnd) return;
    
    const size = Math.min(
        Math.abs(cropEnd.x - cropStart.x),
        Math.abs(cropEnd.y - cropStart.y)
    );
    
    if (size < 20) {
        showMessage('トリミング範囲が小さすぎます', 'error');
        return;
    }
    
    const x = cropEnd.x > cropStart.x ? cropStart.x : cropStart.x - size;
    const y = cropEnd.y > cropStart.y ? cropStart.y : cropStart.y - size;
    
    const scale = cropImage.width / cropCanvas.width;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    
    tempCtx.drawImage(
        cropImage,
        x * scale, y * scale, size * scale, size * scale,
        0, 0, 200, 200
    );
    
    const iconData = tempCanvas.toDataURL('image/png');
    localStorage.setItem('userIcon', iconData);
    
    document.getElementById('currentUserIcon').src = iconData;
    
    // 既存の全投稿のアイコンを更新
    updateAllPostIcons(iconData);
    
    cancelCrop();
    showMessage('アイコンを変更しました', 'success');
}

// 全投稿のアイコンを更新
async function updateAllPostIcons(newIconData) {
    let updated = false;
    
    posts.forEach(post => {
        post.userIcon = newIconData;
        updated = true;
    });
    
    if (updated) {
        // ローカルに保存
        saveLocalPosts();
        
        // GitHubにpush
        const success = await pushToGithub();
        
        if (success) {
            // タイムライン更新
            renderTimeline();
        }
    }
}

function cancelCrop() {
    document.getElementById('iconCropArea').style.display = 'none';
    document.getElementById('iconInput').value = '';
    cropImage = null;
    cropStart = null;
    cropEnd = null;
}

// ===== モーダル操作 =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== 背景選択 =====
function selectBackground(bg) {
    document.querySelectorAll('.bg-pattern-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedItem = document.querySelector(`[data-bg="${bg}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    if (bg === 'none') {
        document.body.style.backgroundImage = 'none';
        localStorage.setItem('background', 'none');
    } else if (bg === 'custom') {
        document.getElementById('bgInput').click();
    } else {
        document.body.style.backgroundImage = `url('${bg}')`;
        localStorage.setItem('background', bg);
    }
}

// ===== カスタム背景 =====
function handleCustomBackground(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        document.body.style.backgroundImage = `url('${event.target.result}')`;
        localStorage.setItem('background', event.target.result);
        
        document.querySelectorAll('.bg-pattern-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('[data-bg="custom"]').classList.add('active');
    };
    reader.readAsDataURL(file);
}

// ===== テーマ変更 =====
function changeTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
}

// ===== 設定読み込み =====
function loadSettings() {
    // テーマ
    const theme = localStorage.getItem('theme') || 'chocolate';
    document.body.dataset.theme = theme;
    document.getElementById('themeSelect').value = theme;
    
    // 背景
    const background = localStorage.getItem('background');
    if (background && background !== 'none') {
        document.body.style.backgroundImage = `url('${background}')`;
        
        const bgItem = document.querySelector(`[data-bg="${background}"]`);
        if (bgItem) {
            bgItem.classList.add('active');
        } else {
            document.querySelector('[data-bg="custom"]').classList.add('active');
        }
    } else {
        document.querySelector('[data-bg="none"]').classList.add('active');
    }
    
    // 背景透明度
    const bgOpacity = localStorage.getItem('bgOpacity') !== 'false';
    document.getElementById('bgOpacityCheck').checked = bgOpacity;
    document.body.classList.toggle('bg-clear', !bgOpacity);
}

// ===== リアクション読み込み（管理画面用・表示のみ） =====
async function loadReactions(postId) {
    try {
        const docRef = db.collection('reactions').doc(postId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // 各リアクションの数を表示
            REACTIONS.forEach(reaction => {
                const count = data[reaction.emoji] || 0;
                const countEl = document.getElementById(`count-${postId}-${reaction.emoji}`);
                if (countEl) {
                    const countSpan = countEl.querySelector('.reaction-count');
                    if (countSpan) {
                        countSpan.textContent = count;
                        // 0の場合は薄く表示
                        countEl.style.opacity = count > 0 ? '1' : '0.3';
                    }
                }
            });
        } else {
            // データがない場合は0表示
            REACTIONS.forEach(reaction => {
                const countEl = document.getElementById(`count-${postId}-${reaction.emoji}`);
                if (countEl) {
                    countEl.style.opacity = '0.3';
                }
            });
        }
    } catch (error) {
        console.error('リアクション読み込みエラー:', error);
    }
}
