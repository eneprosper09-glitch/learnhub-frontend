export const passwordChecks = (password) => {
  const pwd = String(password || '');
  return [
    { key: 'length', label: 'At least 8 characters', ok: pwd.length >= 8 },
    { key: 'upper', label: 'An uppercase letter', ok: /[A-Z]/.test(pwd) },
    { key: 'lower', label: 'A lowercase letter', ok: /[a-z]/.test(pwd) },
    { key: 'digit', label: 'A number', ok: /[0-9]/.test(pwd) },
    { key: 'special', label: 'A special character', ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
};

export const isStrongPassword = (password) =>
  passwordChecks(password).every((c) => c.ok);

export const passwordScore = (password) => {
  const checks = passwordChecks(password);
  return checks.filter((c) => c.ok).length;
};