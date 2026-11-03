# Lineup yönetimi

Steam ile giriş yaptıktan sonra profil menüsündeki **Lineup yönetimi** bağlantısını aç.
Yetki, kullanıcı adına değil `76561199158267709` Steam hesabına bağlıdır.

1. Harita ve mevcut atışı seç veya Yeni atış'a bas.
2. Başlangıç/Düşüş seçerek radarda iki noktayı işaretle. Çok katlı haritalarda katları ayrı seç.
3. Taraf, bomba türü ve atış açıklamalarını düzenle.
4. Kendi MP4/WebM videonu yükle (klip başına 32 MB).
5. Taslağı kaydet. Video ve değişiklikler yayınlanana kadar yöneticiye özeldir.
6. Kaydedilmiş taslağı yayımla, ardından normal katalog sayfasını yenile.

Bir kaydı kaldırmak için Gizle kutusunu işaretleyip kaydet ve yayımla. Aynı kaydı düzenleyerek geri açabilirsin.
JSON dışa aktarımı video dosyalarını içermez. Orijinal videoları ayrıca sakla.

## Barındırma

Taslaklar, yayımlanmış düzenlemeler ve videolar hesaplarla aynı PostgreSQL/SQLite veritabanında saklanır.
Render'da `DATABASE_URL` veya kalıcı `RENDER_DISK_PATH` gereklidir; yoksa kayıt işlemi reddedilir.
Video verisi veritabanında tutulur; klipleri kısa ve sıkıştırılmış tut. Büyük bir video arşivi kurmadan önce
veritabanı kotasını kontrol et ve gerekirse nesne depolamaya geç. Veritabanı yedeği videoları da içermelidir.

- `LINEUP_ADMIN_ENABLED=false`: paneli ve tüm yönetici API işlemlerini kapatır. Yayımlanmış içerik çalışmaya devam eder.
- `LINEUP_ADMIN_STEAM_IDS`: isteğe bağlı, virgülle ayrılmış Steam64 kimlikleri. Varsayılan yalnızca yukarıdaki sahibidir.
- `PUBLIC_BASE_URL`: sitenin tam dış adresi. Düzenleme isteklerinin kaynağı bununla kontrol edilir.

Kapatma ayarını barındırma panelinde değiştirip uygulamayı yeniden başlat. Gizli taslaklar halka açılmaz.

## Sunucular ve diller

WarmupServer, CYBERSHOKE, XPLAY ve PRACC resmî listeleri kullanılır. Yenileme aralığı 90 saniyedir.
XPLAY otomatik isteklere 403 döndürebilir; 3 Kasım 2026'da resmî tarayıcı listesinden alınan
911 farklı geçerli adres başlangıç verisi olarak eklenmiştir. PRACC 41 adres içerir.
Yenileme başarısızsa son bilinen liste etiketlenir; 24 saatten eski harita bilgisi kaldırılır,
30 günden eski adresler gösterilmez. Tüm internet sunucularının kapsandığı iddia edilmez.

TR/EN/RU yanında DE/ES/FR/PT/ZH/HI/AR arayüz dilleri vardır. Ek dillerin ana kontrolleri çevrilmiştir;
henüz çevrilmeyen sözlük açıklamaları İngilizceye döner. Kullanıcı isimleri, komutlar ve kaynak
lineup açıklamaları otomatik çevrilmez.
