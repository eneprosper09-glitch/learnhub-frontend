import { passwordChecks } from '../utils/password';

export default function PasswordChecklist({ password, showWhenEmpty = true }) {
  if (!password && !showWhenEmpty) return null;

  const checks = passwordChecks(password);

  return (
    <ul className="mt-2 space-y-1 text-xs">
      {checks.map((c) => (
        <li
          key={c.key}
          className={c.ok ? 'text-green-600' : 'text-slate-500'}
        >
          {c.ok ? '✓' : '○'} {c.label}
        </li>
      ))}
    </ul>
  );
}