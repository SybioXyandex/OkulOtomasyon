# Sedat Yayla Okul Portalı

Bu proje, öğrenciler ve öğretmenler için basit bir okul portalıdır. Kullanıcıların duyuruları ve yaklaşan etkinlikleri görüntülemesine olanak tanır. Öğretmen rolüne sahip kullanıcılar (admin) yeni duyurular ve etkinlikler ekleyebilir.

Uygulama, modern web teknolojileri kullanılarak oluşturulmuştur ve PWA (Progressive Web App) özellikleri sayesinde çevrimdışı destek sunar.

## ✨ Özellikler

- **Kullanıcı Kimlik Doğrulama:** E-posta ve şifre ile kayıt olma ve giriş yapma.
- **Rol Tabanlı Erişim:**
  - **Öğrenci (guest):** Duyuruları ve etkinlikleri görüntüleyebilir.
  - **Öğretmen (admin):** Duyuruları/etkinlikleri görüntüleyebilir ve yeni kayıtlar ekleyebilir.
- **Duyurular:** Yöneticiler tarafından eklenen ve tüm kullanıcılar tarafından görülebilen duyurular listesi.
- **Etkinlikler:** Yöneticiler tarafından eklenen ve yaklaşan etkinliklerin bir listesi.
- **Yönetici Paneli:** Öğretmenlerin yeni içerik eklemesi için özel bir bölüm.
- **Duyarlı Tasarım:** Mobil ve masaüstü cihazlarda sorunsuz çalışır.
- **Çevrimdışı Yetenek:** Service Worker sayesinde temel uygulama dosyaları önbelleğe alınır ve çevrimdışı erişim sağlanır.
- **Bildirimler:** Başarılı veya hatalı işlemler için kullanıcı dostu bildirimler (toast).

## 🛠️ Kullanılan Teknolojiler

- **Frontend:**
  - HTML5
  - CSS3
  - TypeScript (Vanilla, framework yok)
- **Backend (BaaS - Backend as a Service):**
  - **Supabase:**
    - Veritabanı (PostgreSQL)
    - Kimlik Doğrulama (Authentication)
    - Anında API'ler (Instant APIs)
- **PWA:**
  - Service Worker
  - Web App Manifest
