// Utility functions for Coursera Helper

const Utils = {
  /**
   * Copy content to clipboard, supporting both HTML and Plain Text
   * @param {string} content - The content to copy
   * @param {boolean} isHTML - Whether the content is HTML
   */
  copyToClipboard: async (content, isHTML = false) => {
    if (isHTML) {
      try {
        const blob = new Blob([content], { type: "text/html" });
        const temp = document.createElement("div");
        temp.innerHTML = content;
        const plainText = temp.innerText;
        const data = [
          new ClipboardItem({
            "text/html": blob,
            "text/plain": new Blob([plainText], { type: "text/plain" }),
          }),
        ];
        await navigator.clipboard.write(data);
      } catch (error) {
        console.error("HTML Copy failed, falling back to plain text:", error);
        const temp = document.createElement("div");
        temp.innerHTML = content;
        Utils.fallbackCopy(temp.innerText);
      }
    } else {
      Utils.fallbackCopy(content);
    }
  },

  /**
   * Fallback copy method using textarea
   * @param {string} text - Text to copy
   */
  fallbackCopy: (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textArea);
  },

  /**
   * Temporarily change button text to indicate success
   * @param {HTMLElement} button - The button element
   * @param {string} originalText - Original text to revert to
   * @param {string} newText - Temporary text (default: "Copied!")
   * @param {number} duration - Duration in ms (default: 1000)
   */
  updateButtonText: (button, originalText, newText = "已复制！", duration = 1000) => {
    if (!button) return;
    const currentHTML = button.innerHTML; // Use innerHTML to preserve icons if any
    button.textContent = newText;
    setTimeout(() => {
      button.innerHTML = currentHTML; // Revert to original HTML/Text
      if (button.textContent !== newText) {
        // Double check if we need to set textContent if innerHTML was just text
        // But usually innerHTML is safer if we had icons.
        // For safety, if original was passed, we can use it.
        if (originalText) button.textContent = originalText;
      }
    }, duration);
  },

  /**
   * Create a DOM element with attributes
   * @param {string} tag - HTML tag
   * @param {object} attributes - Key-value pairs of attributes
   * @param {string} text - Text content
   * @returns {HTMLElement}
   */
  createElement: (tag, attributes = {}, text = "") => {
    const element = document.createElement(tag);
    for (const key in attributes) {
      if (key === "className") {
        element.className = attributes[key];
      } else if (key === "style" && typeof attributes[key] === "object") {
        Object.assign(element.style, attributes[key]);
      } else if (key.startsWith("on") && typeof attributes[key] === "function") {
        element.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
      } else {
        element.setAttribute(key, attributes[key]);
      }
    }
    if (text) element.textContent = text;
    return element;
  },

  /**
   * Get or create the main panel container
   * @returns {HTMLElement}
   */
  getOrCreatePanel: () => {
    let panel = document.querySelector(".coursera-helper-panel");
    if (!panel) {
      panel = Utils.createElement("div", { className: "coursera-helper-panel" });
      document.body.appendChild(panel);
    }
    return panel;
  },
  isExtensionContextValid: () => {
    return typeof chrome !== "undefined" && chrome.runtime && !!chrome.runtime.id;
  },
  safeStorageGet: (keys, callback) => {
    try {
      if (Utils.isExtensionContextValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(keys, (result) => {
          try {
            callback(result || {});
          } catch (_) {}
        });
        return;
      }
    } catch (_) {}
    try {
      setTimeout(() => {
        try { callback({}); } catch (_) {}
      }, 0);
    } catch (_) {}
  },
  safeStorageSet: (obj, callback) => {
    try {
      if (Utils.isExtensionContextValid() && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(obj, () => {
          try {
            if (callback) callback();
          } catch (_) {}
        });
        return;
      }
    } catch (_) {}
    try {
      setTimeout(() => {
        try { if (callback) callback(); } catch (_) {}
      }, 0);
    } catch (_) {}
  }
};

// Export for use in other modules (if using ES modules, but here we attach to window or just global scope for content scripts)
window.CourseraUtils = Utils;
