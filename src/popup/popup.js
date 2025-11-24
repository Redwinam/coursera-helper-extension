document.addEventListener('DOMContentLoaded', () => {
    const settings = {
        video: document.getElementById('video-toggle'),
        content: document.getElementById('content-toggle'),
        quiz: document.getElementById('quiz-toggle')
    };

    // Load saved settings
    chrome.storage.local.get(['enableVideo', 'enableContent', 'enableQuiz'], (result) => {
        settings.video.checked = result.enableVideo !== false; // Default true
        settings.content.checked = result.enableContent !== false; // Default true
        settings.quiz.checked = result.enableQuiz !== false; // Default true
    });

    // Save settings on change
    settings.video.addEventListener('change', (e) => {
        chrome.storage.local.set({ enableVideo: e.target.checked });
    });

    settings.content.addEventListener('change', (e) => {
        chrome.storage.local.set({ enableContent: e.target.checked });
    });

    settings.quiz.addEventListener('change', (e) => {
        chrome.storage.local.set({ enableQuiz: e.target.checked });
    });

    // Reset defaults
    document.getElementById('reset-settings').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.storage.local.set({
            enableVideo: true,
            enableContent: true,
            enableQuiz: true
        }, () => {
            settings.video.checked = true;
            settings.content.checked = true;
            settings.quiz.checked = true;
        });
    });
});
