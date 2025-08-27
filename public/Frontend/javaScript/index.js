import url  from "../hostname.js");


const socket = io(url, { withCredentials: true });
let currentChatUser = null;

// ✅ Current user fetch karo
fetch(`${url}/me`, { credentials: "include" })
  .then((res) => {
    if (!res.ok) throw new Error("Not logged in");
    return res.json();
  })
  .then((user) => {
    localStorage.setItem("me", JSON.stringify(user));

    // ✅ Server ko join event bhejna
    socket.emit("join", user._id);
  })
  .catch((err) => {
    console.error("Error:", err);
    window.location.href = "${url}/login";
  });

// ✅ All Logger fetch
function allLogger() {
  fetch(`${url}/allLogger`, { credentials: "include" })
    .then((res) => res.json())
    .then((result) => {
      const all_logger = document.querySelector(".allLogger");
      all_logger.innerHTML = "";

      if (result.success) {
        result.data.forEach((logger) => {
          if (!logger._id) return; // safety

          // if (logger.isOnline) {
          const div = document.createElement("div");
          div.id = `${logger._id}_logger`;
          div.className =
            "group flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer";

          div.innerHTML = `
              <img class="w-11 h-11 rounded-full" src="${logger.img}" alt="" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-medium truncate">${logger.name}</p>
                  <span id="${logger._id}_logger_status" class="text-xs text-white/60">${
                    logger.isOnline ? "Online" : "Offline"
                  }</span>
                </div>
                <p class="text-xs text-white/60 truncate">Click to chat</p>
              </div>
            `;

          div.addEventListener("click", () => currentChat(logger));
          all_logger.appendChild(div);
          //  }
        });
      }
    })
    .catch((err) => console.error("Error fetching /allLogger:", err));
}
allLogger();

// ✅ Message bhejna
function sendMessage(text, toUser) {
  const me = JSON.parse(localStorage.getItem("me"));
  if (!me || !toUser) return;

  const messageData = {
    from: me._id,
    to: toUser._id,
    text: text,
  };

  socket.emit("chat-message", messageData);
}

// ✅ Message receive karna
socket.on("chat-message", (data) => {
  console.log("Server se aaya:", data);
  if (currentChatUser && data.from === currentChatUser._id) {
    appendReceivedMessage(data.text, currentChatUser);
  }
});

// ✅ My Message append
function appendMyMessage(text) {
  const container = document.getElementById("messagesPanel");
  let user = JSON.parse(localStorage.getItem("me"));
  const wrap = document.createElement("div");
  wrap.id = `${user._id}_msg`;
  wrap.className = "flex items-end gap-3 justify-end msg-enter";
  wrap.innerHTML = `
      <div class="relative bubble-light rounded-2xl px-4 py-3 my-2 max-w-[70%]">
      <p class="text-[14px] leading-relaxed">${text}</p>
    </div>
    <img class="w-9 h-9 rounded-full" src="${user.img}" alt="" />
    `;
  container.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("show"));
  container.scrollTop = container.scrollHeight;
}

// ✅ Received message append
function appendReceivedMessage(text, sender) {
  const container = document.getElementById("messagesPanel");
  // console.log(text,sender,container);
  const wrap = document.createElement("div");
  wrap.className = "flex items-end gap-3 msg-enter";
  wrap.innerHTML = `
      <div class="flex items-end gap-3">
        <img
          class="w-9 h-9 rounded-full"
          src="${sender.img}"
          alt=""
        />
        <div class="relative bubble-dark rounded-2xl px-4 py-3 max-w-[70%]">
          <p class="text-[14px] leading-relaxed">${text}</p>
        </div>
      </div>
    `;
  container.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add("show"));
  container.scrollTop = container.scrollHeight;
}

function updateChatUI(data) {
  const { openChat, closeChat } = closeBtn();
  openChat();
  closeChat();
  if (data.length === 0) {
    messagesPanel.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" />
      </svg>
      <h1 class="text-2xl font-bold">No Messages Yet</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
      Start a conversation to see messages here. Your chats will appear in a clean, organized panel.
      </p>
    </div>
  `;
    return;
  }

  messagesPanel.innerHTML = "";

  data.forEach((msg) => {
    if (msg.sender._id === currentChatUser._id) {
      appendReceivedMessage(msg.message, msg.sender);
    } else {
      appendMyMessage(msg.message);
    }
  });
}

// ✅ Chat section initialize
function currentChat(chatter) {
  currentChatUser = chatter;
  const chatingSection = document.querySelector(".chatingSection");
  chatingSection.innerHTML = `
    <svg
    class="absolute inset-0 -z-20 w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
    >
    <defs>
    
      <radialGradient id="g1" r="100%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity=".18" />
        <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="g2" r="100%">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity=".14" />
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20%" cy="25%" r="160" fill="url(#g1)">
        <animate
          attributeName="cx"
          values="20%;75%;20%"
          dur="14s"
          repeatCount="indefinite"
          />
          </circle>
      <circle cx="70%" cy="70%" r="220" fill="url(#g2)">
        <animate
          attributeName="cy"
          values="70%;30%;70%"
          dur="18s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    <!-- animated canvas background inside chat area (kept) -->
    <canvas id="bg" class="absolute inset-0 -z-10"></canvas>
    <!-- header (kept) -->
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/70 backdrop-blur"
    >
      <div class="flex items-center gap-3">
        <img class="w-10 h-10 rounded-full" id="${chatter._id}_img" src="${chatter.img}" alt="" />
        <div class="leading-tight">
          <p class="font-semibold" id="${chatter._id}_name">${chatter.name}</p>
          <div class="flex items-center gap-1">
          <p id="${chatter._id}_status" class="text-xs ${
            chatter.isOnline ? "text-green-500" : "text-red-500"
          }">${chatter.isOnline ? "Online" : "Offline"}</p>
          <p id="${chatter._id}_typing" class="text-xs text-blue-500 hidden typing">Typing...</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 text-slate-600">
        <button class="p-2 hover:bg-slate-100 rounded-lg" aria-label="Call">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-width="1.8"
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.1 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.32 1.75.6 2.58a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.5-1.17a2 2 0 0 1 2.11-.45c.83.28 1.69.48 2.58.6A2 2 0 0 1 22 16.92z"
              />
          </svg>
        </button>
        <button class="p-2 hover:bg-slate-100 rounded-lg" aria-label="Video">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
          <path stroke-width="1.8" d="M23 7l-7 5 7 5V7z" />
          <rect
              x="1"
              y="5"
              width="15"
              height="14"
              rx="2"
              ry="2"
              stroke-width="1.8"
            />
          </svg>
        </button>
        <button class="p-2 hover:bg-slate-100 rounded-lg" aria-label="More">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
        <button id="closeBtn" class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-red-500 transition-colors duration-300 focus:outline-none">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-300 transition-transform duration-300 transform hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
      </div>
    </div>
    <!-- messages (kept; just added id for reliable JS hook) -->
    <div
      id="messagesPanel"
      class="flex-1 overflow-y-auto thin-scroll px-6 py-6 space-y-6 messages"
    >
      <!-- message row -->
      
      
      
    </div>
    <div class="sep mx-6"></div>
    <!-- input bar (kept) -->
  <div class="px-6 py-4 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
  
  <!-- Attach -->
  <button
    class="p-3 rounded-full bg-slate-50 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 shadow-sm hover:shadow-md"
    title="Attach"
    aria-label="Attach"
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        stroke-width="1.8"
        d="M21.44 11.05l-7.07 7.07a5 5 0 0 1-7.07-7.07l7.07-7.07a3 3 0 0 1 4.24 4.24l-7.07 7.07a1 1 0 0 1-1.41-1.41l6.36-6.36"
      />
    </svg>
  </button>

  <!-- Input -->
  <div class="flex-1 relative">
    <input
      id="msgInput"
      type="text"
      placeholder="Message..."
      class="w-full rounded-2xl bg-slate-100/80 px-5 py-3 pr-12 outline-none border border-transparent focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-inner"
    />
    <!-- Emoji -->
    <button
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-all duration-300 hover:scale-110"
      title="Emoji"
      aria-label="Emoji"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" stroke-width="1.8" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke-width="1.8" />
        <path d="M9 9h.01M15 9h.01" stroke-width="2" />
      </svg>
    </button>
  </div>

  <!-- Send -->
  <button
    id="sendBtn"
    class="px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
    aria-label="Send"
  >
    <span class="inline-flex items-center gap-2">
      <span class="hidden sm:inline">Send</span>
      <svg
        id="sendIcon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="transition-transform duration-300"
      >
        <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
      </svg>
    </span>
  </button>
</div>
    `;

  // Suppose aapke paas clicked user ka object hai
  const partnerId = currentChatUser._id;
  // Fetch messages from backend
  fetch(`http://localhost:3000/messages/${partnerId}`, {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        updateChatUI(data.data);
      } else {
        console.error(data.error);
      }
    })
    .catch((err) => console.error("Fetch error:", err));

  animateSendBtn();
  initializeChatEventListeners();
}

// ✅ Event listeners for chat
function initializeChatEventListeners() {
  const input = document.getElementById("msgInput");
  const btn = document.getElementById("sendBtn");

  const typing = document.querySelector(".typing");

  if (!input || !btn) return;

  btn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    appendMyMessage(text);
    sendMessage(text, currentChatUser);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // alert();
      e.preventDefault();
      btn.click();
    }
  });

  let typingTimeout;

  // Jab input me type ho raha hai
  input.addEventListener("input", () => {
    // Emit typing to backend
    socket.emit("typing", currentChatUser._id);

    // Timeout set karo stopTyping bhejne ke liye
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", currentChatUser._id);
    }, 1000);
  });

  // Sirf ek hi bar listener register hoga
  socket.on("typing", ({ from }) => {
    if (from === currentChatUser._id && typing) {
      typing.classList.remove("hidden");
    }
  });

  socket.on("stopTyping", ({ from }) => {
    if (from === currentChatUser._id && typing) {
      typing.classList.add("hidden");
    }
  });

  socket.on('user-offline', ({ userId , User }) => {
  
      document.getElementById(`${userId}_status`).textContent = User.isOnline ? "Online" : "Offline";
      document.getElementById(`${userId}_status`).className = User.isOnline ? "text-green-500" : "text-red-500";
      document.getElementById(`${userId}_logger_status`).textContent = User.isOnline ? "Online" : "Offline";
    
  });

  
  
  
  
}


// Socket listener
socket.on('userOnline', ({ userId, User }) => {
  updateUserStatus(userId, User.isOnline);
});

function updateUserStatus(userId, isOnline) {
  // DOM me IDs hone chahiye
  const statusEl = document.getElementById(`${userId}_status`);
  const loggerStatusEl = document.getElementById(`${userId}_logger_status`);

  if (!statusEl || !loggerStatusEl) {
    // retry after DOM creation
    setTimeout(() => updateUserStatus(userId, isOnline), 500);
    return;
  }

  // Status text update
  statusEl.textContent = isOnline ? "Online" : "Offline";
  loggerStatusEl.textContent = isOnline ? "Online" : "Offline";

  // Class update (use classList instead of overwriting full class)
  statusEl.classList.remove("text-green-500", "text-red-500");
  loggerStatusEl.classList.remove("text-green-500", "text-red-500");

  if (isOnline) {
    statusEl.classList.add("text-green-500");
    loggerStatusEl.classList.add("text-green-500");
  } else {
    statusEl.classList.add("text-red-500");
    loggerStatusEl.classList.add("text-red-500");
  }
}



function closeBtn() {
  const closeBtn = document.getElementById("closeBtn");
  const chatingSection = document.querySelector(".chatingSection");

  function closeChat() {
    closeBtn.addEventListener("click", () => {
      chatingSection.classList.add("active");
    });
  }

  function openChat() {
    chatingSection.classList.remove("active");
  }

  return { closeChat, openChat };
}
function animateSendBtn() {
  const sendBtn = document.getElementById("sendBtn");
  const sendIcon = document.getElementById("sendIcon");

  sendBtn.addEventListener("click", () => {
    // Ripple effect
    sendBtn.classList.add("animate-ping-once");

    // Rocket launch animation
    sendIcon.classList.add(
      "translate-x-2",
      "-translate-y-2",
      "scale-125",
      "rotate-12"
    );

    setTimeout(() => {
      sendIcon.classList.remove(
        "translate-x-2",
        "-translate-y-2",
        "scale-125",
        "rotate-12"
      );
    }, 400); // reset after animation
  });
}

// Utility: Tailwind ping ek hi baar
document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
  .animate-ping-once {
    position: relative;
    overflow: hidden;
  }
  .animate-ping-once::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 200%; height: 200%;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple 0.6s ease-out forwards;
  }
  @keyframes ripple {
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
  </style>`
);
