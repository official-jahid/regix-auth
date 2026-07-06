// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================

/**
 * Creates and manages toast notifications.
 * Usage: showToast("Message", "success"|"error"|"info"|"warning", duration)
 */

(function () {
  // Create toast container if it doesn't exist
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Toast configuration for each type
  const config = {
    success: {
      bg: "rgba(0, 255, 136, 0.12)",
      border: "rgba(0, 255, 136, 0.35)",
      color: "#00ff88",
      icon: `<svg width="20" height="20" fill="none" stroke="#00ff88" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
    },
    error: {
      bg: "rgba(255, 0, 85, 0.12)",
      border: "rgba(255, 0, 85, 0.35)",
      color: "#ff0055",
      icon: `<svg width="20" height="20" fill="none" stroke="#ff0055" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    },
    info: {
      bg: "rgba(0, 240, 255, 0.12)",
      border: "rgba(0, 240, 255, 0.35)",
      color: "#00f0ff",
      icon: `<svg width="20" height="20" fill="none" stroke="#00f0ff" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    },
    warning: {
      bg: "rgba(255, 204, 0, 0.12)",
      border: "rgba(255, 204, 0, 0.35)",
      color: "#ffcc00",
      icon: `<svg width="20" height="20" fill="none" stroke="#ffcc00" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    },
  };

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {'success'|'error'|'info'|'warning'} type - Toast type
   * @param {number} duration - Duration in ms (default: 4000)
   */
  window.showToast = function (message, type, duration) {
    if (window.__toastDisabled) return;

    type = type || "info";
    duration = duration || 4000;
    var cfg = config[type] || config.info;

    var toast = document.createElement("div");
    toast.className = "animate-slide-in";
    toast.style.cssText =
      "display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:6px;" +
      "font-size:0.85rem;font-weight:500;min-width:280px;max-width:420px;" +
      "backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);" +
      "background:" +
      cfg.bg +
      ";border:1px solid " +
      cfg.border +
      ";color:" +
      cfg.color +
      ";box-shadow:0 4px 24px rgba(0,0,0,0.3);cursor:pointer;";

    var iconSpan = document.createElement("span");
    iconSpan.innerHTML = cfg.icon;
    iconSpan.style.cssText = "flex-shrink:0;display:flex;align-items:center;";

    var msgSpan = document.createElement("span");
    msgSpan.textContent = message;
    msgSpan.style.cssText = "flex:1;line-height:1.4;";

    var closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&#10005;";
    closeBtn.style.cssText =
      "flex-shrink:0;opacity:0.6;cursor:pointer;font-size:1rem;transition:opacity 0.2s;";
    closeBtn.onmouseenter = function () {
      closeBtn.style.opacity = "1";
    };
    closeBtn.onmouseleave = function () {
      closeBtn.style.opacity = "0.6";
    };

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);

    var removeToast = function () {
      toast.classList.remove("animate-slide-in");
      toast.classList.add("animate-slide-out");
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      removeToast();
    });

    toast.addEventListener("click", function () {
      removeToast();
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(function () {
        removeToast();
      }, duration);
    }

    return toast;
  };

  /**
   * Disable all toast notifications (for testing/quiet mode)
   */
  window.disableToasts = function () {
    window.__toastDisabled = true;
  };

  /**
   * Enable toast notifications
   */
  window.enableToasts = function () {
    window.__toastDisabled = false;
  };
})();
