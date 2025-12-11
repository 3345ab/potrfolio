// ========== عدد الزوار ==========
function updateVisitorCount() {
  let count = localStorage.getItem('visitorCount');
  count = count ? parseInt(count) + 1 : 1;
  localStorage.setItem('visitorCount', count);
  document.getElementById('visitor-count').textContent = count;
  if (document.getElementById('admin-visitor-count')) {
    document.getElementById('admin-visitor-count').textContent = count;
  }
}

// ========== Workers ==========
function getWorkers() {
  return JSON.parse(localStorage.getItem('workers') || '[]');
}

function saveWorkers(workers) {
  localStorage.setItem('workers', JSON.stringify(workers));
}

function getComments(index) {
  return JSON.parse(localStorage.getItem(`comments_${index}`) || '[]');
}

function saveComments(index, comments) {
  localStorage.setItem(`comments_${index}`, JSON.stringify(comments));
}

let isAdminMode = false;

function loadWorkers() {
  const container = document.getElementById('workers-container');
  const workers = getWorkers();
  container.innerHTML = '';

  workers.forEach((worker, index) => {
    const card = document.createElement('div');
    card.className = 'worker-card';

    const comments = getComments(index);
    let commentsHTML = '';
    comments.forEach(c => {
      commentsHTML += `<div class="comment-item">${c}</div>`;
    });

    card.innerHTML = `
      <img src="${worker.image}" alt="عاملة">
      <p>${worker.desc}</p>
      <div class="actions">
        <button class="share-btn" onclick="shareWorker()">مشاركة</button>
        ${isAdminMode ? `<button class="delete-btn" onclick="deleteWorker(${index})">حذف</button>` : ''}
      </div>
      <div class="comment-section">
        <div class="comment-input-container">
          <input type="text" class="comment-input" placeholder="أضف تعليقًا (150 حرف كحد أقصى)" maxlength="150">
          <div class="char-count">150</div>
        </div>
        <div class="comments-list">${commentsHTML}</div>
      </div>
    `;
    container.appendChild(card);

    const input = card.querySelector('.comment-input');
    const counter = card.querySelector('.char-count');
    input.addEventListener('input', () => counter.textContent = 150 - input.value.length);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = input.value.trim();
        if (text) {
          addComment(index, text);
          input.value = '';
          counter.textContent = '150';
        }
      }
    });
  });
}

function addComment(workerIndex, text) {
  if (!text.trim()) return;
  const comments = getComments(workerIndex);
  comments.push(text.trim());
  saveComments(workerIndex, comments);
  loadWorkers();
}

function deleteWorker(index) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  const workers = getWorkers();
  workers.splice(index, 1);
  saveWorkers(workers);
  localStorage.removeItem(`comments_${index}`);
  loadWorkers();
}

function addWorker() {
  const file = document.getElementById('workerImage').files[0];
  const desc = document.getElementById('workerDesc').value.trim();
  if (!file || !desc) {
    alert('الرجاء اختيار صورة وإدخال وصف.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const workers = getWorkers();
    workers.push({ image: e.target.result, desc });
    saveWorkers(workers);
    document.getElementById('workerDesc').value = '';
    document.getElementById('workerImage').value = '';
    loadWorkers();
  };
  reader.readAsDataURL(file);
}

function shareWorker() {
  if (navigator.share) {
    navigator.share({ title: 'إدارة المنزل', text: 'شاهد هذه العاملة!', url: location.href });
  } else {
    navigator.clipboard.writeText(location.href).then(() => {
      alert('تم نسخ الرابط!');
    });
  }
}

// ========== الدردشة ==========
function getChatMessages() {
  return JSON.parse(localStorage.getItem('chat_messages') || '[]');
}

function saveChatMessages(messages) {
  localStorage.setItem('chat_messages', JSON.stringify(messages));
}

function addChatMessage(sender, name, text) {
  const messages = getChatMessages();
  messages.push({
    sender: sender, // 'visitor' أو 'admin'
    name: name,
    text: text.trim(),
    time: new Date().toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  });
  saveChatMessages(messages);
  renderChat();
  if (isAdminMode) {
    renderAdminChat();
  }
}

function renderChat() {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  const messages = getChatMessages();
  box.innerHTML = '<div class="chat-msg admin-msg">مرحبًا! كيف يمكنني مساعدتك؟</div>';
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.sender === 'visitor' ? 'user-msg' : 'admin-msg'}`;
    div.innerHTML = `<strong>${msg.name}:</strong> ${msg.text}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

function renderAdminChat() {
  const container = document.getElementById('admin-chat-messages');
  if (!container) return;
  const messages = getChatMessages();
  container.innerHTML = '';
  if (messages.length === 0) {
    container.innerHTML = '<p style="color:#64748b; text-align:center;">لا توجد رسائل واردة</p>';
    return;
  }
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:10px; border-bottom:1px solid #eee; font-size:14px;';
    div.innerHTML = `<strong>${msg.name} [${msg.time}]</strong><br>${msg.text}`;
    container.appendChild(div);
  });
}

// إرسال من الزائر
document.getElementById('chat-send').addEventListener('click', () => {
  const input = document.getElementById('chat-text');
  const text = input.value.trim();
  if (text) {
    addChatMessage('visitor', 'زائر', text);
    input.value = '';
  }
});

document.getElementById('chat-text').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('chat-send').click();
  }
});

// إرسال من الادمن (من داخل لوحة التحكم)
function sendAdminReply() {
  const input = document.getElementById('admin-reply-input');
  const text = input.value.trim();
  if (text) {
    addChatMessage('admin', 'المسؤول', text);
    input.value = '';
  }
}

// عرض حقل الرد عند دخول الادمن
function loadChatMessagesForAdmin() {
  renderAdminChat();

  // تأكد من عدم تكرار حقل الرد
  const replyBox = document.getElementById('admin-reply-box');
  if (replyBox) replyBox.remove();

  const container = document.getElementById('admin-chat-messages');
  if (container) {
    const replyDiv = document.createElement('div');
    replyDiv.id = 'admin-reply-box';
    replyDiv.innerHTML = `
      <div style="margin-top:15px; display:flex; gap:8px;">
        <input type="text" id="admin-reply-input" placeholder="رد على الزبون..." style="flex:1; padding:8px; border:1px solid #ccc; border-radius:6px; font-family:'Tajawal';">
        <button onclick="sendAdminReply()" style="padding:8px 12px; background:#0d6efd; color:white; border:none; border-radius:6px; cursor:pointer;">إرسال</button>
      </div>
    `;
    container.parentNode.appendChild(replyDiv);
  }
}

// ========== التحكم ==========
document.getElementById('admin-trigger').onclick = function() {
  const panel = document.getElementById('admin-panel');
  if (isAdminMode) {
    isAdminMode = false;
    panel.style.display = 'none';
    loadWorkers();
  } else {
    const user = prompt('اسم المستخدم:');
    const pass = prompt('كلمة المرور:');
    if (user === 'abood2005' && pass === '1968') {
      isAdminMode = true;
      panel.style.display = 'block';
      loadWorkers();
      updateVisitorCount();
      loadChatMessagesForAdmin();
    } else {
      alert('بيانات خاطئة');
    }
  }
};

// ========== الدردشة المنبثقة ==========
document.getElementById('chat-icon').onclick = function() {
  const box = document.getElementById('chat-box');
  box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  renderChat(); // تأكد من عرض أحدث الرسائل
};

// ========== التشغيل الأولي ==========
updateVisitorCount();
loadWorkers();
renderChat();