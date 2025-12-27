// ==UserScript==
// @name         Pandora VIA
// @namespace    http://leopardindustries.net
// @version      1.6
// @description  Toggles UI elements on Pandora + 16:10 fullscreen fixes + Instant Movers
// @match        https://www.pandora.com/*
// @grant        none
// @icon         https://images.icon-icons.com/17/PNG/256/Pandora_1992.png
// ==/UserScript==

(function() {
    'use strict';

    console.log("our time is now");
    console.log("sending data...");

    // --- MAIN TOGGLE LOGIC ---
    const targets = [
        'div.GlobalSearchInput__inner',
        'div.SourceList',
        'h1.NowPlayingTopInfoSessionName__header',
        'h3.DiscoveryTunerHeader',
        'ul.DiscoveryTuner__options'
    ];
    const oppositeTarget = ['div.VolumeDurationControl', 'a.nowPlayingTopInfo__current__albumName'];
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

// --- 16:10 FULLSCREEN VOLUME CONTROL FIX ---
(function () {
    'use strict';

    const selector = 'div.VolumeDurationControl';
    const normalBottom = '783px';
    const wideBottom = '910px';

    let mode16by10 = false;
    let initialized = false;

    function setBottom(value) {
        const el = document.querySelector(selector);
        if (el) el.style.bottom = value;
    }

    const initInterval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el && !initialized) {
            el.style.bottom = normalBottom;
            initialized = true;
            clearInterval(initInterval);
        }
    }, 100);

    const fsBtn = document.createElement('button');
    fsBtn.textContent = 'FS';
    Object.assign(fsBtn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '999999',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        background: '#1e4ed8',
        color: 'white',
        border: '1px solid white',
        borderRadius: '0px'
    });

    document.body.appendChild(fsBtn);

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000000'
    });

    const popup = document.createElement('div');
    Object.assign(popup.style, {
        background: '#111',
        border: '1px solid white',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        minWidth: '220px',
        borderRadius: '0px'
    });

    popup.innerHTML = `
        <div style="margin-bottom:12px;font-weight:bold;">
            choose fullscreen aspect
        </div>
        <button id="fs169">16:9</button>
        <button id="fs1610">16:10</button>
    `;

    popup.querySelectorAll('button').forEach(b => {
        Object.assign(b.style, {
            margin: '6px',
            padding: '8px 14px',
            background: '#1e4ed8',
            color: 'white',
            border: '1px solid white',
            cursor: 'pointer',
            borderRadius: '0px'
        });
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    function enterFullscreen() {
        setBottom(normalBottom);
        document.documentElement.requestFullscreen().catch(() => {});
    }

    fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            overlay.style.display = 'flex';
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    popup.querySelector('#fs169').addEventListener('click', () => {
        mode16by10 = false;
        overlay.style.display = 'none';
        enterFullscreen();
    });

    popup.querySelector('#fs1610').addEventListener('click', () => {
        mode16by10 = true;
        overlay.style.display = 'none';
        enterFullscreen();
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement && mode16by10) {
            setBottom(wideBottom);
        } else {
            setBottom(normalBottom);
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
        border-bottom-left-radius: 5px;
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
        'https://i.ibb.co/4ZCdvBr3/pir-2.png',
        'https://i.ibb.co/TDbyhX0S/pir-3.png'
    ];

    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        if (i < links.length) img.addEventListener('click', () => window.open(links[i], '_self'));
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
    profileText.textContent = 'VIA Resurrected';
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
})();

// --- NOW PLAYING → CURRENT TIME ---
setInterval(() => {
    const link = document.querySelector('a[data-qa="header_now_playing_link"] span:first-child');
    if (link) {
        const now = new Date();
        link.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}, 1000);

// --- AUTO CLICK "I'M STILL LISTENING" ---
const stillListeningObserver = new MutationObserver(() => {
    const btn = document.querySelector('button[data-qa="keep_listening_button"]');
    if (btn) btn.click();
});
stillListeningObserver.observe(document.body, { childList: true, subtree: true });

// --- ELEMENT MOVERS (UNIFIED + ON LOAD + PERSISTENT) ---
(function () {
    'use strict';

    const volumeSelector = 'div.VolumeDurationControl';
    const thumbsSelector = 'button[data-qa="thumbs_up_button"]';
    const menuBtnSelector = 'button.MenuToggleButton';
    const offsetPx = 0;

    function runElementMovers() {
        const thumbsEl = document.querySelector(thumbsSelector);
        if (!thumbsEl) return;

        const rect = thumbsEl.getBoundingClientRect();
        const baseLeft = rect.left;

        // 1. Move Menu Button (Exact Alignment)
        document.querySelectorAll(menuBtnSelector).forEach(el => {
            el.style.left = `${baseLeft}px`;
            el.style.right = 'auto';
        });

        // 2. Move Volume Control (Relative Alignment)
        const volumeEl = document.querySelector(volumeSelector);
        if (volumeEl && volumeEl.offsetParent) {
            const parentRect = volumeEl.offsetParent.getBoundingClientRect();
            const left = rect.left - parentRect.left + offsetPx;

            volumeEl.style.position = 'absolute';
            volumeEl.style.left = `${left}px`;
            volumeEl.style.right = 'auto';
            volumeEl.style.zIndex = 999999;
            volumeEl.style.display = 'block';
        }
    }

    // Run continuously until found, then maintain
    const persistentMover = setInterval(runElementMovers, 200);

    // Run on resize and fullscreen
    window.addEventListener('resize', runElementMovers);
    document.addEventListener('fullscreenchange', runElementMovers);

    // Watch for DOM changes (loading new songs, SPA navigation) to force alignment
    const moverObserver = new MutationObserver(runElementMovers);
    moverObserver.observe(document.body, { childList: true, subtree: true });

    // Initial run
    runElementMovers();

})();
