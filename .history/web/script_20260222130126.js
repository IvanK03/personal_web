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
});