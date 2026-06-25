import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema, type LoginRequest } from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ApiError } from '../../../data/types/api-error.types';
import { useLoginMutation } from '../api/auth.api';

interface FromState {
  from?: { pathname: string };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

function loginErrorKey(error: unknown, t: TFunction<'auth'>): string {
  if (isApiError(error)) {
    if (error.status === 401) return t('errors.invalidCredentials');
    if (error.status === 0) return t('errors.network');
    return error.message;
  }
  return t('errors.unknown');
}

interface UseLoginResult {
  form: UseFormReturn<LoginRequest>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/** Login form logic (F6 — schema from contracts, errors as i18n keys). */
export function useLogin(): UseLoginResult {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      const state = location.state as FromState | null;
      navigate(state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      form.setError('root', { message: loginErrorKey(error, t) });
    }
  });

  return { form, onSubmit, isSubmitting: isLoading };
}
