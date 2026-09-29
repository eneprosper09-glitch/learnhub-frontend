import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-ink-600">{message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          className="px-4 py-2 rounded-xl border border-ink-200 text-ink-700 font-medium hover:bg-ink-50 transition"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 shadow-sm transition"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}