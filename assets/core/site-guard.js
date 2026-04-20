import { auditDoctrine } from '../core/doctrine-audit.js';

export function enforceDoctrine(payload) {
  const audit = auditDoctrine(payload);

  if (!audit.pass) {
    console.error('Doctrine audit failed:', audit);
    return {
      allowed: false,
      audit
    };
  }

  if (audit.warnings.length) {
    console.warn('Doctrine audit warnings:', audit.warnings);
  }

  return {
    allowed: true,
    audit
  };
}