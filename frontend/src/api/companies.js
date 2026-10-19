import { apiFetch } from './client';

/** Returns all companies: [{ id, name, created_at }] */
export function getCompanies() {
  return apiFetch('/companies');
}

/** Returns one company: { id, name, created_at } */
export function getCompany(companyId) {
  return apiFetch(`/companies/${companyId}`);
}
