document.addEventListener('DOMContentLoaded', function () {
    const root = document.documentElement;
    const desktop = document.getElementById('desktop');
    const noteItems = Array.from(document.querySelectorAll('.note-item'));
    const notes = Array.from(document.querySelectorAll('.note'));
    const noteGroups = Array.from(document.querySelectorAll('.note-group'));
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const content = document.querySelector('.content');
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchEmpty = document.getElementById('search-empty');
    const spotlight = document.getElementById('spotlight');
    const spotlightInput = document.getElementById('spotlight-input');
    const spotlightResults = document.getElementById('spotlight-results');
    const toast = document.getElementById('toast');
    const desktopPopover = document.getElementById('desktop-popover');
    const menuClock = document.getElementById('menu-clock');
    const themeNames = ['sonoma', 'daybreak', 'midnight'];
    const THEME_KEY = 'pg-theme-v2';

    let frontZ = 40;
    let toastTimer = null;
    let selectedSpotlightIndex = 0;

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 2600);
    }

    function bounceDockIcon(button) {
        if (!button) return;
        button.classList.remove('is-bouncing');
        button.offsetHeight;
        button.classList.add('is-bouncing');
        setTimeout(function () {
            button.classList.remove('is-bouncing');
        }, 520);
    }

    function closeDesktopPopover() {
        if (!desktopPopover) return;
        desktopPopover.hidden = true;
        desktopPopover.innerHTML = '';
        desktopPopover.className = 'desktop-popover';
    }

    function positionPopover(anchor, placement) {
        if (!desktopPopover || !anchor) return;
        const rect = anchor.getBoundingClientRect();
        const popRect = desktopPopover.getBoundingClientRect();
        const gap = placement === 'below' ? 8 : 12;
        let left = rect.left + rect.width / 2 - popRect.width / 2;
        let top = placement === 'below'
            ? rect.bottom + gap
            : rect.top - popRect.height - gap;

        left = Math.max(10, Math.min(left, window.innerWidth - popRect.width - 10));
        top = Math.max(40, Math.min(top, window.innerHeight - popRect.height - 12));
        desktopPopover.style.left = left + 'px';
        desktopPopover.style.top = top + 'px';
    }

    function showDesktopPopover(anchor, html, placement) {
        if (!desktopPopover) return;
        desktopPopover.innerHTML = html;
        desktopPopover.hidden = false;
        desktopPopover.className = 'desktop-popover ' + (placement === 'below' ? 'is-menu' : 'is-dock');
        requestAnimationFrame(function () {
            positionPopover(anchor, placement || 'above');
        });
    }

    function menuHtml(kind) {
        const menus = {
            apple: '<strong>PranavOS</strong><button data-popover-note="about">About Pranav</button><button data-popover-action="spotlight">Spotlight Search</button><hr><button data-popover-action="noop">System Settings...</button>',
            file: '<button data-popover-note="about">Open About Me</button><button data-popover-note="links">Open Quick Links</button><button data-popover-note="publications">Open Publications</button><hr><button data-popover-action="mailto">New Message to Pranav</button>',
            edit: '<button data-popover-action="focus-search">Find in Notes</button><button data-popover-action="spotlight">Search All Notes</button>',
            view: '<button data-popover-action="zoom-notes">Zoom Notes Window</button><button data-popover-theme="daybreak">Light Wallpaper Tint</button><button data-popover-theme="sonoma">Natural Wallpaper Tint</button><button data-popover-theme="midnight">Dark Wallpaper Tint</button>',
            window: '<button data-popover-action="open-notes">Bring Notes to Front</button><button data-popover-action="minimize-notes">Minimize Notes</button>',
            help: '<strong>Notes Help</strong><button data-popover-note="about">About Me</button><button data-popover-note="principles">Principles</button>',
            battery: '<strong>Battery</strong><p>100% · Power Adapter</p>',
            wifi: '<strong>Wi-Fi</strong><p>Connected</p><p class="popover-muted">Signal: full bars.</p>',
            control: '<strong>Control Center</strong><button data-popover-theme="daybreak">Light</button><button data-popover-theme="sonoma">Natural</button><button data-popover-theme="midnight">Dark</button><hr><button data-popover-action="spotlight">Spotlight</button>'
        };
        return menus[kind] || '';
    }

    function dockHtml(kind) {
        const docks = {
            finder: '<strong>Finder</strong><button data-popover-note="about">About Me</button><button data-popover-note="links">Quick Links</button><button data-popover-note="publications">Publications</button>',
            messages: '<strong>Messages</strong><a href="mailto:pranavguruprasad0@gmail.com?subject=hi%20pranav&body=%0A%0A%E2%80%94%20sent%20from%20pranav%27s%20website">New Message</a>',
            photos: '<strong>Photos</strong><p>OS X El Capitan</p>',
            music: '<strong>Music</strong><button data-popover-note="music">On Repeat</button>',
            calendar: '<strong>Calendar</strong><p>Thursday, June 18, 2026</p><button data-popover-note="principles">Open Today Notes</button>',
            terminal: '<strong>Terminal</strong><code>open notes://about-me</code><button data-popover-note="about">Run</button>',
            settings: '<strong>System Settings</strong><p>Wallpaper tint</p><button data-popover-theme="daybreak">Light</button><button data-popover-theme="sonoma">Natural</button><button data-popover-theme="midnight">Dark</button>',
            trash: '<strong>Trash</strong><p>Empty</p>'
        };
        return docks[kind] || '';
    }

    function cleanTitle(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    noteItems.forEach(function (item) {
        const noteId = item.getAttribute('data-note');
        const article = document.getElementById('note-' + noteId);
        if (!article) return;

        const lead = article.querySelector('.note-lead');
        const firstLi = article.querySelector('ul li');
        const source = cleanTitle((lead && lead.textContent) || (firstLi && firstLi.textContent) || '');
        const meta = item.querySelector('.note-item-meta');
        const dateEl = meta ? meta.querySelector('.note-item-date') : null;
        if (!source || !meta || !dateEl) return;

        const preview = source.length > 48 ? source.slice(0, 48).trim() + '...' : source;
        meta.innerHTML = '<span class="note-item-date">' + escapeHtml(dateEl.textContent) + '</span> ' + escapeHtml(preview);
    });

    const searchIndex = noteItems.map(function (item) {
        const noteId = item.getAttribute('data-note');
        const article = document.getElementById('note-' + noteId);
        const titleEl = item.querySelector('.note-item-title');
        const metaEl = item.querySelector('.note-item-meta');
        const dateEl = metaEl ? metaEl.querySelector('.note-item-date') : null;
        const title = cleanTitle(titleEl ? titleEl.textContent : '');
        const meta = cleanTitle((metaEl ? metaEl.textContent : '').replace(dateEl ? dateEl.textContent : '', ''));
        const body = cleanTitle(article ? article.textContent : '');
        const emoji = title.slice(0, 2).trim();

        return {
            id: noteId,
            item: item,
            titleEl: titleEl,
            metaEl: metaEl,
            dateText: dateEl ? dateEl.textContent : '',
            title: title,
            meta: meta,
            emoji: emoji || '📝',
            haystack: (title + ' ' + meta + ' ' + body).toLowerCase()
        };
    });

    function highlight(text, query) {
        if (!query) return escapeHtml(text);
        const lower = text.toLowerCase();
        let output = '';
        let index = 0;
        while (index < text.length) {
            const match = lower.indexOf(query, index);
            if (match === -1) {
                output += escapeHtml(text.slice(index));
                break;
            }
            output += escapeHtml(text.slice(index, match));
            output += '<mark>' + escapeHtml(text.slice(match, match + query.length)) + '</mark>';
            index = match + query.length;
        }
        return output;
    }

    function applySearch(rawQuery) {
        const query = rawQuery.trim().toLowerCase();
        let matchCount = 0;

        searchIndex.forEach(function (entry) {
            const matches = !query || entry.haystack.indexOf(query) !== -1;
            entry.item.classList.toggle('is-hidden', !matches);
            if (matches) matchCount++;

            if (entry.titleEl) entry.titleEl.innerHTML = highlight(entry.title, query);
            if (entry.metaEl) {
                entry.metaEl.innerHTML =
                    '<span class="note-item-date">' + escapeHtml(entry.dateText) + '</span> ' +
                    highlight(entry.meta, query);
            }
        });

        noteGroups.forEach(function (group) {
            const visible = group.querySelectorAll('.note-item:not(.is-hidden)').length;
            group.classList.toggle('is-hidden', visible === 0);
        });

        if (searchBar) searchBar.classList.toggle('has-value', rawQuery.length > 0);
        if (searchEmpty) searchEmpty.hidden = matchCount > 0 || !query;
    }

    function bringToFront(win) {
        if (!win) return;
        frontZ += 1;
        win.style.zIndex = String(frontZ);
        document.querySelectorAll('.app-window').forEach(function (other) {
            other.classList.toggle('is-front', other === win);
        });
    }

    function syncDock() {
        document.querySelectorAll('.dock-icon[data-open-window]').forEach(function (icon) {
            const id = icon.getAttribute('data-open-window');
            const win = document.querySelector('[data-window="' + id + '"]');
            const active = win && !win.hidden && !win.classList.contains('is-minimizing');
            icon.classList.toggle('is-active', Boolean(active));
            icon.classList.toggle('is-minimized', Boolean(win && win.hidden));
        });
    }

    function openWindow(id) {
        const win = document.querySelector('[data-window="' + id + '"]');
        if (!win) return;
        window.scrollTo(0, 0);
        win.hidden = false;
        win.classList.remove('is-minimizing');
        bringToFront(win);
        syncDock();
    }

    function minimizeWindow(win) {
        if (!win) return;
        win.classList.add('is-minimizing');
        setTimeout(function () {
            win.hidden = true;
            win.classList.remove('is-minimizing');
            syncDock();
        }, 230);
    }

    function closeWindow(win) {
        if (!win) return;
        const id = win.getAttribute('data-window');
        win.hidden = true;
        win.classList.remove('is-zoomed');
        syncDock();
        if (id === 'notes') showToast('Notes closed. Reopen it from the dock.');
    }

    function openNote(noteId) {
        openWindow('notes');

        noteItems.forEach(function (item) {
            item.classList.toggle('active', item.getAttribute('data-note') === noteId);
        });

        notes.forEach(function (note) {
            const active = note.id === 'note-' + noteId;
            note.classList.toggle('hidden', !active);
            if (active) {
                note.style.animation = 'none';
                note.offsetHeight;
                note.style.animation = '';
            }
        });

        if (content) content.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.innerWidth <= 700) {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        }
    }

    noteItems.forEach(function (item) {
        item.addEventListener('click', function () {
            openNote(item.getAttribute('data-note'));
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applySearch(searchInput.value);
        });

        searchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                searchInput.value = '';
                applySearch('');
                searchInput.blur();
            }
            if (event.key === 'Enter') {
                const firstMatch = document.querySelector('.note-item:not(.is-hidden)');
                if (firstMatch) firstMatch.click();
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applySearch('');
            searchInput.focus();
        });
    }

    document.querySelectorAll('[data-open-note]').forEach(function (button) {
        button.addEventListener('click', function () {
            openNote(button.getAttribute('data-open-note'));
        });
    });

    document.querySelectorAll('[data-open-window]').forEach(function (button) {
        button.addEventListener('click', function () {
            closeDesktopPopover();
            bounceDockIcon(button.closest('.dock-icon') || button);
            openWindow(button.getAttribute('data-open-window'));
        });
    });

    document.querySelectorAll('[data-menu]').forEach(function (button) {
        button.addEventListener('click', function () {
            const html = menuHtml(button.getAttribute('data-menu'));
            if (html) showDesktopPopover(button, html, 'below');
        });
    });

    document.querySelectorAll('[data-dock-action]').forEach(function (button) {
        button.addEventListener('click', function () {
            bounceDockIcon(button);
            showDesktopPopover(button, dockHtml(button.getAttribute('data-dock-action')), 'above');
        });
    });

    if (desktopPopover) {
        desktopPopover.addEventListener('click', function (event) {
            const noteButton = event.target.closest('[data-popover-note]');
            const themeButton = event.target.closest('[data-popover-theme]');
            const actionButton = event.target.closest('[data-popover-action]');

            if (noteButton) {
                openNote(noteButton.getAttribute('data-popover-note'));
                closeDesktopPopover();
                return;
            }

            if (themeButton) {
                applyTheme(themeButton.getAttribute('data-popover-theme'));
                return;
            }

            if (!actionButton) return;
            const action = actionButton.getAttribute('data-popover-action');
            if (action === 'spotlight') {
                closeDesktopPopover();
                openSpotlight();
            } else if (action === 'focus-search') {
                closeDesktopPopover();
                openWindow('notes');
                if (searchInput) searchInput.focus();
            } else if (action === 'zoom-notes') {
                const notesWindow = document.getElementById('notes-window');
                if (notesWindow) notesWindow.classList.toggle('is-zoomed');
                closeDesktopPopover();
            } else if (action === 'open-notes') {
                closeDesktopPopover();
                openWindow('notes');
            } else if (action === 'minimize-notes') {
                const notesWindow = document.getElementById('notes-window');
                closeDesktopPopover();
                if (notesWindow) minimizeWindow(notesWindow);
            } else if (action === 'mailto') {
                window.location.href = 'mailto:pranavguruprasad0@gmail.com?subject=hi%20pranav&body=%0A%0A%E2%80%94%20sent%20from%20pranav%27s%20website';
            }
        });
    }

    document.querySelectorAll('[data-window-action]').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            const win = button.closest('.app-window');
            const action = button.getAttribute('data-window-action');
            if (action === 'close') closeWindow(win);
            if (action === 'minimize') minimizeWindow(win);
            if (action === 'zoom') {
                win.classList.toggle('is-zoomed');
                bringToFront(win);
            }
        });
    });

    document.querySelectorAll('.app-window').forEach(function (win) {
        win.addEventListener('pointerdown', function () {
            bringToFront(win);
        });
    });

    function getSpotlightMatches(query) {
        const normalized = query.trim().toLowerCase();
        const matches = searchIndex.filter(function (entry) {
            return !normalized || entry.haystack.indexOf(normalized) !== -1;
        });
        return matches.slice(0, 6);
    }

    function renderSpotlight() {
        const matches = getSpotlightMatches(spotlightInput.value);
        selectedSpotlightIndex = Math.min(selectedSpotlightIndex, Math.max(matches.length - 1, 0));

        if (!matches.length) {
            spotlightResults.innerHTML = '<div class="spotlight-result" aria-disabled="true"><span class="spotlight-result-icon">∅</span><span><span class="spotlight-result-title">No notes found</span><span class="spotlight-result-meta">Try about, links, reading, publications, music, or principles.</span></span></div>';
            return;
        }

        spotlightResults.innerHTML = matches.map(function (entry, index) {
            return '<button class="spotlight-result' + (index === selectedSpotlightIndex ? ' is-selected' : '') + '" type="button" data-spotlight-note="' + escapeHtml(entry.id) + '">' +
                '<span class="spotlight-result-icon">' + escapeHtml(entry.emoji) + '</span>' +
                '<span><span class="spotlight-result-title">' + escapeHtml(entry.title) + '</span>' +
                '<span class="spotlight-result-meta">' + escapeHtml(entry.meta || 'Open in Notes') + '</span></span>' +
                '</button>';
        }).join('');
    }

    function openSpotlight() {
        spotlight.hidden = false;
        selectedSpotlightIndex = 0;
        spotlightInput.value = '';
        renderSpotlight();
        requestAnimationFrame(function () {
            spotlightInput.focus();
        });
    }

    function closeSpotlight() {
        spotlight.hidden = true;
    }

    function chooseSpotlightResult() {
        const matches = getSpotlightMatches(spotlightInput.value);
        const chosen = matches[selectedSpotlightIndex];
        if (!chosen) return;
        closeSpotlight();
        openNote(chosen.id);
    }

    document.querySelectorAll('[data-open-spotlight]').forEach(function (button) {
        button.addEventListener('click', openSpotlight);
    });

    if (spotlightInput) {
        spotlightInput.addEventListener('input', function () {
            selectedSpotlightIndex = 0;
            renderSpotlight();
        });

        spotlightInput.addEventListener('keydown', function (event) {
            const matches = getSpotlightMatches(spotlightInput.value);
            if (event.key === 'Escape') closeSpotlight();
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectedSpotlightIndex = Math.min(selectedSpotlightIndex + 1, Math.max(matches.length - 1, 0));
                renderSpotlight();
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectedSpotlightIndex = Math.max(selectedSpotlightIndex - 1, 0);
                renderSpotlight();
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                chooseSpotlightResult();
            }
        });
    }

    if (spotlightResults) {
        spotlightResults.addEventListener('click', function (event) {
            const result = event.target.closest('[data-spotlight-note]');
            if (!result) return;
            closeSpotlight();
            openNote(result.getAttribute('data-spotlight-note'));
        });
    }

    if (spotlight) {
        spotlight.addEventListener('click', function (event) {
            if (event.target === spotlight) closeSpotlight();
        });
    }

    document.addEventListener('keydown', function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            closeDesktopPopover();
            openSpotlight();
        }
        if (event.key === 'Escape' && !spotlight.hidden) closeSpotlight();
        if (event.key === 'Escape') closeDesktopPopover();
    });

    document.addEventListener('pointerdown', function (event) {
        if (!desktopPopover || desktopPopover.hidden) return;
        if (event.target.closest('#desktop-popover, [data-menu], .dock-icon')) return;
        closeDesktopPopover();
    });

    function makeDraggable(win) {
        const handle = win.querySelector('[data-drag-handle]');
        if (!handle) return;

        handle.addEventListener('pointerdown', function (event) {
            if (event.target.closest('button, a')) return;
            if (win.classList.contains('is-zoomed')) return;

            bringToFront(win);
            const rect = win.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            handle.setPointerCapture(event.pointerId);

            function move(pointerEvent) {
                const maxLeft = window.innerWidth - 90;
                const maxTop = window.innerHeight - 120;
                const left = Math.min(Math.max(pointerEvent.clientX - offsetX, 8), maxLeft);
                const top = Math.min(Math.max(pointerEvent.clientY - offsetY, 38), maxTop);
                win.style.left = left + 'px';
                win.style.top = top + 'px';
            }

            function stop(pointerEvent) {
                handle.releasePointerCapture(pointerEvent.pointerId);
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', stop);
                handle.removeEventListener('pointercancel', stop);
            }

            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', stop);
            handle.addEventListener('pointercancel', stop);
        });
    }

    document.querySelectorAll('.app-window').forEach(makeDraggable);

    const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    function applyTheme(theme) {
        const next = themeNames.indexOf(theme) === -1 ? 'sonoma' : theme;
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* ignore storage failures */ }
    }

    function cycleTheme() {
        const current = root.getAttribute('data-theme') || 'sonoma';
        const next = themeNames[(themeNames.indexOf(current) + 1) % themeNames.length] || 'sonoma';
        applyTheme(next);
        showToast('Wallpaper switched to ' + next + '.');
    }

    document.querySelectorAll('[data-toggle-theme]').forEach(function (button) {
        button.addEventListener('click', cycleTheme);
    });

    try {
        applyTheme(localStorage.getItem(THEME_KEY) || root.getAttribute('data-theme') || 'sonoma');
    } catch (error) {
        applyTheme('sonoma');
    }

    function updateClock() {
        if (!menuClock) return;
        const now = new Date();
        const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        menuClock.textContent = date + ' ' + time;
        menuClock.dateTime = now.toISOString();

        const calendarWeekday = document.querySelector('[data-calendar-weekday]');
        const calendarDay = document.querySelector('[data-calendar-day]');
        if (calendarWeekday && calendarDay) {
            const weekday = now.toLocaleDateString([], { weekday: 'short' });
            const day = now.toLocaleDateString([], { day: 'numeric' });
            calendarWeekday.textContent = weekday;
            calendarDay.textContent = day;
        }
    }

    updateClock();
    setInterval(updateClock, 15000);

    desktop.addEventListener('dblclick', function (event) {
        if (event.target !== desktop && !event.target.classList.contains('wallpaper-grain')) return;
        openSpotlight();
    });

    openWindow('notes');
    syncDock();
});
