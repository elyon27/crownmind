import { doctrineRules } from './doctrine-rules.js';

export function auditDoctrine(payload = {}) {
  const {
    type = 'content',
    title = '',
    content = '',
    metadata = {},
    source = 'unknown'
  } = payload;

  const combined = `
    ${title}
    ${content}
    ${JSON.stringify(metadata)}
    ${source}
  `;

  const result = doctrineRules.contentChecks(combined);

  return {
    timestamp: new Date().toISOString(),
    type,
    source,
    title,
    pass: result.pass,
    violations: result.violations,
    warnings: result.warnings,
    reviewQuestions: result.reviewQuestions,
    action: result.pass ? 'allow' : 'block'
  };
}