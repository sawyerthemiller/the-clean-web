// ==UserScript==
// @name         YT Redux Improver
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fix YouTube Redux Layout Issues
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Helpers
    const findSectionsContainer = () => document.querySelector('#sections');

    // forgiving search for the subscriptions child: looks for the word "subscriptions" anywhere inside
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

    // place node at index 'idx' inside container (0-based). If idx >= length, appends.
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

    // Main logic: initial move once, then keep at desiredIndex
    (async () => {
        let sections = null;
        let desiredIndex = null; // once set, we will keep Subscriptions at this index
        let subscriptionsNodeId = null; // use weak id reference (we can't rely on stable element identity across replacements, but we can find by text)
        let debounceTimer = null;

        function doEnsurePosition() {
            if (!sections || desiredIndex === null) return;

            const find = findSubscriptionsChild(sections);
            if (!find) return; // can't find subscriptions right now

            const { node: subNode, index: currentIndex, children } = find;

            // If it's already at the desired index, do nothing.
            if (currentIndex === desiredIndex) return;

            // Attempt to move it *to* the desiredIndex.
            // Note: after inserting, the node will be located at 'desiredIndex' unless other mutations race.
            const newIndex = placeNodeAtIndex(sections, subNode, desiredIndex);
            console.log(`[Tampermonkey] Adjusted "Subscriptions" from index ${currentIndex} -> ${newIndex}`);
        }

        // When we detect mutations, we debounce and then either perform initial move or ensure locked position.
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
                        try { if (sectionsObserver) sectionsObserver.disconnect(); } catch (e) {}
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

        // Cleanup on page unload (not strictly necessary but tidy)
        window.addEventListener('beforeunload', () => {
            try { if (sectionsObserver) sectionsObserver.disconnect(); } catch (e) {}
            try { if (bodyObserver) bodyObserver.disconnect(); } catch (e) {}
            clearInterval(ensureInterval);
        });
    })();
})();
(function() {
    'use strict';

    // Inject CSS that overrides YouTube's rounded corners
    const style = document.createElement('style');
    style.textContent = `
        
        yt-flexible-actions-view-model a.yt-spec-button-shape-next,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__button,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__outline,
        yt-flexible-actions-view-model .yt-spec-button-shape-next__button-text-content,
        yt-spec-button-shape-next {
            border-radius: 0 !important;
        }

        /* These two target the internal button container used by YT Studio */
        yt-flexible-actions-view-model a.yt-spec-button-shape-next > * {
            border-radius: 0 !important;
        }

        /* And this nails the backdrop-filter shadow shape */
        yt-flexible-actions-view-model yt-touch-feedback-shape .yt-spec-touch-feedback-shape__fill,
        yt-flexible-actions-view-model yt-touch-feedback-shape .yt-spec-touch-feedback-shape__stroke {
            border-radius: 0 !important;
        }

        /* Fix the stacks so they look normal */
        yt-collections-stack.ytCollectionsStackHost * {
        border-radius: 0 !important
        }

        button.yt-spec-button-shape-next {
        border-radius: 0 !important;
        }
        button.yt-spec-button-shape-next * {
        border-radius: 0 !important;
        }

        .ytThumbnailViewModelImage {
        background: #000 !important;
        }

        .ytThumbnailViewModelImage img {
        background: #000 !important;
        }

    `;
    document.head.appendChild(style);
})();
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
