document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const setHeaderOffset = () => {
        const headerHeight = header
            ? Math.ceil(header.getBoundingClientRect().height)
            : 120;

        document.documentElement.style.setProperty(
            '--header-offset',
            `${headerHeight + 12}px`
        );
    };

    setHeaderOffset();
    window.addEventListener('resize', setHeaderOffset);
    window.addEventListener('orientationchange', setHeaderOffset);

    if (header) {
        window.addEventListener(
            'scroll',
            () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
                setHeaderOffset();
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
        const getPartnerScrollStep = () =>
            Math.max(160, Math.round(partnersContainer.clientWidth * 0.72));

        nextBtn.addEventListener('click', () => {
            partnersContainer.scrollBy({
                left: getPartnerScrollStep(),
                behavior: 'smooth',
            });
        });

        prevBtn.addEventListener('click', () => {
            partnersContainer.scrollBy({
                left: -getPartnerScrollStep(),
                behavior: 'smooth',
            });
        });
    }

    const reviewsTrack = document.querySelector('.reviews-track');
    const reviewsApiUrl = '/api/reviews';
    const loadedRemoteReviewIds = new Set();

    const sanitizeReview = review => {
        if (!review || typeof review !== 'object') {
            return null;
        }

        const stars = Number(review.stars);
        const name = String(review.name || '').trim();
        const description = String(review.description || '').trim();
        const id = review.id ? String(review.id).trim() : '';

        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            return null;
        }

        if (!name || !description) {
            return null;
        }

        return { id, stars, name, description };
    };

    const createReviewCard = review => {
        const article = document.createElement('article');
        article.className = 'review-item';
        article.dataset.reviewSource = 'original';
        if (review.id) {
            article.dataset.reviewId = review.id;
        }

        const starsEl = document.createElement('div');
        starsEl.className = 'stars';
        starsEl.textContent = `${'\u2605'.repeat(review.stars)}${'\u2606'.repeat(5 - review.stars)}`;

        const reviewText = document.createElement('p');
        reviewText.textContent = `"${review.description}"`;

        const author = document.createElement('h4');
        author.textContent = `\u2013 ${review.name}`;

        article.appendChild(starsEl);
        article.appendChild(reviewText);
        article.appendChild(author);

        return article;
    };

    const addApprovedReviewToTrack = review => {
        if (!reviewsTrack) {
            return false;
        }

        const sanitizedReview = sanitizeReview(review);
        if (!sanitizedReview) {
            return false;
        }

        if (sanitizedReview.id && loadedRemoteReviewIds.has(sanitizedReview.id)) {
            return false;
        }

        if (
            sanitizedReview.id &&
            reviewsTrack.querySelector(`.review-item[data-review-id="${sanitizedReview.id}"]`)
        ) {
            loadedRemoteReviewIds.add(sanitizedReview.id);
            return false;
        }

        const article = createReviewCard(sanitizedReview);
        reviewsTrack.appendChild(article);
        if (sanitizedReview.id) {
            loadedRemoteReviewIds.add(sanitizedReview.id);
        }
        return true;
    };

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

    const loadApprovedReviews = async () => {
        if (!reviewsTrack) {
            return;
        }

        try {
            const response = await fetch(reviewsApiUrl, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            if (!payload || !Array.isArray(payload.reviews)) {
                return;
            }

            let hasNewItems = false;
            payload.reviews.forEach(review => {
                if (addApprovedReviewToTrack(review)) {
                    hasNewItems = true;
                }
            });

            if (hasNewItems) {
                rebuildReviewLoop();
            }
        } catch (error) {
            // Keď API nie je dostupné, stránka stále funguje so statickými recenziami.
        }
    };

    rebuildReviewLoop();
    loadApprovedReviews();

    if (reviewsTrack) {
        const isReviewCard = element =>
            Boolean(element && element.closest('.review-item'));
        let touchPauseTimeoutId = null;

        const resumeReviewsAfterTouch = () => {
            if (touchPauseTimeoutId) {
                window.clearTimeout(touchPauseTimeoutId);
            }

            touchPauseTimeoutId = window.setTimeout(() => {
                reviewsTrack.classList.remove('is-paused');
            }, 350);
        };

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

        reviewsTrack.addEventListener(
            'touchstart',
            () => {
                if (touchPauseTimeoutId) {
                    window.clearTimeout(touchPauseTimeoutId);
                }
                reviewsTrack.classList.add('is-paused');
            },
            { passive: true }
        );

        reviewsTrack.addEventListener('touchend', resumeReviewsAfterTouch, {
            passive: true,
        });
        reviewsTrack.addEventListener('touchcancel', resumeReviewsAfterTouch, {
            passive: true,
        });
    }

    const reviewModal = document.getElementById('review-modal');
    const openReviewModalBtn = document.getElementById('open-review-modal');
    const closeReviewModalButtons = document.querySelectorAll('[data-close-review-modal]');
    const reviewForm = document.getElementById('review-form');
    const reviewFormStatus = document.getElementById('review-form-status');
    const reviewSubmitButton = reviewForm?.querySelector('button[type="submit"]');

    const setReviewFormStatus = (message, stateClass = '') => {
        if (!reviewFormStatus) {
            return;
        }
        reviewFormStatus.className = 'review-form-status';
        if (stateClass) {
            reviewFormStatus.classList.add(stateClass);
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

    if (reviewForm) {
        reviewForm.addEventListener('submit', async event => {
            event.preventDefault();

            const stars = Number(reviewForm.elements.stars.value);
            const name = reviewForm.elements.name.value.trim();
            const description = reviewForm.elements.description.value.trim();

            if (!stars || !name || !description) {
                setReviewFormStatus('Pros\u00edm, vypl\u0148te v\u0161etky polia formul\u00e1ra.', 'error');
                return;
            }

            if (reviewSubmitButton) {
                reviewSubmitButton.disabled = true;
            }
            setReviewFormStatus('Odosielam recenziu na schválenie...', 'loading');

            try {
                const response = await fetch(reviewsApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        stars,
                        name,
                        description,
                    }),
                });

                const payload = await response.json().catch(() => null);

                if (!response.ok || !payload || payload.ok !== true) {
                    const errorMessage =
                        payload && payload.error
                            ? String(payload.error)
                            : 'Recenziu sa nepodarilo odoslať.';
                    throw new Error(errorMessage);
                }

                reviewForm.reset();
                setReviewFormStatus(
                    'Ďakujeme. Recenzia bola odoslaná na schválenie a po kontrole ju zverejníme.',
                    'success'
                );

                window.setTimeout(() => {
                    closeReviewModal();
                    setReviewFormStatus('');
                }, 1600);
            } catch (error) {
                setReviewFormStatus(
                    error && error.message
                        ? error.message
                        : 'Recenziu sa teraz nepodarilo odoslať. Skúste to, prosím, znova o chvíľu.',
                    'error'
                );
            } finally {
                if (reviewSubmitButton) {
                    reviewSubmitButton.disabled = false;
                }
            }
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

        const cssHeaderOffset = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--header-offset')
        );
        const sectionOffset = Number.isFinite(cssHeaderOffset)
            ? cssHeaderOffset
            : 120;
        let current = '';

        menuSections.forEach(section => {
            if (window.scrollY >= section.offsetTop - sectionOffset - 16) {
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
    window.addEventListener('resize', highlightMenu);
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
    const honeyField = contactForm.querySelector('input[name="_honey"]');
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    const serviceField = document.getElementById('service');
    const contactPreferenceField = document.getElementById('contact-preference');
    const messageField = document.getElementById('message');
    const gdprConsentField = document.getElementById('gdpr-consent');

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

    const setNextFieldValue = () => {
        if (
            !nextField ||
            (window.location.protocol !== 'http:' && window.location.protocol !== 'https:')
        ) {
            return;
        }

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('sent', '1');
        nextUrl.hash = 'kontakt';
        nextField.value = nextUrl.toString();
    };

    const validateContactFields = () => {
        const validators = [
            {
                field: nameField,
                getMessage: () => {
                    if (!nameField.value.trim()) {
                        return 'Prosím, zadajte meno a priezvisko.';
                    }
                    return '';
                },
            },
            {
                field: emailField,
                getMessage: () => {
                    const value = emailField.value.trim();
                    if (!value) {
                        return 'Prosím, zadajte e-mail.';
                    }
                    if (!emailField.checkValidity()) {
                        return 'Prosím, zadajte platný e-mail v tvare meno@email.sk.';
                    }
                    return '';
                },
            },
            {
                field: phoneField,
                getMessage: () => {
                    return '';
                },
            },
            {
                field: serviceField,
                getMessage: () => (serviceField.value ? '' : 'Prosím, vyberte službu.'),
            },
            {
                field: contactPreferenceField,
                getMessage: () =>
                    contactPreferenceField.value ? '' : 'Prosím, vyberte preferovaný spôsob kontaktu.',
            },
            {
                field: messageField,
                getMessage: () => {
                    if (!messageField.value.trim()) {
                        return 'Prosím, napíšte správu.';
                    }
                    return '';
                },
            },
            {
                field: gdprConsentField,
                getMessage: () =>
                    gdprConsentField.checked
                        ? ''
                        : 'Bez súhlasu so spracovaním údajov nevieme váš dopyt odoslať.',
            },
        ];

        let firstInvalidField = null;

        validators.forEach(({ field, getMessage }) => {
            if (!field) {
                return;
            }

            const validationMessage = getMessage();
            field.setCustomValidity(validationMessage);

            if (!firstInvalidField && validationMessage) {
                firstInvalidField = field;
            }
        });

        return firstInvalidField;
    };

    const validationFields = [
        nameField,
        emailField,
        phoneField,
        serviceField,
        contactPreferenceField,
        messageField,
        gdprConsentField,
    ].filter(Boolean);

    validationFields.forEach(field => {
        const eventName = field.type === 'checkbox' ? 'change' : 'input';

        field.addEventListener(eventName, () => {
            field.setCustomValidity('');
            if (formStatus && formStatus.classList.contains('error')) {
                setFormStatus('', '');
            }
        });
    });

    if (
        nextField &&
        !nextField.value &&
        (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ) {
        setNextFieldValue();
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
        setFormStatus('', '');

        if (honeyField && honeyField.value.trim()) {
            event.preventDefault();
            return;
        }

        const firstInvalidField = validateContactFields();

        if (!contactForm.checkValidity()) {
            event.preventDefault();
            setFormStatus('error', 'Prosím, opravte zvýraznené polia formulára.');

            if (firstInvalidField) {
                firstInvalidField.reportValidity();
            } else {
                contactForm.reportValidity();
            }
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

            let responsePayload = null;
            const responseContentType = response.headers.get('content-type') || '';
            if (responseContentType.includes('application/json')) {
                responsePayload = await response.json();
            }

            if (
                responsePayload &&
                responsePayload.success !== true &&
                responsePayload.success !== 'true'
            ) {
                throw new Error('Formulár nebol prijatý.');
            }

            contactForm.reset();
            setNextFieldValue();
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


