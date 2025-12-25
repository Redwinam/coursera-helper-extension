// Review Controls Module

const ReviewControls = {
    init: () => {
        console.log("Initializing Review Controls");
        const currentUrl = window.location.href;
        
        // Remove existing button first to avoid persistence on wrong pages
        const existingContainer = document.querySelector(".review-grade-container");
        if (existingContainer) existingContainer.remove();
        const existingBtn = document.querySelector(".review-grade-btn");
        if (existingBtn) existingBtn.remove();

        // Check for review pages (specifically review-next as requested)
        if (currentUrl.includes("review-next")) {
            ReviewControls.addGradingButton();
        }
    },

    addGradingButton: () => {
        const existingContainer = document.querySelector(".review-grade-container");
        if (existingContainer) existingContainer.remove();

        const container = Utils.createElement("div", {
            className: "review-grade-container",
            style: { 
                display: "flex", 
                flexDirection: "row", 
                gap: "8px", 
                marginBottom: "8px" 
            }
        });

        const maxButton = Utils.createElement("button", {
            className: "quiz-btn review-grade-btn-max",
            style: { 
                backgroundColor: "#0056D2", // Coursera Blue
                flex: "1",
                padding: "10px 12px"
            },
            onclick: () => {
                ReviewControls.autoGrade("max");
            }
        }, "一键满分");

        const minButton = Utils.createElement("button", {
            className: "quiz-btn review-grade-btn-min",
            style: { 
                backgroundColor: "#C62828", // Red
                flex: "1",
                padding: "10px 12px"
            },
            onclick: () => {
                ReviewControls.autoGrade("min");
            }
        }, "一键零分");

        container.appendChild(maxButton);
        container.appendChild(minButton);
        Utils.getOrCreatePanel().appendChild(container);
    },

    autoGrade: (mode) => {
        // Find all question blocks
        const questions = document.querySelectorAll(".rc-OptionsFormPart");
        let count = 0;

        if (questions.length === 0) {
            console.log("No questions found via .rc-OptionsFormPart");
        }

        questions.forEach(question => {
            const options = question.querySelectorAll('[role="radio"], input[type="radio"]');
            let targetScore = mode === "max" ? -1 : Infinity;
            let targetOption = null;

            options.forEach(option => {
                let text = option.innerText;
                
                if (!text || text.trim() === "") {
                    const parent = option.closest('.peer-option-input') || option.parentElement;
                    if (parent) {
                        text = parent.innerText;
                    }
                }

                const match = text.match(/(\d+)\s*(?:points?|pt|分)/i);
                
                if (match) {
                    const score = parseInt(match[1]);
                    if (mode === "max") {
                        if (score > targetScore) {
                            targetScore = score;
                            targetOption = option;
                        }
                    } else {
                        // min mode
                        if (score < targetScore) {
                            targetScore = score;
                            targetOption = option;
                        }
                    }
                }
            });

            if (targetOption) {
                targetOption.click();
                count++;
            } else if (options.length > 0) {
                // Fallback if no score text found
                if (mode === "max") {
                    options[options.length - 1].click(); // Usually last is max
                } else {
                    options[0].click(); // Usually first is min (0 points)
                }
                count++;
            }
        });

        // Auto-fill text comments
        const textInputs = document.querySelectorAll("textarea, div[role='textbox']");
        let textCount = 0;
        const commentText = mode === "max" ? "好" : "无";
        
        textInputs.forEach(input => {
            if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
                input.value = commentText;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                textCount++;
            } else if (input.isContentEditable || input.getAttribute("role") === "textbox") {
                input.innerText = commentText;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                textCount++;
            }
        });

        const btnClass = mode === "max" ? ".review-grade-btn-max" : ".review-grade-btn-min";
        const button = document.querySelector(btnClass);
        if (button) {
            const originalText = mode === "max" ? "一键满分" : "一键零分";
            if (count > 0 || textCount > 0) {
                Utils.updateButtonText(button, originalText, `已评 ${count} 题，填 ${textCount} 处`);
            } else {
                Utils.updateButtonText(button, originalText, "未找到题目");
            }
        }
    }
};

window.ReviewControls = ReviewControls;
