import React, { useRef, useState, useEffect } from 'react';

const DEFAULT_OPTIONS = {
  threshold: 0.08,
  rootMargin: '0px 0px -20px 0px',
};

/**
 * RevealWrapper — Wraps content and adds .visible when in view (scroll reveal).
 * Matches reference: .reveal { opacity: 0; transform: translateY(24px); transition: ... }
 * .reveal.visible { opacity: 1; transform: translateY(0); }
 */
export default function RevealWrapper({ children, className = '', style = {}, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
          }
        });
      },
      DEFAULT_OPTIONS
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const combinedClassName = `reveal ${visible ? 'visible' : ''} ${className}`.trim();

  return (
    <div ref={ref} className={combinedClassName} style={style} {...props}>
      {children}
    </div>
  );
}
