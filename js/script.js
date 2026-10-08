document.addEventListener('DOMContentLoaded', function () {
    const panels = Array.from(document.querySelectorAll('.panel'));
    const navButtons = Array.from(document.querySelectorAll('[data-panel]'));
    const heroVideo = document.querySelector('.sea-video');
    const motionToggle = document.querySelector('.sound-toggle');
    const navPreview = document.querySelector('.nav-preview');
    const keyboardHint = document.querySelector('.keyboard-hint');
    const periodLabel = document.querySelector('[data-period-label]');
    let panelOpener = null;
    let hintTimer = null;
    let wasPageHidden = false;

    function videoIsManuallyPaused() {
        return document.body.classList.contains('is-still');
    }

    function updateMotionToggle(paused) {
        motionToggle.textContent = paused ? 'resume video' : 'pause video';
        motionToggle.setAttribute('aria-pressed', String(paused));
        motionToggle.setAttribute('aria-label', paused ? 'Resume background video' : 'Pause background video');
    }

    function playVideo(rate) {
        if (!heroVideo || videoIsManuallyPaused()) return;
        heroVideo.playbackRate = rate || 1;
        heroVideo.play().then(function () {
            updateMotionToggle(false);
        }).catch(function () {
            updateMotionToggle(true);
        });
    }

    function currentAmbientRate() {
        if (document.body.classList.contains('panel-open')) return 0.55;
        if (document.body.classList.contains('previewing')) return 0.4;
        return 1;
    }

    function restoreVideo() {
        if (document.hidden || videoIsManuallyPaused()) return;
        playVideo(currentAmbientRate());
    }

    function rebuildVideoPlayback() {
        if (!heroVideo || document.hidden || videoIsManuallyPaused()) return;
        const resumeAt = Number.isFinite(heroVideo.currentTime) ? heroVideo.currentTime : 0;
        const resume = function () {
            if (heroVideo.duration && resumeAt < heroVideo.duration) heroVideo.currentTime = resumeAt;
            playVideo(currentAmbientRate());
        };

        heroVideo.pause();
        heroVideo.load();
        if (heroVideo.readyState >= 2) resume();
        else heroVideo.addEventListener('canplay', resume, { once: true });
    }

    function closePanels() {
        panels.forEach(function (panel) { panel.hidden = true; });
        document.body.classList.remove('panel-open');
        playVideo(1);
        if (panelOpener) panelOpener.focus();
    }

    function openPanel(name, button) {
        const panel = document.getElementById('panel-' + name);
        if (!panel) return;
        clearPreview();
        panels.forEach(function (item) { item.hidden = item !== panel; });
        panelOpener = button;
        document.body.classList.add('panel-open');

        if (heroVideo && !videoIsManuallyPaused()) {
            playVideo(0.55);
        }

        panel.querySelector('[data-close-panel]').focus();
    }

    function showPreview(button) {
        if (!button || document.body.classList.contains('panel-open')) return;
        navPreview.textContent = button.dataset.preview || '';
        navPreview.classList.add('is-visible');
        document.body.classList.add('previewing');
        playVideo(0.4);
    }

    function clearPreview() {
        navPreview.classList.remove('is-visible');
        document.body.classList.remove('previewing');
        if (!document.body.classList.contains('panel-open')) playVideo(1);
    }

    function toggleVideo() {
        if (!heroVideo) return;
        const shouldResume = videoIsManuallyPaused() || heroVideo.paused;

        if (shouldResume) {
            document.body.classList.remove('is-still');
            updateMotionToggle(false);
            rebuildVideoPlayback();
        } else {
            document.body.classList.add('is-still');
            heroVideo.pause();
            updateMotionToggle(true);
        }
    }

    function showKeyboardHint() {
        keyboardHint.classList.add('show');
        if (hintTimer) window.clearTimeout(hintTimer);
        hintTimer = window.setTimeout(function () { keyboardHint.classList.remove('show'); }, 3600);
    }

    function setTimePeriod() {
        const hour = new Date().getHours();
        let period = 'night';
        if (hour >= 5 && hour < 11) period = 'morning';
        else if (hour >= 11 && hour < 17) period = 'afternoon';
        else if (hour >= 17 && hour < 21) period = 'dusk';
        const periodChanged = document.body.dataset.period !== period;
        document.body.dataset.period = period;
        periodLabel.textContent = period;
        if (heroVideo && periodChanged) {
            const startAt = { morning: 0, afternoon: 4, dusk: 9, night: 13 }[period];
            if (heroVideo.readyState >= 1) heroVideo.currentTime = startAt;
            else heroVideo.addEventListener('loadedmetadata', function () { heroVideo.currentTime = startAt; }, { once: true });
        }
    }

    navButtons.forEach(function (button) {
        button.addEventListener('click', function () { openPanel(button.dataset.panel, button); });
        button.addEventListener('mouseenter', function () { showPreview(button); });
        button.addEventListener('focus', function () { showPreview(button); });
        button.addEventListener('mouseleave', clearPreview);
        button.addEventListener('blur', clearPreview);
    });

    document.querySelectorAll('[data-close-panel]').forEach(function (button) {
        button.addEventListener('click', closePanels);
    });

    motionToggle.addEventListener('click', toggleVideo);

    document.addEventListener('keydown', function (event) {
        const tag = event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (event.key === 'Escape') {
            if (panels.some(function (panel) { return !panel.hidden; })) closePanels();
            return;
        }

        if (event.key >= '1' && event.key <= '4') {
            openPanel(navButtons[Number(event.key) - 1].dataset.panel, navButtons[Number(event.key) - 1]);
            showKeyboardHint();
            return;
        }

        if (event.code === 'Space' && tag !== 'BUTTON' && tag !== 'A') {
            event.preventDefault();
            toggleVideo();
            showKeyboardHint();
            return;
        }

    });

    setTimePeriod();
    window.setInterval(setTimePeriod, 60000);
    heroVideo.addEventListener('playing', function () { updateMotionToggle(false); });
    heroVideo.addEventListener('pause', function () {
        if (!document.hidden) updateMotionToggle(true);
    });
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) rebuildVideoPlayback();
        else restoreVideo();
    });
    window.addEventListener('focus', restoreVideo);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            wasPageHidden = true;
            return;
        }

        if (wasPageHidden) {
            wasPageHidden = false;
            rebuildVideoPlayback();
        } else {
            restoreVideo();
        }
    });
});
