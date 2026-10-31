# CLONE LAB · FACEIT Performance · CloneCS 2.5

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
- `GET /api/pro-configs` — upstream MIT lisanslı açık CS2 oyuncu ayarları kataloğu
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





## Sürüm 1.4
Maç geçmişinde ilk iki kayıt görünür; devamı ikişer maçlık bölümlerle açılır.



## Pro Config sekmesi (1.6)
- Oturum açtıktan sonra FACEIT Analiz ve Pro Config sekmeleri görünür.
- Takım ve oyuncu seçimi, sunucunun 1 saat önbelleğe aldığı açık kaynak kataloğundan oluşturulur.
- DPI, oyun içi hassasiyet, eDPI, zoom, polling rate, mouse, çözünürlük, en-boy oranı ve crosshair kodu kaynağın döndürdüğü ölçüde gösterilir.
- Kaynakta yayımlanmayan grafik/video ve viewmodel ayarları açıkça eksik gösterilir; değer uydurulmaz.
- Kaynak ve lisans atfı uygulamanın Config sekmesinde bulunur: https://github.com/Guewenn/cs2-pro-sensitivity-database (MIT).



- 1.6: Config profili video/grafik, viewmodel, HUD/radar ve launch alanlarını da ayrı gösterir; kaynakta bulunmayanlar açıkça eksik kalır. Daha geniş üçüncü taraf arşivine, 23 Mayıs 2026 snapshot tarihi belirtilerek bağlantı verilir.


## 1.7 giriş düzeltmesi
Maç listesi ilk oluştuğunda henüz DOM’da yoktur. Olay dinleyicisi artık kalıcı sonuç kapsayıcısına bağlanır; sayfa açılışındaki JavaScript hatası giriş/kayıt işleyicilerini durduramaz. Yerel uçtan uca doğrulama: kayıt, oturum, profil kaydı, çıkış ve tekrar giriş.

## CLONE LAB 1.8 — Pro Config kataloğu
- Pro Config içinde takım/oyuncu/rol adına göre arama eklendi; takım ve oyuncu seçicileri arama sonucuna göre daralır.
- Uygulama içindeki kayıtlar Guewenn MIT kataloğundan sunucuda en fazla bir saat önbellekle alınır. Kayıt ve takım sayısı ekranda kaynağın döndürdüğü gerçek veriden hesaplanır.
- Daha geniş CSDB.gg ve CS Tools dizinlerine kaynak bağlantıları eklendi. Kaynak sayfaları sırasıyla 1.011 oyuncu/208 takım ve 35 takım/182 pro kaydı bildirmiştir; bu dış veriler Clone Lab'e kopyalanmış gibi gösterilmez.
- Uygulama içindeki açık veri kaynağı yalnızca sınırlı sayıda oyuncunun yayımlanmış ayarını kapsar; bu nedenle bu sürüm henüz top 30 takımın tüm kadrolarını içermiyor. Bulunmayan CFG, video, viewmodel ve diğer ayarlar uydurulmaz. Kaynakta hangi değerler varsa onlar gösterilir.
- FACEIT/Render ayarları ve başlangıç komutu değişmedi. Render'a güncellemek için bu klasörün içeriğini yayınladığın Git deposuna aktar ve mevcut Web Service'i yeniden deploy et. FACEIT API anahtarı sadece sunucu ortam değişkeninde tutulmalı.

## CLONE LAB 1.9 — Oyuncu portreleri ve takım logoları
- Pro Config oyuncu kartlarına oyuncu portresi ve takım logosu eklendi. Görseller CS Tools'un herkese açık PNG adreslerinden yüklenir.
- Görsel bulunamazsa kartta oyuncu/takım baş harfleri görünür; görsel yüklenmemesi ayar kartını bozmaz.
- Görseller haricî kaynaktan geldiğinden internet bağlantısı gerekir. Kaynak örnekleri: https://cstools.io/pros/donk.png ve https://cstools.io/teams/spirit.png.

## CLONE LAB 2.0 — Takım ve oyuncu kartları
- Config bölümünde takım/oyuncu açılır kutuları kaldırıldı. Beş sütunlu kare takım logosu kartları gösterilir; dar ekranlarda sütun sayısı azaltılır.
- Takım kartına basınca o takımın oyuncu portreleri kart olarak açılır. Oyuncu kartına basınca ayar ayrıntıları açılır. Her ekranda geri dönüş düğmesi bulunur.
- Takım araması logolu kartları filtreler. Görsel yüklenemezse baş harf yedeği görünür.

## CLONE LAB 2.1 — HLTV Top 30 kadroları
- `static/hltv-top30.json` içinde HLTV sıralama görünümünde 29 Ekim 2026 tarihinde listelenen 30 takım ve her biri için beş isim bulunur. Kayıt kaynağı ve tarih uygulamada gösterilir.
- Takım/oyuncu kartları bu Top 30 listesinden oluşturulur; liste artık 14 takımlı config kaynağıyla sınırlı değildir.
- Mevcut açık config kaynağında eşleşen oyuncunun gerçek ayarları açılır. Kadroda olup config kaynağında bulunmayan oyuncuların ayarları uydurulmaz; profil bağlantısı ve veri eksikliği notu gösterilir.
- HLTV sıralaması ve takım kadroları değişebilir. Listeyi güncellemek için yeni tarihli kaynak snapshot'ı `static/hltv-top30.json` dosyasına aktar.

## CLONE LAB 2.2 — Logo görünümü ve sabit arşiv notu
- Takım logolarının içindeki baş harf/fallback yazısı ve logo çerçevesi kaldırıldı; kartlarda şeffaf logo odaklı görünüm kullanılır.
- Bulunabilen 14 HLTV Top 30 takım logosu `static/team-logos/` içine yerel PNG olarak alındı. Diğer logolar HLTV'nin güncel sıralama sayfasındaki görsel bağlantısından yüklenir; kaynağın bazı dosyaları bu ortamda yerel indirmeye 403 verdi.
- Kadro listesi tarihli statik dosyadır; açılışta HLTV'den güncelleme çekmez.
- Oyuncu ayarları halen açık kaynak profillerinden gelen alanlarla sınırlıdır. Bazı top 30 oyuncular için uygulamada ayrıntılı CFG bulunmayabilir; eksik alanlar gerçekmiş gibi doldurulmaz.


## CLONE LAB 2.4 — CFG arşivi ve görsel iyileştirmeleri
- `static/configs/` içinde Top 30 kadrosundaki 150 oyuncunun indirilebilir CFG dosyaları bulunur; `static/player-config-index.json` eşleştirme ve kaynak profili bağlantılarını içerir.
- CFG dosyaları yayımlanmış kaynaklardan derlenmiştir. Kaynakta olmayan ayarlar tahmin edilmez. Üç oyuncunun temel ayar dosyası alternatif açık kaynaklardan hazırlanmıştır ve kaynakları indeks dosyasında görünür.
- Bulunabilen 93 oyuncu portresi yerel dosya olarak sunulur. Kalan portrelerde dış kaynak denenir; fotoğraf bulunamazsa oyuncu baş harfleri görünür.
- FaZe, FURIA, Legacy, 3DMAX, HEROIC, 9z, B8, Monte, NiP, HOTU ve Passion UA için daha yüksek çözünürlüklü logolar `static/team-logos/` içine eklendi. Ek M80 logosu Top 30 dışında ayrı gösterilir. Kaynak bağlantıları `static/team-logo-sources.json` dosyasındadır.

## CLONE LAB 2.5 — Yerel oyuncu kataloğu ve portre eşleştirmeleri
- `GET /api/pro-configs` artık canlı bir GitHub isteği yapmaz; dağıtımla birlikte gelen `static/pro_players.json` dosyasını backend üzerinden döndürür. Oyuncu kataloğu Render'da da açılışta dış API'ye bağlı değildir.
- `static/pro_players.json` mevcut Top 30 listesindeki 150 oyuncunun kayıtlarını ve yayımlanmış CFG alanlarını bir araya getirir. Guewenn GitHub açık veri seti ve oyuncuların CFG kaynakları kayda alınır; bilinmeyen değerler boş kalır.
- `static/player-photo-index.json` 93 yerel portreyi ve Liquipedia MediaWiki API ile eşleştirilen 56 portre URL'sini içerir. Fotoğraf bulunmadığında veya açılamadığında isim baş harfleri avatar olarak görünür. Profil sayfasında fotoğraf kaynak bağlantısı yer alır.
- CFG arayüzü `remote_url` portrelerini kullanır; oyuncu başına tahmini CS Tools fotoğraf adresi üretmez.
- Bu snapshot'ta 150 oyuncu ve 150 CFG indirme bağlantısı bulunur. Her oyuncunun her ayarı açık kaynaklarda yayınlanmadığı için eksik DPI, crosshair, mouse veya görüntü değerleri doldurulmuş gibi sunulmaz.

### Yayınlama
GitHub'daki `main` dalına gönder. Render bu dala bağlı otomatik deploy ediyorsa sürüm otomatik yayınlanır; değilse Render panelinden **Manual Deploy → Deploy latest commit** seç. `FACEIT_API_KEY` mevcut Render secret'ı olarak kalır; bu güncelleme yeni bir anahtar gerektirmez.

## Steam ile giriş ve CS2 verileri

- Giriş penceresindeki **Steam ile devam et** seçeneği Steam OpenID ile çalışır. Steam parolası Clone Lab’e girilmez. Yeni hesap SteamID ile oluşturulur; var olan Clone Lab hesabı, profil menüsündeki hesap ayarlarından Steam’e bağlanabilir.
- Steam oturumu, API anahtarından bağımsızdır. Profil ve oyun verileri için `.env` dosyasına `STEAM_API_KEY` ekle; Render Environment bölümüne aynı adıyla gizli değişken olarak ekle. Anahtar HTML/JavaScript’e veya Git’e yazılmaz.
- Render’da `PUBLIC_BASE_URL` değişkenini sitenin tam HTTPS adresine ayarla (ör. `https://clonecs.onrender.com`). Yerelde `.env.example` içindeki `http://127.0.0.1:8000` adresini kullan.
- **Steam / CS2** sekmesi Steam’in API’de görünür kıldığı profili, CS2 toplam ve son iki haftalık oyun süresini ve `GetUserStatsForGame` tarafından gerçekten döndürülen istatistikleri gösterir. Profil/oyun gizliliği bu alanları sınırlayabilir.
- Steam Web API tam kişisel CS2 maç geçmişi sunmadığı için Steam sekmesi maç sonucu, K/D veya ELO uydurmaz. FACEIT maçları FACEIT sekmesinde kalır; Valve eşleştirme maçlarını detaylı analiz etmek için ileride oyun demosu veya kullanıcı tarafından sağlanan maç paylaşım verisi gerekir.
- Steam API ayarları: `STEAM_API_KEY`, `PUBLIC_BASE_URL`. Steam API profili için `GET /api/steam/profile`; OpenID başlatma ve callback uçları `/api/auth/steam` ile `/api/auth/steam/callback`.