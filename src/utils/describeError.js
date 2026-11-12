import { t } from '../i18n.js';

/** API xatosini foydalanuvchiga tushunarli { title, hint } ko'rinishiga o'tkazadi. */
export function describeError(error) {
  if (error?.reason === 'videoChartNotFound') return t.errors.chartNotFound;
  return t.errors[error?.kind] ?? t.errors.unknown;
}
