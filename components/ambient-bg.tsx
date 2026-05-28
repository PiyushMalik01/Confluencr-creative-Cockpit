'use client';

import { motion } from 'framer-motion';

export function AmbientBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)',
          top: '-10%',
          left: '20%',
        }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
          bottom: '10%',
          right: '10%',
        }}
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244,114,182,0.06), transparent 70%)',
          top: '50%',
          left: '5%',
        }}
        animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
