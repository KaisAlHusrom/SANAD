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
  consent: {
    bar: {
      label: 'Cookie notice',
      title: 'We ask first',
      body: 'No analytics or advertising tool runs before you agree. Only the necessary files are active right now, so the site works.',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      customize: 'Customize',
    },
    dialog: {
      title: 'Cookie preferences',
      lead: 'Choose what we may use. You can change this any time from the bottom of any page.',
      close: 'Close',
      save: 'Save preferences',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      withdraw: 'Withdraw my consent',
      remembered: 'We keep your choice for {{days}} days, then ask again.',
    },
    categories: {
      necessary: {
        name: 'Necessary',
        description:
          'Run the basics: language, security, and form submission. The site does not work without them.',
        alwaysOn: 'Always required',
      },
      analytics: {
        name: 'Performance',
        description:
          'Show us which pages matter to you and where to improve. Aggregate numbers, no personal identity.',
      },
      marketing: {
        name: 'Marketing',
        description:
          'Measure how our campaigns perform so they reach people actually looking for our services.',
      },
    },
    vendors: {
      label: 'Loads if you agree',
      none: 'Nothing is configured yet.',
    },
    state: {
      on: 'On',
      off: 'Off',
    },
    links: {
      privacy: 'Privacy policy',
      cookies: 'Cookie policy',
    },
    preferences: {
      open: 'Cookie preferences',
    },
    feedback: {
      notStored:
        'Applied for this session only — your browser’s storage appears to be disabled, so we can’t remember it after you close it.',
    },
  },
};
