'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  leadCreateRequestSchema,
  type LeadCreateRequest,
  type Locale,
} from '@sanad/contracts';
import type { Dictionary } from '../../../i18n/get-dictionary';
import { TravelLink } from '../../../motion/universe';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { REQUEST_COPY } from './request-copy';
import {
  BUDGET_BANDS,
  PROJECT_TYPES,
  REQUEST_STEP_COUNT,
  type RequestOption,
} from './request.constants';

type Status = 'idle' | 'error';

/** Resolve a chosen canonical value back to its localized label (for the review summary). */
function labelFor(
  options: readonly RequestOption[],
  value: string,
  locale: Locale,
): string {
  return options.find((o) => o.value === value)?.label[locale] ?? value;
}

/**
 * A grid of styled choice cards writing ONE canonical value onto a form field (U21(b) — a real
 * component, never a bare `<select>`). `aria-pressed` carries the selection to assistive tech.
 */
function ChoiceGrid({
  options,
  value,
  onSelect,
  locale,
  label,
}: {
  options: readonly RequestOption[];
  value: string;
  onSelect: (value: string) => void;
  locale: Locale;
  label: string;
}) {
  return (
    <div className="mk-request-choices" role="group" aria-label={label}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`mk-request-choice${selected ? ' mk-request-choice--on' : ''}`}
            aria-pressed={selected}
            onClick={() => onSelect(opt.value)}
          >
            {copy(opt.label, locale)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The multi-step request-a-project form (P8.E-5) — the flagship conversion surface. Three steps
 * (Project → Brief → You + review) that create a `lead` with `source: 'request-project'` through
 * the EXISTING pipeline (F9): the shared `leadCreateRequestSchema` (U16/N7) validates per-step via
 * RHF `trigger`, and `onSubmit` is injected (defaults to the server action at the page) so this is
 * unit-testable without a server. Field labels/validation/status reuse `dict.contact.*`; the
 * multi-step chrome comes from `REQUEST_COPY`. Reduced motion is honored globally (MotionConfig).
 */
export function RequestForm({
  dict,
  locale,
  onSubmit,
}: {
  dict: Dictionary;
  locale: Locale;
  onSubmit: (values: LeadCreateRequest) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [submitted, setSubmitted] = useState(false);
  const [needsType, setNeedsType] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    watch,
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
      source: 'request-project',
      locale,
    },
  });

  const projectType = watch('projectType') ?? '';
  const budget = watch('budget') ?? '';

  async function goNext() {
    if (step === 0) {
      // step 1's project type is a UI-required selection (the schema field stays optional)
      if (!getValues('projectType')) {
        setNeedsType(true);
        return;
      }
      setNeedsType(false);
      setStep(1);
      return;
    }
    if (step === 1) {
      const ok = await trigger('message');
      if (ok) setStep(2);
    }
  }

  function goBack() {
    setStatus('idle');
    setStep((s) => Math.max(0, s - 1));
  }

  const submit = handleSubmit(async (values) => {
    setStatus('idle');
    try {
      await onSubmit(values);
      setSubmitted(true);
    } catch {
      setStatus('error');
    }
  });

  if (submitted) {
    return (
      <div className="mk-request-done lp-panel" role="status">
        <span className="mk-request-done-mark" aria-hidden="true" />
        <h2 className="lp-h2">{copy(REQUEST_COPY.success.title, locale)}</h2>
        <p className="lp-section-lead">
          {copy(REQUEST_COPY.success.body, locale)}
        </p>
        <TravelLink className="lp-cta lp-cta--primary" href={`/${locale}`}>
          {copy(REQUEST_COPY.success.back, locale)}
        </TravelLink>
      </div>
    );
  }

  return (
    <div className="mk-request">
      {/* stepper — where you are in the flow */}
      <ol
        className="mk-request-steps"
        aria-label={copy(REQUEST_COPY.stepsAria, locale)}
      >
        {REQUEST_COPY.steps.map((s, i) => (
          <li
            key={s.key}
            className={`mk-request-step${i === step ? ' mk-request-step--on' : ''}${
              i < step ? ' mk-request-step--done' : ''
            }`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="mk-request-step-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="mk-request-step-text">
              <span className="mk-request-step-title">
                {copy(s.title, locale)}
              </span>
              <span className="mk-request-step-caption">
                {copy(s.caption, locale)}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <form className="mk-request-form" onSubmit={submit} noValidate>
        {status === 'error' ? (
          <p className="lead-alert lead-alert--error" role="alert">
            {dict.contact.error}
          </p>
        ) : null}

        {/* STEP 1 — project type + budget */}
        {step === 0 ? (
          <div className="mk-request-panel">
            <RevealOnScroll trigger="mount">
              <div className="mk-request-block">
                <h2 className="mk-request-heading">
                  {copy(REQUEST_COPY.project.typeHeading, locale)}
                </h2>
                <p className="mk-request-hint">
                  {copy(REQUEST_COPY.project.typeHint, locale)}
                </p>
                <ChoiceGrid
                  options={PROJECT_TYPES}
                  value={projectType}
                  onSelect={(v) => {
                    setValue('projectType', v);
                    setNeedsType(false);
                  }}
                  locale={locale}
                  label={copy(REQUEST_COPY.project.typeHeading, locale)}
                />
                {needsType ? (
                  <span className="lead-error">
                    {copy(REQUEST_COPY.project.pleaseSelect, locale)}
                  </span>
                ) : null}
              </div>
            </RevealOnScroll>
            <RevealOnScroll trigger="mount" index={1}>
              <div className="mk-request-block">
                <h2 className="mk-request-heading">
                  {copy(REQUEST_COPY.project.budgetHeading, locale)}
                </h2>
                <p className="mk-request-hint">
                  {copy(REQUEST_COPY.project.budgetHint, locale)}
                </p>
                <ChoiceGrid
                  options={BUDGET_BANDS}
                  value={budget}
                  onSelect={(v) => setValue('budget', v)}
                  locale={locale}
                  label={copy(REQUEST_COPY.project.budgetHeading, locale)}
                />
              </div>
            </RevealOnScroll>
          </div>
        ) : null}

        {/* STEP 2 — the brief */}
        {step === 1 ? (
          <div className="mk-request-panel">
            <RevealOnScroll trigger="mount">
              <div className="mk-request-block">
                <h2 className="mk-request-heading">
                  {copy(REQUEST_COPY.brief.heading, locale)}
                </h2>
                <p className="mk-request-hint">
                  {copy(REQUEST_COPY.brief.hint, locale)}
                </p>
                <div className="lead-field">
                  <label className="lead-label" htmlFor="request-message">
                    {dict.contact.message}
                  </label>
                  <textarea
                    id="request-message"
                    className="lead-textarea mk-request-brief"
                    {...register('message')}
                  />
                  {errors.message ? (
                    <span className="lead-error">{dict.contact.required}</span>
                  ) : null}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        ) : null}

        {/* STEP 3 — your details + a review of the request */}
        {step === 2 ? (
          <div className="mk-request-panel">
            <RevealOnScroll trigger="mount">
              <div className="mk-request-block">
                <h2 className="mk-request-heading">
                  {copy(REQUEST_COPY.you.heading, locale)}
                </h2>
                <div className="mk-request-fields">
                  <div className="lead-field">
                    <label className="lead-label" htmlFor="request-name">
                      {dict.contact.name}
                    </label>
                    <input
                      id="request-name"
                      className="lead-input"
                      {...register('name')}
                    />
                    {errors.name ? (
                      <span className="lead-error">
                        {dict.contact.required}
                      </span>
                    ) : null}
                  </div>
                  <div className="lead-field">
                    <label className="lead-label" htmlFor="request-email">
                      {dict.contact.email}
                    </label>
                    <input
                      id="request-email"
                      type="email"
                      className="lead-input"
                      {...register('email')}
                    />
                    {errors.email ? (
                      <span className="lead-error">
                        {dict.contact.invalidEmail}
                      </span>
                    ) : null}
                  </div>
                  <div className="lead-field">
                    <label className="lead-label" htmlFor="request-company">
                      {dict.contact.company}
                      <span className="lead-optional">
                        {dict.contact.optional}
                      </span>
                    </label>
                    <input
                      id="request-company"
                      className="lead-input"
                      {...register('company')}
                    />
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll trigger="mount" index={1}>
              <div
                className="mk-request-review lp-panel"
                aria-label={copy(REQUEST_COPY.you.reviewHeading, locale)}
              >
                <h3 className="mk-request-review-title">
                  {copy(REQUEST_COPY.you.reviewHeading, locale)}
                </h3>
                <dl className="mk-request-review-list">
                  <div className="mk-request-review-row">
                    <dt>{copy(REQUEST_COPY.review.type, locale)}</dt>
                    <dd>
                      {projectType
                        ? labelFor(PROJECT_TYPES, projectType, locale)
                        : copy(REQUEST_COPY.review.none, locale)}
                    </dd>
                  </div>
                  <div className="mk-request-review-row">
                    <dt>{copy(REQUEST_COPY.review.budget, locale)}</dt>
                    <dd>
                      {budget
                        ? labelFor(BUDGET_BANDS, budget, locale)
                        : copy(REQUEST_COPY.review.none, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            </RevealOnScroll>
          </div>
        ) : null}

        {/* nav — Back / Next until the last step, then Submit */}
        <div className="mk-request-nav">
          {step > 0 ? (
            <button type="button" className="mk-request-back" onClick={goBack}>
              {copy(REQUEST_COPY.nav.back, locale)}
            </button>
          ) : (
            <span />
          )}
          {step < REQUEST_STEP_COUNT - 1 ? (
            <button
              type="button"
              className="lp-cta lp-cta--primary"
              onClick={goNext}
            >
              {copy(REQUEST_COPY.nav.next, locale)}
            </button>
          ) : (
            <button
              type="submit"
              className="lp-cta lp-cta--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? dict.contact.submitting : dict.contact.submit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
