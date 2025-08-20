/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// @ts-nocheck

const { createClient } = supabase;

const supabaseUrl = 'https://yivpadnojkchktvzecuh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdnBhZG5vamtjaGt0dnplY3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzk5NjQsImV4cCI6MjA3MDk1NTk2NH0.Z0R7FCEdS9uYBs6KCT7k-lDb9DeYRtzuAEZHE_N4upE';
const sb = createClient(supabaseUrl, supabaseKey);

// Helper function to show notifications (toast)
const showNotification = (message, type = 'success') => {
  const toast = document.getElementById('notification-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
};

// Helper function to show auth errors
const showAuthError = (message) => {
  const authError = document.getElementById('auth-error');
  authError.textContent = message;
  authError.classList.remove('hidden');
};

const hideAuthError = () => {
  const authError = document.getElementById('auth-error');
  authError.textContent = '';
  authError.classList.add('hidden');
};

// Fetch and display announcements
const fetchAnnouncements = async () => {
    const tbody = document.getElementById('announcements-tbody');
    tbody.innerHTML = '<tr><td>Yükleniyor...</td></tr>';
    const { data, error } = await sb.from('duyuru').select('*').order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching announcements:', error.message);
        let userMessage = '';
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Veritabanına ulaşılamadı. Lütfen internet bağlantınızı ve Supabase ayarlarını (URL/Key) kontrol edin.';
        } else if (error.message.includes('schema cache')) {
            userMessage = '`duyuru` tablosu veritabanında bulunamadı. Lütfen Supabase projenizde tabloyu oluşturduğunuzdan emin olun.';
        } else {
            userMessage = `Duyurular yüklenemedi. Hata: ${error.message}`;
        }
        tbody.innerHTML = `<tr><td>${userMessage}</td></tr>`;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td>Gösterilecek duyuru yok.</td></tr>';
        return;
    }
    tbody.innerHTML = ''; // Clear loading message
    data.forEach(announcement => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${announcement.content}</td>`;
        tbody.appendChild(tr);
    });
};

// Fetch and display events
const fetchEvents = async () => {
    const tbody = document.getElementById('events-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Yükleniyor...</td></tr>';
    const { data, error } = await sb.from('etkinlik').select('*').order('date', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error.message);
        let userMessage = '';
        if (error.message.includes('Failed to fetch')) {
            userMessage = 'Veritabanına ulaşılamadı. Lütfen internet bağlantınızı ve Supabase ayarlarını (URL/Key) kontrol edin.';
        } else if (error.message.includes('schema cache')) {
            userMessage = '`etkinlik` tablosu veritabanında bulunamadı. Lütfen Supabase projenizde tabloyu oluşturduğunuzdan emin olun.';
        } else {
            userMessage = `Etkinlikler yüklenemedi. Hata: ${error.message}`;
        }
        tbody.innerHTML = `<tr><td colspan="3">${userMessage}</td></tr>`;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Yaklaşan etkinlik yok.</td></tr>';
        return;
    }
    tbody.innerHTML = ''; // Clear loading message
    data.forEach(event => {
        const tr = document.createElement('tr');
        const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric'});
        tr.innerHTML = `<td>${event.name}</td><td>${formattedDate}</td><td>${event.location}</td>`;
        tbody.appendChild(tr);
    });
};


document.addEventListener('DOMContentLoaded', () => {
  // Centralized DOM element selection
  const DOM = {
    loginTab: document.getElementById('login-tab'),
    signupTab: document.getElementById('signup-tab'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    authContainer: document.getElementById('auth-container'),
    homeContainer: document.getElementById('home-container'),
    logoutTabMain: document.getElementById('logout-tab-main'),
    welcomeMessage: document.getElementById('welcome-message'),
    addAnnouncementForm: document.getElementById('add-announcement-form'),
    addEventForm: document.getElementById('add-event-form'),
    homeTabs: {
      announcements: document.getElementById('announcements-tab-main'),
      events: document.getElementById('events-tab-main'),
      admin: document.getElementById('admin-tab-main'),
    },
    homeSections: {
      announcements: document.getElementById('announcements-section'),
      events: document.getElementById('events-section'),
      admin: document.getElementById('admin-controls'),
    }
  };

  // Auth Tab switching logic
  DOM.loginTab?.addEventListener('click', () => {
    DOM.loginTab.classList.add('active');
    DOM.signupTab?.classList.remove('active');
    DOM.loginForm?.classList.remove('hidden');
    DOM.signupForm?.classList.add('hidden');
    hideAuthError();
  });

  DOM.signupTab?.addEventListener('click', () => {
    DOM.signupTab.classList.add('active');
    DOM.loginTab?.classList.remove('active');
    DOM.signupForm?.classList.remove('hidden');
    DOM.loginForm?.classList.add('hidden');
    hideAuthError();
  });

  // Refactored Home page tab switching logic
  const allHomeTabs = Object.values(DOM.homeTabs);
  const allHomeSections = Object.values(DOM.homeSections);

  const setActiveHomeTab = (tabToShow) => {
    allHomeTabs.forEach(tab => tab?.classList.remove('active'));
    allHomeSections.forEach(section => section?.classList.add('hidden'));

    DOM.homeTabs[tabToShow]?.classList.add('active');
    DOM.homeSections[tabToShow]?.classList.remove('hidden');
  };

  DOM.homeTabs.announcements?.addEventListener('click', () => setActiveHomeTab('announcements'));
  DOM.homeTabs.events?.addEventListener('click', () => setActiveHomeTab('events'));
  DOM.homeTabs.admin?.addEventListener('click', () => setActiveHomeTab('admin'));

  // Handle Login
  DOM.loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAuthError();
    const email = (DOM.loginForm.elements.namedItem('email')).value;
    const password = (DOM.loginForm.elements.namedItem('password')).value;
    const submitButton = DOM.loginForm.querySelector('button[type="submit"]');

    try {
      submitButton.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) showAuthError(error.message);
      else DOM.loginForm.reset();
    } catch (err) {
      showAuthError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      submitButton.disabled = false;
    }
  });

  // Handle Sign Up
  DOM.signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAuthError();
    const email = (DOM.signupForm.elements.namedItem('email')).value;
    const password = (DOM.signupForm.elements.namedItem('password')).value;
    const confirmPassword = (DOM.signupForm.elements.namedItem('confirm-password')).value;
    const role = (DOM.signupForm.elements.namedItem('role')).value;
    const submitButton = DOM.signupForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
      showAuthError('Şifreler uyuşmuyor.');
      return;
    }

    try {
      submitButton.disabled = true;
      const { data, error } = await sb.auth.signUp({ 
        email, 
        password,
        options: { data: { role: role } }
      });
      if (error) {
        showAuthError(error.message);
      } else if (data.user?.identities?.length === 0) {
        showAuthError('Bu e-posta adresine sahip bir kullanıcı zaten mevcut.');
      } else {
        showNotification('Kayıt başarılı! Lütfen onay için e-postanızı kontrol edin.', 'success');
        DOM.signupForm.reset();
        DOM.loginTab?.click();
      }
    } catch (err) {
      showAuthError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      submitButton.disabled = false;
    }
  });
  
  // Handle Logout
  DOM.logoutTabMain?.addEventListener('click', async () => {
    const { error } = await sb.auth.signOut();
    if (error) showNotification(error.message, 'error');
  });

  // Handle add announcement
  DOM.addAnnouncementForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const content = (form.elements.namedItem('content')).value;
    const submitButton = form.querySelector('button[type="submit"]');
    
    try {
        submitButton.disabled = true;
        const { error } = await sb.from('duyuru').insert([{ content }]);
        if (error) {
            showNotification('Duyuru eklenemedi: ' + error.message, 'error');
        } else {
            form.reset();
            fetchAnnouncements();
            showNotification('Duyuru başarıyla eklendi.', 'success');
            setActiveHomeTab('announcements');
        }
    } catch (err) {
        showNotification('Beklenmedik bir hata oluştu.', 'error');
    } finally {
        submitButton.disabled = false;
    }
  });

  // Handle add event
  DOM.addEventForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = (form.elements.namedItem('name')).value;
    const date = (form.elements.namedItem('date')).value;
    const location = (form.elements.namedItem('location')).value;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        const { error } = await sb.from('etkinlik').insert([{ name, date, location }]);
        if (error) {
            showNotification('Etkinlik eklenemedi: ' + error.message, 'error');
        } else {
            form.reset();
            fetchEvents();
            showNotification('Etkinlik başarıyla eklendi.', 'success');
            setActiveHomeTab('events');
        }
    } catch (err) {
        showNotification('Beklenmedik bir hata oluştu.', 'error');
    } finally {
        submitButton.disabled = false;
    }
  });

  // Auth state change listener
  sb.auth.onAuthStateChange((event, session) => {
    if (session) {
      DOM.homeContainer?.classList.remove('hidden');
      DOM.authContainer?.classList.add('hidden');
      
      const userRole = session.user.user_metadata.role || 'guest';
      const roleText = userRole === 'admin' ? 'Öğretmen' : 'Öğrenci';
      DOM.welcomeMessage.textContent = `Hoşgeldin, ${session.user.email} (${roleText})`;

      fetchAnnouncements();
      fetchEvents();

      if (userRole === 'admin') {
        DOM.homeTabs.admin?.classList.remove('hidden');
      } else {
        DOM.homeTabs.admin?.classList.add('hidden');
        DOM.homeSections.admin?.classList.add('hidden');
      }

      setActiveHomeTab('announcements');
    } else {
      DOM.homeContainer?.classList.add('hidden');
      DOM.authContainer?.classList.remove('hidden');
      DOM.loginForm.reset();
      DOM.signupForm.reset();
      DOM.loginTab?.click();
    }
  });
});