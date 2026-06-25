import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './types';

/** Typed `useDispatch`/`useSelector` (W3 — `import type` for the store back-edges). */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
