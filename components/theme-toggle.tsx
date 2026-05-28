'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = !isDark;

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!doc.startViewTransition) {
      // Fallback: just toggle without animation
      setIsDark(newTheme);
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return;
    }

    const { flushSync } = await import('react-dom');

    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        setIsDark(newTheme);
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      });
    });

    await transition.ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  }, [isDark]);

  if (!mounted) {
    return <div className="size-9 rounded-md" />;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex size-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 backdrop-blur hover:bg-[color:var(--color-muted)] transition-colors"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
