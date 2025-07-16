document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme) {
        if (savedTheme === 'light') {
            html.classList.add('light-mode');
            themeIcon.className = 'fas fa-moon';
        } else {
            html.classList.remove('light-mode');
            themeIcon.className = 'fas fa-sun';
        }
    } else if (!prefersDark) {
        html.classList.add('light-mode');
        themeIcon.className = 'fas fa-moon';
    }
    
    // Toggle theme function
    function toggleTheme() {
        const isLightMode = html.classList.contains('light-mode');
        
        if (isLightMode) {
            html.classList.remove('light-mode');
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.add('light-mode');
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    }
    
    // Add click event listener
    themeToggle.addEventListener('click', toggleTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                html.classList.remove('light-mode');
                themeIcon.className = 'fas fa-sun';
            } else {
                html.classList.add('light-mode');
                themeIcon.className = 'fas fa-moon';
            }
        }
    });
});
