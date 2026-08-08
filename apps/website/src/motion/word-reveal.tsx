'use client';

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { splitWords } from './split-words';

const WORD_SPRING = { type: 'spring', stiffness: 200, damping: 24 } as const;

const WORD_VARIANTS = {
  hidden: { opacity: 0, y: '0.45em' },
  shown: { opacity: 1, y: 0 },
} as const;

/**
 * The hero headline reveal — Arabic splits by WORD, never letter (WEB5), each word fading up in a
 * staggered cascade. `<br>` in the CMS title becomes a real line break. The full text is exposed
 * via `aria-label` so assistive tech reads it as one heading. Under reduced-motion (MotionConfig)
 * the words simply fade in place. Renders an `<h1>` styled by `className`.
 */
export function WordReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = splitWords(text);
  const label = text.replace(/<br\s*\/?>(?=)/gi, ' ');

  return (
    <motion.h1
      className={className}
      aria-label={label}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.07 }}
    >
      {words.map((word, index) =>
        word === '\n' ? (
          <br key={`br-${index}`} aria-hidden="true" />
        ) : (
          <Fragment key={index}>
            <motion.span
              aria-hidden="true"
              variants={WORD_VARIANTS}
              transition={WORD_SPRING}
              style={{
                display: 'inline-block',
                willChange: 'transform, opacity',
              }}
            >
              {word}
            </motion.span>{' '}
          </Fragment>
        ),
      )}
    </motion.h1>
  );
}
