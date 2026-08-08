import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImpactSection } from './impact-section';
import { FooterFinale } from './footer-finale';

describe('ImpactSection', () => {
  it('renders the cinematic descent runway with NO narration label (owner 2026-07-07 #1)', () => {
    const { container } = render(<ImpactSection />);
    const section = container.querySelector('#impact');
    expect(section).not.toBeNull();
    expect(section?.textContent).toBe('');
  });
});

describe('FooterFinale', () => {
  it('renders the business headline (lead + accent word), CTA and nav (ar)', () => {
    render(<FooterFinale locale="ar" />);
    // the headline is split so only the final word carries the accent gradient
    expect(screen.getByText(/مشروعُك القادم يستحق/)).toBeInTheDocument();
    expect(screen.getByText('سَنَدًا')).toBeInTheDocument();
    expect(screen.getByText('ابدأ مشروعك')).toBeInTheDocument();
    expect(screen.getByText('تواصل معنا')).toBeInTheDocument();
  });

  it('localizes to English', () => {
    render(<FooterFinale locale="en" />);
    expect(screen.getByText(/Your next project deserves/)).toBeInTheDocument();
    expect(screen.getByText('real backing')).toBeInTheDocument();
    expect(screen.getByText('Start your project')).toBeInTheDocument();
  });
});
