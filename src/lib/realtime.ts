// File: /src/lib/realtime.ts
// Utility per inviare eventi real-time dalle API

import { broadcastEvent, EventType } from '@/app/api/realtime/route';

// Funzione per notificare un nuovo arresto
export function notifyArrestCreated(arrest: any) {
  broadcastEvent('arrest_created', {
    id: arrest.id,
    citizenId: arrest.citizenId,
    officerId: arrest.officerId,
    date: arrest.date,
    charges: arrest.charges,
  });
}

// Funzione per notificare un arresto aggiornato
export function notifyArrestUpdated(arrest: any) {
  broadcastEvent('arrest_updated', {
    id: arrest.id,
    citizenId: arrest.citizenId,
    officerId: arrest.officerId,
    date: arrest.date,
    charges: arrest.charges,
  });
}

// Funzione per notificare un nuovo rapporto
export function notifyReportCreated(report: any) {
  broadcastEvent('report_created', {
    id: report.id,
    title: report.title,
    citizenId: report.citizenId,
    officerId: report.officerId,
    type: report.type,
    date: report.date,
  });
}

// Funzione per notificare un rapporto aggiornato
export function notifyReportUpdated(report: any) {
  broadcastEvent('report_updated', {
    id: report.id,
    title: report.title,
    citizenId: report.citizenId,
    officerId: report.officerId,
    type: report.type,
    date: report.date,
  });
}

// Funzione per notificare un nuovo ricercato
export function notifyWantedCreated(wanted: any) {
  broadcastEvent('wanted_created', {
    id: wanted.id,
    citizenId: wanted.citizenId,
    reason: wanted.reason,
    dangerLevel: wanted.dangerLevel,
  });
}

// Funzione per notificare un ricercato aggiornato
export function notifyWantedUpdated(wanted: any) {
  broadcastEvent('wanted_updated', {
    id: wanted.id,
    citizenId: wanted.citizenId,
    reason: wanted.reason,
    dangerLevel: wanted.dangerLevel,
    status: wanted.status,
  });
}

// Funzione per notificare un cittadino aggiornato
export function notifyCitizenUpdated(citizenId: number) {
  broadcastEvent('citizen_updated', {
    id: citizenId,
    timestamp: Date.now(),
  });
}

// Funzione per notificare un nuovo porto d'armi
export function notifyWeaponLicenseCreated(license: any) {
  broadcastEvent('weapon_license_created', {
    id: license.id,
    citizenId: license.citizenId,
    licenseType: license.licenseType,
    status: license.status,
  });
}

// Funzione per notificare un porto d'armi aggiornato
export function notifyWeaponLicenseUpdated(license: any) {
  broadcastEvent('weapon_license_updated', {
    id: license.id,
    citizenId: license.citizenId,
    licenseType: license.licenseType,
    status: license.status,
  });
}

// Export dei tipi
export type { EventType };
