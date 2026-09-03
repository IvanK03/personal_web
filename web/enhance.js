/* =====================================================================
   FinKorb — interaktívne prvky (2026)
   Načítava sa až po script.js. Všetko je nezávislé od pôvodného kódu,
   takže sa tento súbor dá odstrániť bez rozbitia stránky.
   ===================================================================== */
(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --------------------------------------------------------------
       1. Ukazovateľ posunu stránky
       -------------------------------------------------------------- */
    const initScrollProgress = () => {
        const bar = document.querySelector('.scroll-progress');
        if (!bar) return;

        let ticking = false;

        const update = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
            bar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
            ticking = false;
        };

        window.addEventListener(
            'scroll',
            () => {
                if (!ticking) {
                    ticking = true;
                    window.requestAnimationFrame(update);
                }
            },
            { passive: true }
        );

        update();
    };

    /* --------------------------------------------------------------
       2. Odhaľovanie prvkov pri scrollovaní
       -------------------------------------------------------------- */
    const initReveal = () => {
        const items = document.querySelectorAll('[data-reveal]');
        if (!items.length) return;

        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            items.forEach(item => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );

        items.forEach(item => observer.observe(item));
    };

    /* --------------------------------------------------------------
       3. Postupné oneskorenie pre súrodencov v mriežke
       -------------------------------------------------------------- */
    const initStagger = () => {
        document.querySelectorAll('[data-reveal-group]').forEach(group => {
            const step = Number(group.dataset.revealGroup) || 110;
            Array.from(group.children).forEach((child, index) => {
                if (child.hasAttribute('data-reveal')) {
                    child.style.setProperty('--reveal-delay', `${index * step}ms`);
                }
            });
        });
    };

    /* --------------------------------------------------------------
       4. Odpočítavanie čísel v štatistikách
       -------------------------------------------------------------- */
    const runCounter = element => {
        const target = Number(element.dataset.count);
        if (!Number.isFinite(target)) return;

        const suffix = element.dataset.countSuffix || '';
        const duration = Number(element.dataset.countDuration) || 1600;

        if (prefersReducedMotion) {
            element.textContent = `${target}${suffix}`;
            return;
        }

        const start = performance.now();

        const tick = now => {
            const progress = Math.min((now - start) / duration, 1);
            // spomalenie ku koncu, aby číslo „dosadlo"
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = `${Math.round(target * eased)}${suffix}`;

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            }
        };

        window.requestAnimationFrame(tick);
    };

    const initCounters = () => {
        const counters = document.querySelectorAll('[data-count]');
        if (!counters.length) return;

        if (!('IntersectionObserver' in window)) {
            counters.forEach(runCounter);
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    runCounter(entry.target);
                    obs.unobserve(entry.target);
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(counter => observer.observe(counter));
    };

    /* --------------------------------------------------------------
       5. FAQ — plynulé otváranie a zatváranie
       -------------------------------------------------------------- */
    const initFaq = () => {
        const items = document.querySelectorAll('#faq details');
        if (!items.length) return;

        items.forEach(details => {
            const summary = details.querySelector('summary');
            if (!summary) return;

            // Obsah zabalíme do dvoch obalov, ktoré potrebuje grid animácia
            const wrapper = document.createElement('div');
            wrapper.className = 'faq-answer';
            const inner = document.createElement('div');

            while (summary.nextSibling) {
                inner.appendChild(summary.nextSibling);
            }

            wrapper.appendChild(inner);
            details.appendChild(wrapper);

            if (!details.open) {
                wrapper.classList.add('is-collapsed');
            }

            summary.addEventListener('click', event => {
                event.preventDefault();

                if (prefersReducedMotion) {
                    details.open = !details.open;
                    wrapper.classList.toggle('is-collapsed', !details.open);
                    return;
                }

                if (details.open) {
                    wrapper.classList.add('is-collapsed');

                    // Zatvorenie viažeme na koniec animácie, ale s poistkou:
                    // na skrytej záložke sa prechod nespustí a transitionend
                    // by nikdy neprišiel — položka by ostala navždy otvorená.
                    let closed = false;
                    const finishClose = () => {
                        if (closed) return;
                        closed = true;
                        window.clearTimeout(fallback);
                        wrapper.removeEventListener('transitionend', onEnd);
                        if (wrapper.classList.contains('is-collapsed')) {
                            details.open = false;
                        }
                    };

                    const onEnd = event => {
                        if (event.propertyName === 'grid-template-rows') {
                            finishClose();
                        }
                    };

                    const fallback = window.setTimeout(finishClose, 600);
                    wrapper.addEventListener('transitionend', onEnd);
                } else {
                    wrapper.classList.add('is-collapsed');
                    details.open = true;
                    // vynútime prekreslenie, aby prehliadač animoval z 0fr
                    void wrapper.offsetHeight;
                    wrapper.classList.remove('is-collapsed');
                }
            });
        });
    };

    /* --------------------------------------------------------------
       6. Tlačidlo návratu hore
       -------------------------------------------------------------- */
    const initBackToTop = () => {
        const button = document.querySelector('.back-to-top');
        if (!button) return;

        let ticking = false;

        const update = () => {
            button.classList.toggle('is-visible', window.scrollY > 700);
            ticking = false;
        };

        window.addEventListener(
            'scroll',
            () => {
                if (!ticking) {
                    ticking = true;
                    window.requestAnimationFrame(update);
                }
            },
            { passive: true }
        );

        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
        });

        update();
    };


    /* --------------------------------------------------------------
       7. Partneri — logá do dlaždíc a nekonečný pás
       -------------------------------------------------------------- */
    const initPartners = () => {
        const logos = document.querySelector('.partners-logos');
        if (!logos || logos.querySelector('.partners-marquee')) return;

        const images = Array.from(logos.querySelectorAll('img'));
        if (!images.length) return;

        const track = document.createElement('div');
        track.className = 'partners-marquee';

        images.forEach(image => {
            const tile = document.createElement('div');
            tile.className = 'partner-tile';
            tile.appendChild(image);
            track.appendChild(tile);
        });

        logos.textContent = '';
        logos.appendChild(track);

        // Druhá polovica pásu je kópia prvej, aby slučka plynule nadväzovala.
        // Kópie sú pre čítačky obrazovky skryté, nech sa logá nečítajú dvakrát.
        Array.from(track.children).forEach(tile => {
            const copy = tile.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            const image = copy.querySelector('img');
            if (image) image.alt = '';
            track.appendChild(copy);
        });
    };

    /* --------------------------------------------------------------
       8. Recenzie — iniciály autora a pätička karty
       -------------------------------------------------------------- */
    const AVATAR_GRADIENTS = [
        'linear-gradient(135deg, #e8b563, #c5832b)',
        'linear-gradient(135deg, #2dd4bf, #0d9488)',
        'linear-gradient(135deg, #60a5fa, #2563eb)',
        'linear-gradient(135deg, #a78bfa, #7c3aed)',
    ];

    const initialsOf = name =>
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase();

    const enhanceReview = item => {
        if (item.dataset.enhanced === 'true') return;

        const heading = item.querySelector('h4');
        if (!heading) return;

        item.dataset.enhanced = 'true';

        // meno je v tvare „– Peter N."
        const name = heading.textContent.replace(/^[\s\u2013\u2014-]+/, '').trim();

        const foot = document.createElement('div');
        foot.className = 'review-foot';

        const avatar = document.createElement('span');
        avatar.className = 'review-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = initialsOf(name) || '?';

        let sum = 0;
        for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
        avatar.style.setProperty('--avatar-grad', AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length]);

        const box = document.createElement('div');
        const role = document.createElement('span');
        role.className = 'review-role';
        role.textContent = 'klient';

        item.insertBefore(foot, heading);
        foot.appendChild(avatar);
        foot.appendChild(box);
        box.appendChild(heading);
        box.appendChild(role);
    };

    const initReviews = () => {
        const track = document.querySelector('.reviews-track');
        if (!track) return;

        track.querySelectorAll('.review-item').forEach(enhanceReview);

        // Recenzie zo servera aj kópie pre slučku pribúdajú až neskôr,
        // preto sledujeme, čo sa do pásu pridá.
        if (!('MutationObserver' in window)) return;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (node.classList.contains('review-item')) enhanceReview(node);
                });
            });
        });

        observer.observe(track, { childList: true });
    };

    const init = () => {
        // Povie inline poistke v <head>, ze animacie prevzal tento subor
        window.__finkorbRevealReady = true;

        initStagger();
        initPartners();
        initReviews();
        initReveal();
        initCounters();
        initScrollProgress();
        initFaq();
        initBackToTop();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
