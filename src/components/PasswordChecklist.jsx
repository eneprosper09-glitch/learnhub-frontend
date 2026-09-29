import { passwordChecks } from '../utils/password';

export default function PasswordChecklist({ password, showWhenEmpty = true }) {
  if (!password && !showWhenEmpty) return null;

  const checks = passwordChecks(password);

  return (
    <ul className="mt-2 space-y-1 text-xs">
      {checks.map((c) => (
        <li
          key={c.key}
          className={`flex items-center gap-2 ${
            c.ok ? 'text-green-600 font-medium' : 'text-ink-400'
          }`}
        >
          <span className="w-4 inline-block">{c.ok ? '✓' : '○'}</span>
          <span>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}