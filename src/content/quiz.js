// Quiz Controls Module

const QuizControls = {
    init: () => {
        console.log("Initializing Quiz Controls");
        QuizControls.addQuizButtons();
    },

    getQuizData: () => {
        const questions = document.querySelectorAll('[role="group"]');
        if (!questions.length) {
            console.log("No quiz questions found");
            return null;
        }

        const quizData = {
            totalQuestions: questions.length,
            questions: Array.from(questions).map((questionElement) => {
                const questionTextElements = questionElement.querySelectorAll('[id^="prompt-"] .rc-CML p span span');
                const questionText = Array.from(questionTextElements)
                    .map((el) => el.textContent.trim())
                    .join(" ");

                const options = questionElement.querySelectorAll(".rc-Option");
                const isSingleChoice = !!questionElement.querySelector('[role="radiogroup"]');
                const overallHasCorrectIcon = !!questionElement.querySelector('[data-testid="icon-correct"]');

                return {
                    questionText,
                    options: Array.from(options).map((optionElement) => {
                        const optionTextElement = optionElement.querySelector(".rc-CML p");
                        const text = optionTextElement ? optionTextElement.textContent.trim() : "";

                        const inputEl = optionElement.querySelector('input[type="radio"], input[type="checkbox"]');
                        const isSelected = inputEl ? inputEl.checked : !!(optionElement.closest("label")?.classList.contains("cui-isChecked") || optionElement.classList.contains("cui-isChecked"));

                        let isCorrect = false;
                        if (isSingleChoice) {
                            isCorrect = isSelected && overallHasCorrectIcon;
                        } else {
                            const optionRow = optionElement.closest(".css-1f00xev") || optionElement.parentElement;
                            const optionFeedback = optionRow?.nextElementSibling;
                            const hasOptionCorrect = !!optionFeedback?.querySelector('[data-testid="icon-correct"]');
                            const hasOptionIncorrect = !!optionFeedback?.querySelector('[data-testid="icon-incorrect"]');
                            if (hasOptionCorrect || hasOptionIncorrect) {
                                isCorrect = hasOptionCorrect;
                            } else {
                                isCorrect = isSelected && overallHasCorrectIcon;
                            }
                        }

                        return { text, isSelected, isCorrect };
                    }),
                };
            }),
        };

        return quizData;
    },

    copyQuestionContent: (questionElement) => {
        const questionTextElements = questionElement.querySelectorAll('[id^="prompt-"] .rc-CML p span span');
        const questionText = Array.from(questionTextElements)
            .map((el) => el.textContent.trim())
            .join(" ");

        const options = questionElement.querySelectorAll(".rc-Option");
        const optionsText = Array.from(options)
            .map((option, index) => {
                const optionTextElement = option.querySelector(".rc-CML p");
                const optionText = optionTextElement ? optionTextElement.textContent.trim() : "";
                return `${String.fromCharCode(65 + index)}. ${optionText}`;
            })
            .join("\n");

        const content = `${questionText}\n\n${optionsText}`;

        // Use navigator.clipboard directly here as it's simple text
        navigator.clipboard.writeText(content)
            .then(() => {
                const copyBtn = questionElement.querySelector(".question-copy-btn");
                Utils.updateButtonText(copyBtn, "📋", "✓");
            })
            .catch((err) => console.error("Copy failed:", err));
    },

    addCopyButtons: () => {
        const questions = document.querySelectorAll('[role="group"]');
        questions.forEach((questionElement) => {
            const container = questionElement.closest(".css-1hhf6i");
            if (!container || container.querySelector(".question-copy-btn")) return;

            const copyButton = Utils.createElement("button", {
                className: "question-copy-btn",
                title: "复制题目",
                onclick: () => QuizControls.copyQuestionContent(questionElement)
            }, "📋");

            container.style.position = "relative";
            container.appendChild(copyButton);
        });
    },

    initButtons: () => {
        const existingSaveBtn = document.querySelector(".quiz-save-btn");
        const existingLoadBtn = document.querySelector(".quiz-load-btn");
        if (existingSaveBtn) existingSaveBtn.remove();
        if (existingLoadBtn) existingLoadBtn.remove();

        const currentUrl = window.location.href;

        // Save Button - only on feedback page
        if (currentUrl.includes("view-feedback")) {
            const saveButton = Utils.createElement("button", {
                className: "quiz-btn quiz-save-btn",
                style: { right: "20px" },
                onclick: () => {
                    const quizData = QuizControls.getQuizData();
                    if (!quizData) return;

                    try {
                        // Using chrome.storage.local instead of localStorage
                        chrome.storage.local.set({ courseraQuizData: JSON.stringify(quizData) }, () => {
                            Utils.updateButtonText(saveButton, "保存答案", "已保存！");
                        });
                    } catch (err) {
                        console.error("Save failed:", err);
                        Utils.updateButtonText(saveButton, "保存答案", "失败");
                    }
                }
            }, "保存答案");

            Utils.getOrCreatePanel().appendChild(saveButton);
        }

        // Load Button - only on attempt page
        if (currentUrl.includes("attempt")) {
            const loadButton = Utils.createElement("button", {
                className: "quiz-btn quiz-load-btn",
                style: { right: "20px" },
                onclick: () => {
                    chrome.storage.local.get(['courseraQuizData'], (result) => {
                        const savedData = result.courseraQuizData;
                        if (!savedData) {
                            Utils.updateButtonText(loadButton, "加载答案", "无数据");
                            return;
                        }

                        try {
                            const quizData = JSON.parse(savedData);
                            const questions = document.querySelectorAll('[role="group"]');

                            Array.from(questions).forEach((questionElement) => {
                                const questionTextElements = questionElement.querySelectorAll('[id^="prompt-"] .rc-CML p span span');
                                const questionText = Array.from(questionTextElements)
                                    .map((el) => el.textContent.trim())
                                    .join(" ");

                                const savedQuestion = quizData.questions.find((q) => q.questionText === questionText);
                                if (!savedQuestion) return;

                                const options = questionElement.querySelectorAll(".rc-Option");
                                Array.from(options).forEach((optionElement) => {
                                    const optionText = optionElement.textContent.trim();
                                    const savedOption = savedQuestion.options.find((o) => o.text === optionText);

                                    if (!savedOption) return;

                                    if (savedOption.isSelected) {
                                        const radioInput = optionElement.querySelector('input[type="radio"]');
                                        if (radioInput) radioInput.checked = true;
                                        const checkboxInput = optionElement.querySelector('input[type="checkbox"]');
                                        if (checkboxInput) checkboxInput.checked = true;

                                        if (savedOption.isCorrect) {
                                            optionElement.classList.add("quiz-correct");
                                            optionElement.title = "之前正确";
                                        } else {
                                            optionElement.classList.add("quiz-incorrect");
                                            optionElement.title = "之前错误";
                                        }
                                    }
                                });
                            });

                            Utils.updateButtonText(loadButton, "加载答案", "已加载");
                        } catch (err) {
                            console.error("Load failed:", err);
                            Utils.updateButtonText(loadButton, "加载答案", "错误");
                        }
                    });
                }
            }, "加载答案");

            Utils.getOrCreatePanel().appendChild(loadButton);
        }

        QuizControls.addCopyButtons();
    },

    addQuizButtons: () => {
        QuizControls.initButtons();
        const questionObserver = new MutationObserver(() => {
            QuizControls.addCopyButtons();
        });
        questionObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
};

window.QuizControls = QuizControls;
