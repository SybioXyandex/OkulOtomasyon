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

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin.

### 1. Supabase Projesi Oluşturma

1.  **Hesap Oluşturun:** [Supabase](https://supabase.com/)'e gidin ve bir hesap oluşturun.
2.  **Yeni Proje Başlatın:** "New Project" butonuna tıklayarak yeni bir proje oluşturun. Projeniz için bir isim ve veritabanı şifresi belirleyin.
3.  **API Anahtarlarını Alın:** Proje panosunda `Settings` > `API` bölümüne gidin. `Project URL` ve `anon` `public` anahtarını kopyalayın. Bu bilgilere daha sonra ihtiyacınız olacak.

### 2. Veritabanı Tablolarını Oluşturma

Supabase projenizin `Table Editor` bölümüne gidin ve aşağıdaki iki tabloyu oluşturun.

#### `duyuru` Tablosu
- **`id`**: `uuid` (Primary Key, varsayılan olarak `uuid_generate_v4()`)
- **`created_at`**: `timestamptz` (Varsayılan olarak `now()`)
- **`content`**: `text`

#### `etkinlik` Tablosu
- **`id`**: `uuid` (Primary Key, varsayılan olarak `uuid_generate_v4()`)
- **`created_at`**: `timestamptz` (Varsayılan olarak `now()`)
- **`name`**: `text`
- **`date`**: `date`
- **`location`**: `text`

### 3. Erişim Politikalarını (RLS) Ayarlama

Veri güvenliği için Satır Seviyesi Güvenliği'ni (Row Level Security - RLS) etkinleştirmeniz gerekir.

`Authentication` > `Policies` bölümüne gidin. `duyuru` ve `etkinlik` tabloları için RLS'yi etkinleştirin ve aşağıdaki politikaları oluşturun:

#### `duyuru` Tablosu Politikaları:
1.  **Politika (SELECT):** "Enable read access for authenticated users"
    - **Target Roles:** `authenticated`
    - **Using Expression:** `true`
2.  **Politika (INSERT):** "Enable insert for admins"
    - **Target Roles:** `authenticated`
    - **Using Expression:** `(auth.jwt() ->> 'user_metadata' ->> 'role'::text) = 'admin'::text`

#### `etkinlik` Tablosu Politikaları:
1.  **Politika (SELECT):** "Enable read access for authenticated users"
    - **Target Roles:** `authenticated`
    - **Using Expression:** `true`
2.  **Politika (INSERT):** "Enable insert for admins"
    - **Target Roles:** `authenticated`
    - **Using Expression:** `(auth.jwt() ->> 'user_metadata' ->> 'role'::text) = 'admin'::text`

### 4. Projeyi Yerelde Çalıştırma

1.  **Projeyi Klonlayın:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Supabase Bilgilerini Güncelleyin:**
    `index.tsx` dosyasını açın ve Supabase URL ve anahtarınızı ilgili alanlara yapıştırın:
    ```javascript
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
    ```
3.  **Uygulamayı Başlatın:**
    Proje dosyalarını bir yerel sunucu ile sunmanız gerekir. Bunun için [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) eklentisini kullanabilir veya terminal üzerinden basit bir Python sunucusu başlatabilirsiniz:
    ```bash
    # Python 3
    python -m http.server
    ```
    Tarayıcınızda `http://localhost:8000` (veya sunucunun belirttiği port) adresine gidin.

Artık uygulama yerel makinenizde çalışıyor! Yeni kullanıcılar kaydedebilir, giriş yapabilir ve özellikleri test edebilirsiniz.
