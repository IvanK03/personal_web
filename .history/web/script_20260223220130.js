document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Sticky Header (Prilepenie hlavičky) ---
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        // Ak sme odscrollovali viac ako 50px, pridáme triedu 'scrolled'
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. Interaktívne FAQ (Akordeón) ---
    const detailsElements = document.querySelectorAll('details');

    detailsElements.forEach(detail => {
        detail.addEventListener('click', (e) => {
            // Zistíme, či sa kliklo na <summary> (hlavičku otázky)
            if (e.target.tagName.toLowerCase() === 'summary') {
                // Ak sa práve otvára (ešte nie je 'open'), zatvoríme ostatné
                if (!detail.hasAttribute('open')) {
                    detailsElements.forEach(otherDetail => {
                        if (otherDetail !== detail) {
                            otherDetail.removeAttribute('open');
                        }
                    });
                }
            }
        });
    });

    // --- 3. Logo Slider (Partneri) ---
    const partnersContainer = document.querySelector('.partners-logos');
    const prevBtn = document.querySelector('.slider-btn.prev');
    const nextBtn = document.querySelector('.slider-btn.next');

    if (partnersContainer && prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
            partnersContainer.scrollBy({ left: 190, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            partnersContainer.scrollBy({ left: -190, behavior: 'smooth' });
        });
    }

    // --- 4. Dark Mode Toggle (Očistený skript) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // 1. Pri načítaní stránky skontrolujeme, či má klient uložený tmavý režim
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    }

    // 2. Čo sa stane pri kliknutí na tlačidlo
    themeToggleBtn.addEventListener('click', () => {
        // Prepne triedu dark-mode (ak tam je, zmaže ju; ak nie je, pridá ju)
        body.classList.toggle('dark-mode');
        
        // Uloží voľbu do pamäte prehliadača
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // --- 5. Scroll Spy (Aktívne menu pri scrollovaní) ---
    const navLinks = document.querySelectorAll('nav ul li a');
    
    // Získame sekcie zodpovedajúce odkazom v menu
    const menuSections = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        return document.querySelector(href);
    }).filter(section => section !== null);

    const highlightMenu = () => {
        let current = '';
        
        menuSections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Offset 150px zabezpečí, že sa položka aktivuje skôr, než sekcia dosiahne úplný vrch
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', highlightMenu);
    highlightMenu(); // Spustíme hneď pri načítaní
});