(() => {
  'use strict';
  // Exact UI phrases only: never translate player names, input values or commands.
  const phrases = `Antrenmanım|My practice|Моя тренировка
Taktikler|Tactics|Тактики
FACEIT profil URL veya kullanici adini gir. Analiz bu sayfada acilir.|Enter a FACEIT profile URL or username. Analysis opens on this page.|Введите ссылку на профиль FACEIT или имя пользователя. Анализ откроется здесь.
Hesabın hazır. FACEIT profilini profil menüsünden bağlayabilirsin.|Your account is ready. Connect FACEIT from your profile menu.|Аккаунт готов. Подключите FACEIT через меню профиля.
FACEIT profilin henüz bağlı değil|Your FACEIT profile is not connected yet|Профиль FACEIT пока не подключён
Steam hesabını bağlayarak CS2 verilerini eşleştir.|Connect Steam to link your CS2 data.|Подключите Steam для синхронизации данных CS2.
Herkese açık kullanıcı adını ekleyerek analiz alanını aç.|Enter your public username to open the analysis workspace.|Введите публичное имя пользователя для доступа к аналитике.
Steam profilinde görünür olan CS2 oyun süreni ve yayımlanmış istatistikleri göster.|View your publicly visible CS2 playtime and published Steam statistics.|Просмотр открытого времени игры в CS2 и опубликованной статистики Steam.
Topluluk arşivi · Kaynak kayıtları 2024 tarihli; güncel oyunda test edilmedi. Radar hedefleri yaklaşık bölgeyi gösterir. Kesin duruş ve nişan için fotoğrafları kullan.|Community archive · Source records are from 2024 and have not been tested in the current game. Radar targets are approximate. Use photos for exact positioning and aim.|Архив сообщества · Записи источника датированы 2024 годом и не проверены в текущей версии игры. Цели на радаре приблизительны. Для точной позиции и прицеливания используйте фотографии.
Haritadaki simgeye ya da aşağıdaki atış adına tıkla. Aynı bölgedeki atışları sayı rozetiyle görebilirsin.|Click a map icon or a throw below. Number badges group throws in the same area.|Нажмите значок на карте или название броска ниже. Числа обозначают броски в одной области.
Bu filtreye uygun kayıt yok. Başka harita veya bomba türü seç.|No entries match this filter. Choose another map or grenade type.|Нет подходящих записей. Выберите другую карту или тип гранаты.
CLONE LAB kişisel analiz aracıdır; FACEIT ile bağlantılı resmî bir ürün değildir. Öneriler istatistik temelli başlangıç noktalarıdır. Maç demosu incelenmeden kesin nişan, pozisyon veya karar hatası iddia edilmez. API anahtarı yalnızca sunucu tarafında tutulmalıdır.|CLONE LAB is a personal analysis tool, not an official FACEIT product. Suggestions are statistical starting points. Aim, positioning and decision errors cannot be confirmed without reviewing a demo. API keys must remain server-side.|CLONE LAB — персональный инструмент аналитики, не официальный продукт FACEIT. Рекомендации основаны на статистике. Ошибки прицеливания, позиции и решений нельзя подтвердить без просмотра демо. Ключи API должны храниться только на сервере.
Giriş Yap|Sign in|Войти
Kayıt Ol|Register|Регистрация
Giriş Yap ↗|Sign in ↗|Войти ↗
Steam ile Giriş Yap|Sign in with Steam|Войти через Steam
Hesap oluştur ↗|Create account ↗|Создать аккаунт ↗
Kullanıcı adı|Username|Имя пользователя
Kullanıcı adın|Your username|Ваше имя пользователя
Parola|Password|Пароль
Parolan|Your password|Ваш пароль
En az 8 karakter|At least 8 characters|Не менее 8 символов
3–32 karakter|3–32 characters|3–32 символа
veya kullanıcı adıyla devam et|or continue with your username|или войдите по имени пользователя
Oyuna devam et.|Get back in the game.|Вернись в игру.
FACEIT profilini bağla, kendi analiz alanını aç.|Connect your FACEIT profile to open your analysis workspace.|Подключите профиль FACEIT для анализа своей игры.
Güvenli oturum · parola sunucu tarafında korunur|Secure session · password protected on the server|Защищённый сеанс · пароль защищён на сервере
Her maçtan|Get more|Получай больше
daha fazlasını çıkar.|out of every match.|от каждого матча.
Ücretsiz başla ↗|Get started free ↗|Начать бесплатно ↗
Platformu keşfet ↓|Explore the platform ↓|Узнать о платформе ↓
Gerçek FACEIT verisi|Real FACEIT data|Реальные данные FACEIT
Kaynaklı pro ayarları|Sourced pro settings|Настройки профессионалов с источниками
Kişisel analiz alanı|Personal analysis workspace|Личный центр аналитики
Oyuncu profili|Player profile|Профиль игрока
PERFORMANS TRENDİ|PERFORMANCE TREND|ДИНАМИКА РЕЗУЛЬТАТОВ
ELO / SON MAÇLAR|ELO / RECENT MATCHES|ELO / ПОСЛЕДНИЕ МАТЧИ
örnek görünüm|sample preview|пример интерфейса
Gerçek değerler girişte FACEIT’ten yüklenir|Real stats load from FACEIT after sign-in|Данные FACEIT загружаются после входа
Oyununu anlamak için|Everything you need|Всё необходимое,
ihtiyacın olan her şey.|to understand your game.|чтобы понять свою игру.
Maç formunu incele, profesyonel ayarları karşılaştır ve sıradaki antrenmanını seç.|Review your form, compare pro settings and choose your next practice.|Оцени форму, сравни настройки профессионалов и выбери тренировку.
FACEIT maçlarını, profesyonel ayarları ve antrenman rutinlerini tek bir çalışma alanında birleştir. Verini gör, sonraki hamleni planla.|Your FACEIT matches, pro settings and training routines in one workspace. Review your data and plan your next move.|Матчи FACEIT, настройки профессионалов и тренировки в одном месте. Изучи данные и спланируй следующий шаг.
ELO, maç sonuçları, K/D, ADR ve harita performansını tek dashboard’da takip et.|Track ELO, match results, K/D, ADR and map performance in one dashboard.|Отслеживай ELO, результаты, K/D, ADR и статистику карт на одной панели.
Örnek arayüz · gerçek değerler girişte yüklenir|Sample interface · real stats load after sign-in|Пример интерфейса · данные загружаются после входа
Takımlara göre dolaş; yayımlanmış crosshair, hassasiyet ve CFG kayıtlarını kaynaklarıyla gör.|Browse teams and explore published crosshairs, sensitivities and configs with sources.|Выбирай команды и изучай прицелы, чувствительность и конфиги с источниками.
KAYNAKLI KAYITLAR|SOURCED RECORDS|ЗАПИСИ С ИСТОЧНИКАМИ
AYARLAR OYUNCU KAYNAĞIYLA GÖSTERİLİR|SETTINGS INCLUDE PLAYER SOURCES|НАСТРОЙКИ С ИСТОЧНИКАМИ ИГРОКОВ
FACEIT Analiz|FACEIT Analysis|Анализ FACEIT
Sunucular|Servers|Серверы
Ayarlar|Settings|Настройки
Oyuncu merkezi|Player center|Центр игрока
Oyuncu|Player|Игрок
Merkezi|Center|Центр
Kaydedilenler|Saved items|Сохранённое
Kaydedilenlerin|Your saved items|Ваше сохранённое
Kaydettiklerim|My saved items|Моё сохранённое
Çıkış yap|Sign out|Выйти
Steam hesabı bağlı değil|Steam account not connected|Аккаунт Steam не подключён
FACEIT profili bağlanmadı|FACEIT profile not connected|Профиль FACEIT не подключён
Hesap bağlantıları|Connected accounts|Подключённые аккаунты
Bağlantıları düzenle|Manage connections|Управлять подключениями
Bağlantılarını yönet, kaydettiklerine dön ve kişisel çalışma alanını düzenle.|Manage your connections, saved items and personal workspace.|Управляй подключениями, сохранённым и личным пространством.
Steam’i bağla|Connect Steam|Подключить Steam
Bağlı|Connected|Подключено
FACEIT kullanıcı adı|FACEIT username|Имя пользователя FACEIT
Bağlantıyı kaydet|Save connection|Сохранить подключение
Yenile|Refresh|Обновить
Aç|Open|Открыть
Pro configler|Pro configs|Конфиги профессионалов
Favori oyuncu ayarların|Your favorite player settings|Избранные настройки игроков
Kayıtlı oyun sunucuların|Your saved game servers|Сохранённые игровые серверы
Kaydettiğin smoke, flash ve molotoflar|Your saved smokes, flashes and molotovs|Сохранённые дымы, флешки и молотовы
Sunucu|Server|Сервер
bul.|finder.|поиск.
Isın, antrenman yap, oyuna katıl. Sunucunu seç ve Steam üzerinden bağlan.|Warm up, practice and play. Pick a server and connect through Steam.|Разминайся, тренируйся и играй. Выбери сервер и подключись через Steam.
Listeyi yenile|Refresh list|Обновить список
Sunucu ara|Search servers|Поиск серверов
İstanbul, Mirage, IP…|City, Mirage, IP…|Город, Mirage, IP…
Sağlayıcı|Provider|Провайдер
Mod|Mode|Режим
Konum|Location|Расположение
Tümü|All|Все
Tüm modlar|All modes|Все режимы
Tüm şehirler|All cities|Все города
Boş yer var|Available slots|Есть места
Kaydet|Save|Сохранить
Kaydedildi|Saved|Сохранено
Bağlan|Connect|Подключиться
Komutu kopyala|Copy command|Копировать команду
Önceki|Previous|Назад
Sonraki|Next|Далее
Güncelliği doğrulanamadı|Freshness not verified|Актуальность не подтверждена
Sunucu listeleri yükleniyor…|Loading server lists…|Загрузка серверов…
Bağlantı komutu kopyalandı.|Connection command copied.|Команда подключения скопирована.
Resmî listeyi aç · IP aktarımı henüz bağlı değil|Open official list · IP import not connected yet|Открыть официальный список · импорт IP пока не подключён
Tarafını seç. Başlangıcı ve hedefi haritada bul, atış talimatını incele.|Choose your side. Find the start and target on the radar and read the throw instructions.|Выбери сторону. Найди начало и цель на радаре и изучи инструкцию броска.
Atış ara: window, CT, market…|Search throws: window, CT, market…|Поиск бросков: window, CT, market…
Atış ara|Search throws|Поиск бросков
Fotoğraflı|With photos|С фотографиями
İki taraf|Both sides|Обе стороны
T · Hücum|T · Attack|T · Атака
CT · Savunma|CT · Defense|CT · Защита
Üst kat|Upper floor|Верхний этаж
Alt kat|Lower floor|Нижний этаж
1 · Nerede dur|1 · Where to stand|1 · Где стоять
2 · Nereye nişan al|2 · Where to aim|2 · Куда целиться
3 · NASIL ATILIR|3 · HOW TO THROW|3 · КАК БРОСАТЬ
Sonuç · Hedef bölgesi|Result · Target area|Результат · Область цели
Antrenmanda konuma git|Go to position in practice|Перейти на позицию в тренировке
Simge: başlangıç · Halka: hedef bölgesi · Çizgi: bağlantı, uçuş yörüngesi değil|Icon: start · Ring: target area · Line: connection, not flight path|Значок: начало · Кольцо: область цели · Линия: связь, а не траектория
Bir atış seç|Select a throw|Выбери бросок
Atış bulunamadı|No throws found|Броски не найдены
HARİTADAN KEŞFET|EXPLORE THE MAP|ИЗУЧАЙ КАРТУ
Kapat|Close|Закрыть
Kapat ×|Close ×|Закрыть ×
Uzaklaştır|Zoom out|Уменьшить
Yakınlaştır|Zoom in|Увеличить
Yakınlaştırmayı sıfırla|Reset zoom|Сбросить масштаб
Veriyi yenile|Refresh data|Обновить данные
Veriyi yenile ↻|Refresh data ↻|Обновить данные ↻
Steam hesabın bağlı değil.|Your Steam account is not connected.|Ваш аккаунт Steam не подключён.
Steam hesabını bağla ↗|Connect Steam ↗|Подключить Steam ↗
Steam verisi henüz yüklenmedi.|Steam data has not loaded yet.|Данные Steam ещё не загружены.
← Takımlara dön|← Back to teams|← К командам
← Oyunculara dön|← Back to players|← К игрокам
Favori CFG’lerim|My favorite configs|Избранные конфиги
Henüz favori oyuncu kaydetmedin.|No favorite players saved yet.|Избранных игроков пока нет.
FACEIT hesabini bagla|Connect your FACEIT account|Подключить аккаунт FACEIT
Hesabi Bagla & Analiz Et|Connect & analyze|Подключить и анализировать
Durumu yenile|Refresh status|Обновить статус
Takibi durdur|Stop tracking|Остановить отслеживание
Otomatik takibi bağla|Enable automatic tracking|Включить отслеживание
Maç geçmişi takibi açık|Match history tracking enabled|Отслеживание матчей включено
Maçlarını otomatik analiz et|Analyze your matches automatically|Автоматический анализ матчей
Maç geçmişi erişim kodu|Match history access code|Код доступа к истории матчей
Başlangıç maç paylaşım kodu|Starting match share code|Код исходного матча`;
  const dictionary=new Map(phrases.split('\n').map(line=>{const [tr,en,ru]=line.split('|');return [tr,{tr,en,ru}];}));
  for(const entry of dictionary.values())Object.assign(entry,window.CloneExtraTranslations?.[entry.en]||{});
  const languages=['tr','en','ru',...(window.CloneExtraLanguages||[])];
  let language='tr';try{language=localStorage.getItem('clone-language')||'tr';}catch{}
  if(!languages.includes(language))language='tr';
  const dynamicWords={tr:['sunucu','atış','oyuncu','bot','Son bilinen liste','Güncellendi','Kaynak erişilemiyor'],en:['servers','throws','players','bots','Last known list','Updated','Source unavailable'],ru:['серверов','бросков','игроков','ботов','Последний список','Обновлено','Источник недоступен'],de:['Server','Würfe','Spieler','Bots','Letzte bekannte Liste','Aktualisiert','Quelle nicht erreichbar'],es:['servidores','lanzamientos','jugadores','bots','Última lista conocida','Actualizado','Fuente no disponible'],fr:['serveurs','lancers','joueurs','bots','Dernière liste connue','Actualisé','Source indisponible'],pt:['servidores','lançamentos','jogadores','bots','Última lista conhecida','Atualizado','Fonte indisponível'],zh:['服务器','投掷','玩家','机器人','最近已知列表','已更新','来源不可用'],hi:['सर्वर','थ्रो','खिलाड़ी','बॉट','अंतिम ज्ञात सूची','अपडेट किया गया','स्रोत उपलब्ध नहीं'],ar:['خوادم','رميات','لاعبين','بوتات','آخر قائمة معروفة','تم التحديث','المصدر غير متاح']};
  const originals=new WeakMap();
  const skipped='script,style,code,textarea,[data-no-translate],#profileWidgetName,#profileMenuAccount,#profileWidgetInitials,.config-player-name';
  function translate(value){const trim=value.trim(),entry=dictionary.get(trim);if(entry)return value.replace(trim,(entry[language]||entry.en));
    const words=dynamicWords[language];
    if(/^\d+ sunucu · (Son bilinen liste|Güncellendi|Kaynak erişilemiyor)$/.test(trim))return value.replace('sunucu',words[0]).replace('Son bilinen liste',words[4]).replace('Güncellendi',words[5]).replace('Kaynak erişilemiyor',words[6]);
    if(/^[\w ]+ · \d+ atış$/.test(trim))return value.replace('atış',words[1]);
    return value;}
  const header=document.querySelector('.site-header');if(!header)return;
  const picker=document.createElement('label');picker.className='language-picker';picker.dataset.noTranslate='';
  picker.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg><select aria-label="Language / Dil / Язык"><option value="tr">Türkçe</option><option value="en">English</option><option value="ru">Русский</option><option value="de">Deutsch</option><option value="es">Español</option><option value="fr">Français</option><option value="pt">Português</option><option value="zh">中文</option><option value="hi">हिन्दी</option><option value="ar">العربية</option></select>';
  header.append(picker);const select=picker.querySelector('select');select.value=language;
  function apply(){
    observer.disconnect();
    document.documentElement.lang=language;
    const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    for(let node;node=walk.nextNode();){
      if(node.parentElement?.closest(skipped))continue;
      const record=originals.get(node);
      const original=record&&record.output===node.nodeValue?record.original:node.nodeValue;
      let output=translate(original);if(language==='ru'&&node.parentElement?.closest('.settings-hero h1')){if(original.trim()==='Oyuncu')output=original.replace('Oyuncu','Центр');if(original.trim()==='Merkezi')output=original.replace('Merkezi','игрока');}originals.set(node,{original,output});if(node.nodeValue!==output)node.nodeValue=output;
    }
    document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(element=>{
      if(element.closest(skipped))return;
      let records=originals.get(element)||{};
      for(const attr of ['placeholder','aria-label','title']){
        if(!element.hasAttribute(attr))continue;
        const current=element.getAttribute(attr),record=records[attr];
        const original=record&&record.output===current?record.original:current,output=translate(original);
        records[attr]={original,output};if(current!==output)element.setAttribute(attr,output);
      }originals.set(element,records);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  }
  let pending=false;
  const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;apply();});}});
  select.addEventListener('change',()=>{language=select.value;try{localStorage.setItem('clone-language',language);}catch{}apply();});
  apply();
})();
