// Main Entry Point

const initApp = () => {
    const currentUrl = window.location.href;
    if (!currentUrl.includes("coursera") || !currentUrl.includes("learn")) {
        console.log("Not a Coursera learning page, skipping init");
        return;
    }

    console.log("Initializing Coursera Helper Extension");

    // Initialize all modules
    if (window.VideoControls) window.VideoControls.init();
    if (window.ContentControls) window.ContentControls.init();
    if (window.QuizControls) window.QuizControls.init();
};

// URL Change Handler
const lastUrl = { current: window.location.href };

const handleUrlChange = (newUrl) => {
    if (newUrl !== lastUrl.current) {
        lastUrl.current = newUrl;
        console.log("URL changed, re-initializing controls");
        if (window.VideoControls) window.VideoControls.init();
        if (window.ContentControls) window.ContentControls.updateSubtitleButtonText();
        if (window.QuizControls) window.QuizControls.initButtons();
    }
};

const urlObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            const newUrl = window.location.href;
            handleUrlChange(newUrl);
        }
    });
});

// Start
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initApp();
        urlObserver.observe(document.body, { childList: true, subtree: true });
    });
} else {
    initApp();
    urlObserver.observe(document.body, { childList: true, subtree: true });
}
