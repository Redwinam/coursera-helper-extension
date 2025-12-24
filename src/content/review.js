// Review Controls Module

const ReviewControls = {
    init: () => {
        console.log("Initializing Review Controls");
        const currentUrl = window.location.href;
        // Check for review pages (specifically review-next as requested)
        if (currentUrl.includes("review-next")) {
            ReviewControls.addGradingButton();
        }
    },

    addGradingButton: () => {
        const existingBtn = document.querySelector(".review-grade-btn");
        if (existingBtn) existingBtn.remove();

        const button = Utils.createElement("button", {
            className: "quiz-btn review-grade-btn",
            style: { 
                backgroundColor: "#0056D2", // Coursera Blue
                marginBottom: "8px"
            },
            onclick: () => {
                ReviewControls.autoGrade();
            }
        }, "一键评分");

        Utils.getOrCreatePanel().appendChild(button);
    },

    autoGrade: () => {
        // Find all question blocks
        // Based on analysis, likely .rc-OptionsFormPart or similar structure
        const questions = document.querySelectorAll(".rc-OptionsFormPart");
        let count = 0;

        if (questions.length === 0) {
            console.log("No questions found via .rc-OptionsFormPart");
            // Fallback for different DOM structures if needed
        }

        questions.forEach(question => {
            // Find options within the question
            // Options are usually radio inputs or containers acting as radios
            const options = question.querySelectorAll('[role="radio"], input[type="radio"]');
            let maxScore = -1;
            let maxOption = null;

            options.forEach(option => {
                // Try to find the score text associated with this option
                // The text might be in the option itself or a sibling label/div
                // We search up to the container level if needed, but usually text is inside or near
                
                // Strategy: check the option's text content, or its parent's text content
                let text = option.innerText;
                
                // If text is empty (e.g. input element), check parent or associated label
                if (!text || text.trim() === "") {
                    // Try to find a label or wrapper
                    const parent = option.closest('.peer-option-input') || option.parentElement;
                    if (parent) {
                        text = parent.innerText;
                    }
                }

                // Look for patterns like "3 points", "1 point", "3 分"
                // Match number followed by "point" or "pt" or "分"
                const match = text.match(/(\d+)\s*(?:points?|pt|分)/i);
                
                if (match) {
                    const score = parseInt(match[1]);
                    if (score > maxScore) {
                        maxScore = score;
                        maxOption = option;
                    }
                } else {
                     // Sometimes just a number at the beginning or end? 
                     // Risky to assume just any number.
                }
            });

            if (maxOption) {
                maxOption.click();
                count++;
            } else if (options.length > 0) {
                // If no score found, default to the last option (often highest score in rubrics)
                // This is a common heuristic for Coursera rubrics where options are ordered 0, 1, 2, 3...
                options[options.length - 1].click();
                count++;
            }
        });

        // Auto-fill text comments
        const textInputs = document.querySelectorAll("textarea, div[role='textbox']");
        let textCount = 0;
        
        textInputs.forEach(input => {
            // Skip if already filled with something substantial (optional, but user said "auto fill")
            // We will overwrite or append? User said "auto fill", usually implies setting the value.
            // Let's set it to "好".
            
            if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
                input.value = "好";
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                textCount++;
            } else if (input.isContentEditable || input.getAttribute("role") === "textbox") {
                input.innerText = "好";
                input.dispatchEvent(new Event('input', { bubbles: true }));
                textCount++;
            }
        });

        const button = document.querySelector(".review-grade-btn");
        if (button) {
            const originalText = "一键评分";
            if (count > 0 || textCount > 0) {
                Utils.updateButtonText(button, originalText, `已评分 ${count} 题，填充 ${textCount} 处评价`);
            } else {
                Utils.updateButtonText(button, originalText, "未找到题目");
            }
        }
    }
};

window.ReviewControls = ReviewControls;
