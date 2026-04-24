document.addEventListener('DOMContentLoaded', function () {
    const noteItems = document.querySelectorAll('.note-item');
    const notes = document.querySelectorAll('.note');
    const noteGroups = document.querySelectorAll('.note-group');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const content = document.querySelector('.content');
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchEmpty = document.getElementById('search-empty');

    // Build a search index from each note item + the body of its matching article
    const searchIndex = Array.from(noteItems).map(function (item) {
        const titleEl = item.querySelector('.note-item-title');
        const metaEl = item.querySelector('.note-item-meta');
        const dateEl = metaEl ? metaEl.querySelector('.note-item-date') : null;

        const noteId = item.getAttribute('data-note');
        const article = document.getElementById('note-' + noteId);
        const bodyText = article ? article.textContent.replace(/\s+/g, ' ').trim() : '';

        // metaPreview = the meta text without the date prefix
        const metaPreview = (metaEl ? metaEl.textContent : '')
            .replace(dateEl ? dateEl.textContent : '', '')
            .trim();

        return {
            item: item,
            titleEl: titleEl,
            metaEl: metaEl,
            dateText: dateEl ? dateEl.textContent : '',
            originalTitle: titleEl ? titleEl.textContent : '',
            originalMetaPreview: metaPreview,
            haystack: ((titleEl ? titleEl.textContent : '') + ' ' +
                       metaPreview + ' ' +
                       bodyText).toLowerCase()
        };
    });

    // Note switching
    noteItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var noteId = item.getAttribute('data-note');

            // Update active state in sidebar
            noteItems.forEach(function (n) { n.classList.remove('active'); });
            item.classList.add('active');

            // Show the selected note
            notes.forEach(function (note) { note.classList.add('hidden'); });
            var target = document.getElementById('note-' + noteId);
            if (target) {
                target.classList.remove('hidden');
                // Re-trigger animation
                target.style.animation = 'none';
                target.offsetHeight; // force reflow
                target.style.animation = '';
            }

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
            }

            // Scroll content to top
            content.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // ===== Search =====
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function highlight(text, query) {
        if (!query) return escapeHtml(text);
        const lower = text.toLowerCase();
        let out = '';
        let i = 0;
        while (i < text.length) {
            const idx = lower.indexOf(query, i);
            if (idx === -1) {
                out += escapeHtml(text.slice(i));
                break;
            }
            out += escapeHtml(text.slice(i, idx));
            out += '<mark>' + escapeHtml(text.slice(idx, idx + query.length)) + '</mark>';
            i = idx + query.length;
        }
        return out;
    }

    function applySearch(rawQuery) {
        const query = rawQuery.trim().toLowerCase();
        let matchCount = 0;

        searchIndex.forEach(function (entry) {
            const matches = !query || entry.haystack.indexOf(query) !== -1;
            entry.item.classList.toggle('is-hidden', !matches);
            if (matches) matchCount++;

            // Restore or update title/meta with optional highlight
            if (entry.titleEl) {
                entry.titleEl.innerHTML = highlight(entry.originalTitle, query);
            }
            if (entry.metaEl) {
                entry.metaEl.innerHTML =
                    '<span class="note-item-date">' + escapeHtml(entry.dateText) + '</span>' +
                    highlight(entry.originalMetaPreview, query);
            }
        });

        // Hide group labels that have no visible items
        noteGroups.forEach(function (group) {
            const visible = group.querySelectorAll('.note-item:not(.is-hidden)').length;
            group.classList.toggle('is-hidden', visible === 0);
        });

        searchBar.classList.toggle('has-value', rawQuery.length > 0);
        searchEmpty.hidden = matchCount > 0 || !query;
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applySearch(searchInput.value);
        });

        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                applySearch('');
                searchInput.blur();
            } else if (e.key === 'Enter') {
                // Open the first visible match
                const firstMatch = document.querySelector('.note-item:not(.is-hidden)');
                if (firstMatch) firstMatch.click();
            }
        });

        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            applySearch('');
            searchInput.focus();
        });

        // Cmd/Ctrl + K focuses search
        document.addEventListener('keydown', function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

    // Mobile sidebar toggle
    content.addEventListener('click', function (e) {
        // Only trigger from the hamburger pseudo-element area
        if (window.innerWidth <= 768 && e.clientY < 60 && e.clientX < 60) {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        }
    });

    overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
});
