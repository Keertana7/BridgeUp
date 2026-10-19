import { apiFetch } from './client';

/**
 * Returns experiences for a given company.
 * Uses GET /experiences?company_id=<uuid>
 */
export function getExperiencesByCompany(companyId) {
  return apiFetch(`/experiences?company_id=${companyId}`);
}

/**
 * Returns a single experience by UUID.
 * Uses GET /experiences/<uuid>
 */
export function getExperience(experienceId) {
  return apiFetch(`/experiences/${experienceId}`);
}
