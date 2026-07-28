const STORAGE_USERS = 'chatAppUsers';
const STORAGE_CURRENT_USER = 'chatAppCurrentUser';
const STORAGE_MESSAGES = 'chatAppMessages';
const DEFAULT_USERS = ['salah', 'mariam', 'ahmed', 'sara', 'mohamed', 'youssef'];

const authForm = document.getElementById('authForm');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const messageEl = document.getElementById('message');
const userList = document.getElementById('userList');
const userStatus = document.getElementById('userStatus');
const chatForm = document.getElementById('chatForm');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const logoutBtn = document.getElementById('logoutBtn');
const chatUserList = document.getElementById('chatUserList');

function loadUsers() {
    const stored = localStorage.getItem(STORAGE_USERS);
    if (!stored) {
        saveUsers(DEFAULT_USERS);
        return DEFAULT_USERS.slice();
    }
    try {
        return JSON.parse(stored) || [];
    } catch (error) {
        return DEFAULT_USERS.slice();
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function loadMessages() {
    const stored = localStorage.getItem(STORAGE_MESSAGES);
    if (!stored) {
        return [];
    }
    try {
        return JSON.parse(stored) || [];
    } catch (error) {
        return [];
    }
}

function saveMessages(messages) {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}

function setCurrentUser(name) {
    localStorage.setItem(STORAGE_CURRENT_USER, name);
}

function getCurrentUser() {
    return localStorage.getItem(STORAGE_CURRENT_USER);
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_CURRENT_USER);
}

function normalize(name) {
    return name.trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, '');
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + (a[j - 1] === b[i - 1] ? 0 : 1)
            );
        }
    }
    return matrix[b.length][a.length];
}

function isSimilarName(name, existing) {
    const normalizedName = normalize(name);
    return existing.some(existingName => {
        const normalizedExisting = normalize(existingName);
        return (
            normalizedName === normalizedExisting ||
            normalizedName.includes(normalizedExisting) ||
            normalizedExisting.includes(normalizedName) ||
            levenshtein(normalizedName, normalizedExisting) <= 2
        );
    });
}

function getStoredUsers() {
    return loadUsers();
}

function showError(text) {
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = 'message error';
    }
}

function showSuccess(text) {
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = 'message success';
    }
}

function renderUserList(listElement, users) {
    if (!listElement) return;
    listElement.innerHTML = '';
    users.forEach(name => {
        const li = document.createElement('li');
        li.textContent = '@' + name;
        listElement.appendChild(li);
    });
}

function handleRegister() {
    const rawName = usernameInput.value;
    const name = normalize(rawName);
    const users = getStoredUsers();

    if (!name || name.length < 3) {
        showError('الاسم قصير جدًا، استخدم 3 أحرف أو أكثر.');
        return;
    }

    if (!/^[@a-z0-9._\u0621-\u064A\u0660-\u0669]+$/i.test(rawName)) {
        showError('اسم المستخدم يجب أن يحتوي أرقام، حروف، نقطة، underscore، أو @ فقط.');
        return;
    }

    if (users.includes(name) || isSimilarName(name, users)) {
        showError('هذا الاسم مشابه أو موجود بالفعل. اختر اسمًا مختلفًا.');
        return;
    }

    users.push(name);
    saveUsers(users);
    setCurrentUser(name);
    showSuccess(`تم التسجيل باسم @${name}. جاري الانتقال إلى صفحة الدردشة...`);
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 900);
}

function handleLogin() {
    const rawName = usernameInput.value;
    const name = normalize(rawName);
    const users = getStoredUsers();

    if (!name) {
        showError('أدخل اسم مستخدم لتسجيل الدخول.');
        return;
    }

    if (!users.includes(name)) {
        showError('الاسم غير موجود. استخدم تسجيل جديد أولًا.');
        return;
    }

    setCurrentUser(name);
    showSuccess(`مرحبًا @${name}. جاري الانتقال إلى الدردشة...`);
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 700);
}

if (authForm) {
    renderUserList(userList, getStoredUsers());
    registerBtn.addEventListener('click', handleRegister);
    loginBtn.addEventListener('click', handleLogin);
    authForm.addEventListener('submit', event => event.preventDefault());
}

if (chatForm) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
    } else {
        if (userStatus) {
            userStatus.textContent = `أنت متصل الآن كـ @${currentUser}`;
        }
        renderUserList(chatUserList, getStoredUsers());
        let messages = loadMessages();
        if (messages.length === 0) {
            messages = [
                { user: 'النظام', text: 'مرحبًا بك في غرفة الدردشة. ابدأ رسالة الآن!', time: new Date().toLocaleTimeString() }
            ];
            saveMessages(messages);
        }

        function renderMessages() {
            chatWindow.innerHTML = '';
            messages.forEach(item => {
                const bubble = document.createElement('div');
                const isSelf = item.user === currentUser;
                bubble.className = `chat-bubble ${isSelf ? 'self' : 'other'}`;
                bubble.innerHTML = `<span class="bubble-user">${item.user === 'النظام' ? '' : '@' + item.user}</span><span class="bubble-text">${item.text}</span><span class="bubble-time">${item.time}</span>`;
                chatWindow.appendChild(bubble);
            });
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        renderMessages();

        chatForm.addEventListener('submit', event => {
            event.preventDefault();
            const text = chatInput.value.trim();
            if (!text) {
                return;
            }
            const newMessage = {
                user: currentUser,
                text,
                time: new Date().toLocaleTimeString()
            };
            messages.push(newMessage);
            saveMessages(messages);
            chatInput.value = '';
            renderMessages();
        });
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        clearCurrentUser();
        window.location.href = 'index.html';
    });
}
