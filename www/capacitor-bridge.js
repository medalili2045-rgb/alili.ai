(function() {
  'use strict';
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const AliliNative = {
    isNative, ready: false, plugins: {},
    async init() {
      if (!isNative) { this.ready = true; return; }
      await this.loadPlugins();
      this.setupBackButton();
      await this.requestPermissions();
      this.ready = true;
    },
    async loadPlugins() {
      const urls = [
        '@capacitor/app@6/dist/plugin.js',
        '@capacitor/local-notifications@6/dist/plugin.js',
        '@capacitor/filesystem@6/dist/plugin.js',
        '@capacitor/share@6/dist/plugin.js',
        '@capacitor/camera@6/dist/plugin.js',
        '@capacitor/haptics@6/dist/plugin.js',
        '@capawesome-team/capacitor-android-foreground-service@6/dist/plugin.js'
      ];
      await Promise.all(urls.map(async p => { try { await this.loadScript('https://unpkg.com/' + p); } catch(e) {} }));
      await new Promise(r => setTimeout(r, 600));
      this.plugins = window.Capacitor.Plugins || {};
    },
    loadScript(url) {
      return new Promise((res, rej) => {
        if (document.querySelector(`script[src="${url}"]`)) return res();
        const s = document.createElement('script');
        s.src = url; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    },
    setupBackButton() {
      const A = this.plugins.App; if (!A) return;
      A.addListener('backButton', () => {
        const openModal = Array.from(document.querySelectorAll('.modal')).find(m => m.style.display === 'flex');
        if (openModal) { openModal.style.display = 'none'; return; }
        const sb = document.getElementById('sb');
        if (sb && sb.classList.contains('open')) { if (window.toggleSidebar) window.toggleSidebar(false); return; }
        if (A.exitApp) A.exitApp();
      });
    },
    async requestPermissions() {
      const LN = this.plugins.LocalNotifications;
      if (LN && LN.requestPermissions) { try { await LN.requestPermissions(); } catch(e) {} }
    },
    async haptic(type = 'light') {
      if (!isNative || !this.plugins.Haptics) return;
      try {
        if (type === 'light') await this.plugins.Haptics.impact({ style: 'Light' });
        else if (type === 'medium') await this.plugins.Haptics.impact({ style: 'Medium' });
        else if (type === 'heavy') await this.plugins.Haptics.impact({ style: 'Heavy' });
        else if (type === 'success') await this.plugins.Haptics.notification({ type: 'Success' });
        else if (type === 'error') await this.plugins.Haptics.notification({ type: 'Error' });
      } catch(e) {}
    },
    async notify(title, body) {
      if (!isNative) { try { if (Notification.permission === 'granted') new Notification(title, { body }); } catch(e) {} return; }
      const LN = this.plugins.LocalNotifications; if (!LN) return;
      try { await LN.schedule({ notifications: [{ id: Math.floor(Date.now() % 2147483647), title, body, schedule: { at: new Date(Date.now() + 100) } }] }); } catch(e) {}
    },
    async saveFile(filename, base64Data) {
      if (!isNative) {
        try { const a = document.createElement('a'); a.href = base64Data; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); return true; } catch(e) { return false; }
      }
      const FS = this.plugins.Filesystem, SH = this.plugins.Share;
      if (!FS || !SH) return false;
      try {
        const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const res = await FS.writeFile({ path: filename, data: clean, directory: 'DOCUMENTS', recursive: true });
        await SH.share({ title: filename, url: res.uri, dialogTitle: 'حفظ / مشاركة' });
        return true;
      } catch(e) { return false; }
    }
  };
  window.AliliNative = AliliNative;
})();
