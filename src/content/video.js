// Video Controls Module

const VideoControls = {
    init: () => {
        console.log("Initializing Video Controls");
        // Check if it's a video page
        const currentUrl = window.location.href;
        const isVideoPage = currentUrl.includes("lecture");

        // Remove existing controls
        const speedContainer = document.querySelector(".speed-control-container");
        const screenshotContainer = document.querySelector(".screenshot-container");
        if (speedContainer) speedContainer.remove();
        if (screenshotContainer) screenshotContainer.remove();

        // Add controls if on video page
        if (isVideoPage) {
            VideoControls.addSpeedControl();
            VideoControls.addScreenshotButton();
        }
    },

    addSpeedControl: () => {
        const container = Utils.createElement("div", { className: "speed-control-container" });
        const buttonGroup = Utils.createElement("div", { style: { display: "flex" } });

        const speeds = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
        speeds.forEach((speed) => {
            const button = Utils.createElement("button", {
                className: "speed-btn",
                onclick: () => {
                    const video = document.querySelector("video");
                    if (video) {
                        video.playbackRate = speed;
                        document.querySelectorAll(".speed-btn").forEach((btn) => {
                            btn.classList.remove("active");
                        });
                        button.classList.add("active");
                    }
                }
            }, `${speed}X`);
            buttonGroup.appendChild(button);
        });

        const rewindButton = Utils.createElement("button", {
            className: "rewind-btn",
            onclick: () => {
                const video = document.querySelector("video");
                if (video) {
                    video.currentTime = Math.max(0, video.currentTime - 2);
                    // video.pause(); // Optional: pause on rewind? Original script did this.
                }
            }
        }, "-2s");

        container.appendChild(buttonGroup);
        container.appendChild(rewindButton);
        container.appendChild(buttonGroup);
        container.appendChild(rewindButton);
        Utils.getOrCreatePanel().appendChild(container);
    },

    addScreenshotButton: () => {
        const container = Utils.createElement("div", { className: "screenshot-container" });

        const cropToggleLabel = Utils.createElement("label", { className: "crop-toggle-label" });
        const cropToggle = Utils.createElement("input", {
            type: "checkbox",
            style: { marginRight: "4px" }
        });

        // Load saved state
        chrome.storage.local.get(['courseraCropEnable', 'courseraCropTop', 'courseraCropHeight'], (result) => {
            cropToggle.checked = result.courseraCropEnable !== undefined ? result.courseraCropEnable : true;
            if (result.courseraCropTop) cropTopInput.value = result.courseraCropTop;
            if (result.courseraCropHeight) cropHeightInput.value = result.courseraCropHeight;
        });

        cropToggle.addEventListener("change", function () {
            chrome.storage.local.set({ courseraCropEnable: this.checked });
        });

        cropToggleLabel.appendChild(cropToggle);
        cropToggleLabel.appendChild(document.createTextNode("裁剪"));

        const cropInputsGroup = Utils.createElement("div", { className: "crop-inputs-group" });

        const cropTopInput = Utils.createElement("input", {
            className: "crop-input",
            placeholder: "上",
            onchange: function () { chrome.storage.local.set({ courseraCropTop: this.value }); }
        });

        const cropHeightInput = Utils.createElement("input", {
            className: "crop-input",
            placeholder: "下",
            onchange: function () { chrome.storage.local.set({ courseraCropHeight: this.value }); }
        });

        cropInputsGroup.appendChild(cropTopInput);
        cropInputsGroup.appendChild(cropHeightInput);

        const button = Utils.createElement("button", {
            className: "screenshot-btn",
            onclick: async () => {
                const video = document.querySelector("video");
                if (!video) {
                    alert("未找到视频元素！");
                    return;
                }

                try {
                    const fullWidth = video.videoWidth;
                    const fullHeight = video.videoHeight;

                    const canvas = document.createElement("canvas");
                    canvas.width = fullWidth;
                    const ctx = canvas.getContext("2d");
                    const enableCrop = cropToggle.checked;

                    if (enableCrop) {
                        const topCrop = Math.max(0, parseInt(cropTopInput.value) || 0);
                        const bottomCrop = Math.max(0, parseInt(cropHeightInput.value) || 0);
                        const croppedHeight = Math.max(1, fullHeight - topCrop - bottomCrop);
                        canvas.height = croppedHeight;
                        ctx.drawImage(
                            video,
                            0, topCrop, fullWidth, croppedHeight,
                            0, 0, fullWidth, croppedHeight
                        );
                    } else {
                        canvas.height = fullHeight;
                        ctx.drawImage(
                            video,
                            0, 0, fullWidth, fullHeight,
                            0, 0, fullWidth, fullHeight
                        );
                    }

                    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);

                    Utils.updateButtonText(button, "复制画面");

                    if (video.paused) {
                        video.play();
                    }
                } catch (error) {
                    console.error("Screenshot failed:", error);
                    alert("截图失败，请检查剪贴板权限。");
                }
            }
        }, "复制画面");

        container.appendChild(cropToggleLabel);
        container.appendChild(cropInputsGroup);
        container.appendChild(button);
        Utils.getOrCreatePanel().appendChild(container);
    }
};

window.VideoControls = VideoControls;
