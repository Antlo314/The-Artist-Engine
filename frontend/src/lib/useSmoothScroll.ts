import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll, wired into GSAP ScrollTrigger.
 * Call once per page that uses scroll-driven animation.
 * Returns nothing; cleans itself up on unmount.
 */
export function useSmoothScroll() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.15,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        lenis.on('scroll', ScrollTrigger.update);

        const raf = (time: number) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(raf);
            lenis.destroy();
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);
}

export { gsap, ScrollTrigger };
