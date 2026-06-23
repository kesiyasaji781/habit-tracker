document.addEventListener("DOMContentLoaded", () => {

    // Apply animation
    document.body.classList.add("fade-in");

    // Load dark mode preference
    const darkMode = localStorage.getItem("darkMode");

    if (darkMode === "enabled") {
        document.body.classList.add("dark-mode");
    }

});


// ======================
// DARK MODE TOGGLE
// ======================

function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    if (
        document.body.classList.contains("dark-mode")
    ) {
        localStorage.setItem(
            "darkMode",
            "enabled"
        );
    } else {
        localStorage.setItem(
            "darkMode",
            "disabled"
        );
    }
}


// ======================
// CONFIRM DELETE
// ======================

function confirmDelete() {

    return confirm(
        "Are you sure you want to delete this habit?"
    );
}


// ======================
// SUCCESS CONFETTI EFFECT
// ======================

function celebrateCompletion() {

    const emojis = ["🎉","🔥","✅","⭐","🚀"];

    const emoji =
        emojis[
            Math.floor(
                Math.random() * emojis.length
            )
        ];

    alert(
        emoji + " Habit Completed Successfully!"
    );
}