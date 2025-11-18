// ===== グローバル変数 =====
let posts = [];
let currentFilter = null;
let reactionsData = {}; // リアクションデータのキャッシュ

// リアクションの種類
const REACTIONS = [
    { emoji: '👍', name: 'いいね' },
    { emoji: '❤️', name: 'すき' },
    { emoji: '🎉', name: 'すごい' },
    { emoji: '😊', name: 'うれしい' },
    { emoji: '✨', name: 'きれい' }
];

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadPosts();
    setupEventListeners();
});

// ===== 投稿データ読み込み =====
async function loadPosts() {
    try {
        const response = await fetch('posts.json');
        if (response.ok) {
            const data = await response.json();
            posts = data.posts || [];
            renderTimeline();
            updateHashtagList();
        } else {
            posts = [];
            showEmptyState();
        }
    } catch (error) {
        console.log('posts.jsonが見つかりません。管理画面から投稿してください。');
        posts = [];
        showEmptyState();
    }
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
    
    // リアクションボタンイベント
    document.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', handleReactionClick);
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
    
    // リアクションボタンHTML
    const reactionsHTML = `
        <div class="post-reactions">
            ${REACTIONS.map(reaction => `
                <button class="reaction-btn" 
                        data-post-id="${post.id}" 
                        data-reaction="${reaction.emoji}"
                        title="${reaction.name}">
                    <span class="reaction-emoji">${reaction.emoji}</span>
                    <span class="reaction-count" id="count-${post.id}-${reaction.emoji}">0</span>
                </button>
            `).join('')}
        </div>
    `;
    
    return `
        <div class="post-item" data-id="${post.id}">
            <img src="${post.userIcon || 'Default-icon.png'}" alt="アイコン" class="user-icon">
            <div class="post-content">
                <div class="post-header">
                    <span class="post-time">${formattedTime}</span>
                </div>
                <div class="post-text">${textWithLinks}</div>
                ${imagesHTML}
                ${reactionsHTML}
            </div>
        </div>
    `;
}

// ===== テキストをリンク化 =====
function linkifyText(text) {
    // URLをリンク化
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="post-url" target="_blank" rel="noopener">$1</a>');
    
    // ハッシュタグをハイライト
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
            <img src="logo.png" alt="Ambrose＊Starlit" style="width: 120px; opacity: 0.5; margin-bottom: 16px;">
            <p>まだ投稿がありません</p>
            <p style="font-size: 0.9rem; color: var(--theme-text-light);">管理画面から投稿してください</p>
        </div>
    `;
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
    
    // ヘッダーにフィルター表示
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

// ===== イベントリスナー設定 =====
function setupEventListeners() {
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

// ===== リアクション機能 =====

// リアクション読み込み
async function loadReactions(postId) {
    try {
        const docRef = db.collection('reactions').doc(postId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            reactionsData[postId] = data;
            
            // 各リアクションの数を表示
            REACTIONS.forEach(reaction => {
                const count = data[reaction.emoji] || 0;
                const countEl = document.getElementById(`count-${postId}-${reaction.emoji}`);
                if (countEl) {
                    countEl.textContent = count;
                    
                    // 自分が押したリアクションをハイライト
                    if (hasUserReacted(postId, reaction.emoji)) {
                        countEl.closest('.reaction-btn').classList.add('reacted');
                    }
                }
            });
        } else {
            // データがない場合は初期化
            reactionsData[postId] = {};
            REACTIONS.forEach(reaction => {
                reactionsData[postId][reaction.emoji] = 0;
            });
        }
    } catch (error) {
        console.error('リアクション読み込みエラー:', error);
        // エラー時はローカルデータで表示
        REACTIONS.forEach(reaction => {
            const countEl = document.getElementById(`count-${postId}-${reaction.emoji}`);
            if (countEl) {
                countEl.textContent = '0';
            }
        });
    }
}

// リアクションクリック処理
async function handleReactionClick(e) {
    const btn = e.currentTarget;
    const postId = btn.dataset.postId;
    const reaction = btn.dataset.reaction;
    
    // スパム防止：連打防止
    if (btn.disabled) return;
    btn.disabled = true;
    
    try {
        const hasReacted = hasUserReacted(postId, reaction);
        
        if (hasReacted) {
            // リアクション取り消し
            await removeReaction(postId, reaction);
            btn.classList.remove('reacted');
        } else {
            // リアクション追加
            await addReaction(postId, reaction);
            btn.classList.add('reacted');
        }
        
        // リアクション数を再読み込み
        await loadReactions(postId);
    } catch (error) {
        console.error('リアクションエラー:', error);
        showReactionError();
    } finally {
        setTimeout(() => {
            btn.disabled = false;
        }, 500);
    }
}

// リアクション追加
async function addReaction(postId, reaction) {
    const docRef = db.collection('reactions').doc(postId);
    
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        let data = {};
        if (doc.exists) {
            data = doc.data();
        }
        
        // カウントを増やす
        data[reaction] = (data[reaction] || 0) + 1;
        
        transaction.set(docRef, data);
    });
    
    // ローカルストレージに記録
    saveUserReaction(postId, reaction, true);
}

// リアクション削除
async function removeReaction(postId, reaction) {
    const docRef = db.collection('reactions').doc(postId);
    
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        if (doc.exists) {
            const data = doc.data();
            data[reaction] = Math.max(0, (data[reaction] || 0) - 1);
            transaction.set(docRef, data);
        }
    });
    
    // ローカルストレージから削除
    saveUserReaction(postId, reaction, false);
}

// ユーザーがリアクション済みか確認
function hasUserReacted(postId, reaction) {
    const userReactions = JSON.parse(localStorage.getItem('userReactions') || '{}');
    return userReactions[postId] && userReactions[postId][reaction];
}

// ユーザーのリアクションを記録
function saveUserReaction(postId, reaction, reacted) {
    const userReactions = JSON.parse(localStorage.getItem('userReactions') || '{}');
    
    if (!userReactions[postId]) {
        userReactions[postId] = {};
    }
    
    userReactions[postId][reaction] = reacted;
    localStorage.setItem('userReactions', JSON.stringify(userReactions));
}

// エラー表示
function showReactionError() {
    const toast = document.createElement('div');
    toast.className = 'reaction-toast';
    toast.textContent = 'リアクションの送信に失敗しました';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
