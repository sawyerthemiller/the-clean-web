// ==UserScript==
// @name         My Avatar Replacer Only
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Replaces ONLY my specific avatar with the hack avatar
// @author       You
// @icon         https://www.reddit.com/favicon.ico
// @match        https://*.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // The unique ID found in your original avatar link
    const MY_UUID = "0208433a-b042-45d7-88aa-aefafe55fe23";

    // The replacement image
    const NEW_AVATAR_URL = "https://i.ibb.co/wZDbbP49/hack-avatar.png";

    function updateAvatars() {
        // 1. Handle SVG avatars (Header/Drawer)
        const svgImages = document.querySelectorAll('.snoovatar image');
        svgImages.forEach(img => {
            const currentSrc = img.getAttribute('href') || "";
            // Only replace if it contains your unique ID and hasn't been swapped yet
            if (currentSrc.includes(MY_UUID) && currentSrc !== NEW_AVATAR_URL) {
                img.setAttribute('href', NEW_AVATAR_URL);
                img.style.width = "100%";
                img.style.height = "100%";

                // Fix container rounding
                const container = img.closest('.snoovatar');
                if (container) container.classList.remove('rounded-full');
            }
        });

        // 2. Handle standard IMG tags (Feed/Comments)
        const stdImages = document.querySelectorAll('img');
        stdImages.forEach(img => {
            const currentSrc = img.src || "";
            // Only replace if it contains your unique ID
            if (currentSrc.includes(MY_UUID) && currentSrc !== NEW_AVATAR_URL) {
                img.src = NEW_AVATAR_URL;

                // Fix container rounding
                const container = img.closest('.snoovatar');
                if (container) container.classList.remove('rounded-full');
            }
        });
    }

    // Run immediately
    updateAvatars();

    // Watch for dynamic updates
    const observer = new MutationObserver(() => {
        updateAvatars();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
