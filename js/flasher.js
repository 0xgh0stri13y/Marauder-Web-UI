if (!('serial' in navigator)) {
    const errorEl = document.getElementById('no-webserial');
    if (errorEl) errorEl.style.display = 'block';
}

function updateManifest(firmware) {
    const select = document.getElementById(firmware + '-variant');
    const flashBtn = document.getElementById(firmware + '-flash');
    if (select && flashBtn) {
        flashBtn.setAttribute('manifest', 'firmware/' + firmware + '/manifest_' + select.value + '.json');
    }
}

// Initialize all manifests on page load to prevent desync if browser remembers dropdown state
window.addEventListener('DOMContentLoaded', () => {
    ['marauder', 'bruce', 'nrfbox', 'esp32div', 'rfclown', 'biscuit'].forEach(fw => {
        if (document.getElementById(fw + '-variant')) {
            updateManifest(fw);
        }
    });
});
