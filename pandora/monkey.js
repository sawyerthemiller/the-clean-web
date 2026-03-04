// ==UserScript==
//
// @name         Pandora VIA
// @namespace    http://leopardindustries.net
// @version      1.7
// @description  Get the VIZIO TV UI on Pandora Web Player
// @icon         https://images.icon-icons.com/17/PNG/256/Pandora_1992.png
// @match        https://www.pandora.com/*
// @grant        none
//
// @updateURL    https://raw.githubusercontent.com/sawyerthemiller/the-clean-web/refs/heads/main/pandora/monkey.js
// @downloadURL  https://raw.githubusercontent.com/sawyerthemiller/the-clean-web/refs/heads/main/pandora/monkey.js
//
// ==/UserScript==

(function () {
    'use strict';

    console.log("our time is now");

    const targets = [
        'div.GlobalSearchInput__inner',
        'div.SourceList',
        'h1.NowPlayingTopInfoSessionName__header',
        'h3.DiscoveryTunerHeader',
        'ul.DiscoveryTuner__options'
    ];
    const oppositeTarget = ['div.VolumeDurationControl'];
    const thumbsButtons = ['button.ThumbUpButton', 'button.ThumbDownButton', 'button.MenuToggleButton'];

    let menuVisible = false;

    const checkVisibility = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const url = window.location.pathname;
        const hideCondition = scrollY > 300 || url.startsWith('/collection') || url.startsWith('/browse');

        thumbsButtons.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = hideCondition ? 'none' : '';
            });
        });

        document.querySelectorAll(oppositeTarget).forEach(el => {
            el.style.display = hideCondition ? 'none' : (menuVisible ? 'none' : '');
        });

        targets.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = hideCondition ? 'none' : (menuVisible ? '' : 'none');
            });
        });
    };

    const hideInterval = setInterval(() => {
        let found = false;
        targets.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
                found = true;
            });
        });
        document.querySelectorAll(oppositeTarget).forEach(el => {
            el.style.display = '';
        });

        if (found) clearInterval(hideInterval);
    }, 100);

    setTimeout(() => {
        document.querySelector('.MenuToggleButton')?.remove();

        const menuBtn = document.createElement('button');
        menuBtn.className = 'MenuToggleButton';
        menuBtn.textContent = 'Menu';
        document.body.appendChild(menuBtn);

        const style = document.createElement('style');
        style.textContent = `
            button.MenuToggleButton {
                background: linear-gradient(to bottom, #3a6eff 0%, #1e4ed8 100%);
                position: fixed;
                left: 1037px; /* Default fallback */
                bottom: 457px;
                font-weight: bold;
                font-size: 125%;
                width: 145px;
                height: 50px;
                border: 1px solid white;
                color: white;
                cursor: pointer;
                z-index: 9999;
            }
            button.MenuToggleButton:hover { filter: brightness(1.2); }
        `;
        document.head.appendChild(style);

        menuBtn.addEventListener('click', () => {
            menuVisible = !menuVisible;
            checkVisibility();
        });

        window.addEventListener('scroll', checkVisibility);
        checkVisibility();

        const observer = new MutationObserver(checkVisibility);
        observer.observe(document.body, { childList: true, subtree: true });
    }, 2000);

})();

(function () {
    'use strict';

    const fsBtn = document.createElement('button');
    fsBtn.textContent = 'FS';
    Object.assign(fsBtn.style, {
        position: 'fixed',
        bottom: '15px',
        right: '20px',
        zIndex: '999999',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        background: 'linear-gradient( to bottom, #2b2b2b 0%, #2b2b2b 50%, #0f0f0f 50%, #0f0f0f 100% )',
        color: 'white',
        border: '2px solid white',
        borderRadius: '0px'
    });

    document.body.appendChild(fsBtn);

    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    });

})();

// --- APPS BAR + TOP-RIGHT PROFILE ---
(() => {
    'use strict';
    const appsBarStyle = document.createElement('style');
    appsBarStyle.textContent = `
      #imageBar {
        position: fixed;
        bottom: -150px;
        left: 0;
        width: 100%;
        background: radial-gradient(circle at center, rgba(51,51,51,0.8) 0%, rgba(17,17,17,0.8) 65%, rgba(0,0,0,0.8) 100%);
        backdrop-filter: blur(6px);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        padding: 12px 24px;
        transition: bottom 0.4s ease;
        z-index: 999999;
        box-shadow: 0 -2px 15px rgba(0,0,0,0.6) inset;
        border-top: 1.5px solid white;
      }
      #imageBar.show { bottom: 0; }
      #imageBar img {
        position: relative;
        height: 80px;
        object-fit: contain;
        transition: transform 0.2s ease, z-index 0.2s ease;
        cursor: pointer;
      }
      #imageBar img:hover { transform: scale(1.025); z-index: 999; }
      .bar-arrow { color: #aaa; font-size: 28px; user-select: none; padding: 0 10px; }
      .hidden-icon { display: none; }

      #topRightProfile {
        position: fixed;
        top: 0px;
        right: 0px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(6px);
        border-left: 1.5px solid white;
        border-bottom: 1.5px solid white;
        border-bottom-left-radius: 0px;
        font-family: Arial, sans-serif;
        color: white;
        z-index: 999999;
        display: none;
      }
      #topRightProfile img { height: 20px; object-fit: contain; }
      #topRightProfile .divider { width: 1px; height: 20px; background-color: lightgray; }
    `;
    document.head.appendChild(appsBarStyle);

    const appsBarDiv = document.createElement('div');
    appsBarDiv.id = 'imageBar';

    const leftArrow = document.createElement('div');
    leftArrow.className = 'bar-arrow';
    leftArrow.textContent = '<';
    appsBarDiv.appendChild(leftArrow);

    const links = [
        'https://netflix.com',
        'https://vudu.com'
    ];

    const imgs = [
        'https://i.ibb.co/cKJn9vyt/pir-1-1.png',
        'https://i.ibb.co/TMtbXWK7/vudu-1.png',
        'https://i.ibb.co/GQdgnSMT/exit-1.png'
    ];

    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        // CHANGED: '_self' to '_blank' to open in new tab
        if (i < links.length) img.addEventListener('click', () => window.open(links[i], '_blank'));
        else {
            img.addEventListener('click', () => {
                appsBarDiv.classList.remove('show');
                document.getElementById('topRightProfile').style.display = 'none';
            });
        }
        appsBarDiv.appendChild(img);
    });

    const rightArrow = document.createElement('div');
    rightArrow.className = 'bar-arrow';
    rightArrow.textContent = '>';
    appsBarDiv.appendChild(rightArrow);

    document.body.appendChild(appsBarDiv);

    const profileDiv = document.createElement('div');
    profileDiv.id = 'topRightProfile';
    const signalImg = document.createElement('img');
    signalImg.src = 'https://i.ibb.co/q3fNK8T4/signal-bars.png';
    profileDiv.appendChild(signalImg);
    const divider = document.createElement('div');
    divider.className = 'divider';
    profileDiv.appendChild(divider);
    const profileText = document.createElement('span');
    profileText.textContent = 'VIA Reborn';
    profileDiv.appendChild(profileText);
    document.body.appendChild(profileDiv);

    let holdTimer = null;
    let isHolding = false;

    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'v' && !holdTimer && !isHolding) {
            isHolding = true;
            holdTimer = setTimeout(() => {
                appsBarDiv.classList.toggle('show');
                profileDiv.style.display = appsBarDiv.classList.contains('show') ? 'flex' : 'none';
            }, 1250);
        }
    });

    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'v') {
            clearTimeout(holdTimer);
            holdTimer = null;
            isHolding = false;
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'e') document.querySelectorAll('.hidden-icon').forEach(el => el.style.display = 'block');
    });

    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'e') document.querySelectorAll('.hidden-icon').forEach(el => el.style.display = 'none');
    });

    function showStartupHint() {
        const hint = document.createElement('div');
        hint.textContent = "hold the 'v' key to open vizio apps bar";

        Object.assign(hint.style, {
            position: 'fixed',
            top: '40px',
            left: '20px',
            width: '15%',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '15px 0',
            zIndex: '1000000',
            borderRadius: '0px',
            fontFamily: 'Segoe UI Supro',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            border: '1px solid #444',
            transition: 'top 0.5s ease'
        });

        document.body.appendChild(hint);

        setTimeout(() => {
            hint.style.top = '-100px';
            setTimeout(() => hint.remove(), 500);
        }, 6000);
    }

    showStartupHint();

})();

setInterval(() => {
    const link = document.querySelector('a[data-qa="header_now_playing_link"] span:first-child');
    if (link) {
        const now = new Date();
        link.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}, 1000);

const stillListeningObserver = new MutationObserver(() => {
    const btn = document.querySelector('button[data-qa="keep_listening_button"]');
    if (btn) btn.click();
});
stillListeningObserver.observe(document.body, { childList: true, subtree: true });

(function () {
    'use strict';

    const volumeSelector = 'div.VolumeDurationControl';
    const thumbsSelector = 'button[data-qa="thumbs_up_button"]';
    const menuBtnSelector = 'button.MenuToggleButton';
    const anchorSelectors = [
        '.nowPlayingTopInfo__current__inner',
        '.nowPlayingTopInfo__current__albumName'
    ];

    function runElementMovers() {
        const volumeEl = document.querySelector(volumeSelector);

        let anchorEl = null;
        for (const sel of anchorSelectors) {
            anchorEl = document.querySelector(sel);
            if (anchorEl) break;
        }

        if (volumeEl && volumeEl.offsetParent && anchorEl) {
            const parentRect = volumeEl.offsetParent.getBoundingClientRect();
            const anchorRect = anchorEl.getBoundingClientRect();

            const top = anchorRect.bottom - parentRect.top - 15;

            const left = anchorRect.left - parentRect.left + 60;

            Object.assign(volumeEl.style, {
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                bottom: 'auto',
                right: 'auto',
                zIndex: '999999',
                display: 'block',
                margin: '0',
                transform: 'none'
            });
        }

        const albumEl = document.querySelector('.nowPlayingTopInfo__current__albumName');
        const thumbsUpEl = document.querySelector('.ThumbUpButton');
        const thumbsDownEl = document.querySelector('.ThumbDownButton');
        const menuEl = document.querySelector('.MenuToggleButton');

        if (albumEl && thumbsUpEl && thumbsDownEl && menuEl) {
            const anchorRect = albumEl.getBoundingClientRect();

            const placeElement = (el, referenceRectBottom) => {
                if (!el.offsetParent) return referenceRectBottom;

                const parentRect = el.offsetParent.getBoundingClientRect();

                const top = referenceRectBottom - parentRect.top + 25;

                const left = anchorRect.left - parentRect.left + 60;

                el.style.setProperty('position', 'absolute', 'important');
                el.style.setProperty('top', `${top}px`, 'important');
                el.style.setProperty('left', `${left - 30}px`, 'important');
                el.style.setProperty('right', 'auto', 'important');
                el.style.setProperty('bottom', 'auto', 'important');
                el.style.setProperty('margin', '0', 'important');

                return el.getBoundingClientRect().bottom;
            };

            let currentBottom = albumEl.getBoundingClientRect().bottom;
            currentBottom = placeElement(thumbsUpEl, currentBottom);
            currentBottom = placeElement(thumbsDownEl, currentBottom);
            currentBottom = placeElement(menuEl, currentBottom);
        }
    }

    const persistentMover = setInterval(runElementMovers, 10);

    window.addEventListener('resize', runElementMovers);
    document.addEventListener('fullscreenchange', runElementMovers);

    const moverObserver = new MutationObserver(runElementMovers);
    moverObserver.observe(document.body, { childList: true, subtree: true });

    runElementMovers();

})();

(function () {
    'use strict';

    const selector = 'a.nowPlayingTopInfo__current__albumName';

    function fixAlbumName() {
        const el = document.querySelector(selector);
        if (!el) return;

        if (el.textContent.endsWith('.')) {
            el.textContent = el.textContent.slice(0, -1);
        }
    }

    fixAlbumName();

    const observer = new MutationObserver(fixAlbumName);
    const target = document.querySelector(selector);
    if (target) {
        observer.observe(target, { childList: true });
    }

    setInterval(fixAlbumName, 1000);
})();

(function () {
    'use strict';

    const TARGET_PATH_D = 'M3.75 22.5v-21l16.5 10.521z';

    function updatePlayButtons() {
        document.querySelectorAll('button[data-qa="play_button"] svg').forEach(svg => {
            const path = svg.querySelector('path');
            if (!path) return;

            if (path.getAttribute('d') === TARGET_PATH_D) {
                svg.style.transform = 'translateX(2px)';
            } else {
                svg.style.transform = '';
            }
        });
    }

    updatePlayButtons();

    const observer = new MutationObserver(updatePlayButtons);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
})();

(function () {
    'use strict';

    function checkStyles() {
        const styles = getComputedStyle(document.documentElement);

        const stylus = styles.getPropertyValue('--stylus-ok').trim();
        const stylebot = styles.getPropertyValue('--stylebot-ok').trim();

        const missing = [];
        if (!stylus) missing.push("Stylus");
        if (!stylebot) missing.push("Stylebot");

        if (missing.length > 0) {
            showMetroModal(missing);
        }
    }

    function showMetroModal(missingList) {
        if (document.getElementById("metro-style-warning")) return;

        const overlay = document.createElement("div");
        overlay.id = "metro-style-warning";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.background = "rgba(0,0,0,0.75)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "999999";

        const modal = document.createElement("div");
        modal.style.background = "#111";
        modal.style.color = "#fff";
        modal.style.padding = "15px";
        modal.style.width = "420px";
        modal.style.fontFamily = "Segoe UI Supro";
        modal.style.borderLeft = "3px solid #00a2ed";

        modal.innerHTML = `
            <h2 style="margin: 0 0 15px 0;font-weight:300;">Required Style Missing!!!</h2>
            <p style="margin: 0 0 15px 0;">
                Missing sheet or extension <strong>${missingList.join(", ")}</strong>
            </p>
            <p style="margin: 0 0 15px 0;">
                Install it from
                <a href="https://github.com/sawyerthemiller/the-clean-web/tree/main/pandora"
                   target="_blank"
                   style="color: #00a2ed; text-decoration: none;">
                   here
                </a>
            </p>
            <div style="text-align:right;">
                <button id="metro-close-btn"
                    style="
                        background: #00a2ed;
                        border: none;
                        color: #fff;
                        padding: 8px 18px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;">
                    IGNORE
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("metro-close-btn").onclick = () => {
            overlay.remove();
        };
    }

    window.addEventListener("load", () => {
        setTimeout(checkStyles, 100);
    });

})();
