
document.addEventListener("DOMContentLoaded", () => {
    const room = document.getElementById("room3d");
    const playButton = document.getElementById("playTimeline");
    const previousButton = document.getElementById("previousStage");
    const nextButton = document.getElementById("nextStage");
    const stageTitle = document.getElementById("stageTitle");
    const stageHeading = document.getElementById("stageHeading");
    const stageDescription = document.getElementById("stageDescription");
    const stageCount = document.getElementById("stageCount");
    const stageButtons = document.querySelectorAll(".stage-button");

    const names = [
        "Empty room",
        "Structure",
        "Materials",
        "Furniture",
        "Final styling"
    ];

    const descriptions = [
        "Start with the empty architectural space.",
        "Explore the room structure and spatial layout.",
        "Preview the materials and surface finishes.",
        "Explore the furniture placement.",
        "Review the finished interior concept."
    ];

    let stage = 0;
    let timer = null;

    function renderStage(index) {
        stage = Math.max(0, Math.min(4, index));

        if (room) {
            room.dataset.stage = String(stage);
        }

        const title = `Stage ${stage + 1} — ${names[stage]}`;

        if (stageTitle) stageTitle.textContent = title;
        if (stageHeading) stageHeading.textContent = title;

        if (stageDescription) {
            stageDescription.textContent = descriptions[stage];
        }

        if (stageCount) {
            stageCount.textContent =
                `${String(stage + 1).padStart(2, "0")} / 05`;
        }

        stageButtons.forEach(button => {
            const active = Number(button.dataset.stage) === stage;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
        });

        if (previousButton) {
            previousButton.disabled = stage === 0;
        }

        if (nextButton) {
            nextButton.disabled = stage === 4;
        }
    }

    function stopSimulation() {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }

        if (playButton) {
            playButton.textContent = "▶ Play simulation";
            playButton.setAttribute("aria-pressed", "false");
        }
    }

    function startSimulation() {
        if (timer !== null) {
            stopSimulation();
            return;
        }

        if (stage === 4) {
            renderStage(0);
        }

        if (playButton) {
            playButton.textContent = "Ⅱ Pause simulation";
            playButton.setAttribute("aria-pressed", "true");
        }

        timer = setInterval(() => {
            if (stage >= 4) {
                stopSimulation();
                return;
            }

            renderStage(stage + 1);

            if (stage >= 4) {
                stopSimulation();
            }
        }, 1800);
    }

    if (playButton) {
        playButton.addEventListener("click", event => {
            event.preventDefault();
            startSimulation();
        });
    } else {
        console.error("FurArch: #playTimeline button was not found.");
    }

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            stopSimulation();
            renderStage(stage - 1);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            stopSimulation();
            renderStage(stage + 1);
        });
    }

    stageButtons.forEach(button => {
        button.addEventListener("click", () => {
            stopSimulation();
            renderStage(Number(button.dataset.stage));
        });
    });

    renderStage(0);
});
