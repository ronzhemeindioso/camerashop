import Swal from 'sweetalert2'

// Confirmation popup used across the admin pages - same look as the order status update.
// Styles (po-swal-*) live in Components/Admin/admin.css, which every admin page loads.
const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`

const ICONS = {
    trash: svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
    undo: svg('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
    ban: svg('<circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/>'),
    check: svg('<circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
    alert: svg('<circle cx="12" cy="12" r="10"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.4" r=".6" fill="currentColor"/>'),
}

const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// tone: '' (green) | 'warn' (orange) | 'danger' (red). Resolves to true when confirmed.
export const confirmDialog = async ({ icon = 'alert', tone = '', title, text = '', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    const result = await Swal.fire({
        html: `<div class="po-swal-icon ${tone}">${ICONS[icon]}</div>` +
            `<h3 class="po-swal-title">${escapeHtml(title)}</h3><p class="po-swal-text">${escapeHtml(text)}</p>`,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        buttonsStyling: false,
        reverseButtons: false,
        customClass: {
            container: 'po-swal-bg',
            popup: 'po-swal',
            htmlContainer: 'po-swal-body',
            closeButton: 'po-swal-close',
            actions: 'po-swal-actions',
            confirmButton: `po-swal-confirm ${tone}`,
            cancelButton: 'po-swal-cancel',
        },
    })
    return result.isConfirmed
}

// ready-made dialogs
export const confirmTrash = (title, text = 'You can restore it later.') =>
    confirmDialog({ icon: 'trash', tone: 'danger', title, text, confirmText: 'Move to trash' })

export const confirmRestore = (title, text = 'It will go back to the active list.') =>
    confirmDialog({ icon: 'undo', tone: '', title, text, confirmText: 'Restore' })

export const confirmPermanent = (title, text) =>
    confirmDialog({ icon: 'alert', tone: 'danger', title, text, confirmText: 'Delete forever' })

export const confirmInactivate = (title, text = 'They will not be able to log in until you activate them again.') =>
    confirmDialog({ icon: 'ban', tone: 'warn', title, text, confirmText: 'Inactivate' })

export const confirmActivate = (title, text = 'They will be able to log in again.') =>
    confirmDialog({ icon: 'check', tone: '', title, text, confirmText: 'Activate' })
