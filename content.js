export function runPageChaos(mode) {
    if (window.__pageChaosInjected) return;
    window.__pageChaosInjected = true;

    // Fix 5: Disconnect MutationObservers
    const OriginalMutationObserver = window.MutationObserver;
    window.MutationObserver = class {
        observe() {}
        disconnect() {}
        takeRecords() { return []; }
    };

    // Load Matter.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
    script.onload = () => initSimulation(mode);
    document.head.appendChild(script);

    function initSimulation(mode) {
        const Matter = window.Matter;

        // Fix 3 & 7: Freeze page and Lock Scroll
        const sx = window.scrollX, sy = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.animationPlayState = 'paused';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${sy}px`;
        document.body.style.left = `-${sx}px`;
        document.body.style.width = '100%';

        const style = document.createElement('style');
        style.textContent = `
            .pagechaos-gpu { 
                will-change: transform, left, top; 
                backface-visibility: hidden; 
                isolation: isolate !important; 
            }
            .pagechaos-blackhole {
                position: fixed; top: 50%; left: 50%; width: 120px; height: 120px;
                background: black; border-radius: 50%; transform: translate(-50%, -50%);
                box-shadow: 0 0 60px 30px purple, inset 0 0 30px 15px #300050;
                animation: pagechaos-pulse 1.5s infinite alternate ease-in-out;
                z-index: 999997; pointer-events: none;
            }
            @keyframes pagechaos-pulse {
                from { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 60px 30px purple; }
                to { transform: translate(-50%, -50%) scale(1.2); box-shadow: 0 0 100px 50px #a020f0; }
            }
            .pagechaos-shockwave {
                position: fixed; top: 50%; left: 50%; width: 20px; height: 20px;
                border: 15px solid rgba(255, 255, 255, 0.9); border-radius: 50%;
                transform: translate(-50%, -50%); animation: pagechaos-explode 0.5s cubic-bezier(0.1, 0, 0, 1) forwards;
                z-index: 999997; pointer-events: none;
            }
            @keyframes pagechaos-explode {
                0% { width: 20px; height: 20px; border-width: 15px; opacity: 1; }
                100% { width: 300vw; height: 300vw; border-width: 0px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        const tags = 'p, h1, h2, h3, h4, h5, h6, img, svg, button, a, li, span, label, input, figure, blockquote, td, th, i';
        
        // Fix 1: Flatten Shadow DOM recursive collector
        function getDeepElements(root) {
            let found = Array.from(root.querySelectorAll(tags));
            const all = root.querySelectorAll('*');
            all.forEach(el => {
                if (el.shadowRoot) {
                    found = found.concat(getDeepElements(el.shadowRoot));
                }
            });
            return found;
        }

        let candidates = getDeepElements(document);
        
        // Fix 6: Video Player Handling (Special case for wrappers)
        const videoWrappers = new Set();
        document.querySelectorAll('video').forEach(v => {
            let container = v.parentElement;
            // Find a reasonable large wrapper (e.g. ytd-player)
            while (container && container !== document.body) {
                if (container.tagName.includes('PLAYER') || container.id.includes('player') || container.className.includes('player')) {
                    videoWrappers.add(container);
                    break;
                }
                container = container.parentElement;
            }
        });

        let elements = candidates.filter(el => {
            // Fix 6: Exclude video internals
            if (el.tagName === 'VIDEO' || el.closest('video')) return false;
            for (let wrapper of videoWrappers) {
                if (wrapper.contains(el) && wrapper !== el) return false;
            }

            if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') return false;
            const s = window.getComputedStyle(el);
            if (s.visibility === 'hidden' || s.display === 'none' || s.opacity === '0') return false;
            
            const innerTags = el.querySelectorAll(tags);
            if (innerTags.length > 3) return false;

            const rect = el.getBoundingClientRect();
            return rect.width >= 10 && rect.height >= 10 && 
                   (rect.width * rect.height < window.innerWidth * window.innerHeight * 0.9);
        });

        // Add video players as single bodies if they exist
        videoWrappers.forEach(w => elements.push(w));

        if (elements.length > 150) {
            const highPriority = ['IMG', 'H1', 'H2', 'H3', 'BUTTON', 'A', 'YTD-PLAYER', 'VIDEO'];
            elements.sort((a, b) => (highPriority.includes(b.tagName) ? 1 : 0) - (highPriority.includes(a.tagName) ? 1 : 0));
            elements = elements.slice(0, 150);
        }

        const toAnimate = [];
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            // Fix 4: Handle existing transforms & Fix 2: Dominance
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.classList.add('pagechaos-gpu');
            el.style.margin = '0';
            el.style.padding = '0';
            el.style.position = 'fixed';
            el.style.left = rect.left + 'px';
            el.style.top = rect.top + 'px';
            el.style.zIndex = '999999';
            el.style.transition = 'none';
            el.style.transform = 'none'; // Zero out transform for physics control

            toAnimate.push({ el, rect, sx, sy });
        });

        const engine = Matter.Engine.create({
            enableSleeping: true,
            positionIterations: 10,
            velocityIterations: 10
        });
        engine.timing.timeScale = 1.2;

        const bodies = toAnimate.map(item => {
            const b = Matter.Bodies.rectangle(
                item.rect.left + sx + item.rect.width / 2,
                item.rect.top + sy + item.rect.height / 2,
                item.rect.width,
                item.rect.height,
                { restitution: 0.5, friction: 0.1, isStatic: true }
            );
            b.width = item.rect.width;
            b.height = item.rect.height;
            item.body = b;
            return b;
        });

        Matter.Composite.add(engine.world, bodies);

        let lastTime = 0, animationId = null, elementsToUpdate = [...toAnimate];

        function update(time) {
            if (!lastTime) lastTime = time;
            const delta = Math.min(time - lastTime, 32);
            lastTime = time;

            Matter.Engine.update(engine, delta);

            const updates = [];
            const shakeX = window.__pageChaosShakeX || 0;
            const shakeY = window.__pageChaosShakeY || 0;

            for (let i = elementsToUpdate.length - 1; i >= 0; i--) {
                const item = elementsToUpdate[i];
                const b = item.body;

                if (!b.isStatic || shakeX !== 0 || shakeY !== 0) {
                    updates.push({
                        el: item.el,
                        left: b.position.x - b.width/2 - sx + shakeX,
                        top: b.position.y - b.height/2 - sy + shakeY,
                        angle: b.angle,
                        scale: item.scale,
                        opacity: item.opacity,
                        isSleeping: b.isSleeping
                    });
                }

                if (item.opacity === 0 || (b.position.y - b.height > sy + window.innerHeight + 800)) {
                    item.el.style.display = 'none';
                    elementsToUpdate.splice(i, 1);
                }
            }

            updates.forEach(up => {
                up.el.style.left = up.left + 'px';
                up.el.style.top = up.top + 'px';
                let t = `rotate(${up.angle}rad)`;
                if (up.scale !== undefined) t += ` scale(${up.scale})`;
                up.el.style.transform = t;
                if (up.opacity !== undefined) up.el.style.opacity = up.opacity;

                if (up.isSleeping) up.el.classList.remove('pagechaos-gpu');
                else up.el.classList.add('pagechaos-gpu');
            });

            if (elementsToUpdate.length === 0) {
                cancelAnimationFrame(animationId);
                return;
            }
            animationId = requestAnimationFrame(update);
        }

        animationId = requestAnimationFrame(update);

        function addBoundaries() {
            const floor = Matter.Bodies.rectangle(window.innerWidth/2 + sx, window.innerHeight + sy + 25, window.innerWidth * 3, 100, { isStatic: true });
            Matter.Composite.add(engine.world, [floor]);
        }

        if (mode === 'gravity') {
            engine.gravity.y = 2.0;
            addBoundaries();
            toAnimate.forEach(item => Matter.Body.setStatic(item.body, false));
        } else if (mode === 'explosion') {
            engine.gravity.y = 0.5;
            const sw = document.createElement('div');
            sw.className = 'pagechaos-shockwave';
            document.body.appendChild(sw);
            setTimeout(() => sw.remove(), 500);
            const center = { x: window.innerWidth/2 + sx, y: window.innerHeight/2 + sy };
            toAnimate.forEach(item => {
                Matter.Body.setStatic(item.body, false);
                const dx = item.body.position.x - center.x, dy = item.body.position.y - center.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const force = (0.4 * item.body.mass) / (dist * 0.002 + 1);
                Matter.Body.applyForce(item.body, item.body.position, { x: (dx/dist) * force, y: (dy/dist) * force });
            });
        } else if (mode === 'meteor') {
            engine.gravity.y = 1.5;
            addBoundaries();
            const shuffled = [...toAnimate].sort(() => Math.random() - 0.5);
            let i = 0;
            const interval = setInterval(() => {
                if (i >= shuffled.length) return clearInterval(interval);
                const item = shuffled[i++];
                Matter.Body.setStatic(item.body, false);
                Matter.Body.applyForce(item.body, item.body.position, { x: (Math.random()-0.5)*0.1*item.body.mass, y: -0.2*item.body.mass });
                window.__pageChaosShakeX = (Math.random()-0.5)*8;
                window.__pageChaosShakeY = (Math.random()-0.5)*8;
                setTimeout(() => { window.__pageChaosShakeX = 0; window.__pageChaosShakeY = 0; }, 40);
            }, 45);
        } else if (mode === 'wave') {
            engine.gravity.y = 0.8;
            addBoundaries();
            toAnimate.forEach((item) => {
                const delay = Math.max(0, ((item.body.position.x - sx) / window.innerWidth) * 600);
                setTimeout(() => {
                    Matter.Body.setStatic(item.body, false);
                    Matter.Body.applyForce(item.body, item.body.position, { x: 0.15 * item.body.mass, y: -0.05 * item.body.mass });
                }, delay);
            });
        } else if (mode === 'blackhole') {
            engine.gravity.y = 0;
            const bh = document.createElement('div');
            bh.className = 'pagechaos-blackhole';
            document.body.appendChild(bh);
            let mouseX = window.innerWidth / 2 + sx, mouseY = window.innerHeight / 2 + sy, consumedCount = 0;
            const onMouseMove = (e) => {
                mouseX = e.clientX + window.scrollX; mouseY = e.clientY + window.scrollY;
                bh.style.left = e.clientX + 'px'; bh.style.top = e.clientY + 'px';
            };
            document.addEventListener('mousemove', onMouseMove);
            toAnimate.forEach(item => Matter.Body.setStatic(item.body, false));
            Matter.Events.on(engine, 'beforeUpdate', () => {
                toAnimate.forEach(item => {
                    if (item.opacity === 0) return;
                    const b = item.body, dx = mouseX - b.position.x, dy = mouseY - b.position.y, dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    if (dist < 40) {
                        item.opacity = 0; Matter.Body.setPosition(b, { x: -9999, y: -9999 }); consumedCount++;
                        const s = 120 + (consumedCount * 0.5);
                        bh.style.width = s + 'px'; bh.style.height = s + 'px';
                        bh.style.boxShadow = `0 0 ${60 + consumedCount}px ${30 + consumedCount/2}px purple, inset 0 0 30px 15px #300050`;
                        return;
                    }
                    const power = 0.00018 * b.mass * (dist < window.innerWidth * 0.15 ? 5 : (dist < window.innerWidth * 0.4 ? 2 : 1));
                    const dir = { x: dx/dist, y: dy/dist }, tan = { x: -dir.y, y: dir.x };
                    Matter.Body.applyForce(b, b.position, { x: (dir.x + tan.x * 0.5) * power, y: (dir.y + tan.y * 0.5) * power });
                    if (dist < 250) item.scale = Math.max(0.1, dist / 250);
                });
            });
        }
    }
}
