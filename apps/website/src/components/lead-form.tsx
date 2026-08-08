'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  leadCreateRequestSchema,
  type LeadCreateRequest,
  type LeadSource,
  type Locale,
} from '@sanad/contracts';
import type { Dictionary } from '../i18n/get-dictionary';

type Status = 'idle' | 'success' | 'error';

/**
 * The public contact / request-a-project form (WEB1, F6). Schema-validated with the shared
 * `leadCreateRequestSchema` (U16/N7); messages are i18n keys (F6); F2 states cover
 * submitting (in-button) + success + error. `onSubmit` is injected (defaults to the server
 * action) so the form is unit-testable without a server. `source` distinguishes the simple
 * contact form from the multi-step request flow (8.B); `locale` is recorded for the reply.
 */
export function LeadForm({
  dict,
  locale,
  source = 'contact',
  onSubmit,
}: {
  dict: Dictionary;
  locale: Locale;
  source?: LeadSource;
  onSubmit: (values: LeadCreateRequest) => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadCreateRequest>({
    resolver: zodResolver(leadCreateRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      budget: '',
      projectType: '',
      message: '',
      source,
      locale,
    },
  });

  const submit = handleSubmit(async (values) => {
    setStatus('idle');
    try {
      await onSubmit(values);
      setStatus('success');
      reset({
        name: '',
        email: '',
        company: '',
        budget: '',
        projectType: '',
        message: '',
        source,
        locale,
      });
    } catch {
      setStatus('error');
    }
  });

  const emailError = errors.email ? dict.contact.invalidEmail : null;

  return (
    <form className="lead-form" onSubmit={submit} noValidate>
      {status === 'success' ? (
        <p className="lead-alert lead-alert--success" role="status">
          {dict.contact.success}
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="lead-alert lead-alert--error" role="alert">
          {dict.contact.error}
        </p>
      ) : null}

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-name">
          {dict.contact.name}
        </label>
        <input id="lead-name" className="lead-input" {...register('name')} />
        {errors.name ? (
          <span className="lead-error">{dict.contact.required}</span>
        ) : null}
      </div>

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-email">
          {dict.contact.email}
        </label>
        <input
          id="lead-email"
          type="email"
          className="lead-input"
          {...register('email')}
        />
        {emailError ? <span className="lead-error">{emailError}</span> : null}
      </div>

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-company">
          {dict.contact.company}
          <span className="lead-optional">{dict.contact.optional}</span>
        </label>
        <input
          id="lead-company"
          className="lead-input"
          {...register('company')}
        />
      </div>

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-project-type">
          {dict.contact.projectType}
          <span className="lead-optional">{dict.contact.optional}</span>
        </label>
        <input
          id="lead-project-type"
          className="lead-input"
          {...register('projectType')}
        />
      </div>

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-budget">
          {dict.contact.budget}
          <span className="lead-optional">{dict.contact.optional}</span>
        </label>
        <input
          id="lead-budget"
          className="lead-input"
          {...register('budget')}
        />
      </div>

      <div className="lead-field">
        <label className="lead-label" htmlFor="lead-message">
          {dict.contact.message}
        </label>
        <textarea
          id="lead-message"
          className="lead-textarea"
          {...register('message')}
        />
        {errors.message ? (
          <span className="lead-error">{dict.contact.required}</span>
        ) : null}
      </div>

      <button type="submit" className="site-cta" disabled={isSubmitting}>
        {isSubmitting ? dict.contact.submitting : dict.contact.submit}
      </button>
    </form>
  );
}
