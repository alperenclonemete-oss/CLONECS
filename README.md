# CS2 Coach MVP

Bu uygulama FACEIT Data API üzerinden gerçek oyuncu profili, CS2 maç geçmişi, kariyer istatistikleri ve maç başı performans alanlarını getirir. Öneriler yalnızca dönen istatistiklerden oluşturulur. FACEIT'in vermediği alanlar uydurulmaz.

## Yerelde çalıştırma

1. Python 3.10 veya üzerini kur.
2. FACEIT Developer Portal'dan bir Data API anahtarı al ve gizli tut.
3. `FACEIT_API_KEY` ortam değişkenine anahtarı ekle. Anahtarı `static/` içine koyma.
4. Proje klasöründe:

   ```bash
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

5. `http://127.0.0.1:8000` adresini aç.

## Render'a dağıtım

Bu proje Render'da **Web Service** olarak çalışır; Static Site seçilmemeli. Python runtime kullan. `render.yaml` build ve start komutlarını içeriyor. Render servisinin Environment bölümüne `FACEIT_API_KEY` ekle ve yeniden deploy et. Publish Directory boş kalmalı. `/api/health` anahtarın ayarlı olup olmadığını gösterir; anahtarın kendisini göstermez.

## Veriler ve sınırlar

- Oyuncu profili ve güncel ELO/level FACEIT oyuncu endpoint'inden gelir.
- Son maçlar FACEIT history endpoint'inden alınır. Kazanan, oyuncunun takım anahtarı veya takım kimliğiyle eşleştirilir; belirsiz sonuç `SONUÇ YOK` görünür.
- Son 20 maça kadar per-match stats ve tüm kariyer istatistikleri istenir. HS oranı API'den direkt alınır; yoksa yalnızca headshot ve kill alanları birlikte gelirse hesaplanır.
- Maç detayı ve maç istatistikleri, kullanıcı istediğinde FACEIT match endpoint'lerinden alınır.
- Grafikler FACEIT'in maç başına gönderdiği K/D, HS% ve ADR değerlerini gösterir. ELO değişim geçmişi public Data API'de bu kullanım için sağlanmadığından uydurma grafik çizilmez.
- API anahtarı izinleri, FACEIT'in alanları yayınlaması ve rate limit ekranın doluluğunu etkileyebilir. Eksik istatistik `—` olarak kalır.

## Endpoint'ler

- `GET /api/health`
- `GET /api/player/{nickname}?limit=20`
- `GET /api/match/{match_id}`

Kaynak: [FACEIT Data API belgeleri](https://docs.faceit.com/api/data/).
