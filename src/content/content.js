// Content Controls Module (Title & Subtitle)

const ContentControls = {
    init: () => {
        console.log("Initializing Content Controls");
        ContentControls.addTitleCopyButton();
        ContentControls.addSubtitleCopyButton();
        ContentControls.addDirectoryCopyButton();
        ContentControls.initSubtitleHeaderObserver();
    },

    addDirectoryCopyButton: () => {
        const existingContainer = document.querySelector(".directory-copy-container");
        if (existingContainer) existingContainer.remove();
        
        // Remove legacy button if it exists
        const legacyBtn = document.querySelector(".directory-copy-btn");
        if (legacyBtn && !legacyBtn.closest(".directory-copy-container")) {
            legacyBtn.remove();
        }

        // Only show on module pages
        if (!window.location.href.includes("/home/module/")) {
            return;
        }

        const container = Utils.createElement("div", { 
            className: "directory-copy-container",
            style: { display: "flex", alignItems: "center", gap: "8px" }
        });

        const toggleLabel = Utils.createElement("label", {
            style: { display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }
        });

        const toggle = Utils.createElement("input", {
            type: "checkbox",
            checked: false,
            style: { marginRight: "4px" },
            onchange: (e) => {
                // Save state
                chrome.storage.local.set({ 'directory_heading_mode': e.target.checked });
            }
        });

        // Load saved state
        chrome.storage.local.get(['directory_heading_mode'], (result) => {
            if (result.directory_heading_mode !== undefined) {
                toggle.checked = result.directory_heading_mode;
            }
        });

        toggleLabel.appendChild(toggle);
        toggleLabel.appendChild(document.createTextNode("标题模式"));

        const button = Utils.createElement("button", {
            className: "coursera-subtitle-btn directory-copy-btn", // Reusing style
            style: { backgroundColor: "#7986CB" }, // Indigo 300 - A beautiful, soft blue-purple (Periwinkle)
            onclick: () => {
                const modules = document.querySelectorAll(".cds-AccordionRoot-container.cds-AccordionRoot-standard");
                let text = "";
                const isHeadingMode = toggle.checked;

                // Extract Module/Week number from URL
                const urlMatch = window.location.href.match(/(?:module|week)\/(\d+)/);
                const moduleNumber = urlMatch ? urlMatch[1] : "";

                if (modules.length === 0) {
                    // Fallback logic remains same
                    console.log("No modules found");
                }

                modules.forEach((module, index) => {
                    const moduleTitleElement = module.querySelector(".cds-AccordionHeader-labelGroup .css-6ecy9b");
                    let moduleTitle = moduleTitleElement ? moduleTitleElement.innerText : "Unknown Module";
                    
                    // Prepend Module Number to the first module title
                    if (index === 0 && moduleNumber) {
                        moduleTitle = `Module ${moduleNumber} ${moduleTitle}`;
                    }
                    
                    if (isHeadingMode) {
                        text += `<h2>${moduleTitle}</h2>\n`;
                    } else {
                        text += `${moduleTitle}\n`;
                    }

                    const sections = module.querySelectorAll(".cds-AccordionRoot-container.cds-AccordionRoot-silent");
                    
                    if (sections.length === 0) {
                        // Maybe direct items under module?
                        const items = module.querySelectorAll(".rc-NamedItemListRefresh li");
                        items.forEach((item) => {
                            const itemTitleElement = item.querySelector('p[data-test="rc-ItemName"]');
                            const itemTitle = itemTitleElement ? itemTitleElement.innerText : "Unknown Item";
                            if (isHeadingMode) {
                                text += `<h1>${itemTitle}</h1>\n`;
                            } else {
                                text += `  - ${itemTitle}\n`;
                            }
                        });
                    } else {
                        sections.forEach((section) => {
                            const sectionTitleElement = section.querySelector(".cds-AccordionHeader-labelGroup .css-6ecy9b");
                            const sectionTitle = sectionTitleElement ? sectionTitleElement.innerText : "Unknown Section";
                            if (isHeadingMode) {
                                text += `<h3>${sectionTitle}</h3>\n`;
                            } else {
                                text += `  - ${sectionTitle}\n`;
                            }

                            const items = section.querySelectorAll(".rc-NamedItemListRefresh li");
                            items.forEach((item) => {
                                const itemTitleElement = item.querySelector('p[data-test="rc-ItemName"]');
                                const itemTitle = itemTitleElement ? itemTitleElement.innerText : "Unknown Item";
                                if (isHeadingMode) {
                                    text += `<h1>${itemTitle}</h1>\n`;
                                } else {
                                    text += `    - ${itemTitle}\n`;
                                }
                            });
                        });
                    }
                    if (!isHeadingMode) {
                        text += "\n";
                    }
                });

                if (text.trim()) {
                    Utils.copyToClipboard(text, isHeadingMode);
                    Utils.updateButtonText(button, "复制目录");
                } else {
                    console.log("No directory content found");
                    Utils.updateButtonText(button, "复制目录", "未找到内容");
                }
            }
        }, "复制目录");

        container.appendChild(toggleLabel);
        container.appendChild(button);
        Utils.getOrCreatePanel().appendChild(container);
    },

    addTitleCopyButton: () => {
        const existing = document.querySelector(".title-copy-container");
        if (existing) existing.remove();

        const container = Utils.createElement("div", { className: "title-copy-container" });

        const toggleLabel = Utils.createElement("label", {
            style: { display: "flex", alignItems: "center", fontSize: "12px", cursor: "pointer" }
        });

        const toggle = Utils.createElement("input", {
            type: "checkbox",
            checked: true,
            style: { marginRight: "4px" }
        });

        toggleLabel.appendChild(toggle);
        toggleLabel.appendChild(document.createTextNode("HTML格式"));

        const button = Utils.createElement("button", {
            className: "title-copy-btn",
            onclick: () => {
                const titleElement = document.querySelector("h1.video-name") ||
                    document.querySelector("div.reading-name") ||
                    document.querySelector("h1.cds-Typography-base") ||
                    document.querySelector("h1");

                if (titleElement) {
                    const useHtml = toggle.checked;
                    if (useHtml) {
                        const titleHTML = titleElement.innerHTML || titleElement.textContent || "";
                        const contentToCopy = `<h1>${titleHTML}</h1>`;
                        Utils.copyToClipboard(contentToCopy, true);
                    } else {
                        let titleText = titleElement.innerText || titleElement.textContent || "";
                        if (titleText.includes("\n")) {
                            titleText = titleText.split("\n")[0];
                        }
                        Utils.copyToClipboard(titleText, false);
                    }
                    Utils.updateButtonText(button, "复制标题");
                } else {
                    console.log("Title element not found");
                }
            }
        }, "复制标题");

        container.appendChild(toggleLabel);
        container.appendChild(button);
        Utils.getOrCreatePanel().appendChild(container);
    },

    addSubtitleCopyButton: () => {
        const existing = document.querySelector(".coursera-subtitle-btn");
        if (existing) existing.remove();

        // Only show on lecture or supplement pages
        const currentUrl = window.location.href;
        const isLecture = currentUrl.includes("lecture");
        const isSupplement = currentUrl.includes("supplement");

        if (!isLecture && !isSupplement) {
            return;
        }

        const buttonText = isSupplement ? "复制内容" : "复制字幕";

        const button = Utils.createElement("button", {
            className: "coursera-subtitle-btn",
            onclick: () => {
                let targetDiv = null;

                if (isLecture) {
                    // Only look for transcripts on lecture pages
                    targetDiv =
                        document.querySelector("#cds-react-aria-35-panel-TRANSCRIPT > div > div.cds-1.css-arowdh.cds-3.cds-grid-item.cds-48.cds-73 > div > div > div") ||
                        document.querySelector("#cds-react-aria-90-panel-TRANSCRIPT > div > div.cds-1.css-arowdh.cds-3.cds-grid-item.cds-48.cds-73") ||
                        document.querySelector(".rc-Transcript");
                } else if (isSupplement) {
                    // Only look for reading content on supplement pages
                    targetDiv = document.querySelector("div.rc-CML[dir='auto']");
                }

                if (targetDiv) {
                    // If transcript, remove timestamps temporarily
                    if (targetDiv.classList.contains("rc-Transcript")) {
                        const timestampButtons = targetDiv.querySelectorAll("button.timestamp");
                        timestampButtons.forEach((btn) => btn.remove());
                    }

                    const htmlContent = targetDiv.innerHTML;
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = htmlContent;

                    // Clean up
                    tempDiv.querySelectorAll("button, .timestamp").forEach((el) => el.remove());

                    let contentToCopy = tempDiv.innerHTML;
                    const isTranscript = targetDiv.classList.contains("rc-Transcript");

                    if (!isTranscript) {
                        const titleElem = document.querySelector("h1.video-name") ||
                            document.querySelector("div.reading-name") ||
                            document.querySelector("h1.cds-Typography-base") ||
                            document.querySelector("h1");
                        if (titleElem) {
                            const titleHTML = titleElem.innerHTML || titleElem.textContent || "";
                            contentToCopy = `<h1>${titleHTML}</h1>` + contentToCopy;
                        }
                    }

                    Utils.copyToClipboard(contentToCopy, true);
                    Utils.updateButtonText(button, button.textContent);
                } else {
                    console.log("Subtitle/Content not found");
                }
            }
        }, buttonText);

        Utils.getOrCreatePanel().appendChild(button);
    },

    initSubtitleHeaderObserver: () => {
        const observer = new MutationObserver(() => {
            document.querySelectorAll(".css-vac8rf").forEach((elem) => {
                elem.style.marginRight = "40px";
            });

            const subtitles = document.querySelectorAll(".rc-ModuleSection .cds-AccordionHeader-labelGroup .css-6ecy9b");
            subtitles.forEach((subtitle) => {
                if (!subtitle.nextElementSibling?.classList?.contains("subtitle-copy-btn")) {
                    const copyBtn = Utils.createElement("button", {
                        className: "subtitle-copy-btn",
                        onclick: (e) => {
                            e.stopPropagation();
                            const htmlContent = subtitle.outerHTML;
                            Utils.copyToClipboard(htmlContent, true).then(() => {
                                Utils.updateButtonText(copyBtn, "Copy");
                            });
                        }
                    }, "复制");

                    subtitle.parentNode.insertBefore(copyBtn, subtitle.nextSibling);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
};

window.ContentControls = ContentControls;
