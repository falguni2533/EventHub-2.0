// Simple non-blocking toasts. Works with all of these imports:
//   import toast from '../utils/toast'
//   import { toast } from '../utils/toast'
//   import { Toaster } from '../utils/toast'   (renders nothing, kept for compatibility)

export const Toaster = () => null;

const COLORS = {
  success: ['#dcfce7', '#166534'],
  error: ['#fee2e2', '#991b1b'],
  info: ['#ede9fe', '#5b21b6'],
  loading: ['#fef9c3', '#854d0e'],
};

function show(message, type = 'info') {
  if (typeof document === 'undefined') return;

  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(box);
  }

  const [bg, fg] = COLORS[type] || COLORS.info;
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `background:${bg};color:${fg};padding:10px 14px;border-radius:10px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.12);max-width:320px`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
  return el;
}

export const toast = Object.assign((msg) => show(msg, 'info'), {
  success: (msg) => show(msg, 'success'),
  error: (msg) => show(msg, 'error'),
  info: (msg) => show(msg, 'info'),
  loading: (msg) => show(msg, 'loading'),
});

export default toast;