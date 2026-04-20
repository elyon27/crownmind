import doctrineConfig from './doctrine-config.json' assert { type: 'json' };

export const doctrineRules = {
  requiredPrinciples: doctrineConfig.immutable_principles,

  bannedTerms: [
    'submit to crownmind',
    'only crownmind can',
    'chosen tier',
    'elite agent',
    '144k agents',
    'obey the system',
    'you must follow us',
    'exclusive spiritual class'
  ],

  softWarningTerms: [
    'dominate',
    'control minds',
    'influence them deeply',
    'convert at all costs',
    'optimize persuasion',
    'keep them dependent',
    'bind them to the platform'
  ],

  contentChecks(content = '') {
    const text = String(content).toLowerCase();

    const violations = [];
    const warnings = [];

    for (const term of this.bannedTerms) {
      if (text.includes(term)) {
        violations.push(`Forbidden phrase detected: ${term}`);
      }
    }

    for (const term of this.softWarningTerms) {
      if (text.includes(term)) {
        warnings.push(`High-risk phrase detected: ${term}`);
      }
    }

    if (text.includes('crownmind is the answer')) {
      violations.push('System-centered claim detected.');
    }

    if (text.includes('follow crownmind instead of')) {
      violations.push('Dependency-forming language detected.');
    }

    if (text.includes('special rank') || text.includes('inner circle')) {
      violations.push('Hierarchical identity language detected.');
    }
};