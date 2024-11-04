/**
 * Creates modern, draggable notification-style popups
 * @param {Object} config - Configuration object for the popup
 * @param {string} config.message - The message to display
 * @param {string} [config.title] - Optional title for the notification
 * @param {string} [config.icon] - Optional icon URL
 * @param {string} [config.imageShape='circle'] - Shape of the icon ('circle' or 'square')
 * @param {number} [config.delay=0] - Delay before showing
 * @param {number} [config.duration=5000] - How long to display before auto-dismiss
 * @param {string} [config.theme='dark'] - Theme ('dark' or 'light')
 */
function createPopup(config) {
    // Add Lexend font
    if (!document.querySelector('#lexend-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'lexend-font';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&display=swap';
        document.head.appendChild(fontLink);
    }

    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const defaults = {
        message: '',
        title: '',
        icon: '',
        imageShape: 'circle',
        delay: 0,
        duration: 5000,
        theme: 'dark'
    };

    const settings = { ...defaults, ...config };

    // Theme-based styles
    const themes = {
        dark: {
            background: 'rgba(37, 37, 37, 0.95)',
            color: '#FFFFFF',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            titleColor: 'rgba(255, 255, 255, 0.95)',
            messageColor: 'rgba(255, 255, 255, 0.8)',
            closeButtonColor: 'rgba(255, 255, 255, 0.5)',
            shadow: '0 4px 24px rgba(0,0,0,0.2)'
        },
        light: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#000000',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            titleColor: 'rgba(0, 0, 0, 0.95)',
            messageColor: 'rgba(0, 0, 0, 0.8)',
            closeButtonColor: 'rgba(0, 0, 0, 0.5)',
            shadow: '0 4px 24px rgba(0,0,0,0.1)'
        }
    };

    const theme = themes[settings.theme] || themes.dark;

    const notification = document.createElement('div');
    notification.style.cssText = `
        font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${theme.background};
        color: ${theme.color};
        padding: ${settings.imageShape === 'square' ? '0' : '16px'};
        margin-bottom: 10px;
        border-radius: 16px;
        box-shadow: ${theme.shadow};
        transform: translateX(420px);
        position: relative;
        width: 380px; /* Set a fixed width */
        display: flex;
        align-items: stretch;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid ${theme.borderColor};
        pointer-events: auto;
        cursor: grab;
        user-select: none;
        touch-action: none;
        opacity: 0;
        will-change: transform, opacity;
        overflow: hidden;
        /* Add word wrapping */
        word-wrap: break-word;
    `;

    let iconHtml = '';
    if (settings.icon) {
        if (settings.imageShape === 'circle') {
            iconHtml = `<img src="${settings.icon}" style="
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
                pointer-events: none;
                -webkit-user-drag: none;
                margin-right: 16px;
                flex-shrink: 0;
            " draggable="false">`;
        } else {
            iconHtml = `<div style="
                flex-shrink: 0;
                width: 64px;
                margin-right: 16px;
            "><img src="${settings.icon}" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
                -webkit-user-drag: none;
            " draggable="false"></div>`;
        }
    }

    let titleHtml = '';
    if (settings.title) {
        titleHtml = `<div style="font-weight: 600; font-size: 17px; margin-bottom: 4px; color: ${theme.titleColor};">${settings.title}</div>`;
    }

    notification.innerHTML = `
        ${settings.imageShape === 'square' ? iconHtml : ''}
        <div style="
            flex-grow: 1;
            padding: ${settings.imageShape === 'square' ? '16px' : '0'};
            padding-left: ${settings.imageShape === 'square' ? '0' : '0'};
            display: flex;
            align-items: ${settings.imageShape === 'square' ? 'flex-start' : 'center'};
            gap: ${settings.imageShape === 'square' ? '12px' : '0'};
        ">
            ${settings.imageShape === 'circle' ? iconHtml : ''}
            <div style="flex-grow: 1; ${settings.imageShape === 'circle' ? 'padding-right: 12px;' : ''}">
                ${titleHtml}
                <div style="color: ${theme.messageColor}; font-size: 15px; line-height: 1.4; font-weight: 400;">${settings.message}</div>
            </div>
            <button class="close-btn" style="
                font-family: 'Lexend', sans-serif;
                background: none;
                border: none;
                color: ${theme.closeButtonColor};
                cursor: pointer;
                padding: 4px;
                font-size: 18px;
                line-height: 1;
                transition: color 0.2s;
                opacity: 0;
                transition: opacity 0.2s;
                margin-left: 8px;
                flex-shrink: 0;
            ">×</button>
        </div>
    `;

    // Add hover effect for close button
    notification.addEventListener('mouseenter', () => {
        notification.querySelector('.close-btn').style.opacity = '1';
    });
    notification.addEventListener('mouseleave', () => {
        notification.querySelector('.close-btn').style.opacity = '0';
    });

    // Dragging functionality
    let isDragging = false;
    let startX;
    let startTranslateX;
    let currentTranslateX = 0;

    function handleDragStart(e) {
        if (e.target.tagName === 'IMG') return;
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        notification.style.transition = 'none';
        notification.style.cursor = 'grabbing';
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        currentTranslateX = Math.max(0, deltaX);
        
        notification.style.transform = `translateX(${currentTranslateX}px)`;

        if (currentTranslateX > 100) {
            isDragging = false;
            dismissNotification();
        }
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        notification.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        if (currentTranslateX <= 100) {
            notification.style.transform = 'translateX(0)';
        }
        
        notification.style.cursor = 'grab';
        currentTranslateX = 0;
    }

    function dismissNotification() {
        notification.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        notification.style.transform = 'translateX(420px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }

    notification.addEventListener('mousedown', handleDragStart);
    notification.addEventListener('touchstart', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    // Close button functionality
    notification.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        dismissNotification();
    });

    setTimeout(() => {
        container.appendChild(notification);
        // Force a reflow to ensure the initial state is rendered
        notification.offsetHeight;
        
        // Add transition after the element is added to ensure animation works
        notification.style.transition = 'all 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Trigger the animation in the next frame
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto dismiss after duration if specified
        if (settings.duration > 0) {
            setTimeout(dismissNotification, settings.duration);
        }
    }, settings.delay);

    // Clean up event listeners when notification is removed
    function cleanup() {
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    }

    notification.addEventListener('remove', cleanup);
}
/**
 * Shows a notification with title and message
 * @param {string} title - The notification title
 * @param {string} message - The message to display
 * @param {string} [icon=''] - Optional icon URL
 * @param {number} [delay=0] - Delay in milliseconds before showing
 * @param {string} [theme='dark'] - Theme ('dark' or 'light')
 * @param {number} [duration=5000] - Duration to show notification (0 for no auto-dismiss)
 * @param {string} [imageShape='circle'] - Shape of the icon ('circle' or 'square')
 */
function showPopup(title, message, icon = '', delay = 0, theme = 'dark', duration = 5000, imageShape = 'circle') {
    createPopup({
        title: title,
        message: message,
        icon: icon,
        delay: delay,
        theme: theme,
        duration: duration,
        imageShape: imageShape
    });
}
