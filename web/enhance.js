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

    const init = () => {
        // Povie inline poistke v <head>, ze animacie prevzal tento subor
        window.__finkorbRevealReady = true;

        initStagger();
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
