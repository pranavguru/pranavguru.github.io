document.addEventListener('DOMContentLoaded', function () {
    const noteItems = document.querySelectorAll('.note-item');
    const notes = document.querySelectorAll('.note');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const content = document.querySelector('.content');

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
