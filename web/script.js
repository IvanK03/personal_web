document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');

    if (header) {
        window.addEventListener(
            'scroll',
            () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            },
            { passive: true }
        );
    }

    const detailsElements = document.querySelectorAll('details');

    detailsElements.forEach(detail => {
        detail.addEventListener('toggle', () => {
            if (!detail.open) {
                return;
            }

            detailsElements.forEach(otherDetail => {
                if (otherDetail !== detail) {
                    otherDetail.removeAttribute('open');
                }
            });
        });
    });

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

    const reviewsTrack = document.querySelector('.reviews-track');

    const rebuildReviewLoop = () => {
        if (!reviewsTrack) {
            return;
        }

        const allItems = Array.from(reviewsTrack.querySelectorAll('.review-item'));
        allItems.forEach(item => {
            if (!item.dataset.reviewSource) {
                item.dataset.reviewSource = 'original';
            }
        });

        const existingClones = reviewsTrack.querySelectorAll('.review-item[data-review-source="clone"]');
        existingClones.forEach(clone => clone.remove());

        const originalReviews = Array.from(
            reviewsTrack.querySelectorAll('.review-item[data-review-source="original"]')
        );
        const fragment = document.createDocumentFragment();

        originalReviews.forEach(review => {
            const clone = review.cloneNode(true);
            clone.dataset.reviewSource = 'clone';
            clone.setAttribute('aria-hidden', 'true');
            fragment.appendChild(clone);
        });

        reviewsTrack.appendChild(fragment);
        reviewsTrack.dataset.cloned = 'true';
    };

    rebuildReviewLoop();

    if (reviewsTrack) {
        const isReviewCard = element =>
            Boolean(element && element.closest('.review-item'));

        reviewsTrack.addEventListener('pointerover', event => {
            if (isReviewCard(event.target)) {
                reviewsTrack.classList.add('is-paused');
            }
        });

        reviewsTrack.addEventListener('pointerout', event => {
            if (!isReviewCard(event.target)) {
                return;
            }

            if (!isReviewCard(event.relatedTarget)) {
                reviewsTrack.classList.remove('is-paused');
            }
        });
    }

    const reviewModal = document.getElementById('review-modal');
    const openReviewModalBtn = document.getElementById('open-review-modal');
    const closeReviewModalButtons = document.querySelectorAll('[data-close-review-modal]');
    const reviewForm = document.getElementById('review-form');
    const reviewFormStatus = document.getElementById('review-form-status');

    const setReviewFormStatus = message => {
        if (!reviewFormStatus) {
            return;
        }
        reviewFormStatus.textContent = message;
    };

    const openReviewModal = () => {
        if (!reviewModal) {
            return;
        }
        reviewModal.hidden = false;
        document.body.style.overflow = 'hidden';
        setReviewFormStatus('');
        const starsField = reviewForm?.querySelector('#review-stars');
        starsField?.focus();
    };

    const closeReviewModal = () => {
        if (!reviewModal) {
            return;
        }
        reviewModal.hidden = true;
        document.body.style.overflow = '';
    };

    if (openReviewModalBtn) {
        openReviewModalBtn.addEventListener('click', openReviewModal);
    }

    closeReviewModalButtons.forEach(button => {
        button.addEventListener('click', closeReviewModal);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && reviewModal && !reviewModal.hidden) {
            closeReviewModal();
        }
    });

    if (reviewForm && reviewsTrack) {
        reviewForm.addEventListener('submit', event => {
            event.preventDefault();

            const stars = Number(reviewForm.elements.stars.value);
            const name = reviewForm.elements.name.value.trim();
            const description = reviewForm.elements.description.value.trim();

            if (!stars || !name || !description) {
                setReviewFormStatus('Pros\u00edm, vypl\u0148te v\u0161etky polia formul\u00e1ra.');
                return;
            }

            const article = document.createElement('article');
            article.className = 'review-item';
            article.dataset.reviewSource = 'original';

            const starsEl = document.createElement('div');
            starsEl.className = 'stars';
            starsEl.textContent = `${'\u2605'.repeat(stars)}${'\u2606'.repeat(5 - stars)}`;

            const reviewText = document.createElement('p');
            reviewText.textContent = `"${description}"`;

            const author = document.createElement('h4');
            author.textContent = `\u2013 ${name}`;

            article.appendChild(starsEl);
            article.appendChild(reviewText);
            article.appendChild(author);

            reviewsTrack.appendChild(article);
            rebuildReviewLoop();
            reviewForm.reset();
            setReviewFormStatus('');
            closeReviewModal();
        });
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');

            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }

    const navLinks = document.querySelectorAll('nav ul li a');
    const menuSections = Array.from(navLinks)
        .map(link => {
            const href = link.getAttribute('href');
            return href ? document.querySelector(href) : null;
        })
        .filter(Boolean);

    const highlightMenu = () => {
        if (!menuSections.length) {
            return;
        }

        let current = '';

        menuSections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 150) {
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

    window.addEventListener('scroll', highlightMenu, { passive: true });
    highlightMenu();

    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (!contactForm) {
        return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitMode = (contactForm.dataset.submitMode || 'native').toLowerCase();
    const ajaxEndpoint = contactForm.getAttribute('data-ajax-endpoint');
    const replyToField = document.getElementById('contact-replyto');
    const nextField = document.getElementById('contact-next');
    const emailField = document.getElementById('email');

    const setFormStatus = (stateClass, message) => {
        if (!formStatus) {
            return;
        }

        formStatus.className = 'form-status';
        if (stateClass) {
            formStatus.classList.add(stateClass);
        }
        formStatus.textContent = message;
    };

    if (
        nextField &&
        !nextField.value &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('sent', '1');
        nextUrl.hash = 'kontakt';
        nextField.value = nextUrl.toString();
    }

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('sent') === '1') {
        setFormStatus('success', '\u010eakujeme, spr\u00e1va bola odoslan\u00e1. Ozveme sa v\u00e1m \u010do najsk\u00f4r.');

        if (window.history.replaceState) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('sent');
            window.history.replaceState({}, '', cleanUrl.toString());
        }
    }

    contactForm.addEventListener('submit', async event => {
        if (!contactForm.checkValidity()) {
            event.preventDefault();
            contactForm.reportValidity();
            return;
        }

        if (replyToField && emailField) {
            replyToField.value = emailField.value.trim();
        }

        if (submitMode !== 'ajax') {
            setFormStatus('loading', 'Odosielam spr\u00e1vu...');
            return;
        }

        event.preventDefault();

        if (!ajaxEndpoint) {
            setFormStatus('error', 'Chyba konfigur\u00e1cie formul\u00e1ra. Sk\u00faste n\u00e1s kontaktova\u0165 telefonicky.');
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
        }
        setFormStatus('loading', 'Odosielam spr\u00e1vu...');

        try {
            const formData = new FormData(contactForm);
            const response = await fetch(ajaxEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Po\u017eiadavka zlyhala.');
            }

            contactForm.reset();
            setFormStatus('success', '\u010eakujeme, ozveme sa v\u00e1m \u010do najsk\u00f4r.');
        } catch (error) {
            if (submitButton) {
                submitButton.disabled = false;
            }

            setFormStatus('loading', 'Sk\u00fa\u0161am odosla\u0165 formul\u00e1r n\u00e1hradn\u00fdm sp\u00f4sobom...');
            contactForm.submit();
            return;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
});


