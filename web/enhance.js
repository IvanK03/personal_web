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
       7. Partneri — railboard
          Pásy sa nehýbu samy. Posúvajú sa podľa toho, kde je doska
          vo výreze okna, takže ich rozhýbe scrollovanie — a keďže sa
          hodnota dotiahne s tlmením, záleží aj na rýchlosti.
          Pravítko sa navyše dá chytiť myšou a pretiahnuť.
       -------------------------------------------------------------- */
    const RAIL = {
        cloneBuffer: 96,
        minTravelCards: 1.25,
        edgeReveal: 3.4,
        scrollEase: 0.075,   // dotahovanie pri scrollovani
        scrubEase: 0.22,     // rychlejsie, ked sa tahá pravítko
        progressStart: 0.84, // doska v spodnej casti okna -> zaciatok
        progressEnd: 0.18,   // doska hore -> koniec
    };

    const clamp01 = value => Math.min(Math.max(value, 0), 1);

    const initRailboard = () => {
        const board = document.querySelector('.rail-board');
        if (!board) return;

        const scrubber = board.querySelector('.rail-scrubber');
        const trackEls = Array.from(board.querySelectorAll('.rail-track'));
        if (!scrubber || !trackEls.length) return;

        const ticks = Array.from(scrubber.querySelectorAll('span'));

        const rails = trackEls.map(row => ({
            row,
            originals: Array.from(row.children).filter(el => el.matches('.rail-card')),
            dir: row.dataset.dir === 'right' ? 1 : -1,
            travel: 0,
            base: 0,
        }));

        const boardWidth = () => board.getBoundingClientRect().width;

        const measureRail = rail => {
            const first = rail.originals[0];
            const last = rail.originals[rail.originals.length - 1];
            if (!first) return;

            const cardWidth = first.getBoundingClientRect().width || 176;
            const contentWidth = last
                ? last.getBoundingClientRect().right - first.getBoundingClientRect().left
                : cardWidth;
            const reveal = Math.min(boardWidth() * 0.11, 96) * RAIL.edgeReveal;

            rail.travel = Math.max(
                contentWidth - boardWidth() + reveal,
                cardWidth * RAIL.minTravelCards
            );
            rail.base = rail.dir === 1 ? -rail.travel : 0;
        };

        const makeClone = card => {
            const copy = card.cloneNode(true);
            copy.dataset.railClone = '';
            copy.setAttribute('aria-hidden', 'true');
            copy.tabIndex = -1;
            return copy;
        };

        const fillRail = rail => {
            rail.row.querySelectorAll('[data-rail-clone]').forEach(node => node.remove());

            const needed = boardWidth() + rail.travel + RAIL.cloneBuffer;
            let rounds = 0;
            while (rail.row.scrollWidth < needed && rounds < 12) {
                rail.originals.forEach(card => rail.row.append(makeClone(card)));
                rounds += 1;
            }
        };

        const layout = () => {
            rails.forEach(measureRail);
            rails.forEach(fillRail);
        };

        const applyProgress = progress => {
            rails.forEach(rail => {
                const x = rail.base + rail.dir * progress * rail.travel;
                rail.row.style.transform = `translate3d(${x}px, 0, 0)`;
            });
        };

        const paintScrubber = progress => {
            if (!ticks.length) return;
            const position = progress * (ticks.length - 1);
            ticks.forEach((tick, index) => {
                const distance = Math.abs(index - position);
                tick.classList.toggle('on', distance < 1.2);
                tick.classList.toggle('near', distance >= 1.2 && distance < 3.4);
            });
        };

        // Kde sa doska nachádza vo výreze okna, prepočítané na 0–1
        const scrollProgress = () => {
            const viewport = window.innerHeight || document.documentElement.clientHeight;
            const from = viewport * RAIL.progressStart;
            const to = viewport * RAIL.progressEnd;
            const rect = board.getBoundingClientRect();
            return clamp01((from - (rect.top + rect.height / 2)) / (from - to));
        };

        // Klik na kartu ju zvýrazní (aj jej kópie v slučke)
        const activate = name => {
            board.querySelectorAll('.rail-card').forEach(card => {
                const isActive = Boolean(name) && card.dataset.name === name;
                card.classList.toggle('is-active', isActive);
                card.setAttribute('aria-pressed', String(isActive));
            });
        };

        let activeName = null;
        board.addEventListener('click', event => {
            const card = event.target.closest('.rail-card');
            if (!card) return;
            activeName = card.dataset.name === activeName ? null : card.dataset.name;
            activate(activeName);
        });

        // Do tabulátora púšťame len karty, ktoré sú naozaj vidieť
        if ('IntersectionObserver' in window) {
            const visibility = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        entry.target.tabIndex = entry.intersectionRatio >= 0.5 ? 0 : -1;
                    });
                },
                { root: board, threshold: [0, 0.5] }
            );
            rails.forEach(rail =>
                rail.originals.forEach(card => {
                    card.tabIndex = -1;
                    visibility.observe(card);
                })
            );
        }

        layout();

        let current = prefersReducedMotion ? 0.5 : scrollProgress();
        applyProgress(current);
        paintScrubber(current);

        const relayout = () => {
            layout();
            applyProgress(current);
        };

        window.addEventListener('resize', relayout);

        // logá majú rozmery až po načítaní, dovtedy je meranie orientačné
        board.querySelectorAll('img').forEach(image => {
            if (!image.complete) image.addEventListener('load', relayout, { once: true });
        });

        if (prefersReducedMotion) return;

        // Ťahanie pravítka
        let dragTarget = null;
        let touchProbe = null;
        // Poloha nastavená ručne. Drží sa, kým používateľ nezačne
        // scrollovať — inak by sa pás hneď po pustení vrátil tam,
        // kam ho ťahá poloha dosky vo výreze okna.
        let holdProgress = null;

        const progressFromPointer = event => {
            const rect = scrubber.getBoundingClientRect();
            return clamp01((event.clientX - rect.left) / rect.width);
        };

        const beginDrag = event => {
            if (scrubber.setPointerCapture) {
                try { scrubber.setPointerCapture(event.pointerId); } catch (error) { /* nevadi */ }
            }
            scrubber.classList.add('is-dragging');
            dragTarget = progressFromPointer(event);
            start();
        };

        scrubber.addEventListener('pointerdown', event => {
            // Myšou a perom začíname hneď.
            if (event.pointerType !== 'touch') {
                event.preventDefault();
                beginDrag(event);
                return;
            }

            // Pri dotyku počkáme, ktorým smerom prst pôjde. Pravítko je úzky
            // pás cez celú šírku dosky — keby sme ťahanie spustili hneď,
            // nedalo by sa cezeň scrollovať stránku.
            touchProbe = { id: event.pointerId, x: event.clientX, y: event.clientY };
        });

        scrubber.addEventListener('pointermove', event => {
            if (touchProbe && event.pointerId === touchProbe.id && !scrubber.classList.contains('is-dragging')) {
                const dx = Math.abs(event.clientX - touchProbe.x);
                const dy = Math.abs(event.clientY - touchProbe.y);

                if (dy > 10 && dy > dx) {
                    // zvislé gesto patrí stránke
                    touchProbe = null;
                    return;
                }

                if (dx > 8 && dx > dy) {
                    touchProbe = null;
                    beginDrag(event);
                } else {
                    return;
                }
            }

            if (!scrubber.classList.contains('is-dragging')) return;

            // počas ťahania nechceme, aby sa popri tom hýbala aj stránka
            if (event.cancelable) event.preventDefault();
            dragTarget = progressFromPointer(event);
        });

        const endDrag = event => {
            touchProbe = null;
            if (!scrubber.classList.contains('is-dragging')) return;
            scrubber.classList.remove('is-dragging');
            if (dragTarget !== null) holdProgress = dragTarget;
            dragTarget = null;
            if (event && scrubber.hasPointerCapture && scrubber.hasPointerCapture(event.pointerId)) {
                scrubber.releasePointerCapture(event.pointerId);
            }
        };

        scrubber.addEventListener('pointerup', endDrag);
        scrubber.addEventListener('pointercancel', endDrag);
        scrubber.addEventListener('lostpointercapture', endDrag);

        let frame = 0;
        let onScreen = true;

        const tick = () => {
            if (!onScreen || document.hidden) {
                frame = 0;
                return;
            }

            let target;
            let ease;

            if (dragTarget !== null) {
                target = dragTarget;
                ease = RAIL.scrubEase;
            } else if (holdProgress !== null) {
                target = holdProgress;
                ease = RAIL.scrubEase;
            } else {
                target = scrollProgress();
                ease = RAIL.scrollEase;
            }

            current += (target - current) * ease;
            applyProgress(current);
            paintScrubber(current);

            frame = window.requestAnimationFrame(tick);
        };

        function start() {
            if (!frame && onScreen && !document.hidden) {
                frame = window.requestAnimationFrame(tick);
            }
        }

        const stop = () => {
            window.cancelAnimationFrame(frame);
            frame = 0;
        };

        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

        // Len skutočný posun stránky, nie drobné dochvenie po pustení prsta
        let lastScrollY = window.scrollY;
        window.addEventListener(
            'scroll',
            () => {
                if (Math.abs(window.scrollY - lastScrollY) > 4) holdProgress = null;
                lastScrollY = window.scrollY;
            },
            { passive: true }
        );

        if ('IntersectionObserver' in window) {
            const near = new IntersectionObserver(
                ([entry]) => {
                    onScreen = entry ? entry.isIntersecting : true;
                    if (onScreen) start();
                    else stop();
                },
                { rootMargin: '160px 0px' }
            );
            near.observe(board);
        }

        start();
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
        initRailboard();
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
