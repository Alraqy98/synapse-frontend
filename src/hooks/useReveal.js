import { useRef, useState, useEffect } from 'react';

const DEFAULT_OPTIONS = {
  threshold: 0.08,
  rootMargin: '0px 0px -20px 0px',
};

/**
 * useReveal — IntersectionObserver to add "visible" class for scroll reveal.
 * Returns [ref, isVisible]. Attach ref to the element and add class "reveal" + "visible" when isVisible.
 */
export function useReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: opts.threshold, rootMargin: opts.rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [opts.threshold, opts.rootMargin]);

  return [ref, isVisible];
}

export default useReveal;
