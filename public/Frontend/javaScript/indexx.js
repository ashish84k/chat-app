import url from "../hostname.js";

const socket = io(url, { withCredentials: true });
let currentChatUser = null;
let Me = null;

// ✅ Current user fetch karo
async function fetchCurrentUser() {
  try {
    const res = await fetch(`${url}/me`, { credentials: "include" });

    if (!res.ok) {
      throw new Error("Not logged in");
    }

    const user = await res.json();

    // Local storage me store karo
    localStorage.setItem("me", JSON.stringify(user));

    Me = user;

    // Socket join
    socket.emit("join", user._id);
  } catch (err) {
    console.error("Error fetching current user:", err);

    // User ko login page pe redirect karo
    window.location.href = "/login";
  }

  const chatSection = document.querySelector(".chatingSection");
  let messagesPanel = document.getElementById("messagesPanel"); // Fixed: Declare messagesPanel globally

  function openChat() {
    chatSection.classList.remove("active");
  }

  function closeChat() {
    chatSection.classList.add("active");
  }

  function allLogger() {
    fetch(`${url}/allLogger`, { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        const all_logger = document.querySelector(".allLogger");
        all_logger.innerHTML = "";

        if (result.success) {
          console.log(result.data);

          result.data.forEach((logger) => {
            if (!logger._id) return; // safety

            const div = document.createElement("div");
            div.id = `logger_${logger._id}`;
            div.className =
              "group flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer";

            div.innerHTML = `
              <img class="w-11 h-11 rounded-full" id="logger_img_${
                logger._id
              }" src="${logger.img}" alt="" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-medium truncate" id="logger_name_${
                    logger._id
                  }">${logger.name}</p>
                  <span id="logger_status_${logger._id}" class="text-xs ${
              logger.isOnline ? "text-green-500" : "text-red-500"
            }">${logger.isOnline ? "Online" : "Offline"}</span>
                </div>
                <p class="text-xs text-white/60 truncate">Click to chat</p>
              </div>
            `;

            div.addEventListener("click", () => {
              currentChat(logger);
              openChat();

              // Fixed: Update message status properly
              const message_status = document.getElementById("message_status");
              const message_img = document.getElementById("message_img");
              const message_name = document.getElementById("message_name");

              if (message_status && message_img && message_name) {
                // Remove any existing status classes
                message_status.className = message_status.className
                  .replace(/message_status_\w+/g, "")
                  .replace(/text-(green|red)-500/g, "")
                  .trim();

                message_status.classList.add(`message_status_${logger._id}`);
                message_img.classList.add(`message_img_${logger._id}`);
                message_name.classList.add(`message_name_${logger._id}`);

                message_img.src = logger.img;
                message_name.textContent = logger.name;
                message_status.textContent = logger.isOnline
                  ? "Online"
                  : "Offline";
                message_status.classList.add(
                  logger.isOnline ? "text-green-500" : "text-red-500"
                );
              }
            });

            all_logger.appendChild(div);
          });
        }
      })
      .catch((err) => console.error("Error fetching /allLogger:", err));
  }

  allLogger();

  function currentChat(chatter) {
    const partnerId = chatter._id;
    currentChatUser = chatter;

    // Fixed: Ensure messagesPanel exists
    if (!messagesPanel) {
      messagesPanel = document.getElementById("messagesPanel");
    }

    // Fetch messages from backend
    fetch(`${url}/messages/${partnerId}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          updateChatUI(data.data, chatter);
        } else {
          console.error(data.error);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  }

  function updateChatUI(data, currentChatUser) {
    // Fixed: Ensure messagesPanel exists
    if (!messagesPanel) {
      messagesPanel = document.getElementById("messagesPanel");
    }

    if (!messagesPanel) {
      console.error("Messages panel not found");
      return;
    }

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

    // Fixed: Get current user for comparison
    const me = JSON.parse(localStorage.getItem("me"));
    if (!me) return;

    data.forEach((msg) => {
      if (msg.sender._id === me._id) {
        appendMyMessage(msg.message);
      } else {
        appendReceivedMessage(msg.message, msg.sender);
      }
    });
  }

  // My message
  function appendMyMessage(text) {
    const container = document.getElementById("messagesPanel");
    if (!container) return;

    let user = JSON.parse(localStorage.getItem("me"));
    if (!user) return;

    const wrap = document.createElement("div");
    wrap.id = `${user._id}_msg_${Date.now()}`; // Fixed: Make IDs unique
    wrap.className = "flex items-end gap-3 justify-end msg-enter";
    wrap.innerHTML = `
      <div class="relative bubble-light rounded-2xl px-4 py-3 my-2 max-w-[70%]">
      <p class="text-[14px] leading-relaxed">${escapeHtml(text)}</p>
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
    if (!container) return;

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
          <p class="text-[14px] leading-relaxed">${escapeHtml(text)}</p>
        </div>
      </div>
    `;
    container.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add("show"));
    container.scrollTop = container.scrollHeight;
  }

  // Fixed: Add HTML escape function for security
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function animateSendBtn() {
    const sendBtn = document.getElementById("sendBtn");
    const sendIcon = document.getElementById("sendIcon");

    if (!sendBtn || !sendIcon) return; // Fixed: Safety check

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
        sendBtn.classList.remove("animate-ping-once"); // Fixed: Remove ping class
      }, 400);
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
  .msg-enter {
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }
  .msg-enter.show {
    opacity: 1;
    transform: translateY(0);
  }
  </style>`
  );

  // Fixed: Initialize animations only after DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    animateSendBtn();
    initializeChatEventListeners();
  });

  // ✅ Event listeners for chat
  function initializeChatEventListeners() {
    const input = document.getElementById("msgInput");
    const btn = document.getElementById("sendBtn");
    const typing = document.querySelector(".typing");

    if (!input || !btn) {
      console.warn("Chat input elements not found");
      return;
    }

    // Fixed: Remove existing event listeners to prevent duplicates
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    // Re-get references after cloning
    const freshBtn = document.getElementById("sendBtn");
    const freshInput = document.getElementById("msgInput");

    freshBtn.addEventListener("click", () => {
      const text = freshInput.value.trim();
      if (!text || !currentChatUser) return;

      appendMyMessage(text);
      sendMessage(text, currentChatUser);
      freshInput.value = "";
    });

    freshInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        freshBtn.click();
      }
    });

    let typingTimeout;

    // Typing indicator
    freshInput.addEventListener("input", () => {
      if (!currentChatUser) return;

      socket.emit("typing", currentChatUser._id);

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit("stopTyping", currentChatUser._id);
      }, 1000);
    });

    // Fixed: Remove existing socket listeners to prevent duplicates
    socket.removeAllListeners("typing");
    socket.removeAllListeners("stopTyping");
    socket.removeAllListeners("chat-message");
    socket.removeAllListeners("userOnline");
    socket.removeAllListeners("user-offline");

    // Typing indicators
    socket.on("typing", ({ from }) => {
      if (from === currentChatUser?._id && typing) {
        typing.classList.remove("hidden");
      }
    });

    socket.on("stopTyping", ({ from }) => {
      if (from === currentChatUser?._id && typing) {
        typing.classList.add("hidden");
      }
    });

    // User status updates
    socket.on("user-offline", ({ userId, User }) => {
      updateUserStatus(userId, User);
    });

    socket.on("userOnline", ({ userId, User }) => {
      updateUserStatus(userId, User);
    });

    // Message receive
    socket.on("chat-message", (data) => {
      if (currentChatUser && data.from === currentChatUser._id) {
        appendReceivedMessage(data.text, currentChatUser);
      }
    });
  }

  // Fixed: Separate function for updating user status
  function updateUserStatus(userId, User) {
    const loggerStatus = document.getElementById(`logger_status_${userId}`);
    const messageStatus = document.getElementById("message_status");

    if (loggerStatus) {
      loggerStatus.textContent = User.isOnline ? "Online" : "Offline";
      loggerStatus.className = `text-xs ${
        User.isOnline ? "text-green-500" : "text-red-500"
      }`;
    }

    if (messageStatus && currentChatUser && userId === currentChatUser._id) {
      messageStatus.textContent = User.isOnline ? "Online" : "Offline";
      messageStatus.className = User.isOnline
        ? "text-green-500"
        : "text-red-500";
    }
  }

  // ✅ Message bhejna
  function sendMessage(text, toUser) {
    const me = JSON.parse(localStorage.getItem("me"));
    if (!me || !toUser || !text.trim()) return;

    const messageData = {
      from: me._id,
      to: toUser._id,
      text: text.trim(),
    };

    socket.emit("chat-message", messageData);
  }

  function minuProfile() {
    const ElementMinu = document.querySelector(".minu-profile");
    if (!ElementMinu) {
      console.error("Element with class 'minu-profile' not found");
      return;
    }

    console.log("Initializing menu for:", ElementMinu);

    const div = document.createElement("div");
    div.className = "relative inline-block menu-container";

    // Generate unique menu ID to avoid conflicts
    const menuId = `menu-${Me.name}`;

    div.innerHTML = `
    <!-- Professional Three Dot Menu -->
    <button
      onclick="window.toggleMenu('${menuId}')"
      class="menu-trigger p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      aria-label="Open menu"
      role="button"
    >
      <svg
        class="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="5" r="2.5"/>
        <circle cx="12" cy="12" r="2.5"/>
        <circle cx="12" cy="19" r="2.5"/>
      </svg>
    </button>

    <!-- Enhanced Menu Dropdown -->
    <div
      id="${menuId}"
      class="menu-dropdown hidden absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right scale-95 opacity-0 transition-all duration-300 ease-out backdrop-blur-sm"
      role="menu"
      aria-hidden="true"
    >
      <!-- Menu Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <h3 class="text-white font-semibold text-sm">Account Menu</h3>
      </div>
      
      <!-- Menu Items -->
      <ul class="py-2">
        <li role="menuitem" id="profile-menu" onclick="openProfile()">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 group"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-semibold text-sm">Profile</span>
              <p class="text-xs text-gray-500 group-hover:text-blue-500">View & Edit Profile</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>
        
        <li role="menuitem">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-semibold text-sm">Settings</span>
              <p class="text-xs text-gray-500 group-hover:text-green-500">App Preferences</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>
        
        <li role="menuitem">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-700 transition-all duration-200 group"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-semibold text-sm">Privacy</span>
              <p class="text-xs text-gray-500 group-hover:text-purple-500">Security Settings</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </li>

        <!-- Divider -->
        <li class="border-t border-gray-100 my-1"></li>
        
        <li role="menuitem" onclick="logout()">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:text-orange-700 transition-all duration-200 group"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"/>
              </svg>
            </div>
            <div class="flex-1" >
              <span class="font-semibold text-sm">Logout</span>
              <p class="text-xs text-gray-500 group-hover:text-orange-500">Sign out of account</p>
            </div>
          </a>
        </li>

        <li role="menuitem" onclick="deleteAccount()">
          <a
            href="#"
            class="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-200 group"
          >
            <div class="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
              </svg>
            </div>
            <div class="flex-1">
              <span class="font-semibold text-sm">Delete Account</span>
              <p class="text-xs text-gray-500 group-hover:text-red-500">Permanently delete</p>
            </div>
            <svg class="w-4 h-4 text-red-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </a>
        </li>
      </ul>
      
      <!-- Menu Footer -->
      <div class="border-t border-gray-100 p-2">
        <button class="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <svg class="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
          </svg>
          Help & Support
        </button>
      </div>
    </div>
  `;

    ElementMinu.appendChild(div);

    // Enhanced toggle function with animations
    function toggleMenu(menuId) {
      const menu = document.getElementById(menuId);
      const isHidden = menu.classList.contains("hidden");

      if (isHidden) {
        // Show menu with animation
        menu.classList.remove("hidden");
        menu.setAttribute("aria-hidden", "false");

        // Trigger reflow for animation
        requestAnimationFrame(() => {
          menu.classList.remove("scale-95", "opacity-0");
          menu.classList.add("scale-100", "opacity-100");
        });

        // Add backdrop blur effect
        document.body.classList.add("menu-open");
      } else {
        // Hide menu with animation
        menu.classList.add("scale-95", "opacity-0");
        menu.classList.remove("scale-100", "opacity-100");
        menu.setAttribute("aria-hidden", "true");

        setTimeout(() => {
          menu.classList.add("hidden");
          document.body.classList.remove("menu-open");
        }, 300);
      }
    }

    // Enhanced click outside handler
    function handleClickOutside(event) {
      const menu = document.getElementById(menuId);
      const menuContainer = event.target.closest(".menu-container");

      if (!menuContainer && !menu.classList.contains("hidden")) {
        menu.classList.add("scale-95", "opacity-0");
        menu.classList.remove("scale-100", "opacity-100");
        menu.setAttribute("aria-hidden", "true");

        setTimeout(() => {
          menu.classList.add("hidden");
          document.body.classList.remove("menu-open");
        }, 300);
      }
    }

    // Keyboard navigation support
    function handleKeyDown(event) {
      const menu = document.getElementById(menuId);

      if (event.key === "Escape" && !menu.classList.contains("hidden")) {
        toggleMenu(menuId);
      }
    }

    // Event listeners
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Make toggle function globally available
    window.toggleMenu = toggleMenu;

    // Add custom CSS for enhanced effects
    if (!document.querySelector("#professional-menu-styles")) {
      const style = document.createElement("style");
      style.id = "professional-menu-styles";
      style.textContent = `
      .menu-open {
        overflow: hidden;
      }
      
      .menu-dropdown {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      
      .menu-dropdown::before {
        content: '';
        position: absolute;
        top: -8px;
        right: 12px;
        width: 16px;
        height: 16px;
        background: white;
        transform: rotate(45deg);
        border-left: 1px solid #e5e7eb;
        border-top: 1px solid #e5e7eb;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .menu-dropdown {
          transition: none;
        }
      }
    `;
      document.head.appendChild(style);
    }

    console.log(`Professional menu initialized with ID: ${menuId}`);
    return menuId;
  }

  // Initialize the menu
  const menuId = minuProfile();

  if (menuId) {
    profileMe();
  }

  function profileMe() {
    const profileMe = document.getElementById("profileMe");

    const div = document.createElement("div");
    console.log(Me);

    div.id = `profile_${Me._id}`;
    div.innerHTML = `
    

        <!-- Header Section -->
        <div class="relative bg-black bg-opacity-20 backdrop-blur-sm">
            <div class="max-w-4xl mx-auto px-6 py-8">
                <div class="flex justify-between items-start">
                    <button onclick="closeProfile()" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <button onclick="toggleEdit()" id="editBtn" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                </div>
                
                <!-- Profile Avatar and Basic Info -->
                <div class="flex flex-col items-center mt-6">
                    <div class="relative">
                        <div class="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <img id="profileImg" src="${url}/${
      Me?.img
    }" alt="Profile Picture" class="w-28 h-28 rounded-full object-cover">
                        </div>
                        <input type='file' id="profileFileInput" class="hidden" accept="image/*">
                        <label title="Change Profile Picture" for="profileFileInput" class="cursor-pointer absolute bottom-0 right-0 bg-white bg-opacity-20 p-2 rounded-full backdrop-blur-sm hover:bg-opacity-30 transition-all">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </label>
                    </div>
                    
                    <div class="text-center mt-6">
                        <div>
                        <input type="text" id="nameField" value="${
                          Me?.name || ""
                        }" class="text-3xl font-bold text-white text-center bg-transparent border-2 border-blue-500 rounded-2xl outline-none px-4 py-2 transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:border-blue-400 shadow-lg hover:shadow-blue-500/30 hidden">
                        </div>
                        <h1 id="nameDisplay" class="text-3xl font-bold text-white">${
                          Me?.name
                        }</h1>
                        <div>
                        <textarea id="bioField" class="m-3 w-80 max-w-full text-lg text-white text-center bg-transparent border-2 border-blue-500 rounded-2xl outline-none px-4 py-2 transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 hover:border-blue-400 shadow-lg hover:shadow-blue-500/30 hidden resize-none overflow-hidden break-words" rows="3" oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';" >${Me?.bio || ""}</textarea>

                        </div>
                        <p class="text-red-100 mt-2 w-[300px]" id="bioDisplay">${
                          Me?.bio
                        }</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Details -->
        <div class="max-w-4xl mx-auto px-6 py-8">
            <div class="grid md:grid-cols-2 gap-8">
                
                <!-- Contact Information -->
                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Contact Information
                    </h2>
                    
                    <div class="space-y-4">
                        <div class="flex items-center text-red-100">
                            <svg class="w-5 h-5 mr-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span>${Me?.email}</span>
                        </div>
                        
                        <div class="flex items-center text-red-100">
                            <svg class="w-5 h-5 mr-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span>${Me?.phone}</span>
                        </div>
                        
                        <div class="flex items-center text-red-100">
                            <svg class="w-5 h-5 mr-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6a2 2 0 002-2v-3H6v3a2 2 0 002 2z"></path>
                            </svg>
                            <span>Gender : ${Me?.gender}</span>
                        </div>
                        
                        <div class="flex items-center text-red-100">
                            <svg class="w-5 h-5 mr-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2"></path>
                            </svg>
                            <span>Account Created: ${new Date(
                              Me?.createdAt
                            ).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- About Section -->
                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        About Me
                    </h2>
                    
                    <div id="descriptionDisplay" class="text-red-100 leading-relaxed">
                        ${Me?.description}
                    </div>
                    
                    <textarea id="description" class="w-full bg-white bg-opacity-20 text-white p-4 rounded-lg border border-white border-opacity-30 outline-none hidden resize-none" rows="5" placeholder="Tell us about yourself...">${
                      Me?.description
                    }</textarea>
                </div>
                
                <!-- Skills Section -->
                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Skills
                    </h2>
                    
                    <div class="flex flex-wrap gap-2">
                      ${Me?.skills
                        ?.map(
                          (skill) => `
                        <span class="bg-red-400 bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">${
                          skill ? skill : ""
                        }</span>
                      `
                        )
                        .join("")}
                    </div>
                </div>
                
                <!-- Statistics -->
                <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
                    <h2 class="text-xl font-semibold text-white mb-6 flex items-center">
                        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Statistics
                    </h2>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">42</div>
                            <div class="text-red-200 text-sm">Projects</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">128</div>
                            <div class="text-red-200 text-sm">Commits</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">15</div>
                            <div class="text-red-200 text-sm">Reviews</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-white">3.2k</div>
                            <div class="text-red-200 text-sm">Lines of Code</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="mt-8 flex justify-center space-x-4" id="actionButtons" style="display: none;">
                <button onclick="saveProfile()" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg backdrop-blur-sm transition-all flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Save Changes
                </button>
                <button onclick="cancelEdit()" class="bg-red-600 bg-opacity-50 hover:bg-opacity-70 text-white px-6 py-3 rounded-lg backdrop-blur-sm transition-all flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Cancel
                </button>
            </div>
        </div>
  `;
    profileMe.appendChild(div);
  }

  let isEditMode = false;

  document
    .getElementById("profileFileInput")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // ✅ Pehle preview dikhao
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("profileImg").src = event.target.result;
      };
      reader.readAsDataURL(file);

      // ✅ Ab file ko server pe bhejo
      try {
        const formData = new FormData();
        formData.append("profile", file); // "profile" => backend me multer ya koi bhi field name

        const res = await fetch(`${url}/profile/upload-profile`, {
          method: "POST",
          credentials: "include", // session cookies ke liye
          body: formData,
        });

        const data = await res.json();
        if (res.ok) {
          console.log("Upload success:", data);
          if (data.profileUrl) {
            document.getElementById(
              "profileImg"
            ).src = `${url}${data.profileUrl}`;
          }
        } else {
          console.error("Upload failed:", data.message);
        }
      } catch (err) {
        console.error("Error uploading file:", err);
      }
    });

  function closeProfile() {
    const profileMe = document.getElementById("profileMe");
    profileMe.style.display = "none";
  }

  function openProfile() {
    const profileMe = document.getElementById("profileMe");
    profileMe.style.display = "block";
  }

  function toggleEdit() {
    isEditMode = !isEditMode;

    if (isEditMode) {
      // Show edit mode
      document.getElementById("nameField").classList.remove("hidden");
      document.getElementById("nameField").disabled = false;
      document.getElementById("nameDisplay").classList.add("hidden");

      document.getElementById("description").classList.remove("hidden");
      document.getElementById("description").disabled = false;
      document.getElementById("descriptionDisplay").classList.add("hidden");

      document.getElementById("bioField").classList.remove("hidden");
      document.getElementById("bioField").disabled = false;
      document.getElementById("bioDisplay").classList.add("hidden");

      document.getElementById("actionButtons").style.display = "block";
    } else {
      // Show display mode
      document.getElementById("nameField").classList.add("hidden");
      document.getElementById("nameField").disabled = true;
      document.getElementById("nameDisplay").classList.remove("hidden");

      document.getElementById("description").classList.add("hidden");
      document.getElementById("description").disabled = true;
      document.getElementById("descriptionDisplay").classList.remove("hidden");

      document.getElementById("bioField").classList.add("hidden");
      document.getElementById("bioField").disabled = true;
      document.getElementById("bioDisplay").classList.remove("hidden");

      document.getElementById("actionButtons").style.display = "none";
    }
  }

  async function saveProfile() {
    // Get values from edit fields
    const newName = document.getElementById("nameField").value;
    const description = document.getElementById("description").value;
    const newBio = document.getElementById("bioField").value;

    // Update display elements

    // Send updated data to the server
    try {
      const res = await fetch(`${url}/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          description: description,
          bio: newBio,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        document.getElementById("nameDisplay").textContent = newName;
        document.getElementById("descriptionDisplay").textContent = description;
        document.getElementById("bioField").textContent = newBio;
        toggleEdit();
      } else {
        alert("Error updating profile: " + data.message);
      }
    } catch (err) {
      console.log("Error:", err);
    }
  }

  function cancelEdit() {
    // Reset fields to original values
    document.getElementById("nameField").value =
      document.getElementById("nameDisplay").textContent;
    document.getElementById("description").value =
      document.getElementById("descriptionDisplay").textContent;

    // Exit edit mode
    toggleEdit();
  }

  function deleteAccount() {
    if (confirm("Are you sure you want to delete your account?")) {
      // Call the API to delete the account
      fetch(`${url}/delete`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Account deleted successfully.");
            // Redirect to home or login page
            window.location.href = "/";
          } else {
            alert("Error deleting account: " + data.message);
          }
        })
        .catch((err) => {
          console.error("Error:", err);
        });
    }
  }

  function logout() {
    fetch(`${url}/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Logged out successfully.");
          window.location.href = "/login";
        } else {
          alert("Error logging out: " + data.message);
        }
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  }

  // Fixed: Export functions properly
  window.closeChat = closeChat;
  window.logout = logout;
  window.deleteAccount = deleteAccount;
  window.openChat = openChat;
  window.cancelEdit = cancelEdit;
  window.saveProfile = saveProfile;
  window.closeProfile = closeProfile;
  window.toggleEdit = toggleEdit;
  window.openProfile = openProfile;
}

// Call the function
fetchCurrentUser();
