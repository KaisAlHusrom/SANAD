import type { ar } from './ar';

/**
 * English (secondary, LTR) UI-chrome strings. MUST mirror the `ar` key tree exactly
 * (U8/F13 parity — verifier-enforced). Typed against the `ar` shape so a missing or
 * extra key is a compile error.
 */
export const en: typeof ar = {
  nav: {
    home: 'Home',
    services: 'Services',
    work: 'Work',
    about: 'About',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  cta: {
    startProject: 'Start your project',
    contactUs: 'Contact us',
  },
  footer: {
    tagline: 'Sanad Tech — we build your software, phase by phase.',
    rights: 'All rights reserved',
    contact: 'Contact',
    social: 'Social links',
  },
  contact: {
    title: "Let's talk",
    lead: 'Tell us about your project and we will get back to you.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone number',
    phoneHint:
      'We call you on it directly — pick the country, then enter the number.',
    phonePlaceholder: '5X XXX XXXX',
    phoneCountry: 'Country code',
    phoneCountrySearch: 'Search for a country',
    phoneNoCountry: 'No matching country',
    invalidPhone: 'Enter a valid phone number',
    company: 'Company',
    budget: 'Estimated budget',
    projectType: 'Project type',
    message: 'Project details',
    optional: 'optional',
    submit: 'Send request',
    submitting: 'Sending…',
    success: 'Your request was received. We will be in touch soon.',
    error: 'Could not send your request. Please try again.',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
  },
  states: {
    loading: 'Loading…',
    error: 'Something went wrong',
    empty: 'No content yet',
    notFound: 'Page not found',
    retry: 'Retry',
  },
  language: {
    switch: 'العربية',
  },
  audio: {
    on: 'Sound on',
    off: 'Sound off',
    label: 'Sound',
  },
};
