import { runPageChaos } from './content.js';

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: runPageChaos,
                    args: [mode],
                    world: 'MAIN'
                }, () => {
                    setTimeout(() => window.close(), 150);
                });
            }
        });
    });
});
