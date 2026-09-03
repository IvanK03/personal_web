/* =====================================================================
   FinKorb — návrh „MOTION", interaktívna časť
   ===================================================================== */
(() => {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* --------------------------------------------------------------
       1. Nadpis v hero rozdelíme na slová, ktoré sa vysunú za sebou
       -------------------------------------------------------------- */
    const initHeadline = () => {
        const heading = document.querySelector('#hero h1');
        if (!heading) return;

        let index = 0;
        let lastWord = null;

        heading.querySelectorAll('.m-line').forEach(line => {
            const parts = [];

            line.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent.split(/(\s+)/).forEach(chunk => {
                        if (chunk.trim()) parts.push({ text: chunk });
                        else if (chunk) parts.push({ space: true });
                    });
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    parts.push({ node });
                }
            });

            line.textContent = '';

            parts.forEach(part => {
                if (part.space) {
                    line.appendChild(document.createTextNode(' '));
                    return;
                }

                const word = document.createElement('span');
                word.className = 'm-word';
                word.style.setProperty('--word-delay', `${140 + index * 85}ms`);
                index += 1;

                if (part.node) {
                    word.appendChild(part.node);
                } else {
                    word.textContent = part.text;
                }

                line.appendChild(word);
                lastWord = word;
            });
        });

        // Po dobehnutí poslednej animácie zrušíme maskovanie riadkov,
        // inak by orezalo žiaru za nadpisom.
        const finish = () => heading.classList.add('m-done');

        if (reduced || !lastWord) {
            finish();
            return;
        }

        lastWord.addEventListener('animationend', finish, { once: true });
        // poistka, keby sa animácia nespustila (skrytá záložka a pod.)
        window.setTimeout(finish, 400 + index * 85 + 1200);
    };

    /* --------------------------------------------------------------
       2. Pozadie sa jemne posúva za myšou
       -------------------------------------------------------------- */
    const initMeshParallax = () => {
        const mesh = document.querySelector('.m-mesh');
        if (!mesh || reduced) return;

        let raf = null;
        let targetX = 0;
        let targetY = 0;

        const apply = () => {
            mesh.style.setProperty('--mx', targetX.toFixed(1));
            mesh.style.setProperty('--my', targetY.toFixed(1));
            raf = null;
        };

        window.addEventListener(
            'pointermove',
            event => {
                if (event.pointerType === 'touch') return;
                targetX = (event.clientX / window.innerWidth - 0.5) * 46;
                targetY = (event.clientY / window.innerHeight - 0.5) * 46;
                if (!raf) raf = window.requestAnimationFrame(apply);
            },
            { passive: true }
        );
    };

    /* --------------------------------------------------------------
       3. Odhaľovanie pri scrollovaní
       -------------------------------------------------------------- */
    const initReveal = () => {
        const items = document.querySelectorAll('[data-m-reveal]');
        if (!items.length) return;

        document.querySelectorAll('[data-m-group]').forEach(group => {
            const step = Number(group.dataset.mGroup) || 110;
            Array.from(group.children).forEach((child, i) => {
                if (child.hasAttribute('data-m-reveal')) {
                    child.style.setProperty('--reveal-delay', `${i * step}ms`);
                }
            });
        });

        if (reduced || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('is-in'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    obs.unobserve(entry.target);
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -70px 0px' }
        );

        items.forEach(el => observer.observe(el));
    };

    /* --------------------------------------------------------------
       4. Odpočítavanie čísel
       -------------------------------------------------------------- */
    const runCounter = el => {
        const target = Number(el.dataset.mCount);
        if (!Number.isFinite(target)) return;

        const suffix = el.dataset.mSuffix || '';

        if (reduced) {
            el.textContent = `${target}${suffix}`;
            return;
        }

        const duration = 1700;
        const start = performance.now();

        const tick = now => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (p < 1) window.requestAnimationFrame(tick);
        };

        window.requestAnimationFrame(tick);
    };

    const initCounters = () => {
        const counters = document.querySelectorAll('[data-m-count]');
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

        counters.forEach(el => observer.observe(el));
    };

    /* --------------------------------------------------------------
       5. Bežiace pásy — obsah zdvojíme, aby slučka nadväzovala
       -------------------------------------------------------------- */
    const initMarquees = () => {
        document.querySelectorAll('.m-marquee__track').forEach(track => {
            track.innerHTML += track.innerHTML;
        });

        // Logá partnerov zabalíme do pásu a tiež zdvojíme
        const logos = document.querySelector('.partners-logos');
        if (logos && !logos.querySelector('.m-logos-track')) {
            const track = document.createElement('div');
            track.className = 'm-logos-track';
            while (logos.firstChild) track.appendChild(logos.firstChild);
            track.innerHTML += track.innerHTML;
            logos.appendChild(track);
        }
    };

    /* --------------------------------------------------------------
       6. Postup — linka sa vyfarbuje podľa scrollovania
       -------------------------------------------------------------- */
    const initSteps = () => {
        const wrap = document.querySelector('.m-steps');
        if (!wrap) return;

        const steps = [...wrap.querySelectorAll('.m-step')];
        if (!steps.length) return;

        let ticking = false;

        const update = () => {
            const rect = wrap.getBoundingClientRect();
            const anchor = window.innerHeight * 0.55;
            const progress = (anchor - rect.top) / rect.height;

            wrap.style.setProperty('--steps-progress', Math.min(Math.max(progress, 0), 1).toFixed(3));

            steps.forEach(step => {
                const dot = step.querySelector('.m-step__dot');
                const top = dot ? dot.getBoundingClientRect().top : step.getBoundingClientRect().top;
                step.classList.toggle('is-active', top <= anchor);
            });

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

        window.addEventListener('resize', update);
        update();
    };

    /* --------------------------------------------------------------
       7. FAQ — plynulé rozbaľovanie
       -------------------------------------------------------------- */
    const initFaq = () => {
        document.querySelectorAll('#faq details').forEach(details => {
            const summary = details.querySelector('summary');
            if (!summary) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'faq-answer';
            const inner = document.createElement('div');

            while (summary.nextSibling) inner.appendChild(summary.nextSibling);
            wrapper.appendChild(inner);
            details.appendChild(wrapper);

            if (!details.open) wrapper.classList.add('is-collapsed');

            summary.addEventListener('click', event => {
                event.preventDefault();

                if (reduced) {
                    details.open = !details.open;
                    wrapper.classList.toggle('is-collapsed', !details.open);
                    return;
                }

                if (details.open) {
                    wrapper.classList.add('is-collapsed');

                    // Poistka: na skrytej záložke sa prechod nespustí a
                    // transitionend by nikdy neprišiel.
                    let done = false;
                    const finish = () => {
                        if (done) return;
                        done = true;
                        window.clearTimeout(timer);
                        wrapper.removeEventListener('transitionend', onEnd);
                        if (wrapper.classList.contains('is-collapsed')) details.open = false;
                    };
                    const onEnd = e => {
                        if (e.propertyName === 'grid-template-rows') finish();
                    };
                    const timer = window.setTimeout(finish, 650);
                    wrapper.addEventListener('transitionend', onEnd);
                } else {
                    wrapper.classList.add('is-collapsed');
                    details.open = true;
                    void wrapper.offsetHeight;
                    wrapper.classList.remove('is-collapsed');
                }
            });
        });
    };

    /* --------------------------------------------------------------
       8. Ukazovateľ posunu a návrat hore
       -------------------------------------------------------------- */
    const initChrome = () => {
        const bar = document.querySelector('.m-progress');
        const top = document.querySelector('.m-top');
        let ticking = false;

        const update = () => {
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
            if (bar) bar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
            if (top) top.classList.toggle('is-in', window.scrollY > 800);
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

        if (top) {
            top.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
            });
        }

        update();
    };

    const init = () => {
        window.__finkorbMotionReady = true;

        initHeadline();
        initMarquees();
        initMeshParallax();
        initReveal();
        initCounters();
        initSteps();
        initFaq();
        initChrome();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
