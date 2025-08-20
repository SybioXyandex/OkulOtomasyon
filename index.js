// ====================================================================================
// DOM Elemanları
// ====================================================================================
const authContainer = document.getElementById('auth-container');
const homeContainer = document.getElementById('home-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const authError = document.getElementById('auth-error');

const welcomeMessage = document.getElementById('welcome-message');
const announcementsTab = document.getElementById('announcements-tab-main');
const eventsTab = document.getElementById('events-tab-main');
const adminTab = document.getElementById('admin-tab-main');
const logoutTab = document.getElementById('logout-tab-main');

const announcementsSection = document.getElementById('announcements-section');
const eventsSection = document.getElementById('events-section');
const adminControls = document.getElementById('admin-controls');
const announcementsTbody = document.getElementById('announcements-tbody');
const eventsTbody = document.getElementById('events-tbody');

const addAnnouncementForm = document.getElementById('add-announcement-form');
const addEventForm = document.getElementById('add-event-form');
const notificationToast = document.getElementById('notification-toast');

// ====================================================================================
// Supabase Yapılandırması ve İstemcisi
// Kendi Supabase projenizin URL ve Anon Anahtarını buraya ekleyin.
// ====================================================================================
const SUPABASE_URL = 'https://peettiigrkhtloqschwe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZXR0aWlncmtodGxvcXNjaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzMsImV4cCI6MjA3MTIwMzczM30.mnnIlRJaRQP2RnHyb-0Sp0AwPE6hTUe5uWrMi-Q6pnc';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================================================
// Yardımcı Fonksiyonlar
// ====================================================================================

/**
 * Toast bildirimini gösterir.
 * @param {string} message - Gösterilecek mesaj.
 * @param {boolean} isError - Hata bildirimi mi olduğunu belirtir.
 */
function showToast(message, isError = false) {
    notificationToast.textContent = message;
    notificationToast.classList.remove('hidden', 'success', 'error');
    if (isError) {
        notificationToast.classList.add('error');
    } else {
        notificationToast.classList.add('success');
    }
    notificationToast.classList.add('visible');

    setTimeout(() => {
        notificationToast.classList.remove('visible');
        notificationToast.classList.add('hidden');
    }, 3000);
}

/**
 * Kimlik doğrulama arayüzünü (login/signup) gösterir ve ana sayfayı gizler.
 */
function showAuthUI() {
    authContainer.classList.remove('hidden');
    homeContainer.classList.add('hidden');
    authError.classList.add('hidden');
}

/**
 * Ana sayfa arayüzünü gösterir ve kimlik doğrulama sayfasını gizler.
 */
function showHomeUI() {
    authContainer.classList.add('hidden');
    homeContainer.classList.remove('hidden');
}

/**
 * Verilen role göre arayüzü günceller.
 * @param {string} role - Kullanıcının rolü ('guest' veya 'admin').
 */
function updateUIForRole(role) {
    if (role === 'admin') {
        adminTab.classList.remove('hidden');
        adminControls.classList.remove('hidden');
    } else {
        adminTab.classList.add('hidden');
        adminControls.classList.add('hidden');
    }
}

// ====================================================================================
// Veri Yükleme Fonksiyonları
// ====================================================================================

/**
 * Duyuruları veritabanından çeker ve tabloya ekler.
 */
async function fetchAndRenderAnnouncements() {
    announcementsTbody.innerHTML = ''; // Tabloyu temizle
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Duyurular yüklenirken hata oluştu:', error.message);
        showToast('Duyurular yüklenemedi.', true);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(announcement => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${announcement.content}</td>`;
            announcementsTbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td>Henüz duyuru bulunmamaktadır.</td>`;
        announcementsTbody.appendChild(row);
    }
}

/**
 * Etkinlikleri veritabanından çeker ve tabloya ekler.
 */
async function fetchAndRenderEvents() {
    eventsTbody.innerHTML = ''; // Tabloyu temizle
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Etkinlikler yüklenirken hata oluştu:', error.message);
        showToast('Etkinlikler yüklenemedi.', true);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(event => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.name}</td>
                <td>${event.date}</td>
                <td>${event.location}</td>
            `;
            eventsTbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3">Henüz etkinlik bulunmamaktadır.</td>`;
        eventsTbody.appendChild(row);
    }
}

// ====================================================================================
// Kimlik Doğrulama İşlemleri
// ====================================================================================

/**
 * Supabase kimlik doğrulama durumundaki değişiklikleri dinler.
 * Kullanıcı giriş yaptığında veya çıkış yaptığında arayüzü günceller.
 */
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        showHomeUI();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            welcomeMessage.textContent = `Hoş geldin, ${user.email}`;

            // Kullanıcı rolünü profil tablosundan çek
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Kullanıcı rolü çekilirken hata oluştu:', error.message);
            }

            if (profile) {
                updateUIForRole(profile.role);
            }

            // İlk olarak duyuruları göster
            announcementsTab.click();
        }
    } else {
        showAuthUI();
        welcomeMessage.textContent = 'Anasayfa';
        adminTab.classList.add('hidden');
    }
});

// ====================================================================================
// Olay Dinleyicileri (Event Listeners)
// ====================================================================================

// --- Sekme Değiştirme (Login/Signup) ---
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    authError.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authError.classList.add('hidden');
});

// --- Ana Sayfa Sekmeleri ---
announcementsTab.addEventListener('click', () => {
    document.querySelectorAll('#home-container .tab-buttons button').forEach(btn => btn.classList.remove('active'));
    announcementsTab.classList.add('active');
    announcementsSection.classList.remove('hidden');
    eventsSection.classList.add('hidden');
    adminControls.classList.add('hidden');
    fetchAndRenderAnnouncements();
});

eventsTab.addEventListener('click', () => {
    document.querySelectorAll('#home-container .tab-buttons button').forEach(btn => btn.classList.remove('active'));
    eventsTab.classList.add('active');
    announcementsSection.classList.add('hidden');
    eventsSection.classList.remove('hidden');
    adminControls.classList.add('hidden');
    fetchAndRenderEvents();
});

adminTab.addEventListener('click', () => {
    document.querySelectorAll('#home-container .tab-buttons button').forEach(btn => btn.classList.remove('active'));
    adminTab.classList.add('active');
    announcementsSection.classList.add('hidden');
    eventsSection.classList.add('hidden');
    adminControls.classList.remove('hidden');
});

logoutTab.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showToast('Çıkış yapılırken bir hata oluştu.', true);
    } else {
        showToast('Başarıyla çıkış yapıldı.');
    }
});

// --- Form Gönderimleri ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
        showToast('Giriş başarısız.', true);
    } else {
        authError.classList.add('hidden');
        showToast('Başarıyla giriş yapıldı!');
        loginForm.reset();
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target['signup-email'].value;
    const password = e.target['signup-password'].value;
    const confirmPassword = e.target['confirm-password'].value;
    const role = e.target.role.value;

    if (password !== confirmPassword) {
        authError.textContent = 'Şifreler eşleşmiyor.';
        authError.classList.remove('hidden');
        showToast('Şifreler eşleşmiyor.', true);
        return;
    }

    const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: role // Rol bilgisini metaveriye ekleyebiliriz
            }
        }
    });

    if (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
        showToast('Kayıt başarısız.', true);
    } else {
        authError.classList.add('hidden');
        // Kullanıcıyı profiles tablosuna ekle
        if (user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({ id: user.id, email: user.email, role: role });

            if (profileError) {
                console.error('Profil eklenirken hata oluştu:', profileError.message);
            }
        }

        showToast('Kayıt başarılı. Lütfen e-postanızı kontrol edin.');
        signupForm.reset();
        loginTab.click(); // Kayıt sonrası giriş sayfasına yönlendir
    }
});

addAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = e.target['announcement-content'].value;

    const { error } = await supabase
        .from('announcements')
        .insert([{ content }]);

    if (error) {
        showToast('Duyuru eklenirken hata oluştu.', true);
        console.error('Duyuru eklenirken hata:', error.message);
    } else {
        showToast('Duyuru başarıyla yayınlandı.');
        addAnnouncementForm.reset();
        fetchAndRenderAnnouncements(); // Duyuruları yenile
    }
});

addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target['event-name'].value;
    const date = e.target['event-date'].value;
    const location = e.target['event-location'].value;

    const { error } = await supabase
        .from('events')
        .insert([{ name, date, location }]);

    if (error) {
        showToast('Etkinlik eklenirken hata oluştu.', true);
        console.error('Etkinlik eklenirken hata:', error.message);
    } else {
        showToast('Etkinlik başarıyla eklendi.');
        addEventForm.reset();
        fetchAndRenderEvents(); // Etkinlikleri yenile
    }
});

// Sayfa yüklendiğinde mevcut oturumu kontrol et

supabase.auth.getSession();
