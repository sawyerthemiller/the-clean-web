// ==UserScript==
// @name         YT Redux Improver
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  do what they won't...
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

/* ==========================================================================
   PART 1: Move Subscriptions to Top
   ========================================================================== */
(function () {
    'use strict';

    // Helpers
    const findSectionsContainer = () => document.querySelector('#sections');

    // Forgiving search for the subscriptions child: looks for the word "subscriptions" anywhere inside
    function findSubscriptionsChild(container) {
        const children = Array.from(container.children || []);
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (!child) continue;
            const text = (child.textContent || '').trim();
            if (/subscriptions/i.test(text)) return { node: child, index: i, children };
        }
        return null;
    }

    // Place node at index 'idx' inside container
    function placeNodeAtIndex(container, node, idx) {
        const children = Array.from(container.children || []);
        if (idx <= 0) {
            container.insertBefore(node, children[0] || null);
            return 0;
        }
        if (idx >= children.length) {
            container.appendChild(node);
            return children.length; // new index
        }
        // insert before the current item at idx
        container.insertBefore(node, children[idx]);
        return idx;
    }

    // Main logic - initial move once, then keep at desiredIndex
    (async () => {
        let sections = null;
        let desiredIndex = null; // once set, we will keep Subscriptions at this index
        let debounceTimer = null;

        function doEnsurePosition() {
            if (!sections || desiredIndex === null) return;

            const find = findSubscriptionsChild(sections);
            if (!find) return; // can't find subscriptions right now

            const { node: subNode, index: currentIndex } = find;

            // If it's already at the desired index, do nothing.
            if (currentIndex === desiredIndex) return;

            // Attempt to move it *to* the desiredIndex.
            const newIndex = placeNodeAtIndex(sections, subNode, desiredIndex);
            console.log(`[Tampermonkey] Adjusted "Subscriptions" from index ${currentIndex} -> ${newIndex}`);
        }

        // When we detect mutations, we debounce and then either perform initial move or ensure locked position
        function onMutations() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (!sections) return;

                // If desiredIndex is not yet set, try to perform the single move
                if (desiredIndex === null) {
                    const found = findSubscriptionsChild(sections);
                    if (!found) return; // sidebar not ready yet

                    const { node: subNode, index: subIndex, children } = found;

                    // If it's already last, we can't move down; lock its current index.
                    if (subIndex >= children.length - 1) {
                        desiredIndex = subIndex;
                        console.log('[Tampermonkey] Subscriptions is last; locking at current index', desiredIndex);
                        return;
                    }

                    // Perform the single move down by one slot
                    const targetIndex = subIndex + 1;

                    // Insert subscriptions after the element currently at targetIndex (so we end up at targetIndex)
                    const referenceElement = children[targetIndex];
                    sections.insertBefore(subNode, referenceElement.nextSibling);
                    desiredIndex = targetIndex; // lock this index
                    console.log(`[Tampermonkey] Moved "Subscriptions" down once to index ${desiredIndex} and locked position.`);
                    return;
                }

                // If desiredIndex is already set, ensure the node stays at that index
                doEnsurePosition();
            }, 150); // small debounce
        }

        // Watch a given sections element
        function bindObserverToSections(sectionsElement) {
            if (!sectionsElement) return null;
            sections = sectionsElement;

            const obs = new MutationObserver(() => {
                onMutations();
            });

            obs.observe(sections, { childList: true, subtree: true, characterData: true });
            return obs;
        }

        // Observe the body for #sections replacements; rebind observer if replaced.
        let sectionsObserver = null;
        let bodyObserver = null;

        function setup() {
            const sec = findSectionsContainer();
            if (sec) {
                if (!sectionsObserver) sectionsObserver = bindObserverToSections(sec);
                // trigger an immediate check in case it's ready now
                onMutations();
            }
            if (!bodyObserver) {
                bodyObserver = new MutationObserver(() => {
                    const newSec = findSectionsContainer();
                    if (newSec && newSec !== sections) {
                        // rebind
                        try { if (sectionsObserver) sectionsObserver.disconnect(); } catch (e) { }
                        sectionsObserver = bindObserverToSections(newSec);
                        console.log('[Tampermonkey] Rebound observer to new #sections element.');
                        onMutations();
                    }
                });
                bodyObserver.observe(document.body, { childList: true, subtree: true });
            }
        }

        // initial setup and periodic fallback in case YT is slow to create #sections
        setup();
        const fallbackInterval = setInterval(() => {
            setup();
            // stop fallback once we've locked desiredIndex
            if (desiredIndex !== null) {
                clearInterval(fallbackInterval);
            }
        }, 750);

        // Also attempt a final ensure each few seconds for resilience
        const ensureInterval = setInterval(() => {
            if (desiredIndex !== null) doEnsurePosition();
        }, 3000);

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            try { if (sectionsObserver) sectionsObserver.disconnect(); } catch (e) { }
            try { if (bodyObserver) bodyObserver.disconnect(); } catch (e) { }
            clearInterval(ensureInterval);
        });
    })();
})();

/* ==========================================================================
   PART 2: Square Corners CSS
   ========================================================================== */
(function () {
    'use strict';

    // Inject CSS that overrides YouTube's rounded corners
    const style = document.createElement('style');
    style.textContent = `
        .style-scope.tp-yt-paper-menu-button,
        .style-scope.tp-yt-paper-menu-button *,

        button.yt-spec-button-shape-next,
        yt-collections-stack.ytCollectionsStackHost *,
        yt-flexible-actions-view-model a.yt-spec-button-shape-next,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__button,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__outline,
        yt-flexible-actions-view-model a.yt-spec-button-shape-next > *,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__button-text-content,
        yt-flexible-actions-view-model yt-touch-feedback-shape .yt-spec-touch-feedback-shape__fill,
        yt-flexible-actions-view-model yt-touch-feedback-shape .yt-spec-touch-feedback-shape__stroke,

        button.yt-spec-button-shape-next *,
        yt-spec-button-shape-next,

        [aria-label="Sort comments"] {
            border-radius: 0 !important;
        }

        span.yt-core-attributed-string,
        span.yt-icon-shape.ytSpecIconShapeHost,
        div.yt-spec-button-shape-next__icon {
            color: white;
        }

        #ticket-shelf {
            display: none !important;
        }

        .yt-spec-button-shape-next.yt-spec-button-shape-next--filled.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--size-m.yt-spec-button-shape-next--enable-backdrop-filter-experiment {
            background-color: transparent !important;
        }

        .ytThumbnailViewModelImage
        .ytThumbnailViewModelImage img {
            background: #000 !important;
        }
    `;
    document.head.appendChild(style);
})();

/* ==========================================================================
   PART 3: Remove Shorts
   ========================================================================== */
(function () {
    'use strict';

    function removeShorts() {
        const videos = document.querySelectorAll("ytd-video-renderer");

        videos.forEach(v => {
            const link = v.querySelector("a#thumbnail, a#video-title");
            if (!link) return;

            const href = link.getAttribute("href") || "";

            // Shorts always use /shorts/ID
            if (href.startsWith("/shorts/")) {
                v.remove();
            }
        });
    }

    // initial run
    removeShorts();

    // dynamic page updates (YouTube SPA behavior)
    const obs = new MutationObserver(removeShorts);
    obs.observe(document.body, { childList: true, subtree: true });
})();

/* ==========================================================================
   PART 4: Icon Tweaks
   ========================================================================== */
(function () {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        /* shrink the notification bell */
        yt-animated-icon {
            transform: scale(0.8) !important;
            transform-origin: center center !important;
        }

        /* shrink the share icon wrapper */
        button[aria-label="Clip"] .ytIconWrapperHost,
        button[aria-label="Share"] .ytIconWrapperHost {
            width: 20px !important;
            height: 20px !important;
        }

        /* shrink the actual 24x24 svg inside */
        button[aria-label="Clip"] svg,
        button[aria-label="Share"] svg {
            width: 20px !important;
            height: 20px !important;
        }
    `;
    document.head.appendChild(style);
})();

/* ==========================================================================
   PART 5: General UI Tweaks (Meatball, Download, Save, REMOVE ADS)
   ========================================================================== */
(function () {
    'use strict';

    function applyTweaks() {
        // --- TASK 1: Move Meatball Menu after Share ---
        const menuRenderer = document.querySelector('ytd-menu-renderer.ytd-watch-metadata');
        if (menuRenderer) {
            const meatballMenu = menuRenderer.querySelector('yt-button-shape#button-shape');
            const shareBtnInner = menuRenderer.querySelector('button[aria-label="Share"]');

            if (meatballMenu && shareBtnInner) {
                const shareBtnContainer = shareBtnInner.closest('yt-button-view-model');
                // Move only if not already in position
                if (shareBtnContainer && shareBtnContainer.nextElementSibling !== meatballMenu) {
                    shareBtnContainer.parentNode.insertBefore(meatballMenu, shareBtnContainer.nextSibling);
                }
            }

            // --- TASK 2: Fix Save Button Icon Margin ---
            const saveBtnInner = menuRenderer.querySelector('button[aria-label="Save to playlist"]');
            if (saveBtnInner) {
                const saveIcon = saveBtnInner.querySelector('.yt-spec-button-shape-next__icon');
                if (saveIcon) {
                    saveIcon.style.marginRight = '4px';
                }
            }
        }

        // --- TASK 3: Move Sidebar 4px to the Right ---
        const secondaryColumn = document.getElementById('secondary');
        if (secondaryColumn) {
            secondaryColumn.style.marginLeft = '6px';
        }

        // --- TASK 4: Hide Download Button ---
        const downloadSelectors = [
            'ytd-download-button-renderer', // Main bar button
            'ytd-menu-service-item-download-renderer', // The menu item wrapper
            '.ytd-menu-service-item-download-renderer'
        ];

        downloadSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.style.display !== 'none') {
                    el.style.display = 'none';
                }
            });
        });

        // --- TASK 5: Hide "Remove ads" Button ---
        const items = document.querySelectorAll('yt-list-item-view-model');
        items.forEach(item => {
            // Check if it's already hidden to save performance
            if (item.style.display === 'none') return;

            // Check if the text content matches "Remove ads"
            if (item.textContent.trim().includes('Remove ads')) {
                item.style.display = 'none';
            }
        });
    }

    // Observer to handle dynamic loading
    const observer = new MutationObserver((mutations) => {
        applyTweaks();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial run
    applyTweaks();

})();

/* ==========================================================================
   PART 6: Force Full Reload on Video Change
   ========================================================================== */
(function () {
    'use strict';

    // Track the current video ID so we can detect changes
    function getVideoId(url) {
        try {
            const u = new URL(url, location.origin);
            return u.searchParams.get('v');
        } catch (_) {
            return null;
        }
    }

    let lastVideoId = getVideoId(location.href);

    function reloadIfChanged(newUrl) {
        const newId = getVideoId(newUrl);
        if (newId && newId !== lastVideoId) {
            location.href = newUrl;
            return true;
        }
        return false;
    }

    const originalPush = history.pushState;
    history.pushState = function () {
        const url = arguments[2];
        if (url && reloadIfChanged(url.toString())) return;
        originalPush.apply(this, arguments);
    };

    const originalReplace = history.replaceState;
    history.replaceState = function () {
        const url = arguments[2];
        if (url && reloadIfChanged(url.toString())) return;
        originalReplace.apply(this, arguments);
    };

    window.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;

        const url = link.href;
        if (url && url.includes('/watch?v=')) {
            e.preventDefault();
            location.href = url;
        }
    }, true);

    setInterval(() => {
        const currentId = getVideoId(location.href);
        if (currentId && currentId !== lastVideoId) {
            location.reload();
        }
    }, 500);

    window.addEventListener('yt-navigate-finish', () => {
        const currentId = getVideoId(location.href);
        if (currentId && currentId !== lastVideoId) {
            location.reload();
        }
    });
})();
