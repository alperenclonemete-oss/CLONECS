# CS2 Coach MVP

En kolay dağıtım: Render üzerinde tek web servisi. Frontend ve API aynı uygulamada sunulur; ayrı veritabanı veya ayrı frontend servisi gerekmez.

FACEIT profil arama, oyuncu maç geçmişi, lifetime istatistikleri ve şeffaf heuristiklerle ilk koçluk önerileri sunan kişisel kullanım MVP'si.

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
- Bu bir ilk sürüm iskeletidir. FACEIT API anahtarı ve API erişimi olmadan canlı veriler gösterilemez.
- FACEIT'in CS2 game ID'si veya erişim yetkileri hesabına göre beklenenden farklı davranırsa `.env` içindeki `FACEIT_GAME_ID` ve API erişimini kontrol et.
- FACEIT Data API maç geçmişi, tek başına her round için pozisyon veya aim hatası vermez. Kesin demo koçluğu için demo dosyası indirme/işleme, round olayları ve oyuncu koordinatlarının analizi sonraki aşamadır.
- Mevcut koçluk kuralları bilerek basit tutulmuştur. Eşikler evrensel oyuncu standartları değildir; rol, rank, silah ve örneklem büyüklüğü dikkate alınmalıdır.
- Uygulama FACEIT tarafından yapılmış veya onaylanmış değildir.

## Sonraki geliştirme adımları
1. Canlı API yanıtlarını örnekleyerek `stats` alan adlarını normalize et.
2. Kullanıcı profili ve maç verileri için PostgreSQL + cache ekle.
3. FACEIT maç `demo_url` alanını izin verilen biçimde alıp `.dem` dosyasını `demoparser2` ile işle.
4. Round bazlı olaylardan ilk ölüm, trade, utility ve pozisyon raporları üret.
5. Antrenman kütüphanesi, sunucu kataloğu, kullanıcı hesabı ve dağıtım ekle.

## Ücretsiz/düşük maliyetli online yayın (Render)

1. Bu klasörü kendi GitHub deponun kök dizinine yükle. `.env` dosyasını ve API anahtarını depoya yükleme.
2. Render hesabında **New + → Blueprint** seçip depoyu bağla. `render.yaml` servisi otomatik tanımlar.
3. Render servisinin **Environment** bölümüne `FACEIT_API_KEY` adlı secret değişken ekle. Değeri FACEIT Developer Portal'dan alınan **Server-side** Data API anahtarı olmalı.
4. Deploy tamamlanınca Render'ın verdiği `https://...onrender.com` adresini aç. `/api/health` adresinde `faceit_key_configured: true` görünmeli.
5. FACEIT kullanıcı adını ara. `Örnek demoyu aç` butonu canlı API'ye bağlanmadan arayüzü test eder.

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