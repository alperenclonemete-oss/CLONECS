# CLONE LAB · FACEIT Performance

En kolay dağıtım: Render üzerinde tek web servisi. Frontend ve API aynı uygulamada sunulur; ayrı veritabanı veya ayrı frontend servisi gerekmez.

Clone Lab, oyuncu maç geçmişi, lifetime istatistikleri ve şeffaf heuristiklerle ilk koçluk önerileri sunan kişisel kullanım MVP'si.

## Gereksinimler
- Python 3.10+
- FACEIT Developer Portal üzerinden alınmış sunucu tarafı Data API key

## Çalıştırma (Windows)

PowerShell veya CMD'yi bu klasörde aç:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

`.env` dosyasını açıp `FACEIT_API_KEY` değerini kendi anahtarınla değiştir. Anahtarı HTML/JavaScript içine yazma ve GitHub'a yükleme.

```powershell
uvicorn main:app --reload
```

Tarayıcıda http://127.0.0.1:8000 adresini aç.

## Uç noktalar
- `GET /api/health` — sunucu durumu ve anahtarın yapılandırılmış olup olmadığı
- `GET /api/player?nickname=...` — oyuncu arama
- `GET /api/player/{player_id}/matches?limit=20` — son maçlar
- `GET /api/player/{player_id}/stats` — FACEIT lifetime istatistikleri
- `GET /api/match/{match_id}/stats` — belirli maçın istatistikleri
- `GET /api/player/{player_id}/match-stats?limit=100` — son maçların ham FACEIT alanları, özetleri ve grafik serileri
- `POST /api/coach-report` — istatistikleri basit, açıklanabilir önerilere dönüştürme

## Önemli kapsam notları
- Bu proje canlı FACEIT API verilerine dayalı bir MVP iskeletidir. FACEIT API anahtarı ve API erişimi olmadan canlı veriler gösterilemez.
- FACEIT'in CS2 game ID'si veya erişim yetkileri hesabına göre beklenenden farklı davranırsa `.env` içindeki `FACEIT_GAME_ID` ve API erişimini kontrol et.
- FACEIT Data API maç geçmişi, tek başına her round için pozisyon veya aim hatası vermez. Kesin demo koçluğu için demo dosyası indirme/işleme, round olayları ve oyuncu koordinatlarının analizi sonraki aşamadır.
- Mevcut koçluk kuralları bilerek basit tutulmuştur. Eşikler evrensel oyuncu standartları değildir; rol, rank, silah ve örneklem büyüklüğü dikkate alınmalıdır.
- Uygulama FACEIT tarafından yapılmış veya onaylanmış değildir.

## Sonraki geliştirme adımları
1. Canlı API yanıtlarını örnekleyerek `stats` alan adlarını normalize et.
2. Kullanıcı profili ve maç verileri için PostgreSQL + cache ekle.
3. FACEIT maç `demo_url` alanını izin verilen biçimde alıp `.dem` dosyasını `demoparser2` ile işle.
4. Round bazlı olaylardan ilk ölüm, trade, utility ve pozisyon raporları üret.
5. Antrenman kütüphanesi, sunucu kataloğu ve maç demosu incelemesini geliştir.

## Ücretsiz/düşük maliyetli online yayın (Render)

1. Bu klasörü kendi GitHub deponun kök dizinine yükle. `.env` dosyasını ve API anahtarını depoya yükleme.
2. Render hesabında **New + → Blueprint** seçip depoyu bağla. `render.yaml` servisi otomatik tanımlar.
3. Render servisinin **Environment** bölümüne `FACEIT_API_KEY` adlı secret değişken ekle. Değeri FACEIT Developer Portal'dan alınan **Server-side** Data API anahtarı olmalı.
4. Deploy tamamlanınca Render'ın verdiği `https://...onrender.com` adresini aç. `/api/health` adresinde `faceit_key_configured: true` görünmeli.
5. Hesap oluştur veya giriş yap; ardından FACEIT kullanıcı adını kaydedip profilini aç. Sonraki girişte kayıtlı profil otomatik yüklenir.

Render'ın ücretsiz planı zaman zaman uykuya geçebilir ve ilk açılış yavaş olabilir; güncel limitleri Render'ın fiyatlandırma sayfasından kontrol et. Üretim kullanımı için uygun bir ücretli web servisine geçilebilir.

### Canlı veri ve sınırlar
- API anahtarı yalnızca backend ortam değişkeninde tutulur; tarayıcıya gönderilmez.
- FACEIT Data API yalnızca sağladığı alanları gösterir. Maç geçmişi endpoint'i her zaman harita adını veya ayrıntılı round olaylarını sağlamaz.
- Koçluk önerileri şeffaf, temel istatistik eşiklerine dayanır; demo analizinin yerine geçmez.
- FACEIT'in resmî API dokümantasyonu: https://docs.faceit.com/api/data/

## Son güncelleme

- İstatistik paneli FACEIT’in maç başı K/D, HS% ve ADR değerlerini hem özet hem trend grafiği olarak gösterir. Bir metrik API’den dönmezse ilgili grafik boş veri durumunu açıkça belirtir.
- HS% FACEIT alanından alınır; alan yoksa yalnızca aynı maçta Headshots ve Kills ikisi de varsa oran türetilir.
- Maç detayları isteğe bağlı yüklenir ve takım kadrosu ile API’nin yayınladığı oyuncu maç istatistiklerini gösterir.
- FACEIT’in Data API bu sorgu için tarihsel ELO serisi sunmadığından ELO grafiği eklenmedi. Güncel ELO gösterilir; geçmiş ELO noktaları uydurulmaz.
- Değişiklikleri yayınlamak için güncel dosyaları bağlı GitHub deposuna gönderip Render servisini redeploy et. `FACEIT_API_KEY` sunucudaki secret olarak kalmalı.
### Performans ve harita grafikleri
- Profil analizine son 30 maçtan K/D/A, K/D, K/R, HS%, ADR ve maç sonucu özeti eklendi.
- Sonuç grafiği, tarih sırasına göre 5 maçlık hareketli galibiyet oranını gösterir. Bu ELO grafiği değildir.
- Harita radar grafiği yalnızca FACEIT yanıtında harita adı ve bilinen sonucu bulunan maçları kullanır; en az üç harita kaydı yoksa veri eksikliği açıklanır.
- FACEIT geçmiş ELO serisi vermediği için geçmiş ELO değişimi gösterilmez. Güncel ELO oyuncu profilinden alınır.
## Hesap ve kayıtlı FACEIT profili

- Ziyaretçi kullanıcı adı ve parola ile hesap açabilir veya giriş yapabilir. Parolalar scrypt ile özetlenerek saklanır; tarayıcı oturumu HTTP-only çerezle tutulur.
- FACEIT nickini hesaba kaydettiğinde uygulama profili FACEIT Data API üzerinden bulur ve sonraki girişinde otomatik açar. Bu bir FACEIT OAuth bağlantısı değildir ve profil sahipliğini doğrulamaz.
- Yerelde veritabanı `data/accounts.sqlite3` içinde tutulur; bu klasör Git dışında bırakılır.
- Render dağıtımında kalıcı hesaplar için `DATABASE_URL` ortam değişkenine kalıcı bir Postgres bağlantısı ver veya ücretli web servisine `/var/data` gibi kalıcı disk bağlayıp `RENDER_DISK_PATH=/var/data` ayarla. Ücretsiz Render web servislerinin dosya sistemi restart/deploy sonrası silinebilir; ücretsiz Render Postgres veritabanları da 30 gün sonra sona erer. Uzun süreli hesaplar için ücretsiz geçici veritabanı kullanma.
- Yeni kullanıcı adı/parola akışında e-posta doğrulama ve parola sıfırlama yoktur; parolanı güvenli yerde sakla.

Hesap uç noktaları: `GET /api/account`, `POST /api/account/register`, `POST /api/account/login`, `POST /api/account/logout`, `POST /api/account/faceit`.

## CLONE LAB 1.3 arayüzü

Bu sürümde koyu turkuaz/siyah renk paleti, keskin köşeli bileşenler ve özgün CLONE LAB kask amblemi kullanılır. Analiz ekranı oturum açılmadan gösterilmez. Örnek demo kaldırılmıştır. Her hesap bir herkese açık FACEIT kullanıcı adını kaydedebilir; FACEIT hesabına giriş yapılmaz ve sahiplik doğrulanmaz.



