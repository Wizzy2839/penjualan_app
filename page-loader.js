document.addEventListener("DOMContentLoaded", () => {
    const loadComponent = (id, url) => {
        const element = document.getElementById(id);
        if (element) {
            fetch(url)
                .then(response => response.text())
                .then(data => {
                    element.innerHTML = data;
                })
                .catch(error => console.error(`Gagal memuat ${url}:`, error));
        }
    };

    loadComponent("header-placeholder", "header.html");
    loadComponent("footer-placeholder", "footer.html");
});