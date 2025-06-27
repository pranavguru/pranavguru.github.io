$(document).ready(function() {
    // Smooth scrolling for navigation links
    $(".navbar-nav a").on('click', function(event) {
        if (this.hash !== "") {
            event.preventDefault();
            var hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function(){
                window.location.hash = hash;
            });
        }
    });

    // Fetch and display projects
    fetch('projects/projects.json')
        .then(response => response.json())
        .then(data => {
            const projectsContainer = document.getElementById('projects-container');
            data.projects.forEach(project => {
                const projectCard = `
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${project.name}</h5>
                                <p class="card-text">${project.description}</p>
                                <a href="${project.url}" class="btn btn-primary">View Project</a>
                            </div>
                        </div>
                    </div>
                `;
                projectsContainer.innerHTML += projectCard;
            });
        });
});
