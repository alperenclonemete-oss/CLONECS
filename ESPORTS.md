# E-spor merkezi

Ekonomi menüsü yerine E-spor merkezi eklenmiştir. Veri sağlayıcı PandaScore'dur; HLTV kazıma entegrasyonu yoktur.

## Etkinleştirme
1. PandaScore hesabında Fixtures planı ve API token oluşturun.
2. Render web servisinin Environment bölümüne `PANDASCORE_TOKEN` ekleyin. Tokeni istemci JavaScript'ine, Git'e veya sohbete koymayın.
3. Kaydedip web servisini yeniden dağıtın. Oracle demo worker için bu anahtar gerekmez.
4. E-spor sekmesinde sağlayıcı zamanı ve gerçek maçları kontrol edin.

Ücretsiz Fixtures kapsamı: maç listeleri, takvim, sonuçlar, turnuva eşleşmeleri ve kadrolar. Ayrıntılı harita sonuçları ve maç oyuncu istatistikleri için Historical yetkisi gerekir. Düşük gecikmeli round-by-round canlı yayın bu sürümde uygulanmamıştır; running listesi 60 saniyelik REST kontrolüdür. Kullanıcı yeni plan satın almaya yönlendirilmez.

İstekler yalnızca sabit api.pandascore.co adresine, sunucudan Authorization başlığı ile gider. Süreli ve 150 kayıtla sınırlı önbellek, süreç başına saatte 200 dış istek bütçesi ve 429 geri çekilmesi vardır. Çoklu web instance kullanılıyorsa kota/cache Redis gibi ortak bir depoya taşınmalıdır. Liste sayfaları 50 kayıt, en fazla 20 sayfadır. Anahtar olmadan dürüst kurulum durumu gösterilir; örnek maçlar canlı sitede gösterilmez.

Kaynaklar: https://developers.pandascore.co/docs/plan-reference ve https://developers.pandascore.co/docs/getting-started
HLTV koşulları: https://www.hltv.org/terms

Test önizlemesi `tools/build-esports-preview.cjs` ile üretilir. Buradaki takımlar ve skorlar açıkça test verisidir.
