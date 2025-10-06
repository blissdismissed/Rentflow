// Component loader utility
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            // Execute any scripts in the loaded component
            const scripts = element.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });
        }
    } catch (error) {
        console.error(`Error loading component from ${componentPath}:`, error);
    }
}

// Load header and footer
async function loadHeaderFooter(headerType = 'public') {
    const headerPath = headerType === 'dashboard'
        ? '/src/components/dashboard-header.html'
        : '/src/components/public-header.html';

    await loadComponent('header-placeholder', headerPath);
    await loadComponent('footer-placeholder', '/src/components/footer.html');
}
