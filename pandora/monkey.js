// ==UserScript==
// @name         Pandora Menu Toggle
// @namespace    http://leopardindustries.net
// @version      1.4
// @description  Toggles UI elements on Pandora
// @match        https://www.pandora.com/*
// @grant        none
// @icon         https://images.icon-icons.com/17/PNG/256/Pandora_1992.png
// ==/UserScript==

(function() {
    'use strict';

    const targets = [
        'div.GlobalSearchInput__inner',
        'div.SourceList',
        'h1.NowPlayingTopInfoSessionName__header',
        'h3.DiscoveryTunerHeader',
        'ul.DiscoveryTuner__options'
    ];
    const oppositeTarget = 'div.VolumeDurationControl';
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
                left: 1037px;
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

            button.MenuToggleButton:hover {
                filter: brightness(1.2);
            }
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
        height: 80px;
        object-fit: contain;
        transition: transform 0.2s ease;
        cursor: pointer;
      }
      #imageBar img:hover { transform: scale(1.1); }
      .bar-arrow {
        color: #aaa;
        font-size: 28px;
        user-select: none;
        padding: 0 10px;
      }
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
      #topRightProfile .divider {
        width: 1px;
        height: 20px;
        background-color: lightgray;
      }
    `;
    document.head.appendChild(appsBarStyle);

    const appsBarDiv = document.createElement('div');
    appsBarDiv.id = 'imageBar';

    const leftArrow = document.createElement('div');
    leftArrow.className = 'bar-arrow';
    leftArrow.textContent = '<';
    appsBarDiv.appendChild(leftArrow);

    const links = [
        'https://pandora.com',
        'https://netflix.com',
        'https://vudu.com',
        'close'
    ];

    const imgs = [
        'https://i.ibb.co/Ds0tGx1/pir-1.png',
        'https://i.ibb.co/cKJn9vyt/pir-1-1.png',
        'https://i.ibb.co/4ZCdvBr3/pir-2.png',
        'https://i.ibb.co/TDbyhX0S/pir-3.png'
    ];

    imgs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        if (i < 3) img.addEventListener('click', () => window.open(links[i], '_self'));
        else if (i === 3) {
            img.classList.add('hidden-icon');
            img.addEventListener('click', () => appsBarDiv.classList.remove('show'));
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
    profileText.textContent = 'Profile — Sawyer';
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
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    link.textContent = time;
  }
}, 1000);

// --- AUTO CLICK "I'M STILL LISTENING" ---
const stillListeningObserver = new MutationObserver(() => {
    const btn = document.querySelector('button[data-qa="keep_listening_button"]');
    if (btn) {
        btn.click();
        console.log("clicked i'm still listening");
    }
});
stillListeningObserver.observe(document.body, { childList: true, subtree: true });
