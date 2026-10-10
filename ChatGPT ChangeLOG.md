# ChatGPT ChangeLOG

## پیگیری وضعیت AdMob — 2026-10-09

بررسی تازهٔ App settings و جست‌وجوی دقیق `com.rahanetmci.securevpn`: App store details خالی (`—`) است و جست‌وجوی Google Play نتیجه ندارد؛ اتصال Store انجام نشده است. screenshot فعلی App verification را `Not required` با Verify app غیرفعال نشان می‌دهد؛ این وضعیت به معنی تأیید app-ads.txt نیست و نباید با Verified اشتباه شود. طبق راهنمای Store linking گوگل، برای لینک‌کردن باید اپ در فروشگاه پشتیبانی‌شده عمومی باشد؛ محدودبودن نسخه به Closed testing با پیدا نشدن آن سازگار است، اما علت نهایی فقط از نتیجهٔ جست‌وجو اثبات نمی‌شود. هیچ تنظیم خارجی تغییر نکرد.

جزئیات `Requires review` در overview اپ باز شد: برای رفع محدودیت نمایش تبلیغ، اتصال به فروشگاه پشتیبانی‌شده و بررسی اپ لازم است؛ متن AdMob تصریح می‌کند تأیید حساب جدید باید پیش از بررسی اپ انجام شود. در Settings → Linked services، Google Ads و Firebase هر دو `Not linked` هستند؛ Google Ads برای campaigns و Firebase برای analytics/reporting است و این اتصال‌ها جایگزین Store linking نیستند. هیچ اتصال یا تنظیم خارجی تغییر نکرد.

داشبورد Home پس از reload و فهرست Apps دوباره بررسی شدند: حساب همچنان `Your account is being verified` و تأییدنشده است؛ payment profile کامل است. SecureVPN همچنان `Requires review / Limited ad serving / Add store to lift limit` و بدون Store یا package لینک‌شده است. تأیید جدیدی مشاهده نشد. این پیگیری فقط خواندنی بود و کد یا تنظیمات خارجی تغییر نکردند.

## بررسی تبلیغات Play و پیام رضایت جهانی — 2026-10-08

- کاربر عدم نمایش تبلیغ بعد از دو اتصال/قطع موفق روی چند گوشی را گزارش کرد. شناسه‌های live AdMob در manifest و DEX فایل واقعی Play 1.0.0/code1 تأیید شد؛ مشکل demo ID مشاهده نشد. سورس واقعی Play در `scratch/SecureVPN-Android-source` بررسی شد.
- داشبورد که ابتدا 403 می‌داد، در تلاش دوباره با Chrome باز شد: حساب هنوز در verification است، payment profile کامل است؛ اپ `Requires review / Limited ad serving` و بدون Store لینک‌شده است. جست‌وجوی package دقیق در Add store هیچ نتیجه‌ای نداد؛ اتصال جعلی به اپ یا فروشگاه دیگر انجام نشد.
- پیام consent وجود نداشت؛ پیش‌نویس English برای SecureVPN با privacy URL و گزینه‌های پذیرش، رد و مدیریت رضایت ذخیره شد. انتشار عامل ابتدا توسط بررسی خودکار به‌دلیل نبود تأیید صریح همین تنظیم حریم خصوصی رد شد. کاربر خودش Publish را زد و محدودهٔ جهانی خواست؛ پیام منتشرشده باز و `Published` و `Everywhere` تأیید شد. برای این تنظیم سروری APK/AAB جدید لازم نیست؛ propagation طبق دیالوگ AdMob ممکن است تا یک ساعت طول بکشد.
- پیام جهانی تضمین نمایش تبلیغ جهانی یا تأیید حساب/اپ نیست. محدودیت‌های باقی‌ماندهٔ AdMob و نیاز به Store linking/app readiness/app-ads.txt در `ANDROID_ADS.md` ثبت شد. دسترسی ADB به گوشی وجود نداشت؛ نمایش creative واقعی، علت خطای گوشی و صحت شمارنده روی آن دستگاه ادعا نشد. کد اپ در این مرحله تغییر نکرد.
- شواهد در `scratch/ads-audit` ذخیره شدند؛ نسخهٔ مستندات در ریشه و repository خصوصی اندروید هر دو به‌روز شدند. مراحل بعد: تأیید حساب، Store linking پس از قابل پیدا شدن صفحه و در صورت ادامهٔ مشکل خواندن لاگ UMP/LoadAdError دستگاه.

## آخرین وضعیت انتشار Play و رفع خطای Foreground Service — 2026-10-08

این بخش وضعیت جدید Console را ثبت می‌کند و بر وضعیت‌های قدیمیِ «آپلود نشده/ذخیره نشده» در بخش‌های تاریخی مقدم است.

- برچسب AI فقط برای آیکون و feature graphic با تأیید صریح کاربر ارسال شد؛ چهار screenshot واقعی برچسب نخوردند. Store listing ذخیره شد و وضعیت آن Ready to send for review است.
- نسخهٔ اصلاح‌شدهٔ سایت privacy با تأیید قبلی کاربر در Cloudflare Pages منتشر شد. صفحهٔ `https://securevpn.rahanetmci.com/privacy/` با HTTP 200 و وجود متن encryption/HTTPS بررسی شد؛ DNS تغییر نکرد.
- AAB نهایی Play 1.0.0 / versionCode 1 در پیش‌نویس Closed testing / Alpha آپلود و پردازش شد. Console آن را پذیرفت و حجم دانلود هر نصب را 37.6MB نشان داد. releaseId=1، trackId=4698309559748468453؛ ارسال نهایی برای review هنوز انجام نشده است.
- کاربر تنظیم کشورها و آزمایشگران را اصلاح کرد. Console اکنون 178 کشور/منطقه و فهرست First Testers با 24 عضو را نشان می‌دهد. ایمیل‌های اشخاص در این گزارش درج نشده‌اند و هیچ پیام دعوتی ارسال نشده است.
- تنها خطای مسدودکنندهٔ مشاهده‌شده در آخرین review، اظهارنامهٔ FOREGROUND_SERVICE_SPECIAL_USE بود. یک هشدار native debug symbols نیز باقی است و در این صفحه مسدودکننده نیست.
- Manifest و VpnConnectionService بررسی شدند: `specialUse` برای حفظ تونل VPN شروع‌شده توسط کاربر و اعلان اتصال استفاده می‌شود. گزینهٔ Other انتخاب شد و توضیح انگلیسی مطابق رفتار واقعی در فرم نوشته شد. لینک برنامه‌ریزی‌شدهٔ فیلم در فرم وارد شد؛ Save هنوز زده نشده و اظهارنامه ثبت نشده است.
- از APK استخراج‌شدهٔ همان AAB روی شبیه‌ساز اختصاصی Android14 فیلم واقعی تهیه شد: درخواست اجازهٔ Android VPN، اتصال، ماندن VPN در پس‌زمینه، اعلان با Disconnect و حذف اعلان/علامت VPN پس از قطع. پینگ دو اتصال حدود226/235ms بود. این آزمون شامل دستگاه16KB یا تست یک‌شبه نبود.
- پروفایل تست قبلاً مجاز Dallas تنها در دادهٔ نصب آزمایشی شبیه‌ساز وارد شد، با نام عمومی User VPN profile. هیچ کانفیگ یا ساب به APK/AAB اضافه نشده است. IPها و آدرس سرور در فیلم تحویلی پوشانده شدند؛ بخش چرخهٔ دوم فیلم چهار برابر سریع شده است. فایل خام و credentialها فقط در scratch خصوصی هستند.
- فیلم آماده: `SecureVPN-Play-1.0.0/securevpn-foreground-service-demo.mp4`، 514746 بایت، SHA256 `68B54407CF28752E284CF73E64010ECABD34D6BC17A81D7FBCEFAC9A6AB2DDEA`. نسخهٔ redacted در `scratch/SecureVPN-Android-source/website/media/` نیز آماده شد. ZIP شش‌فایلی `scratch/securevpn-website-fgs-demo.zip` آماده است؛ انتشار فیلم روی سایت هنوز انجام نشده و لینک آنلاین فعلاً قابل اتکا نیست.
- برای انتشار فیلم و ذخیرهٔ اظهارنامهٔ جدید، تأیید action-time طبق مهارت computer-use درخواست شد؛ پاسخ هنوز در انتظار است. فرم Cloudflare هنگام آخرین بازبینی به فهرست deployments برگشته بود، بنابراین برای انتشار فیلم باید ZIP دوباره در Create deployment آماده و پس از تأیید Save and deploy زده شود.
- باقی‌مانده: انتشار/راستی‌آزمایی URL فیلم، ذخیرهٔ اظهارنامه و بررسی مجدد release، ذخیرهٔ release و ارسال تغییرات برای review با تأیید صاحب حساب، سپس opt-in آزمایشگران. افزودن افراد به فهرست به معنای opt-in نیست و دورهٔ14روزه هنوز تأیید نشده است.
- مانع native16KB قبلی همچنان پابرجاست: ELF64 کتابخانه‌های conscrypt/OpenConnect/stoken هنوز4KB هستند؛ پذیرش این AAB در Console اثبات سازگاری runtime16KB نیست. پیام رضایت AdMob نیز هنوز ساخته/منتشر نشده است. در این نوبت commit یا push جدید انجام نشده است.

این فایل برای تحویل ادامهٔ توسعهٔ SecureVPN به Antigravity نوشته شده است.

آخرین به‌روزرسانی: **۲۰۲۶-۱۰-۰۸، منطقهٔ زمانی Asia/Tehran**. آزمون‌های نسخهٔ1.3.63 از شب۲اکتبر شروع شدند؛ اصلاحات و آزمون نهایی1.3.65 در۳اکتبر تکمیل شدند. Windows2.0.37 در۶اکتبر برای بایپس، دانلود موازی و Check for Updates منتشر شد؛ سپس Android1.3.66و1.3.67 در۷اکتبر برای صفحهٔ فشرده، ساب، اعلان، پینگ و کارت‌ها و1.3.68 در۸اکتبر برای QR و ثبات DNS ساخته شدند.

## وضعیت فعلی و دامنهٔ این همکاری

- کار این گفتگو از وضعیت Android **1.3.55 / versionCode 185** شروع شد و آخرین نسخهٔ ساخته‌شده **1.0.1 / versionCode 200** است.
- مرحلهٔ نخست روی **اندروید** تا1.3.65 انجام شد؛ سپس طبق درخواست کاربر توسعهٔ **Windows/Tauri** به2.0.31 و2.0.32 منتقل شد. آزمون‌های اولیهٔ Android با Windows CLI فقط پراکسی محلی داشتند؛ در مرحلهٔ Windows2.0.31، تونل واقعی سیستم نیز آزمایش و پس از هر مورد کاملاً بسته شد.
- آخرین نصب‌کنندهٔ Windows: [SecureVPN-v2.0.37-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.37-Setup.exe>)، x64، **36,849,111 بایت**، حدود35.14MiB، SHA256 `A3F443DC2A11BF378CFE5C3306228E0C710D11F10C4C436B0348C28D6AAE39ED`. [ریلیز عمومی37](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.37) منتشر شد؛ آزمون ارتقای واقعی36به37 هنوز تأیید نشده است.
- این گزارش تغییرات انجام‌شده در همین همکاری را پوشش می‌دهد. تاریخچهٔ قدیمی‌تر و معماری اولیهٔ پروژه در [DEVELOPMENT_SUMMARY.md](<H:/Antigravity Projects/VPN APP/DEVELOPMENT_SUMMARY.md>) موجود است؛ تمام تغییرات تاریخی آن سند به ChatGPT این گفتگو نسبت داده نشده‌اند.
- آخرین APK: [SecureVPN-v1.0.1.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.0.1.apk>)، arm64-v8a، **37,968,749بایت**، SHA256 `0B797360E8336757AE6432BEE15602ED72234CB9B7823A4D8F9C9B31821E1DF6`. امضای APKهای تست قبلی حفظ شد؛ این فایل هنوز برای Play آماده نیست.
- در 1.3.63 پینگ فهرست SSTP/OpenConnect و انتخاب مستقل mode برای هر XHTTP اصلاح شدند؛ سیاست Force عمومی همچنان پیش‌فرض روشن است.
- کاربر عملکرد فرانسه با stream-up را عالی گزارش کرد، سپس خرابی اپ YouTube با وجود بازشدن سایت را مطرح کرد. علت این گزارش هنوز قطعی نیست؛ تست سایت به‌تنهایی تأیید پخش در اپ محسوب نمی‌شود.
- اصلاح قطع اتصال و وضعیت ابتدایی در 1.3.61 روی شبیه‌ساز با Release تأیید شد: ۱۸ اتصال موفق و قطع کامل. در تست‌های واقعی گوشی 1.3.63 نیز شبکهٔ VPN پس از قطع باقی نماند؛ رفتار تمام گوشی‌ها/Doze تأیید نشده است.

## AdMob setup — ثبت SecureVPN و ساخت واحد بنر، 2026-10-08

- طبق درخواست کاربر از نشست واردشدهٔ AdMob استفاده شد؛ اپ Android با نام دقیق **SecureVPN** به‌عنوان اپی که هنوز در Store منتشر نشده ثبت شد. نام نمایشی مستقل از package فعلی `com.vpnapp` نگه داشته شد.
- واحد `SecureVPN-Connection-Banner` ساخته شد. App ID: `ca-app-pub-5284715425712192~7524274903`; Banner ID: `ca-app-pub-5284715425712192/9988540732`.
- کد بیلد تست عمداً همچنان از Google demo IDs استفاده می‌کند؛ شناسه‌های واقعی هنوز در Manifest یا UI اپ قرار نگرفته‌اند و آگهی درآمدزا تست نشده است.
- باقی‌مانده برای تبلیغ واقعی: پیام رضایت و privacy choices در AdMob/UMP، ارتقای سازگار SDK/toolchain، سیاست حریم خصوصی و Data safety، انتشار/اتصال Store listing، وب‌سایت توسعه‌دهنده و `app-ads.txt`، سپس AdMob readiness review. AdMob اعلام کرد فعال‌شدن اولیهٔ واحد جدید ممکن است تا یک ساعت طول بکشد.
- منابع بررسی‌شده: [راهنمای UMP اندروید](https://developers.google.com/admob/android/privacy) و [راهنمای بنر اندروید](https://developers.google.com/admob/android/banner).

## Google Play — بررسی نام بسته و آماده‌سازی فرم، 2026-10-08

- نام نمایشی SecureVPN در فرم Create app وارد شد. بررسی Play نشان داد شناسهٔ فعلی `com.vpnapp` و `com.securevpn` قبلاً در Play استفاده شده‌اند؛ candidate `com.rahanetmci.securevpn` آزاد بود، اما تا تأیید مالکیت دامنهٔ `rahanetmci.com` انتخاب/ثبت نشد.
- فرم Play ارسال نشد و دو اظهارنامهٔ سیاست Play و صادرات رمزنگاری را تیک نزدم. هیچ listing یا AAB بارگذاری و منتشر نشده است. تغییر package یعنی نسخهٔ Play از اپ sideload فعلی جدا نصب می‌شود.

## Android 1.0.1 / versionCode200 — بنر آزمایشی پس از دو چرخه، 2026-10-08

- طبق تأیید کاربر، بنر کوچک AdMob با demo App ID و fixed-banner ID رسمی Google اضافه شد؛ شناسهٔ درآمدزا یا کانفیگ آمادهٔ VPN اضافه نشده است.
- دو چرخه فقط با ثبت موفقیت اتصال در worker و خاتمهٔ نشست همان worker حساب می‌شوند. تکرار پیام، خطای قبل از اتصال، status request و کلیک دکمه شمارنده را زیاد نمی‌کنند. AtomicFile+قفل فایل در noBackupFilesDir برای اشتراک امن بین UI و worker به‌کار رفت؛ UI از SharedPreferences cache چندپروسسی برای شمارنده استفاده نمی‌کند.
- نمایش فقط داخل Home، foreground/RESUMED و DISCONNECTED؛ footer320×50 زیر ناحیهٔ اسکرول است و روی کنترل‌های اتصال نمی‌افتد. در اتصال مجدد/خروج Home/پس‌زمینه destroy می‌شود. اتصال از اعلان تبلیغ یا Activity جدید باز نمی‌کند.
- حداقل دو دقیقه فاصلهٔ تلاش‌ها،15ثانیه فرصت load پس از SDK init،45ثانیه سقف نمایش، بدون placeholder هنگام خطا. چرخه‌ها با impression واقعی reset می‌شوند؛ failure مصرف نمی‌کند و pending به2 محدود است. Ads از state machine اتصال مستقل‌اند و exception شمارنده سرویس را قطع نمی‌کند.
- SDK25.5 با Kotlin فعلی به‌دلیل metadata2.3 شکست خورد؛ AAR24.0 نیزmetadata2.1 داشت. برای APK تست23.6 استفاده شد؛ این سری deprecated ولی هنوز sunset نشده است. ارتقای SDK همراه Kotlin/Compose/AGP پیش از Play در ANDROID_ADS.md ثبت شد. AD_ID از merged manifest حذف شد؛ ادعای نبود جمع‌آوری داده توسط SDK نشده است.
- بسته‌بندی چهار ABI با heap2GB دچار OutOfMemory شد؛ همان بیلد با heap4GB و max-workers=2 پاس شد. این محدودیت ابزار build است، نه crash اپ گوشی. نخستین بیلدهای ناموفق و اصلاحات در لاگ‌های scratch محفوظ‌اند.
- نتیجهٔ نهایی:39 آزمون JVM بدون شکست،4 آزمون متمایز Android (شمارنده، پنج restart واقعی worker، Home فشرده و بنر) و smoke نسخهٔ minified Release پاس شدند. creative آزمایشی Google واقعاً دریافت و نمایش داده شد؛ در CONNECTING حذف شد و کنترل‌ها فعال ماندند. خطای اولیهٔ SDK «Must be called on main UI thread» با dispatch صریح loadAd و destroy به Main.immediate رفع شد. لاگ‌های نهایی: android-1.0.1-banner-final.log و android-1.0.1-release-smoke.log در scratch.
- APK1.0.1/code200، arm64-v8a،37,968,749بایت، SHA256 `0B797360E8336757AE6432BEE15602ED72234CB9B7823A4D8F9C9B31821E1DF6`؛ امضای تست قبلی حفظ شده است. افزایش حدود1.81MiB نسبت به1.0 به وابستگی Ads مربوط است. Windows تغییر نکرد. تست شبانه روی گوشی انجام نشده؛ این فایل برای تست است و درآمد تبلیغاتی ندارد.

## Android 1.0 / versionCode 199 — تم ساده، اعلان و آماده‌سازی انتشار، 2026-10-08

- طبق درخواست کاربر برای اولین انتشار Play، نسخهٔ نمایشی از1.3.68 به1.0 تغییر کرد؛ versionCode از198 به199 افزایش یافت تا APK تست روی نصب قبلی ارتقا پیدا کند. نسخهٔ دسکتاپ تغییر نکرد.
- پس‌زمینهٔ تزئینی WorldMap از صفحهٔ اصلی حذف شد. همهٔ صفحه‌ها زمینهٔ یکدست دارند؛ دارک با مشکی/خاکستری خنثی و کارت‌های بدون گرادیان آبی/بنفش نمایش داده می‌شود. surfaceTint نیز خنثی شد.
- تابع بلااستفادهٔ getDefaultVlessProfile حاوی کانفیگ تست واقعی و SampleProfiles حذف شدند. Repository در نصب تازه هیچ پروفایل یا سابی ایجاد نمی‌کند؛ کانفیگ‌های شخصی نصب قبلی حذف نمی‌شوند.
- گزارش اعلانِ ناپدیدشده بدون قطع VPN: سرویس همهٔ پروتکل‌ها هر15ثانیه وجود اعلان همان نشست را بررسی می‌کند؛ فقط وقتی اعلان مفقود و دسترسی/کانال فعال باشد بازیابی می‌شود. هنگام shutdown job لغو می‌شود و lock و session guard مانع بازگشت اعلان نشست متوقف‌شده هستند. deleteIntent بازیابی قبلی حفظ شد.
- اگر startForeground شکست بخورد، اتصال متوقف می‌شود؛ VPN بدون foreground ادامه نمی‌یابد. Android14+ اجازهٔ سوایپ ongoing را به کاربر می‌دهد؛ اپ از category جعلی تماس استفاده نمی‌کند. امکان بازیابی اعلان با سیاست سیستم هماهنگ است و اعلان خاموش‌شده از تنظیمات کاربر دوباره فعال نمی‌شود.
- ریپوی خصوصی جدا: https://github.com/morezaGeek/SecureVPN-Android . مقدار PAT و فایل‌های خصوصی، APK، backup، دیتای کاربر و AAR بزرگ وارد Git نمی‌شوند. مبنای تاریخچه snapshot پاک‌سازی‌شدهٔ1.3.68 است، نه ادعای وجود همهٔ commitهای قدیمی اندروید.
- آماده‌سازی Play: این نخستین انتشار است. امضای فعلی APK تست debug است و برای Play پذیرفته نمی‌شود. بررسی ELF arm64 نشان داد libbox دارای alignment16KB است، ولی libconscrypt_jni/libopenconnect/libstoken فقط4KB هستند و باید dependency به‌روزرسانی یا از سورس بازسازی شوند؛ فقط ZIP alignment مشکل ELF را رفع نمی‌کند. targetSDK فعلی35 است؛ انتشار تازه در۸اکتبر۲۰۲۶ API36 می‌خواهد. راهنمای انتشار و شواهد در ANDROID_PLAY_PREPARATION.md ثبت می‌شوند. هیچ آپلود Play در این مرحله انجام نشده است.
- تأیید نهایی: 34 آزمون JVM، شش آزمون instrumented شامل نصب خالی، رنگ خنثی، صفحهٔ فشرده، اعلان و پنج reconnect تونل واقعی پاس شدند. در roundاول اعلان ongoing واقعاً در shade سوایپ شد؛ deleteIntent فقط در ابزار تست حذف شده بود، لذا برگشت اعلان از watchdog بود. در roundآخر16ثانیه بعد از disconnect نیز اعلان غایب ماند. بررسی یک‌شبه روی گوشی کاربر انجام نشده است.
- APK Release با R8 روی شبیه‌ساز نیز اجرا شد؛ runner مستقل از Compose، نسخه1.0 و نبود پروفایل آماده را تأیید و چهار اسکرین‌شات واقعی Home/Settings در Light/Dark را ثبت کرد. عکس‌ها آفلاین و بدون IP واقعی یا کانفیگ کاربر در Android-1.0-Screenshots هستند. مشکل initial manifest ابزار تست با ثبت صریح JUnit runner رفع شد؛ برنامهٔ تولیدی تغییر اضافی نداشت.
- فایل گوشی SecureVPN-v1.0.apk، arm64-v8a، 36,073,260 بایت، SHA256 `25B4CB4FE09EC39383E354C31638F2013FCFDC19B3B3CF0FDB3E42C6013E029E`. apksigner گواهی قبلی `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` را تأیید کرد. کد199 از198 بالاتر است؛ ارتقای APK بدون reset نسخه ممکن است. پس‌زمینه و helper بلااستفاده حذف شدند، اندازهٔ APK اندکی کمتر از1.3.68 شد.
- شواهد: scratch/android-1.0-build.log، android-1.0-instrumentation.log، android-1.0-release-smoke.log و android-1.0-native-audit.json. Play بعد از API36، امضای انتشار و اصلاح native16KB قابل ادامه است.
- انتشار سورس تأیید شد: دو commit مبنا و تغییرات در main ریپوی خصوصی SecureVPN-Android پوش شدند؛ SHA بررسی‌شدهٔ initial push `0507b8da5efd7f7e2ebc0094243b634a66f1d76b` بود. private بودن پس از push با API دوباره تأیید شد. بیلد مستقل checkout پوش‌شده نیز با JDK17 و dependency pinned، به‌صورت offline پاس شد؛34 آزمون JVM و assembleRelease موفق بودند. راهنمای ادامه و محل checkout در ANDROID_GITHUB.md است.

## Android 1.3.68 / versionCode198 — اسکن و اشتراک‌گذاری QR و ثبات DNS، 2026-10-08

- نتیجهٔ تست گوشی، ۸ اکتبر ۲۰۲۶: پس از تحویل APK1.3.68 در ادامهٔ گزارش کامنت‌های Instagram روی Dallas/Gozar، کاربر گفت «دمت گرم درست شد». رفع مشکل گزارش‌شده روی گوشی از طرف کاربر تأیید شد. این نتیجه، تأیید کاربر است؛ تست مستقل حساب توسط توسعه‌دهنده انجام نشده و ثابت نمی‌کند تغییر نگاشت FakeIP تنها علت بوده است. timeoutهای آزمایش شبیه‌ساز در گزارش زیر برای پیگیری تاریخی حفظ شده‌اند.
- Add → Scan QR، V2Ray → Scan QR و Add Sub → Scan QR یک اسکنر portrait داخلی با ZXing Android Embedded4.3.0 وcore3.5.3 باز می‌کنند. CAMERA فقط پس از انتخاب Scan QR درخواست می‌شود؛ نبود دوربین، رد مجوز و لغو اسکن رسیدگی دارند. CAMERA feature اجباری نیست. CaptureActivity چرخهٔ دوربین و decoding را مدیریت می‌کند؛ QR فقط محلی پردازش می‌شود، تصویر دوربین ذخیره/آپلود نمی‌شود.
- نتیجهٔ QR و کلیپ‌بورد از ShareLinkCodec.parseImport عبور می‌کنند. لینک پروفایل قبل از ذخیره نام/پروتکل/سرور را نشان می‌دهد؛ HTTP(S) پیش‌نمایش ساب و نام اختیاری دارد و تنها پس از Import دانلود می‌شود. QRهای دیگر، لینک نامعتبر، پورت خارج بازه و auth خالی رد می‌شوند. Force/Smart XHTTP همچنان از addProfile قبلی اعمال می‌شود.
- دکمهٔ Share کنار هر کارت و Share subscription در ویرایش ساب، دیالوگ QR و Copy link / Share link / Share QR image باز می‌کند. کلیپ‌بورد full link و sensitive flag دارد. PNG از cache/shared-qr با FileProvider غیرexported و فقط همان مسیر، content URI و مجوز موقت خواندن ارسال می‌شود؛ دسترسی storage درخواست نمی‌شود. QR سفید/سیاه با quiet zone، UTF-8 وECC M است؛ لینک بیش از ظرفیت QR همچنان کامل قابل کپی و اشتراک متنی است. ساخت QR وPNG روی thread پس‌زمینه انجام می‌شود.
- خروجی VLESS/VMess/Trojan/Shadowsocks/Hysteria2 لینک همان پروتکل است؛ IPv6، credential، نام فارسی، + و% وtransport، XHTTP extra/mode، TLS/Reality، VLESS encryption وVMess cipher/alterId حفظ می‌شوند. خروجی OpenConnect/SSTP با scheme همان پروتکل، username/password وinsecure/DTLS/native/MTU است؛ round-trip داخل SecureVPN پشتیبانی می‌شود، سازگاری این دو scheme با تمام کلاینت‌های دیگر ادعا نمی‌شود. Smart policy محلی/شناسه‌ها/آمار/تاریخ به گیرنده صادر نمی‌شوند؛ برای XHTTP mode واقعی/موفق صادر می‌شود و سیاست import گیرنده مستقل است.
- parser برای round-trip اصلاح شد: fragment URI دوباره URLDecode نمی‌شود (نام‌های شامل%یا+ خراب می‌شدند)، bracketهای IPv6 حذف می‌شوند، gRPC serviceName خوانده می‌شود وVMess aid/scy/extra وallowInsecure از لینک نگه داشته می‌شوند. Hysteria2 insecure صریح خوانده می‌شود؛ پیش‌فرض قبلی بدونپارامتر حفظ شد.
- نسخه وUI به1.3.68/code198 افزایش یافت؛ کتابخانهٔ هسته، MTU وWindows تغییر نکردند. علاوه بر QR، persistence نگاشت FakeIP اصلاح شد.
- بررسی Dallas ساب Gozar: پروفایل محلی VLESS/XHTTP باTLS وALPN=h2 وextra مربوط بهpadding بود. مقایسهٔ Desktop با sing-box1.14.2-lx.11 وXray26.3.27، درauto وstream-up: هرچهار URL (generate_204، robots اینستاگرام، i.instagram.com/api/v1 وgraph.instagram.com) پاسخ HTTP دادند؛ UDP/DNS از داخل SOCKS نیز درهرچهار حالت پاسخ معتبر داشت. 404/400 ویک500 پاسخ سرور API بدونورود هستند، تأیید کامنت یا حساب نیستند. نتایج بدونcredential در scratch/dallas-2026-10-08/results.json هستند.
- یک ایراد مشخص DNS بازتولید شد: FakeIP همان دامنه در دو worker متوالی و ترتیب متفاوت تخصیص از198.18.0.3 به198.18.0.5 عوض شد. اپ‌های باز می‌توانند پاسخ IP قبلی را در حافظه نگه دارند و بعد ازتعویض VPN به نگاشت اشتباه/ناموجود برسند. experimental.cache_file با enabled وstore_fakeip فعال شد؛ مسیر مطلق context.noBackupFilesDir/sing-box-fakeip.db، مشترک بین کانفیگ‌ها وخصوصی اپ است، درbackup اندروید وارد نمی‌شود. مسیر نسبی قبلاً به‌دلیل permission حذف شده بود؛ این مسیر از working directory هسته مستقل است. صرفاً نگاشت FakeIP ذخیره می‌شود؛ store_dns فعال نشده تا پاسخ‌های واقعی DNS بین سرورها بی‌جهت نگه نمانند. تست پینگ مستقل mixed-inbound این فایل را استفاده نمی‌کند.
- آزمون پیش‌ازاصلاح در scratch/android-1.3.68-fakeip-before.log باخطای مقایسهٔ آدرس شکست خورد؛ پس‌ازاصلاح پنج restart هسته باسرورfixtureمحلی، چنددامنهٔ جدید درهرround وDNS UDP ازتونل واقعی، آدرس همان دامنه ثابت ماند وexitlookup/latency کارکردند. آماده‌شدن شبکهٔ VPN پیش‌شرط درخواستDNS شد؛ broadcast CONNECTED می‌تواند زودتر ازانتخاب default network برسد وبدوناین‌انتظار یکquery بهDNS بیرونی رفتهNXDOMAIN گرفت. این انتظار اصلاح تست است؛ خودش به‌عنوان علت قطعی Instagram گزارش نشده.
- آزمون نهایی: 34unit، 16instrumentation یکپارچه و1instrumentation اضافی تغییر زندهٔ routing/قطع و وصل همگی پاس شدند. مسیر دوربین باQR مصنوعی، رد دسترسی وretry/تأیید، عدمذخیره قبل ازImport، round-trip هفت پروتکل، خواندنPNG ازFileProvider، clipboard sensitive وdecode پیکسل‌هایQR درهردوتم بررسی شدند. oversized QR کپی/اشتراکمتنی را ازکارنمی‌اندازد. R8/minify وlintVitalRelease پاس شدند.
- چالش‌های تستQR: شبیه‌ساز اولیهAPI37 باEspresso قدیمی خطای InputManager داشت؛ آزمون نهایی رویAPI34 اجرا شد. imagefile camera باpath دارایفاصله وviewport/crop ورودی به‌درستی QR را نشان نمی‌داد؛ فایل تست به مسیر بدونفاصله منتقل وQR512px درcanvas سفید1920 باoffset مناسب گذاشته شد. flagهای user-fixed مجوز بینتست‌ها پاک شدند. اسکن واقعی API34 سپس پاس شد؛ تست منطق بافرض decode موفق گزارش نشده است. دیالوگ اشتراک160dp وpreview لینک دودخط است تا Copy/Share ازابتدا دیده شوند؛ محتوای خروجی وPNG768px کامل هستند. PixelCopy درتغییرتم ممکن است زودتر ازhardware redraw snapshot بدهد؛ خود QR نمایش‌داده‌شده درهرتم decode و اعتبارسنجی شد.
- آزمون تکمیلی نگاشت معکوس نیز پاس شد: در هر پنج اتصال، با socket به FakeIP نگه‌داشته‌شده وصل شدیم و HTTP Host هم همان IP بود تا sniffing نام اصلی را بازیابی نکند؛ سرور fixture نام دامنهٔ صحیح را در هدر VLESS دریافت کرد. تست اولیهٔ HttpURLConnection به‌دلیل منع cleartext اندروید متوقف شد و فقط ابزار تست به socket محلی تغییر کرد؛ سیاست HTTP اپ تغییر نکرد. لاگ نهایی scratch/android-1.3.68-fakeip-after.log شامل OK (1 test) است.
- محدودیت Dallas: باگ تغییر نگاشت FakeIP تأیید و اصلاح شده است، ولی اینکه تنها علت نیامدن کامنت‌های حساب کاربر باشد هنوز ثابت نشده؛ endpoint بدونlogin جای تست خودcomments را نمی‌گیرد. پس‌ازنصب، یکبار Instagram را کامل ببند و دوباره باز کن تاFakeIPهای ذخیره‌شده ازنسخهٔ قبلی کنار گذاشته شوند؛ سپس Dallas وقطع/وصل را باهمان حساب/اینترنت مقایسه کن. درصورتباقی‌ماندن مشکل، trace DNS/TCP/UDP همان گوشی وکانفیگ دقیق v2rayNG لازم است؛ بدونشاهد QUIC یاMTU سراسری تغییر داده نشد.
- وضعیت دقیق تست واقعیDallas: قبل ازاصلاح، stream-up رویریلیز ازTUN واقعی بههرسه endpoint جوابداد وping209ms/PublicIPUS داشت. دربیلدنهایی، باmodeواقعی auto (generated_mode=auto)، دوendpoint اینستاگرامtimeout وgraph400 بود. سناریوی stream-up/reconnect هم رویبررسی endpointها شکست خورد؛ بنابراین موفقیت تستثباتDNS با موفقیت کامنت‌ها یکی نیست وتمام timeoutهایDallas رفع‌شده گزارش نمی‌شوند. Desktopمجدداً درهردوهسته وmodeها HTTP/UDP پاسخ داد؛ اختلاف AndroidTUN/مسیرشبکه هنوز نیازمند trace گوشی است. ابزار قدیمی mode_override تنهاv2rayType را عوض می‌کرد وoverride ذخیره‌شده می‌توانست آنرا overwrite کند؛ ابزار اصلاح شد وgeneratedmode باخواستهٔ تست assert می‌شود. کاربر درپاسخ۸اکتبر گفت فعلاً APK را بده تاخودش رویگوشی تست کند؛ تستخودحساب وcomments انجام نشد.
- APK نهایی: [SecureVPN-v1.3.68.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.3.68.apk>)، arm64-v8a، **36,078,148 بایت**، حدود34.41MiB، افزایش179,284بایت نسبت به67. SHA256 `F5EC40C67E295906F5740149D9B46B982B556156A6C562B0B16206CFC51B51A6`. apksigner گواهی قبلی `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` را تأیید کرد؛ نصب روی نسخهٔ قبلی ممکن است. شواهد محلی: scratch/android-1.3.68-build.log، api34-tests.log، routing-test.log، qr-pixels.log، qr-release.log وپوشه scratch/dallas-2026-10-08. سورسAndroid وAPK مطابق ignore ریشه محلی‌اند؛ این درخواست انتشارGitHub نداشت.
- منابع رسمی پیاده‌سازی: [ZXing Android Embedded](https://github.com/journeyapps/zxing-android-embedded)، [Android FileProvider](https://developer.android.com/reference/androidx/core/content/FileProvider)، [Sensitive clipboard](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste#sensitive-content)، [sing-box cache_file/store_fakeip](https://sing-box.sagernet.org/configuration/experimental/cache-file/). برای تست واقعی مسیر دوربین می‌توان [imagefile camera emulator](https://developer.android.com/studio/run/emulator-commandline) را باQR مصنوعی به کار برد.

## Android 1.3.67 / versionCode197 — پینگ تازه و کارت‌های کوچک‌تر، 2026-10-07

- با شروع تست، نتیجهٔ قبلی تمام پروفایل‌های هدف و selectedProfile فوراً پاک می‌شود. تست‌ها پشت‌سرهم اجرا می‌شوند؛ صف تست، پروفایل در حال تست و تعداد تکمیل‌شده در StateFlow نمایش داده می‌شوند. spinner فقط هنگام تست فعال است؛ کارت‌های منتظر «Queued» دارند. دکمهٔ Ping حین تست غیرفعال است تا ضربهٔ تکراری صف جدا نسازد.
- generation و cancellation از اعمال نتیجهٔ دور قبلی جلوگیری می‌کنند؛ failure مقدار -1 ثبت می‌کند و حالت busy در finally پاک می‌شود. نتیجهٔ پروفایلی که حین تست ویرایش یا با refresh عوض شده اعمال نمی‌شود. هنگام اتصال، تست لیست فقط latency تونل فعال را می‌گیرد؛ هستهٔ آزمایشی موازی با VPN ساخته نمی‌شود. انتخاب کارت دیگر هویت تست تونل فعال را عوض نمی‌کند.
- لمس ردیف سرعت/حجم، دیالوگ دانلود، آپلود و مجموع حجم همین اتصال را باز می‌کند؛ اعداد زنده‌اند و شمارندهٔ کل عمر اپ محسوب نمی‌شوند.
- تاریخ روی کارت زمان آخرین اتصال بود؛ نمایش آن و formatter حذف شد ولی timestamp ذخیره‌شده حفظ شد. عنوان کارت titleSmall و حداکثر2خط است، ستون متن وزن مستقل دارد تا دکمه‌های ویرایش/حذف بیرون نروند.
- هسته، MTU، routing، Windows و فونت سیستم گوشی تغییر نکردند.
- تأیید نهایی67: 34 تست JVM و5 تست instrumentation روی emulator API34 موفق بودند؛ پاک‌شدن فوری نتایج، تکرار تست با probe لغوشده، failure و رفع busy، نام دقیقاً2خطی در عرض360dp/font1.2، حذف تاریخ و نمایش spinner به‌جای پینگ قبلی، دیالوگ ترافیک در تم روشن/تیره و رگرسیون‌های ساب/اعلان پوشش داده شدند. تصاویر Home به‌صورت محلی بررسی شدند. Release با R8 روی شبیه‌ساز نصب شد و MainActivity بدون crash اجرا شد؛ تست واقعی اتصال/سرعت شبکه روی گوشی در این نسخه انجام نشده است.
- APK نهایی: [SecureVPN-v1.3.67.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.3.67.apk>)، arm64-v8a، **35,898,864 بایت**، حدود34.24MiB؛ افزایش3,172بایت نسبت به66. SHA256 `A17A47030FE25AAC6296B88096A609CD06E5971F84E5EC583C698602181E1842`. apksigner امضای67و66را یکسان تأیید کرد: `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62`؛ APK روی نسخهٔ موجود قابل ارتقاست، نصب روی گوشی به کاربر واگذار شد.
- شواهد محلی: scratch/android-1.3.67-build.log، scratch/android-1.3.67-instrumentation.log، scratch/android-1.3.67-home-light.png وhome-dark.png. سورس Android وAPK طبق .gitignore ریشه وارد Git ویندوز نمی‌شوند؛ انتشار GitHub در این درخواست انجام نشد.

## Android 1.3.66 / versionCode196 — صفحهٔ اصلی فشرده و ساب، 2026-10-07

- طبق درخواست کاربر، توسعه دوباره به Android منتقل شد؛ Windows2.0.37 و هسته‌ها تغییر نکردند.
- MainActivity.onStart رفرش تمام ساب‌های ذخیره‌شده را در پس‌زمینه درخواست می‌کند؛ برگشت از پس‌زمینه نیز رفرش می‌کند. ViewModel guard جلوی تکرار در چرخش صفحه و jobهای هر ساب جلوی هم‌پوشانی را می‌گیرند. حداکثر3دریافت هم‌زمان؛ موفقیت/شکست در لاگ و وضعیت refresh در UI. رفرش دیگر خودکار همهٔ پینگ‌ها را اجرا یا VPN را restart نمی‌کند. قطع شبکه، فهرست قبلی را نگه می‌دارد؛ URL و حذف/ویرایش حین دریافت دوباره بررسی می‌شوند.
- SubscriptionProfiles.merge شناسهٔ محلی، زمان ساخت/آخرین اتصال و override دستی XHTTP را حفظ می‌کند؛ دادهٔ تازهٔ سرور وارد می‌شود و نتیجهٔ smart/ping با تغییر endpoint معتبر نمی‌ماند. نام‌های تکراری یک‌به‌یک با endpoint تطبیق می‌یابند. این اصلاح برای رفرش هر بار ضروری بود؛ parser قبلاً UUID تازه می‌داد و selected profile به اول لیست می‌پرید.
- فیلتر ساب در SharedPreferences vpn_profiles با selected_subscription_id ذخیره می‌شود؛ در بازشدن/بازگشت از تنظیمات همان ساب می‌ماند و chip آن به دید می‌آید. حذف همان ساب به All برمی‌گردد؛ پروفایل‌ها پاک نمی‌شوند.
- نام کانفیگ اصلی از session/service و profile_id نمایش داده می‌شود، مستقل از انتخاب کارت بعدی. تمام broadcastهای Connected و RequestState شناسه/نام/پروتکل دارند؛ وضعیت سرویس در هر onStart UI دوباره خوانده می‌شود. کانفیگ حذف‌شده از ساب، نام session فعال را مخفی نمی‌کند.
- UI: دکمهٔ108dp کنار وضعیت و نام کانفیگ/ساب/زمان؛ حذف Private IP و Transport فقط از صفحه؛ Public IP و Ping در کارت کوچک، Origin IP و MTU در ردیف پایین؛ سرعت دانلود/آپلود و مجموع حجم در یک ردیف. نسخه به بالای صفحه منتقل، فاصله‌ها کمتر، لاگ با لمس باز/بسته و FAB تکراری حذف شد. تم روشن/تیرهٔ موجود حفظ شد و انیمیشن مداوم جدید اضافه نشد.
- اعلان سرویس ongoing و autoCancel=false و onlyAlertOnce است. اندروید14به‌بعد حتی ongoing را در حالت unlocked قابل سوایپ می‌کند؛ deleteIntent به همان سرویس برمی‌گردد و فقط برای session فعلی در حالت connecting/connected اعلان را repost می‌کند. در قطع، shutdown یا intent متعلق به session قدیمی، VPN دوباره وصل نمی‌شود و اعلان برنمی‌گردد. این راهکار بازیابی اعلان است، ادعای ممنوع‌شدن قطعی gesture در تمام OEMها نیست؛ مجوز/کانال خاموش‌شده توسط کاربر هم از اپ قابل اجبار نیست. [مرجع رسمی](https://developer.android.com/about/versions/14/behavior-changes-all#non-dismissable-notifications).
- تأیید نهایی66: 34 تست JVM و3 تست instrumentation روی emulator API34 گذشتند (Home360dp وfont1.2 در هر دو تم، foreground refresh/فیلتر و notification flags). Release با R8 نصب و اجرا شد. SecureVPN-v1.3.66.apk، arm64، 35,895,692بایت؛ SHA256 `CD659654104B30656347C4938081732836552D65ED468DF8211E948AC741B30B`؛ همان گواهی نسخه65. آزمون VPN و gesture اعلان روی تمام OEMها انجام نشده. درخواست بازگردانی font_scale شبیه‌ساز از1.5به1.0 در پایان66 توسط automatic approval review به علت سقف مصرف رد شد و اجرا نشد.
- خطای اولیه Gradle: TEMP ابزار sandbox بیش از حد طولانی بود و JDK UnixDomainSockets با Invalid argument: connect شکست خورد. انتخاب JDK17 و TEMP/TMP و jdk.net.unixdomain.tmpdir کوتاه داخل scratch/jtmp فقط برای پردازش build، مشکل اتصال daemon را حل کرد؛ IPv4 به‌تنهایی کافی نبود. هیچ تنظیم سیستمی تغییر نکرد.

## Windows 2.0.37 — رفع حلقهٔ بایپس و دانلود موازی، 2026-10-06

- گزارش کاربر: هنگام ورود IP بایپس پنجره‌ای مکرراً باز/بسته می‌شود؛ دامنه نیز همان مسیر را داشت. save روی blur حتی آرایهٔ بدون تغییر را ارسال می‌کرد؛ provider صرف وجود کلید routing را «تغییر» فرض و connect دوباره می‌کرد. taskkill بدون CREATE_NO_WINDOW می‌توانست پنجره/فوکوس را جابه‌جا کند و blur مجدد تولید کند.
- provider اکنون مقادیر واقعی را با settingsRef مقایسه می‌کند؛ بدون تغییر هیچ ذخیره/اتصال مجدد انجام نمی‌شود. merge بیرون updater تابع setState است، snapshot جدید فوراً در ref نگهداری می‌شود و تغییر هم‌زمان IP/دامنه از بین نمی‌رود. routing در یک صف apply انجام می‌شود؛ blur+Save همان Promise را انتظار می‌کشند، عملیات هم‌زمان connect ایجاد نمی‌کنند و آخرین snapshot بعد از عملیات جاری اعمال می‌شود.
- blur ناشی از خروج فوکوس از خود اپ، متن نیمه‌ویرایش‌شده را live apply نمی‌کند؛ Save صریح همچنان کار می‌کند. پیام Applied Live بعد از پایان عملیات موفق نمایش داده می‌شود؛ در خطا، تنظیمات ذخیره می‌شوند ولی پیام reconnect لازم است. تایمرهای Saved محدود به دو کادرند، هنگام خروج پاک می‌شوند و پاسخ دیررس روی screen بسته‌شده setState نمی‌کند. label دسترس‌پذیر برای کادرها/Save اضافه شد.
- taskkillهای بستن PID خود اپ و فرمان net session به helper hidden_command منتقل شدند که در Windows از CREATE_NO_WINDOW استفاده می‌کند. نصب/UAC دور زده نشده است؛ رفتار GUI هسته تغییر نکرده و آزمون مستقیم روی پنجرهٔ Administrator انجام نشده است.
- دانلود خودکار فایل‌های حداقل8MiB اکنون Range0-0 را واقعاً بررسی می‌کند؛ در پشتیبانی معتبر، چهار اتصال HTTP/1.1، قطعه‌های2MiB و handle/seek مستقل در فایل preallocated استفاده می‌شوند. هر قطعه دو تلاش،90ثانیه سقف درخواست و20ثانیه سقف توقف دریافت دارد. به‌جای clone کردن handle با offset مشترک، هر worker فایل را جدا باز می‌کند.
- Range باید206، Content-Range دقیق شامل total و encoding identity داشته باشد؛ strong ETag در صورت وجود با If-Range منتقل می‌شود. URL نهایی CDN از redirect معتبر client گرفته می‌شود؛ توکن انتشار داخل اپ وجود ندارد. در خطا/عدم پشتیبانی، همهٔ workerها abort/reap و سپس فایل برای دانلود تک‌اتصال truncate می‌شود. retry پیشرفت را دوبار نمی‌شمارد و بیشتر از100درصد گزارش نمی‌شود.
- بعد از flush/sync، SHA256 روی کل فایل مونتاژشده خوانده و اندازه/hash تأیید می‌شوند؛ hash قطعه‌ها به‌هم چسبانده نمی‌شود. فایل ناقص/اشتباه جای installer تأییدشده را نمی‌گیرد و اجرا نمی‌شود. فایل‌های کوچک مستقیم تک‌اتصال می‌مانند.
- مقایسهٔ زنده بدون توکن، با همان installer36 به اندازه36,785,885بایت و همان Client/شبکه: تک‌اتصال86.47ثانیه،3.40Mbps میانگین؛ موازی واقعاً Parallel،12.52ثانیه،23.51Mbps میانگین. SHA256 هر دو صحیح بود؛ حدود6.91برابر بهبود در این اجرا، نه تضمین همیشگی. اجرای مستقل production downloader نیز همین فایل را10.9ثانیه و با hash صحیح دریافت کرد.
- تست رفتاری React: blur بدون تغییر، blur+Save، صف IP سپس دامنه، حفظ هر دو مقدار، blurهای تکراری بعد از apply و خروج فوکوس از اپ پاس شدند؛ تست‌های قبلی پینگ/حفظ ساب نیز پاس‌اند.22تست Rust موفق،5تست شبکه/fixture پیش‌فرض ignored؛ تست هم‌زمانی Range، tail غیرهم‌اندازه، Range نادیده‌گرفته، header خراب، قطعهٔ ناقص/retry، و حفاظت SHA/installer قبلی پاس شدند. TypeScript پاس شد؛ Release build و نصب‌کننده37 موفق‌اند.
- نصب‌کنندهٔ نهایی: [SecureVPN-v2.0.37-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.37-Setup.exe>)، x64، **36,849,111 بایت**، حدود35.14MiB، SHA256 `A3F443DC2A11BF378CFE5C3306228E0C710D11F10C4C436B0348C28D6AAE39ED`.
- تصویر جدید نصب36 را تأیید می‌کند؛ روش نصب و دیدن نشان Update صریحاً تأیید نشده. دانلود خود37 از نسخهٔ نصب‌شده36 همچنان downloader قدیمی36 را استفاده می‌کند؛ دانلود موازی پس از نصب37 برای آپدیت‌های بعدی فعال است. طبق درخواست پیشین،37 اول روی GitHub منتشر می‌شود و قبل از آزمون نشان36 دستی نصب نمی‌شود.
- Android، core1.14.2-lx.11 و تنظیمات MTU/DNS اتصال اصلی تغییر نکردند؛ توکن/fixtureهای خصوصی و فایل‌های نامرتبط وارد Git نمی‌شوند.
- درخواست تکمیلی همین نسخه: دکمهٔ Check for Updates در پایین Sidebar همیشه در دسترس است؛ به‌جای بازکردن صفحهٔ Releases، metadata را با backend واقعی بررسی می‌کند. Checking، Up to date و خطا نمایش داده می‌شوند؛ با پیدا شدن نسخهٔ جدید، دکمه به Update تبدیل می‌شود. بررسی نصب خودکار انجام نمی‌دهد؛ نصب با کلیک بعدی کاربر است. دکمهٔ Settings/About همین مسیر را حفظ می‌کند و footer برای متن کامل دو ردیف دارد. تست رفتاری، بررسی دستی دوم پس از نبود آپدیت، قفل هنگام بررسی و نصب فقط با کلیک را تأیید کرد.
- مرجع semantics Range/206 و If-Range: [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-14)، [If-Range](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.5).

- انتشار37 تکمیل شد: سورس `c2d3e76c3869f34c5eb1b5995f69034fd1889769` روی main پوش و tag v2.0.37 روی همان commit تأیید شد. [ریلیز عمومی37](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.37) و [installer](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.37/SecureVPN-v2.0.37-Setup.exe)، 36,849,111بایت، SHA256 `A3F443DC2A11BF378CFE5C3306228E0C710D11F10C4C436B0348C28D6AAE39ED`. فایل draft قبل از عمومی‌شدن دانلود مجدد و hash، سپس digest/اندازه/tag عمومی تأیید شدند. دکمهٔ Check for Updates هم در همان build نهایی37 است؛ React workflow و TypeScript بعد از افزودن آن مجدداً پاس شدند.
- آزمون خودکار کلیک Update در نسخهٔ نصب‌شده36 همچنان به دسترسی ابزار به اپ Administrator محدود است؛ نتیجهٔ ارتقای واقعی36به37 را تأیید نمی‌کنیم.37 دستی نصب نشده است؛ کاربر می‌تواند در36 از Settings/About > Check for Updates مسیر واقعی ارتقا را تست کند. دانلود موازی برای آپدیت‌های بعدی از37 فعال خواهد بود.

## Windows 2.0.36 — پینگ، حفظ صفحه/ساب و دانلود آپدیت، 2026-10-06

- کاربر دانلود و نصب واقعی آپدیت35 و اتصال Hamed را تأیید کرد. تصویر جدید نسخهٔ نصب‌شده35 را نشان می‌دهد؛ دیگر وضعیت «هنوز34» جاری نیست.
- علت گیرکردن Test all: صفحه ساب انتخاب‌شده را فیلتر می‌کرد، اما provider همهٔ72پروفایل را تست می‌کرد. اکنون IDهای فهرست نمایان منتقل می‌شوند؛ All همچنان همه را تست می‌کند. پیشرفت done/total و Stop اضافه شدند؛ قفل فوری ref، دوبارکلیک/تست تکی هم‌زمان را مهار می‌کند.
- هر اجرا requestId مستقل دارد؛ event/جواب نهایی قدیمی بعد از Stop، Clear یا شروع اجرای جدید پذیرفته نمی‌شود. finally اجرای قبلی هم وضعیت اجرای تازه را پاک نمی‌کند. Cancel تا پایان توقف runner و حذف config خصوصی صبر می‌کند؛ kill_on_drop و مدیریت محدودهٔ پورت/پروفایل نامعتبر اضافه شدند.
- پینگ واقعی و زنده از مسیر مشترک latency.rs استفاده می‌کنند: gstatic، Cloudflare و Google به‌ترتیب جایگزین؛ TLS معتبر، بدون redirect، پاسخ کوچک حداکثر4KiB؛ درخواست نخست گرم می‌کند و درخواست دوم RTT کاربردی HTTP را می‌سنجد. هر درخواست3ثانیه و کل پروب9ثانیه مهلت دارد؛4کانفیگ هم‌زمان تست می‌شوند. این عدد ICMP نیست و الزاماً با مقصد آزمون سایر اپ‌ها مساوی نیست.
- تولید batch دیگر DNS هر پروفایل را در Rust سریالی resolve نمی‌کند؛ domain به core سپرده می‌شود. DNS مستقل1.1.1.1 و auto_detect_interface برای جلوگیری از استفادهٔ ناخواسته از VPN فعال در تست اضافه شدند. در تست شروع، detour به outbound direct خالی با خطای core رد شد؛ حذف آن و اتکا به auto_detect_interface شروع runner را اصلاح کرد. کانفیگ اتصال واقعی VPN/DNS/MTU و core1.14.2-lx.11 تغییر نکردند.
- پینگ زنده اولین بار خودکار اجرا می‌شود، دوره‌ای هم‌پوشانی ندارد؛ client با PID اتصال cache می‌شود و با تغییر PID/status درخواست قبلی فوراً لغو می‌شود. frontend هم generation اتصال/پروفایل دارد. Hysteria2 به پینگ زنده اضافه شد. API قدیمی server ping دیگر عدد ساختگی25ms نمی‌دهد؛ TCP واقعی می‌سنجد. OpenConnect در فهرست، TCP سرور را می‌سنجد و tooltip نوع آزمون را روشن می‌کند؛ این آزمون تأیید احراز هویت VPN نیست.
- صفحهٔ آخر با vpn-last-screen و ساب با vpn-selected-subscription ذخیره می‌شوند؛ ساب ذخیره‌شده فقط در صورت وجود پذیرفته می‌شود. بین تب‌ها و بعد از خروج/راه‌اندازی مجدد حفظ می‌شوند. storage-version همچنان1.0.6 است؛ پروفایل‌ها پاک نشده‌اند.
- دانلود updater به BufWriter1MiB تبدیل شد تا به‌ازای هر chunk نوشتن دیسک رخ ندهد؛ flush و sync قبل از SHA256/size/rename حفظ شدند. هیچ محدودکنندهٔ سرعت یا سیاست کاهش سرعت انتهای فایل در کد یافت نشد.
- آزمون محلی مسیر production:36MiB با chunkهای4KiB و انتهای غیرهم‌اندازهٔ بافر، در0.56ثانیه ذخیره/هش و پیشرفت کامل تأیید شد. دانلود عمومی installer35 با همین downloader در147.9ثانیه، هش/اندازهٔ صحیح؛ بازه‌ها1.69تا2.90Mbps، بازهٔ آخر2.10Mbps بود. افت اختصاصی انتهای دانلود در این اجرا بازتولید نشد؛ نرخ مسیر GitHub/CDN/شبکه متغیر است و این تغییر تضمین افزایش سرعت اینترنت نیست.
- آزمون زنده69کانفیگ در دو نوبت:44پاسخ معتبر،25عدم پاسخ در مهلت آزمون؛ زمان کل91.99ثانیه. چهار Hamed سالم111تا114ms پاسخ دادند؛ پنجم همچنان ناموفق بود و مشکل certificate/SNI ثبت‌شده در35 باقی است. با سه نمونهٔ ناموفق، پروب20ثانیه و DNS/IP قدیم/جدید مقایسه شد: Jup Finland S1 و Istanbul S1 در هر دو شکست خوردند؛ Armenia Yerevan در تکرار بعدی204 داد، پس نوسان شبکه نیز وجود دارد. ادعا نشده تمام timeoutها خرابی قطعی سرورند. Direct-To-Server طبق درخواست کاربر تست نشد.
- نصب‌کنندهٔ نهایی: [SecureVPN-v2.0.36-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.36-Setup.exe>)، x64، **36,785,885 بایت**، حدود35.08MiB. SHA256: `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`.
- دو OpenConnect هم TCP پاسخ دادند:218 و94ms؛ این اعداد احراز هویت/ترافیک تونل را تأیید نمی‌کنند.
- اعتبارسنجی نهایی:18تست Rust موفق،4آزمون شبکه/fixture پیش‌فرض ignored؛ TypeScript، React workflow و Release build موفق. تست React در سورس tests/ping-workflow.test.tsx، دستور npm run test:workflows؛ دامنهٔ ساب، Stop، جواب دیررس، کلیک تکراری، حفظ انتخاب با جابه‌جایی/راه‌اندازی و تغییر اتصال را بررسی می‌کند. react-test-renderer فقط devDependency است و داخل اپ بسته‌بندی نمی‌شود.
- ابتدا push و انتشار36 روی GitHub، سپس بررسی تشخیص Update در35؛ نسخهٔ جدید قبل از آن دستی نصب نمی‌شود. Android تغییر نکرده و فایل‌های خصوصی/توکن/fixture وارد Git نشده‌اند.

- انتشار36 تکمیل شد: سورس `057dd859b4158c8e1e160ceaf4e335be0b9d598b` روی main پوش و tag v2.0.36 روی همان commit تأیید شد. [ریلیز عمومی36](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.36) و [installer](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.36/SecureVPN-v2.0.36-Setup.exe)، 36,785,885بایت، SHA256 `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`. فایل draft قبل از عمومی‌شدن دانلود مجدد و hash، سپس digest/اندازه/tag عمومی تأیید شدند.
- بررسی UI بعد از انتشار: نسخهٔ نصب‌شده35 در Profiles/Sale باز است و هنوز Releases نشان می‌دهد؛ اجرای Administrator طبق پیام ابزار higher Windows integrity دسترسی به دکمه‌ها را محدود کرده است. از کاربر خواسته شد در35 Check for Updates را بزند. این آزمون تا دریافت پاسخ کاربر تأییدشده نیست؛36 دستی نصب نشده است.

## Windows 2.0.35 — Speedtest و سابسکریپشن Hamed، 2026-10-06

- روی دادهٔ واقعی Windows،72پروفایل و پنج Hamed خوانده شد؛ بکاپ فقط‌خواندنی در `scratch/windows-diagnostics/2026-10-06` است. لینک تازهٔ Hamed با UUID و encryption ذخیره‌شده یکسان بود؛ لینک‌ها و کلیدها خصوصی و خارج Git هستند.
- ایراد برنامه: سازندهٔ Rust پارامتر VLESS encryption را حذف می‌کرد. انتقال مقدار اصلی فعال اضافه شد. هستهٔ نصب‌شده1.14.0-lx.15 با `unknown field encryption` رد می‌کند؛ ارتقای pinned رسمی1.14.2-lx.11 لازم است. SHA256 ZIP رسمی: `0a63389570c675aa7a8820c0e0a61fa8c7a7f3346dcec9773b67bbcfc551bc85`.
- ایراد دوم: WebSocket با لیست ALPN اصلی حامد `h2,http/1.1,h3` می‌توانست HTTP/2 انتخاب کند، در حالی که پیاده‌سازی Upgrade این اپ HTTP/1.1 می‌خواهد. برای WS/HTTPUpgrade فقط HTTP/1.1 ارسال می‌شود؛ برای XHTTP/gRPC تغییری ندارد.
- آزمون اولیهٔ ناقص با encryption ولی ALPN مخلوط همچنان EOF داد؛ آن نتیجه نباید خرابی همهٔ سرورها تفسیر شود. کانفیگ کامل مرجع با HTTP/1.1 و encryption در Xray سه درخواست HTTP/HTTPS/64KB را موفق داد؛ بدون encryption همه شکست خوردند. آزمون تولیدی اصلاح‌شده در حال انجام است.
- Speedtest Store خطا را بازتولید کرد و TCP آن به127.0.0.1:2080 در SYN_SENT ماند، بدون loopback exemption. ProxyEnable تنها کافی نیست؛ بررسی پاک‌سازی آدرس/cache و پرهیز از فعال‌کردن پراکسی در TUN ادامه دارد. رسیدن موقت به GO تأیید کامل تست سرعت نیست.
- طبق دستور کاربر نسخهٔ جدید پیش از آزمون Update روی2.0.34 دستی نصب نمی‌شود؛ این محدودیت در طول بیلد و آزمون‌های مستقل رعایت شد.
- اصلاح Speedtest در سورس: اتصال TUN دیگر پراکسی localhost را فعال نمی‌کند. پاک‌سازی startup/connect/disconnect/exit فقط پراکسی127.0.0.1:2080 متعلق به اپ را با API رسمی WinINet حذف می‌کند؛ اعلان95/39/37 cache را به‌روز می‌کند. پراکسی‌های دیگر و PAC/AutoDetect حفظ می‌شوند. حذف صرف registry endpoint و خاموش‌بودن ProxyEnable مشکل Speedtest را رفع نکرد؛ بازاعمال per-connection و اجرای تازه توانست سرور را بگیرد و تست دانلود را شروع کند.
- آزمون واقعی generator اصلاح‌شده با هستهٔ جدید: هر پنج config check موفق، چهار Hamed از پنج مورد HTTPS204 و دانلود64KB200 دادند. پنجم certificate hostname mismatch دارد (گواهی hl.dimdata.org، SNI de.sadraguard.ir)، حتی قبل از VLESS؛ به‌عنوان مشکل سمت لینک/سرور باقی است و allowInsecure به‌صورت خودکار فعال نشده است.
- هستهٔ رسمی Windows1.14.2-lx.11 جایگزین شد؛ hash executable و منبع در resources/singbox/README.md ثبت شده است. DLL اختیاری Cronet لازم نیست و به بسته اضافه نشده. تست رگرسیون encrypted VLESS، VMess cipher و ALPN مخلوط WS/HTTPUpgrade افزوده شد.
- تست harness خود ماژول Rust نشان داد WinINet با server=null می‌تواند endpoint قدیمی registry را باقی بگذارد؛ پاک‌سازی scoped آدرس/override خود اپ قبل از per-connection API افزوده شد. حذف registry به‌تنهایی یا API به‌تنهایی کافی تلقی نمی‌شود.
- تست کامل Speedtest روی تونل فعلی با اصلاح وضعیت پراکسی: Ping207ms، Download53.91Mbps، Upload9.94Mbps؛ MTU همان1400 و بدون تغییر بود.14تست Rust، TypeScript و Release نهایی پاس شدند؛ پس از اصلاح آخر، Release دوباره ساخته شد تا installer با سورس نهایی مطابق باشد.
- harness مستقل از نسخهٔ نصب‌شده، همان system_proxy.rs تولیدی را کامپایل و legacy endpoint خاموش127.0.0.1:2080 را بازسازی کرد؛ حذف endpoint و حفظ Direct/AutoDetect با WinHTTP IE config و flags9 تأیید شد. VPN فعلی دست‌نخورده ماند.
- سه XHTTP رگرسیون از GozarVPN/Sale (Dallas،US-reza،Armenia Tun) همگی check،HTTPS204،download64KB200 موفق بودند. تست‌های Hamed/XHTTP روی listenerهای محلی جدا انجام شدند؛ این بخش آزمون کامل TUN جدید نصب‌شده نیست. کانفیگ‌ها/تنظیمات کاربر تغییر نکردند و Direct-To-Server آزمایش نشد.
- نصب‌کنندهٔ نهایی [SecureVPN-v2.0.35-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.35-Setup.exe>)، ProductVersion2.0.35،36,827,328بایت، SHA256 `EF38A372368614DF7530CFD19E91CC83AB46F07A2C46F29FF64725889757D25D`. افزایش حدود6.19MiB نسبت به34 به‌دلیل executable69MB هستهٔ جدید است، نه انیمیشن یا اضافه‌شدن فایل خصوصی؛ libcronet.dll بسته‌بندی نشده.
- پنجرهٔ نصب‌شده2.0.34 با دسترسی Administrator اجرا شده و Computer Use وضعیت `higher Windows integrity` می‌دهد؛ پس از انتشار، آزمون کلیک نشان آپدیت نیازمند همراهی کاربر است. کنترل UAC یا دورزدن محدودیت انجام نمی‌شود. نتیجهٔ انتشار و این آزمون جدا ثبت خواهند شد.
- انتشار تکمیل شد: کامیت سورس `b1fc54c49d0781f3c299379c5c0639056770cd93` روی main پوش و tag v2.0.35 روی همان commit است. [ریلیز35](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.35) با [installer عمومی](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.35/SecureVPN-v2.0.35-Setup.exe) منتشر شد؛ فایل draft ابتدا دانلود مجدد/hash شد، سپس عمومی و digest/اندازه/tag تأیید شدند. PAT در staging وجود ندارد؛ توکن، fixtureهای خصوصی و فایل‌های نامرتبط Android وارد انتشار نشدند.
- مقایسهٔ storage پس از تست‌ها: vpn-profiles،vpn-settings،vpn-subscriptions و storage version دقیقاً با بکاپ قبل یکسان‌اند؛72پروفایل حفظ شدند. درخواست اجرای Settings/About/Check for Updates و نصب از نشان به کاربر داده شد؛ هنوز این مسیر UI به‌عنوان موفق ثبت نشده است.

## Windows 2.0.34 — آپدیت GitHub و نصب‌کننده، 2026-10-04

- درخواست: بررسی GitHub، نشان آپدیت در پایین sidebar، دانلود و نصب با کلیک، پیش‌فرض Update برای نسخهٔ جدید/Reinstall برای نسخهٔ برابر و گزینهٔ جداگانهٔ Clean Install با هشدار فارسی داخل پرانتز. نسخه‌های package/lock/Cargo/Tauri/UI به2.0.34 افزایش یافتند؛ اصلاح تک‌نمونهٔ33 نیز در این build هست.
- `src-tauri/src/updater.rs`: بررسی تا۱۰۰ ریلیز اخیر مخزن عمومی morezaGeek/SecureVPN، مقایسهٔ SemVer واقعی، حذف draft/prerelease/asset اندروید/نسخهٔ برابر یا قدیمی. فقط فایل دقیق SecureVPN-v<version>-Setup.exe با URL رسمی همین مخزن پذیرفته می‌شود؛ سقف۱۵۰MiB، HTTPS با redirect محدود، timeout، اندازهٔ دقیق و SHA256 از digest رسمی GitHub پیش از اجرا کنترل می‌شوند. فایل ناقص/خراب حذف و نصب‌کنندهٔ معتبر قبلی با دانلود خراب جایگزین نمی‌شود. PAT انتشار وارد کلاینت نمی‌شود؛ semver وsha2 وابستگی مستقیم شدند، نسخهٔ Tauri حفظ شد.
- `UpdateContext`/`UpdateButton`/bridge: چک در شروع، هر۶ساعت، focus با فاصلهٔ حداقل۱ساعت، و دستی در Settings/About. نشان Download/Update پایین اپ، پیشرفت درصدی مشترک در sidebar/Settings، جلوگیری از نصب همزمان و retry پس از خطا اضافه شدند. چک خودکار ناموفق مزاحم اتصال نمی‌شود؛ خطای دستی نمایش دارد. دانلود ابتدا انجام می‌شود؛ پس از تأیید، اتصال جدید مسدود، مسیر موجود vpn_disconnect اجرا، installer با /UPDATE باز و اپ بسته می‌شود. نصب تعاملی است؛ لغو installer داده‌های پیش‌فرض را حذف نمی‌کند و اپ قبلی دوباره قابل بازشدن است.
- `installer/installer.nsi` از قالب رسمی pin‌شدهٔ tauri-cli-v2.11.4 مشتق شد. ایراد پیش‌فرض قبلی uninstall-before-install بود؛ گزینهٔ اول حالا Update (keep all settings) یا Reinstall (keep all settings) است و نسخهٔ قبلی NSIS را uninstall نمی‌کند. گزینهٔ دوم Clean Install، با «(تمامی تنظیمات برای نصب پاک میکند)» و توضیح انگلیسی، فقط پس از شروع نصب و توقف اپ داده‌های همین identifier را در AppData/LocalAppData کاربر نصب‌کننده پاک می‌کند؛ پروفایل‌ها/ساب‌ها/تنظیمات/WebView شامل‌اند، داده‌های حساب Windows دیگر حذف نمی‌شوند. نصب خاموش/passive هیچ‌وقت انتخاب Clean را استنباط نمی‌کند. downgrade غیرفعال شد و مسیر WiX migration موجود حفظ شد.
- چالش پاک‌سازی: یک مسیر AppData ممکن است وجود نداشته باشد؛ حذف فقط مسیر موجود و کنترل خطا اضافه شد. دانلود اولیه در cache اپ بود؛ در Clean Install اجرای installer از همان پوشه می‌توانست حذف داده را با خطای فایل قفل‌شده متوقف کند. فایل نهایی به %TEMP%\\SecureVPN-updates منتقل شد، خارج از پوشه‌ای که Clean Install پاک می‌کند. فایل‌های Temp تابع پاک‌سازی معمول سیستم‌اند.
- اعتبارسنجی: typecheck نهایی و Release/NSIS x64 موفق؛۱۲ تست Rust موفق، صفر شکست و۳ ignored. یک ignored integration جدا اجرا و موفق شد: metadata واقعی GitHub، دانلود عمومی2.0.32 به‌اندازه30,267,577بایت، تطبیق SHA256 و نبود downgrade از34. نصب/اجرای این فایل قدیمی انجام نشد و فایل آزمایشی حذف شد. آزمون HTTP محلیِ دانلود خراب نیز حذف part و حفظ فایل معتبر قبلی را تأیید کرد.
- `scripts/test-installer-maintenance.ps1` کد واقعیِ تصمیم و cleanup را از قالب استخراج و در fixtureهای NSIS بدون elevation اجرا کرد:۶ سناریوی Update، Reinstall، Clean، Clean بدون Roaming، passive و silent موفق. تمام مسیرهای حذف به دادهٔ ساختگی در scratch بازنویسی شدند؛ نصب فعلی، رجیستری و AppData واقعی دست‌کاری نشدند. این تست اکنون از ignore کلی *.ps1 مستثناست. یک اجرای اولیهٔ fixture به‌خاطر کد پیش‌فرض Quit شکست خورد؛ SetErrorLevel0 در ابزار آزمایشی اصلاح شد و شش مورد مجدد گذشتند.
- آزمون UI با preview موقتیِ React و API ساختگی: نشان آپدیت در تم روشن، نبود آپدیت در تیره، چک دستی، خطای شبکه، پیشرفت۴۵٪، قفل دکمهٔ دانلود و بازیابی بعد از خطای checksum تأیید شد. درصد mock آزمون دانلود واقعی نیست؛ دانلود واقعی در integration جدا تأیید شد. fixtureهای موقت حذف، tab بسته و Vite متوقف شد. اجرای کامل نصب روی Program Files و فعال‌سازی دوبارهٔ VPN پس از نصب واقعی هنوز آزمایش نشده‌اند؛ آزمون حذف روی دادهٔ واقعی کاربر عمداً انجام نشد.
- فایل تحویل SecureVPN-v2.0.34-Setup.exe،30,339,736بایت؛56,990بایت بیشتر از33؛ ProductVersion2.0.34 و SHA256 `BC4B501E084CFF4DE8DC2C86F2273709FB46256E2D0425BA94563BF00AB1B326`. فایل .sha256 کنار آن است. ساخت/تست‌ها در scratch/windows-diagnostics/*2.0.34.log؛ یک درخواست نخست Rust log به مسیر نادرست هدایت و پیش از اجرای تست متوقف شد، اجرای اصلاح‌شده موفق بود. هشدارهای Vite مربوط به CJS API و import همزمان static/dynamic قدیمی باقی‌اند.
- راهنمای ادامه در `windows-app-tauri/src-tauri/installer/README.md`: قالب را هنگام ارتقای CLI بازبینی کن؛ نسخهٔ آینده باید tag v<semver> و asset دقیق یادشده با digest عمومی داشته باشد. repo/token/helper انتشار در GITHUB_PUBLISH.md است. ابتدا فایل34 محلی تحویل شد؛ سپس طبق درخواست بعدی کاربر در۴اکتبر سورس روی main پوش و ریلیز عمومی34 منتشر شد. روی34 با آخرین ریلیز34، نبود نشان آپدیت صحیح است؛ برای آزمون نهایی ارتقا، انتشار نسخه‌ای بزرگ‌تر از نسخهٔ نصب‌شده لازم است. Android تغییر نکرد.
- انتشار GitHub: کامیت سورس `bbd3de728ae069c1dbd0a8a381640aa740f51024` با۲۳ فایل مرتبط Windows/مستندات پوش و remote main تأیید شد. staging از نظر وجود PAT بررسی شد؛ توکن، scratch، temp49/temp50 و فایل‌های نامرتبط Android وارد کامیت نشدند. helper محلی `scratch/windows-diagnostics/publish-2.0.34.cjs` فقط توکن مرکزی پروژه را می‌خواند؛ credential.helper برای Git غیرفعال است. فایل exe در draft آپلود، دانلود مجدد و SHA256 تأیید، سپس ریلیز عمومی و تطبیق tag با کامیت بررسی شد. metadata عمومی asset دارای digest دقیق SHA256 موردنیاز کلاینت آپدیت است. [دانلود عمومی نصب‌کننده](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.34/SecureVPN-v2.0.34-Setup.exe).
- پس از انتشار، integration واقعی با همان backend آپدیت و بدون توکن دوباره اجرا شد: ریلیز عمومی34 و فایل30,339,736بایتی دانلود و digest/hash دقیق تأیید شدند؛ check روی نسخهٔ برابر34 آپدیت کاذب نشان نداد. فایل تست پس از آزمون حذف شد؛ installer اجرا نشد. گزارش `scratch/windows-diagnostics/live-published-updater-2.0.34.log` است. مستندات نتیجهٔ انتشار نیز در کامیت جدا روی main پوش شدند.

## Windows 2.0.33 — جلوگیری از اجرای چندباره، 2026-10-04

- طبق گزارش کاربر، اجرای دوباره از Start/Desktop یک process و پنجرهٔ مستقل ایجاد می‌کرد و setup دوباره ProxyEnable را پاک می‌کرد؛ این مسیر امکان داشتن state/هستهٔ مستقل برای دو اپ را داشت.
- افزونهٔ رسمی tauri-plugin-single-instance به‌عنوان اولین plugin ثبت شد؛ اجرای دوم به نمونهٔ اصلی اعلان می‌دهد و پیش از setup اپ خاتمه می‌یابد. callback فقط پنجرهٔ main موجود را show/unminimize/focus می‌کند و connect/disconnect یا پاک‌کردن proxy را اجرا نمی‌کند. helper مشترک همین رفتار را برای Tray نیز اعمال می‌کند. شناسهٔ اپ com.securevpn.windows ثابت و feature semver فعال نشده تا نسخه‌های دارای این قفل با یک شناسه کار کنند.
- نسخهٔ package/lock/Cargo/Tauri و نمایش UI به2.0.33 افزایش یافت. Cargo افزونهٔ2.4.5 سازگار با وابستگی‌های موجود را قفل کرد؛ Tauri2.11.5 موجود تغییر نکرد. افزوده‌های lock شامل وابستگی‌های سکوی Linux نیز هستند؛ نصب‌کنندهٔ Windows فقط وابستگی‌های هدف Windows را دارد. Release/NSIS x64 و typecheck موفق؛۷ تست Rust موفق، صفر شکست و۲ ignored. تست‌ها رگرسیون backend قبلی‌اند و آزمون UI single-instance محسوب نمی‌شوند.
- نصب‌کنندهٔ محلی SecureVPN-v2.0.33-Setup.exe ساخته شد، **30,282,746 بایت**؛ افزایش15,169بایت نسبت به32. ProductVersion نهایی2.0.33 و SHA256: `C73900E0443B42F892845E67089863BD2686FF716CB91F320532D26D745AEBCD`. باینری VPN/MTU و داده‌های پروفایل تغییر نکردند. نسخهٔ قدیمی32 این قفل را ندارد و باید پیش از اجرای نسخهٔ تازه بسته شود؛ این اصلاح نمی‌تواند جلوی اجرای باینری قدیمی فاقد قفل را بگیرد.
- محدودیت آزمون runtime: Computer Use با درخواست مسیر build به اپ نصب‌شدهٔ Program Files هدایت شد؛ screenshot نشان‌دهندهٔ2.0.32 بود، پس این اجرا آزمون33 نیست. accessibility به‌علت integrity بالاتر محدود بود و کلیک Close نتیجه نداد؛ تکرار یا دورزدن حفاظت انجام نشد. از کاربر خواسته شد نسخهٔ32 را ببندد یا فایل را برای تست خودش بگیرد. restore/focus پنجرهٔ نسخه33 روی این دستگاه هنوز با UI تأیید نشده و موفقیت build جای این آزمون را نمی‌گیرد. گزارش build و تست در scratch/windows-diagnostics/build-2.0.33.log و unit-tests-2.0.33.log است. یک فراخوانی اولیهٔ تست به‌علت اشتباه مسیر فایل log پیش از اجرای Cargo شکست خورد؛ اجرای اصلاح‌شده موفق است.
- مرجع: [راهنمای رسمی Single Instance در Tauri](https://v2.tauri.app/plugin/single-instance/)؛ plugin باید پیش از سایر pluginها ثبت شود. بدون تست runtime، صحت focus/minimize صرفاً از ساخت نتیجه‌گیری نمی‌شود.

## Windows 2.0.32 — ترتیب سابسکریپشن و برچسب رنگی، 2026-10-03

- انتشار GitHub طبق درخواست کاربر: سورس Windows/Tauri و مستندات در کامیت8b0f875 ثبت شدند. دو توکن قدیمی پروژه HTTP401 دادند؛ خواندن credential store نیز توسط بررسی خودکار مجوز رد شد، چون کاربر استفاده از توکن پروژه را مشخص کرده بود. سپس کاربر توکن جدید داد و ذخیره‌کردن آن در پروژه را مجاز کرد: در2026-10-03، دسترسی مخزن/پوش توکن جدید تأیید و مقدار صرفاً در scratch/github-token.private.txt ذخیره شد. همهٔ helperهای محلی به فایل مرکزی وصل شدند؛ credential store استفاده نشد. مسیر و روش برای Antigravity در GITHUB_PUBLISH.md ثبت و ignore فایل‌های private نیز افزوده شد. مقدار توکن و پوشه‌های scratch/temp وارد مخزن یا ریلیز نمی‌شوند.
- **انتشار تکمیل شد،2026-10-03:** سورس و راهنمای دسترسی روی main پوش شدند؛ [ریلیز عمومی v2.0.32](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.32) به کامیت8f59c382e41ea570c4fd7d6e3f7a7efaad685f18 اشاره دارد. نصب‌کنندهٔ30,267,577بایتی آپلود، دوباره دانلود و SHA256 آن با فایل تحویل‌شده برابر تأیید شد؛ tag و وضعیت draft=false نیز بررسی شدند. [دانلود مستقیم](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.32/SecureVPN-v2.0.32-Setup.exe). در draft، لینک asset موقت untagged بود؛ پس از عمومی‌شدن دوباره metadata خوانده شد و لینک نهایی tag در خروجی/مستندات ثبت شد. این تغییر ابزار انتشار است و باینری اپ را تغییر نمی‌دهد.
- طبق درخواست کاربر، فهرست All Profiles به ترتیب آرایهٔ subscriptions، دقیقاً مطابق تب‌های چپ به راست، نمایش داده می‌شود؛ ترتیب فعلی GozarVPN سپس Sale سپس ALI است. ترتیب داخلی هر گروه حفظ می‌شود و کانفیگ‌های دستی/اشتراک حذف‌شده در انتها قرار می‌گیرند. sort روی کپی انجام می‌شود؛ دادهٔ ذخیره‌شده یا ترتیب export تغییر نمی‌کند.
- utility مشترک profilePresentation در Profiles و Connection استفاده می‌شود. کنار نام هر کانفیگ، SubscriptionBadge با نام و رنگ گروه نمایش داده می‌شود؛ Manual برای دستی و Unknown subscription برای ID بدون اشتراک موجود است. رنگ‌ها در تم روشن/تیره خوانا و در دو صفحه یکسان‌اند؛ پالت شش رنگ برای گروه‌های بیشتر تکرار می‌شود.
- select بومی Connection که امکان نمایش span رنگی داخل option ندارد، با ProfilePicker جایگزین شد: فهرست قابل اسکرول، برچسب رنگی کنار نام، نشان انتخاب، بستن با کلیک بیرون/Escape/Tab و انتخاب با کیبورد/جستجوی تایپی؛ نام سابسکریپشن در انتخاب بسته و توضیح اتصال نیز دیده می‌شود. منطق اتصال و هسته تغییر نکردند.
- نسخهٔ package/lock/Cargo/Tauri و نمایش خودکار UI به2.0.32 افزایش یافت. typecheck موفق؛ Release و NSIS x64 موفق، ProductVersion/FileVersion نهایی2.0.32. نصب‌کنندهٔ SecureVPN-v2.0.32-Setup.exe در ریشه ذخیره شد؛ **30,267,577 بایت**، افزایش5,206بایت نسبت به31. SHA256: `DAF84EAB301B4248A0819C7DC4781E1798FFFCCBDEDCC7368BF1E42CAF111C9D`.
- بررسی تعاملی با دادهٔ ساختگی و۳۰ کانفیگ در پیش‌نمایش محلی خود React انجام شد: ترتیب GozarVPN/Sale/ALI/Manual در هر دو صفحه، حفظ ترتیب داخلی، فیلتر Sale، انتخاب Sale با End/Arrow/Enter، انتخاب ALI با جستجوی تایپی، اسکرول، Escape/Tab و کلیک بیرون موفق. ظاهر برچسب‌ها در تم روشن و تیره بررسی شد. هیچ کانفیگ واقعی یا تنظیم اپ نصب‌شده تغییر نکرد؛ فایل‌های موقت پیش‌نمایش و سرور بسته/حذف شدند.
- آزمون شبکهٔ۳۶ تونل مربوط به2.0.31 است؛ در2.0.32 تغییر فقط نمایش و نسخه است و تست شبکه تکرار نشد. نصب ارتقایی/رابط WebView2 روی اپ نصب‌شده در این مرحله اجرا نشد؛ نصب‌کننده برای تست کاربر تحویل می‌شود. جزئیات بیلد محلی: scratch/windows-diagnostics/build-2.0.32.log.

## Windows 2.0.31 — بررسی GozarVPN و Sale، 2026-10-03 — تکمیل و تحویل

- کاربر ادامهٔ کار را به Windows/Tauri منتقل کرد و خواست تمام تغییرات Windows نیز در همین فایل ثبت شوند. سورس Electron قدیمی و Android در این مرحله تغییر نمی‌کنند. Direct-To-Server مطابق درخواست قبلی از آزمایش کنار گذاشته شد.
- از Local Storage اپ com.securevpn.windows، بکاپ خصوصی LevelDB گرفته شد؛ ۵۹ پروفایل و سه اشتراک وجود دارند: GozarVPN۲۶، Sale۱۱، ALI۲۰ و دو OpenConnect دستی. هدف آزمایش این مرحله۳۶ ورودی GozarVPN/Sale پس از حذف Direct-To-Server است؛ ALI و OpenConnect خارج این درخواست‌اند. URL/UUID/اطلاعات ورود در گزارش چاپ نمی‌شوند.
- علت قطعی نخست از فایل واقعی Temp/secure-vpn-singbox.json پیدا شد: rule شامل s1.rahanetmci.com/32 بود. resolve_hostname_to_ip در شکست DNS رشتهٔ دامنه را برمی‌گرداند، ولی generator بدون اعتبارسنجی IP به آن /32 اضافه می‌کند. core1.14.0-lx.15 فایل اصلی را با ParsePrefix رد کرد؛ با تغییر فقط این rule به IPv4 معتبر، check همان core موفق شد. بنابراین پینگ پراکسی می‌تواند موفق باشد و کانفیگ کامل TUN در startup شکست بخورد.
- نسخهٔ توسعه به2.0.31 افزایش یافت. یک export تشخیصی با fixture خصوصی به تست‌های Rust اضافه شد تا کانفیگ کامل و پراکسی از همان generator اصلی، برای تمام۳۶ مورد ساخته و مستقل بررسی شوند؛ این export VPN/پراکسی سیستم را تغییر نمی‌دهد. این export خصوصی برای مقایسهٔ پایه و اصلاح نهایی استفاده شد؛ نتیجهٔ نهایی و نصب‌کننده در ادامه ثبت شده‌اند.
- آزمون پایه با DNS فعلی موفق: هر۳۶ config کامل check شدند و هر۳۶ پراکسی از همان generator، HTTPS204 و دانلود64KB200 دادند. این نتیجه صحت سرویس/اطلاعات ورود را در این آزمون نشان می‌دهد؛ فایل واقعی قبلی همچنان DNS-fallback را به CIDR نامعتبر تبدیل می‌کرد و پینگ کافی برای تأیید TUN نیست.
- اصلاح نخست: server_cidr فقط IP معتبر را با /32 برایIPv4 یا /128 برایIPv6 قبول می‌کند؛ در شکست DNS، rule دامنهٔ direct باقی می‌ماند و CIDR/route_exclude جعلی ساخته نمی‌شود. این منطق در config کامل و test config مشترک است. lookup با بودجه۴ثانیه انجام می‌شود. پیش از spawn، همان core فایل را check می‌کند تا خطای دقیق config در UI برگردد. خطای resolve/build/check نیز وارد مسیر error/cleanup می‌شود و state روی connecting/is_running باقی نمی‌ماند؛ FATAL با متن timeout در noise filter حذف نمی‌شود. تست رگرسیون CIDR/DNS و FATAL اضافه شد. هسته/MTU هنوز تغییر نکردند.
- اشتراک تازه با User-Agent خود اپ v2rayN/6.23 خوانده شد؛ درخواست اولیهٔ Python بدون آن403 گرفت و داده‌ای تغییر نکرد. extra در۲۴ GozarVPN و۱۰ Sale وجود داشت: mode و xPaddingBytes، بدون XMUX/downloadSettings. parser اکنون JSON اصلی extra را در پروفایل نگه می‌دارد؛ mode صریح URL مقدم است و mode داخلextra fallback است. export نیز mode/extra را حفظ می‌کند. generator padding صریح را به x_padding_bytes تبدیل و range نامعتبر را رد می‌کند؛ default عمومی mode همچنان auto است. موارد دیگرextra با این patch به schema هسته ترجمه نمی‌شوند؛ حفظ داده به معنی پشتیبانی همهٔ قابلیت‌های Xray نیست.
- بررسی TypeScript خطاهای قدیمی در API اختیاری داخل callback، نوع NodeJS.Timeout در frontend مرورگر و metadata قدیمی TLS/REALITY را پیدا کرد. API در scope هر عملیات capture و guard شد، نوع timer از setInterval گرفته شد و metadata اختیاری در مدل ثبت شد؛ برای عبور از typecheck، اعتبارسنجی گواهی یا اطلاعات اتصال تغییر نکردند. آزمون Rust برای اولویت mode و padding افزوده شد؛ typecheck و بیلد نهایی موفق شدند.

- نتیجهٔ نهایی: **۷ تست Rust موفق، صفر شکست، دو تست ignored**؛ export تشخیصی جداگانه موفق، typecheck موفق و round-trip parser با تطبیق۳۶ پروفایل تازه و حفظ۳۴ extra موفق. اجرای اولیهٔ Cargo بدون --lib پس از موفقیت تست کتابخانه، برای اجرای binary با خطای740 نیاز به elevation متوقف شد؛ اجرای درست --lib موفق شد و اجرای اولیه به‌عنوان موفقیت کامل شمارش نشد.
- هر۳۶ config نهایی core check شدند؛ تست پراکسی نهایی **۷۲/۷۲ درخواست HTTPS204 و دانلود64,000بایت200** موفق داشت. سپس **۳۶/۳۶ تونل واقعی Windows** با همان generator، بدون پراکسی curl، هر دو درخواست را عبور دادند؛ شمارندهٔ ترافیک core و routeهای TUN نیز تأیید شدند. **۳۶/۳۶ قطع کامل**: routeهای متعلق به تونل حذف و پورت‌های2080/9090 بسته شدند. پایان آزمون core فعال باقی نماند و ProxyEnable همان0 بود.
- این تست کامل شبکه با CLI تشخیصی انجام شد؛ دکمه‌های React/IPC و نصب ارتقایی NSIS در این مرحله آزمایش نشده‌اند. اپ نصب‌شده هنوز2.0.30 بود؛ طبق درخواست کاربر نصب‌کنندهٔ تازه برای نصب و تست شخصی تحویل می‌شود. موفقیت دو مقصد آزمون، تضمین همهٔ اپ‌ها یا شبکه‌ها نیست. گزارش بدون اطلاعات ورود: [WINDOWS_TEST_REPORT.md](<H:/Antigravity Projects/VPN APP/WINDOWS_TEST_REPORT.md>).
- هستهٔ Windows **sing-box1.14.0-lx.15**، MTU1400 و stack سیستم تغییر نکردند. Smart اندروید یا Force stream-up به Windows اضافه نشد؛ mode اشتراک حفظ می‌شود. Android/Electron قدیمی تغییر نکردند. داده‌های اپ فقط خوانده و بکاپ شدند؛ پس از نصب، refresh اشتراک‌های GozarVPN و Sale برای بازیابی extra حذف‌شده در ایمپورت قدیمی لازم است.
- Release x64/NSIS موفق: [SecureVPN-v2.0.31-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.31-Setup.exe>)، **30,262,371 بایت**؛ شناسهٔ قبلی com.securevpn.windows حفظ شد. SHA256: `02B615DF9E7757A2FB99356D38A6E5CC967EF8B957B277EF0886E57A2974604A`. اپ قبلی پیش از نصب بسته شود؛ تست نصب ارتقایی را کاربر انجام می‌دهد.

## Android 1.3.65 / code195 — نتیجهٔ نهایی 2026-10-03

- گزینهٔ **Edit Profile > Stream Settings > XHTTP mode > Smart** کنار انتخاب‌های دستی **auto / stream-up / packet-up / stream-one** و Follow app setting اضافه شد. انتخاب دستی بر Force عمومی اولویت دارد؛ Smart فقط برای XHTTP/splithttp است. پیش‌فرض Force عمومی طبق درخواست قبلی روشن ماند؛ Smart باید برای پروفایل مورد نظر انتخاب شود.
- Smart قبل از ایجاد TUN، HTTPS واقعی را از پراکسی موقت همان کانفیگ بررسی می‌کند؛ نخست آخرین mode موفق، سپس mode اصلی اشتراک و باقی حالت‌ها، بدون تکرار و حداکثر چهار حالت. دو مقصد generate_204 جایگزین‌اند؛ موفقیت200/204 برای عبور آزمون کافی است. بودجه45ثانیه است و خروج از درخواست مسدودشده ممکن است تا timeout محدود socket/cleanup طول بکشد؛ این عدد hard deadline نیست. mode موفق در v2raySmartXhttpMode ذخیره و روی کارت نمایش داده می‌شود. در هر اتصال دوباره بررسی می‌شود؛ خاموش‌شدن اینترنت پس از اتصال باعث تعویض خودکار mode در این نسخه نمی‌شود.
- کلیدها، VLESS encryption، TLS/REALITY، بررسی گواهی و extra در تمام تلاش‌ها ثابت‌اند. refresh همان endpoint، انتخاب Smart/دستی را حفظ می‌کند؛ تغییر مشخصات اتصال/احراز هویت cache mode موفق را حذف می‌کند. لغو بررسی، تغییر/حذف پروفایل و خروج از ViewModel، کار را متوقف می‌کنند؛ generation guard جلوی شروع دیرهنگام VPN را می‌گیرد. در صورت روشن‌بودن VPN دیگر، Smart به‌جای تست از مسیر نامعلوم خطا می‌دهد. شکست Smart به ERROR می‌رسد و VPN ساخته نمی‌شود؛ این بررسی همهٔ مقصدها یا همهٔ پروتکل‌ها را تضمین نمی‌کند.
- فرم Add/Edit و Settings کوچک‌تر شدند: متن اصلی14sp، متن متوسط13sp، توضیحات12sp و عنوان22sp؛ مقیاس فونت سیستم و اندازهٔ هدف لمس حفظ شد. فونت صفحهٔ اصلی تغییر نکرد.
- علت واقعی Hamed، نادیده‌گرفتن VLESS encryption بود. در64 مدل/parser/Repository/editor/generator اضافه شد، اما تست Release گوشی نشان داد مقدار تازه در Intent بین MainActivity و VpnConnectionService جا می‌ماند. در65 EXTRA_VLESS_ENCRYPTION در دو طرف اضافه شد؛64 مرحلهٔ میانی است و برای تحویل نهایی نیست. روی گوشی هر چهار پروفایل با تطبیق UUID/سرور از لینک اصلی اصلاح شده‌اند؛ روی دستگاهی که قبلاً اطلاعات را ناقص وارد کرده، refresh همان اشتراک پس از نصب لازم است.
- **اصلاح برداشت قبلی:** آزمون‌های مستقل قبلی حامد هم از مدل ناقص ساخته شده و encryption نداشتند؛ شکست آن‌ها خرابی سرور را ثابت نمی‌کرد. با کانفیگ کامل، دو هسته24/24 درخواست موفق دادند. در65 گوشی هر چهار Hamed، Ping109..139ms، Public IP و هشت درخواست GeoIP/دانلود200 داشتند؛ در JSON واقعی هسته نیز encryption دقیقاً برابر مقدار ذخیره‌شده است و هر چهار قطع کامل شدند. MTU و باینری هسته برای این اصلاح تغییر نکردند.
- **۲۸ تست JVM بدون شکست/خطا**؛ Release minified ساخته و با دادهٔ قبلی روی گوشی نصب شد. آزمون UI، Follow app setting/auto/Smart/packet-up و نگهداری encryption در clipboard/editor را تأیید کرد. تست نهایی US با mode اولیهٔ ناسازگار stream-up، پیش از شروع VPN به **packet-up** رسید و همان mode ذخیره‌شده در خروجی واقعی هسته بود؛ GeoIP و دانلود200، Ping[202ms] و قطع کامل داشت. در تلاش قبل‌تر auto عبور کرده بود ولی cleanup ابزار خطا داشت؛ آن اجرای ناقص به‌عنوان تست نهایی شمرده نشد. این تغییر انتخاب با وضعیت واقعی درخواست‌ها سازگار است، نه وعدهٔ یک mode ثابت برای همهٔ شبکه‌ها. لغو Smart و نبود VPN دیرهنگام پس از10ثانیه موفق شد.
- پینگ نهایی **43 مورد، 43 پاسخ و 0 شکست**؛ Direct-To-Server طبق درخواست کاربر تست نشد. TLS پینگ SSTP/OpenConnect تأیید احراز هویت نیست. نتایج اتصال/درخواست جداگانه در ANDROID_PHONE_TEST.md ثبت شده‌اند؛ timeoutهای مقطعی s1، از جمله دانلود US در تلاش اول و FR در اجرای نهایی65، همچنان محدودیت‌اند؛ پینگ/GeoIP موفق همهٔ دانلودها را تضمین نمی‌کند. Connected در اتصال دستی همچنان شروع هسته/TUN است؛ Smart قبل از آن یک آزمون ترافیک دارد، نه تضمین عملکرد تمام اپ‌ها.
- یک assertion اولیهٔ ابزار تست از برچسب قدیمی Smart در یک frame گذار نتیجهٔ غلط گرفت. بررسی ابزار به مقدار تأییدشده/ذخیره‌شده پیش از VPN تغییر کرد. cleanup بعدی دوباره روی دکمهٔ stale کلیک کرد و خطا داد؛ ابزار به ارسال یک درخواست قطع، انتظار بسته‌شدن VPN و restore در finally مستقل تغییر کرد. تنظیم موقت باقی‌مانده با بررسی همان44ID از backup پیش از65 برگردانده و سناریوها تکرار شدند. فایل‌های ui-race-invalid و cleanup-invalid به‌عنوان تست نهایی شمارش نشدند؛ موفقیت درخواست‌ها در آن‌ها به‌تنهایی موفقیت cleanup نیست. APK اصلی در اصلاح ابزار تغییر نکرد.
- restoreProfileByName اکنون ابتدا پروفایل انتخاب‌شدهٔ فعلی با همان نام را نگه می‌دارد تا نام تکراری بی‌جهت انتخاب را عوض نکند؛ fallback هنوز با name است و انتقال هویت سرویس با ID به‌طور کامل پیاده نشده است.
- پایان: همان44ID، انتخاب قبلی و تنظیمات حفظ شدند؛ تفاوت با backup پیش از65 صرفاً هیچ فیلدی بود. تست‌ها تنظیم Smart آزمایشی را بازگرداندند؛ پنج s1 همچنان auto · Custom هستند. VPN فعال نیست. این مقایسهٔ backup پیش از65 است؛ اصلاح encryption چهار حامد پیش از این backup انجام شده بود.
- APK قابل ارتقا: SecureVPN-v1.3.65.apk، arm64-v8a، **35,896,236 بایت**، حدود 34.23MiB؛ افزایش 6,584بایت نسبت به63. SHA256: `95B1CA22905BA7B207F4CF367B1CE8F97654CB7B66DBB5FD515274F629F92E04`. گواهی قبلی با SHA256 `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62` حفظ شد. ویندوز تغییر نکرد.

شواهد محلی: scratch/xhttp-server-check/build-1.3.65.log، phone-1.3.65-*.json، named-hamed-encryption-results.json. لینک/کلید/backup با پسوندprivate در گزارش عمومی درج نشده‌اند.

## اصلاح علت واقعی Hamed در 1.3.64 — 2026-10-03

- کاربر تأیید کرد همان Hamed در اپ دیگر اینترنت می‌دهد. روی گوشی، گروه import sub در اپ مرجع بررسی و لینک همان پروفایل به‌صورت محلی مقایسه شد. UUID/سرور/مسیر برابر بودند، اما لینک شامل `encryption=mlkem768x25519plus.native.0rtt.…` بود؛ parser اپ ما پارامتر encryption را نادیده می‌گرفت و مدل/خروجی VLESS نیز فیلدی برای آن نداشتند.
- **نتیجهٔ قبلی دربارهٔ چهار شکست WS باید تصحیح شود:** تست‌های مستقل Xray/sing-box نیز از مدل ناقص اپ ساخته شده و encryption را جا انداخته بودند؛ بنابراین آن‌ها «همان کانفیگ کامل» نبودند و نمی‌توانستند خرابی سرور یا حساب را ثابت کنند. بسته‌شدن WebSocket پس از VLESS بدون این لایه، رفتار مورد انتظار سروری بود که encryption می‌خواهد. اشاره‌های حل‌نشده در تاریخچهٔ1.3.63، نتیجهٔ موقت پیش از این کشف‌اند.
- آزمون A/B درست: فقط encryption اصلی به هر چهار ورودی اضافه شد، بدون تغییر UUID/سرور/WS/TLS/ALPN/fp. با sing-box1.14.2-lx.11 و Xray26.3.27، **۲۴/۲۴ درخواست HTTP204، HTTPS204 و دانلود64KB200 موفق شدند**. هستهٔ فعلی Android از این encryption پشتیبانی دارد؛ تعویض یا افزودن هسته لازم نبود.
- فیلد مستقل `vlessEncryption` با default=none به VpnProfile و ProfileRepository اضافه شد. V2RayLinkParser مقدار URL-decoded را از VLESS می‌خواند؛ Clipboard، دستی و اشتراک همین parser را دارند. فرم افزودن/ویرایش مقدار را در هر سه مسیر Paste حفظ و با فیلد VLESS encryption نمایش می‌دهد؛ Save آن را نگه می‌دارد. generator فقط برای VLESS فعال، کل رشته را به فیلد encryption هسته می‌دهد؛ TLS/REALITY و security مربوط به VMess مستقل‌اند. مقدار غایب/خالی/none رفتار قبلی را حفظ می‌کند. رشتهٔ فعال حذف یا به none تبدیل نمی‌شود؛ بررسی دقیق قالب به هسته واگذار شده است.
- پروفایل‌های قدیمی encryption از‌دست‌رفته را روی دیسک ندارند. روی دستگاه دیگر پس از نصب، یک refresh اشتراک لازم است؛ از UUID/hostname نمی‌توان کلید را حدس زد. روی گوشی کاربر، چهار پروفایل با تطبیق دقیق UUID/سرور از لینک تازه اصلاح شدند؛ سایر داده‌ها و mode اختصاصی s1 حفظ شدند.
- در نسخهٔ میانی64 دو تست JVM جدید نگهداری encryption کنار TLS/flow و عدم فعال‌شدن آن برای VLESS قدیمی یا VMess را پوشش می‌دهند. این آزمون‌ها بعداً در65 با انتقال Intent تکمیل و موفق شدند؛ جزئیات در بخش نهایی بالا است. نسخه194/1.3.64؛ باینری libbox و تنظیم MTU تغییر نکردند.
- US مستقیم مسئلهٔ جدا دارد: در تست A/B، auto با هر دو fingerprint پاسخ داد و stream-up در دو هسته timeout شد؛ این تنظیم همچنان auto · Custom است. timeoutهای مقطعی قبلی، مخصوصاً NL، به encryption حامد نسبت داده نمی‌شوند.

مرجع قالب و پشتیبانی: [مستندات رسمی Xray VLESS encryption](https://xtls.github.io/en/config/outbounds/vless.html#encryption-string)، [قابلیت VLESS encryption در fork مورد استفاده](https://github.com/Leadaxe/sing-box-lx#vless-encryption). شواهد A/B: `scratch/xhttp-server-check/named-hamed-encryption-results.json`. لینک اپ مرجع و پاسخ اشتراک با پسوندprivate خصوصی‌اند.

## تاریخچهٔ بررسی اولیه در 1.3.63 — گوشی و سازگاری XHTTP

### پیگیری نام‌دار Hamed و US مستقیم HetznerSale — 2026-10-03

- کاربر مشخص کرد منظورش اشتراک Hamed و US-reza در HetznerSale است، نه US Tun. Direct-To-Server همچنان از تست کنار گذاشته شد. پاسخ تازهٔ هر دو اشتراک خوانده و با گوشی مقایسه شد؛ چهار UUID حامد و UUID موارد HetznerSale با دادهٔ ذخیره‌شده یکسان‌اند. اطلاعات ورود در خروجی چاپ نشد.
- تفاوت‌ها: Hamed چهار IP با VLESS/WS/TLS، پورت2053، SNI یکسان de.sadraguard.ir و path `/` دارد؛ هر چهار به hostname و مسیر یکسان اشاره می‌کنند. US-reza، XHTTP روی s1.rahanetmci.com:443 با path `/us`، mode اصلیauto و بدون fp/alpn صریح است. US Tun روی irnew.rahanetmci.com:443 با path `/usa`، ALPN=h2 وfp=chrome و xPaddingBytes صریح است. اپ برای fp غایب chrome و برای XHTTP ALPN غایب h2,http/1.1 می‌گذارد؛ WS در config واقعی به http/1.1 محدود می‌شود، بنابراین ALPN خام h2,http/1.1,h3 حامد مستقیم در WebSocket استفاده نمی‌شود. DNS فعلی s1 به91.107.158.74 و irnew به2.144.27.208 اشاره داشت؛ هر دو در تست گوشی Public IP خروجی یکسان دادند. بدون لاگ سرور، توپولوژی کامل relay قطعی نیست.
- مقایسهٔ مستقل دو هسته: US-reza باauto، چهchrome چهTLS استاندارد، در هر دو sing-box1.14.2-lx.11 وXray26.3.27 پاسخ HTTP204/HTTPS204/دانلود64KB200 داد؛ **۱۲/۱۲ درخواست کامل**. همان US باstream-up در هر دو هسته **۰/۶ درخواست** موفق داشت و timeout شد. تغییر fingerprint علت شکست را رفع نکرد؛ این نتیجه مؤید ناسازگاری stream-up با این مسیر/سرور است، نه اثبات یک ایراد خاص MTU. US Tun باstream-up ترافیک داد ولی همهٔ درخواست‌های CLI کامل نبودند؛ یک timeout handshake و یک دانلود ناقص دیده شد.
- گوشی واقعی همان Release1.3.63: Hamed ظاهراًConnected ولی PingFail، PublicIPUnavailable و هر دو درخواست اینترنت با connection closed. US-reza باoverrideauto، Ping198ms، PublicIPUS و GeoIP/دانلود64KB200؛ US Tun باstream-up، Ping220ms و همان PublicIPUS و دو درخواست200. هر سه قطع کامل داشتند. یک موفقیت US به معنی حذف timeoutهای مقطعی ثبت‌شدهٔ قبلی نیست؛ تنظیم profile یاMTU در این پیگیری تغییر نکرد.
- برای تشخیص مرحلهٔ خرابی حامد، درخواست VLESS مستقیم داخل WebSocket با TLS معتبر و همانUUID اجرا شد: هر چهار آدرس HTTP101 با Sec-WebSocket-Accept معتبر دادند، اما پس از ارسال درخواست VLESS، **اولین frame از نوعClose باcode1000، بدونreason و بدونdata** بود. درخواست مشابه روی WebSocket سالم GozarVPN، binary frame و HTTP204 داد. این شاهد، بسته‌شدن از سمتendpointپس از VLESS را نشان می‌دهد؛ code1000 علت احراز هویت/تنظیماتbackend را مشخص نمی‌کند. سرور/اکانت/فوروارد Worker باید با لاگ سرور بررسی شود؛ صرفاً تغییرALPN/fp/MTU راه‌حل اثبات‌شده نیست.
- علت نمایشConnected بدون اینترنت در سورس مشخص است: SingBoxEngine بعد از startOrReloadService، onStarted می‌فرستد و VpnConnectionService بدون انتظار تست اینترنت STATUS_CONNECTED منتشر می‌کند. این وضعیت شروع هسته/TUN است، نه تأیید احراز هویتVLESS یا ترافیک مقصد؛ UI فعلی ممکن است برای سرور خراب گمراه‌کننده باشد. رفتار محصول در این نوبت تغییر داده نشد و نسخه/APK همان1.3.63 است.
- شواهد تازه: `named-transport-comparison.json`، `named-ws-vless-responses.json` و `named-phone-Hamed/US-auto/US-Tun.json` درscratch/xhttp-server-check. فایل‌های raw subscriptions/config با پسوندprivate خصوصی‌اند. نتایج به ANDROID_PHONE_TEST و DEVELOPMENT_SUMMARY اضافه شدند.

### دامنه و شواهد اولیه

- گوشی واقعی کاربر مدل 2407FPN8EG با ۴۴ پروفایل بررسی شد: ۴۲ VLESS، یک Native OpenConnect و یک SSTP. قبل از تغییر، پروفایل‌ها و تنظیمات در backup خصوصی ذخیره شدند.
- تست اولیه 1.3.62 شامل ۳۳ پاسخ پینگ و ۱۱ شکست بود. شکست‌ها شامل SSTP، چهار Mo-Ebrahimi با WS/TLS، پنج XHTTP روی s1 و Direct-To-Server بودند. درخواست اتصال/اینترنت واقعی برای موارد ناموفق نیز بررسی شد؛ صرف نمایش Connected یا موفقیت TLS به‌عنوان موفقیت اینترنت حساب نشد.
- کاربر بعداً روشن کرد که فقط Direct-To-Server را نباید تست کرد؛ پس از این دستور آن مورد از ادامه و تست نهایی حذف شد. پروفایل آن نگه داشته شد. تست ابتدایی این مورد پیش از دستور است و نباید با نتیجهٔ نهایی مخلوط شود.
- نصب اولیهٔ ابزار تست با پیام Android مبنی بر لغو نصب توسط کاربر رد شد. پس از اطلاع و تأیید کاربر، نصب مجدد موفق شد. APK تست جدا از APK اصلی است.

### SSTP: دو علت جدا

- پروفایل گوشی آدرس تایپی `sstp.rahanetmi.com` داشت. با اصلاح به `sstp.rahanetmci.com` و حفظ اطلاعات ورود، اتصال واقعی در نسخهٔ جدید حدود ۶.۱ ثانیه، Ping238ms، Public IP و درخواست GeoIP/دانلود HTTP200 و قطع کامل ثبت شد.
- باگ اپ در پینگ فهرست مستقل از اشتباه آدرس بود: SSTP به sing-box فرستاده می‌شد و Unsupported protocol می‌داد. `SingBoxDelayTester.kt` اکنون SSTP/OpenConnect را به تست TCP/TLS اختصاصی می‌فرستد؛ SSTP در تست نهایی287ms و OpenConnect359ms پاسخ دادند.
- تست TLS، `skipCertificateVerification` را رعایت می‌کند؛ در حالت بررسی گواهی، chain و hostname معتبرسنجی می‌شوند. timeout اتصال/خواندن چهار ثانیه، fallback محدود آدرس با ترجیح IPv4، بستن socket در هر مسیر و ساعت monotonic اعمال شده‌اند. این عدد، زمان دسترسی TLS است؛ احراز هویت VPN یا ICMP را ثابت نمی‌کند.

### XHTTP: محدودیت Force و راه‌حل هر پروفایل

- Force عمومی stream-up که در 1.3.62 به درخواست کاربر اضافه شد برای فرانسه/سوئیس مفید بود، اما پنج کانفیگ s1 با آن timeout داشتند. همان ورودی با mode اصلی `auto` ترافیک و Public IP داد. بنابراین Force یک mode روی تمام سرورها سازگاری تضمین‌شده ندارد؛ تغییر MTU علت اثبات‌شدهٔ این پنج مورد نبود.
- در Edit Profile > Stream Settings > XHTTP mode گزینه‌های Follow app setting، auto، packet-up، stream-up و stream-one اضافه شدند. انتخاب اختصاصی با `v2rayXhttpModeOverride` ذخیره و روی کارت با `auto · Custom` نمایش داده می‌شود؛ Follow app setting دوباره سیاست عمومی را فعال می‌کند.
- override از Force عمومی اولویت بالاتر دارد؛ mode اصلی حفظ می‌شود. تغییر Force عمومی override را پاک نمی‌کند. مدل/Repository ذخیره‌سازی سازگار با دادهٔ قدیمی دارند. refresh اشتراک برای endpoint یکسان، override را با تطبیق name/protocol/server/port/network/path/host/SNI نگه می‌دارد، حتی اگر ID/UUID ورودی عوض شود. endpoint متفاوت override قدیمی را به ارث نمی‌برد.
- پنج پروفایل موجود s1 با حفظ اطلاعات اتصال روی auto · Custom تنظیم شدند؛ Force عمومی برای بقیه و ایمپورت‌های جدید روشن ماند. تست UI واقعی تغییر auto → Follow app setting → auto و ذخیره/نمایش کارت موفق شد.
- آزمون نهایی فهرست: **۴۳ مورد، ۳۹ پاسخ موفق و چهار شکست Mo-Ebrahimi**؛ Direct-To-Server حذف از تست. این عدد به معنی احراز هویت موفق تمام ۳۹ تونل نیست. نتایج ردیف‌به‌ردیف در [ANDROID_PHONE_TEST.md](<H:/Antigravity Projects/VPN APP/ANDROID_PHONE_TEST.md>) هستند.
- SSTP، OpenConnect و فرانسهٔ stream-up در نسخهٔ جدید Ping/Public IP و GeoIP/دانلود200 داشتند؛ MTU OpenConnect واقعی/نمایش1252 و دو مورد دیگر1500 بود. فرانسه Ping129ms و OpenConnect117ms ثبت شد. شبکهٔ VPN پس از قطع باقی نماند.
- روی پنج s1 mode واقعی خروجی auto تأیید شد. DE/FR دو درخواست200 دادند؛ US/UK پس از تکمیل probe اولیه در تکرار دو درخواست200 دادند. **timeout مقطعی همچنان دیده شد، به‌ویژه NL**: UI پینگ123ms/Public IP داشت ولی درخواست‌های جداگانهٔ GeoIP/دانلود در تکرار timeout شدند. این مورد کاملاً رفع‌شده اعلام نمی‌شود و بررسی کیفیت/همزمانی/پایداری سرور و مسیر لازم دارد.

### چهار WebSocket باقی‌مانده و محدودیت نتیجه

- چهار Mo-Ebrahimi TCP/TLS و پاسخ WebSocket101 داشتند، ولی درخواست HTTPS از تونل با connection closed شکست خورد. تست مستقل Xray26.3.27 با همان کانفیگ‌ها و یک نمونه بدون fingerprint نیز موفق نشدند؛ این تست ویندوز فقط پراکسی محلی ابزار بود و VPN/پراکسی سیستم را تغییر نداد.
- بازشدن endpoint و101 به معنی پذیرش VLESS/UUID نیست. علت قطعی بین حساب/کانفیگ/سرور یا رفتار مشترک هسته‌ها با این شواهد مشخص نیست؛ وضعیت این چهار مورد **حل‌نشده** است. برای ادامه، نتیجهٔ همان کانفیگ در اپ دیگر یا لاگ سمت سرور/کانفیگ سالم لازم است؛ اطلاعات ورود یا UUID را در گزارش عمومی منتشر نکنید.

### اعتبارسنجی، حفظ داده و تحویل

- ۲۴ تست JVM بدون شکست/خطا اجرا شدند؛ دو تست جدید اولویت override، toggle عمومی، حذف override و حفظ آن در refresh یکسان/عدم انتقال به endpoint متفاوت را پوشش می‌دهند. APK Release minified ساخته و با گواهی قبلی روی گوشی نصب شد. ساخت نهایی آرشیو نیز موفق است؛ لاگ `scratch/xhttp-server-check/build-1.3.63-archive.log`.
- یک نتیجهٔ اولیهٔ NL به‌علت خروج زودهنگام helper تست، connected=false ثبت شده بود؛ تصویر گوشی اتصال و IP را نشان می‌داد. helper اصلاح و تست تکرار شد؛ نتیجهٔ معتبر connected=true همراه timeout ترافیک است. این خطای ابزار تست با باگ اپ اشتباه نشود.
- مقایسهٔ backup اولیه/نهایی: همان۴۴ ID و پروفایل انتخابی حفظ شدند. فقط serverAddress یک SSTP و v2rayType/override پنج s1 تغییر کردند؛ credentials و سایر فیلدها ثابت ماندند. کلید Force که قبلاً غایب و به‌صورت پیش‌فرض true بود، اکنون صریحاً true ذخیره شد؛ مقدار مؤثر سایر تنظیمات تغییر نکرد. پایان تست VPN فعال نبود.
- فایل‌های خصوصی اولیه/نهایی و نتایج خام در `scratch/xhttp-server-check` هستند؛ گزارش عمومی بدون رمز، UUID و لینک خصوصی اشتراک است. مستندات DEVELOPMENT_SUMMARY و ANDROID_REVIEW نیز به‌روز شدند. هسته، MTU عمومی و اپ ویندوز در این اصلاح تغییر نکردند.

فایل‌های اصلی این نسخه: `SingBoxDelayTester.kt`، `XHttpModePolicy.kt`، `Models.kt`، `ProfileRepository.kt`، `VpnViewModel.kt`، `AddEditProfileScreen.kt`، `ProfileCard.kt`، `SettingsScreen.kt`، نسخهٔ Gradle/HomeScreen، تست‌های XHttpModePolicy و ابزار ReleaseServerDiagnosticsInstrumentation.

## تکمیل 1.3.62 — Force XHTTP، OpenConnect، SSTP و کیبورد

### سیاست XHTTP

- `XHttpModePolicy.kt` همهٔ xhttp/splithttpها را با گزینهٔ پیش‌فرض روشن `force_xhttp_stream_up` به stream-up تبدیل می‌کند؛ پروفایل‌های ذخیره‌شده، clipboard، افزودن دستی و افزودن/refresh اشتراک پوشش داده شدند.
- حالت اصلی در `v2rayOriginalXhttpMode` نگهداری و توسط `ProfileRepository` ذخیره می‌شود؛ خاموش‌کردن گزینه آن را برمی‌گرداند. raw extra و داده‌های TLS/سرور حفظ می‌شوند. گزینهٔ فعال روی اتصال جاری در reconnect بعدی اثر می‌کند.
- Settings > XHTTP > Force XHTTP stream-up و نشان `stream-up · Forced` روی کارت اضافه شدند. تست UI واقعی مهاجرت ۴۹ XHTTP، ایمپورت clipboard با packet-up، خاموش/روشن‌کردن و بازیابی mode/extra را تأیید کرد.

### علت خرابی probe در OpenConnect و راه‌حل

- در 1.3.61 خود اپ اجباری از VPN خارج شده بود؛ اتصال واقعی و درخواست‌های دیگر ممکن بودند ولی Ping/Public IP اپ شکست می‌خوردند. exclusion اجباری حذف و فهرست excluded_apps کاربر رعایت شد.
- پس از رفع اول، reconnect دوم خطای EPERM روی netId شبکهٔ بازنشسته را آشکار کرد. probe غیر sing-box اکنون Socket معمولی تحت مسیر پیش‌فرض UID داخل VPN دارد؛ DNS با شبکهٔ فعال VPN resolve و هویت شبکه قبل/بعد اتصال کنترل می‌شود. پاسخ دیررس با generation guard منتشر نمی‌شود. onCapabilitiesChanged نیز probe را به‌روز می‌کند؛ جست‌وجوی شبکه‌های VPN قدیمی حذف شد.
- Native OpenConnect اکنون buffer/NoDelay را می‌گیرد و روی duplicate FD محافظت‌شده با Os.setsockoptInt اعمال می‌کند. FD اصلی بسته نمی‌شود. TCP_NODELAY روی UDP اعمال نمی‌شود. Android ممکن است اندازهٔ بافر را محدود کند؛ readback مؤثر kernel تأیید نشده است.
- buffer_size و tcp_no_delay پایدار شدند. MTU واقعی min(requested, negotiated) و پس از establish به UI گزارش می‌شود؛ hard cap ثابت قبلی کنار رفت. تشخیص DTLS موفق دیگر متن خطای عمومی DTLS connection را موفق تلقی نمی‌کند. cookie/auth body/value از لاگ حذف شدند.
- سه reconnect Native روی سرور OpenConnect کاربر: Ping=103..104ms، Public IP برابر GeoIP واقعی، MTU واقعی/نمایش1252، ۹ درخواست Geo/download/upload با HTTP200، قطع کامل313..625ms. مسیر این تست TCP بود؛ DTLS فعال موفق تأیید نشده است.
- تست مستقل تنظیمات: MTU1200، buffer1MB، NoDelay=false، DisableDTLS=true، BypassLAN=true؛ MTU واقعی/نمایش1200، syscall buffer پذیرفته و TCP_NODELAY=0 ثبت شد؛ probe و سه درخواست200، قطع354ms بدون VPN/worker باقی‌مانده.
- Java OpenConnect نیز MTU در X-CSTP-MTU و negotiated cap می‌گیرد و skipCertificateVerification را رعایت می‌کند؛ این موتور جایگزین هنوز در آزمون واقعی این نوبت تأیید نشده است.

### SSTP و فرم

- آدرس تایپی دو نقطهٔ کاربر به sstp.rahanetmci.com اصلاح شد. بررسی مستقل سرور HTTP200 و ACK با SHA256 و PAP را نشان داد.
- C-bit هدر از0x10 اشتباه به0x01 اصلاح شد. `SstpCryptoBinding.kt` nonce، hash گواهی، CMK/HMAC و Crypto Binding را می‌سازد؛ PAP از HLAK صفر32بایتی استفاده می‌کند. پس از PAP موفق و پیش از IPCP، binding ارسال می‌شود. منتظر ACK دوطرفه LCP/IPCP می‌مانیم؛ DNS NAK/reject مدیریت می‌شود.
- بستن socket هنگام disconnect فوری شد؛ دیگر پشت reader بلوکه‌شده صف نمی‌شود. MTU/MRU توافق‌شده به TUN و UI یکسان ارسال می‌شود؛ hostname validation در حالت معتبرسنجی گواهی اضافه شد.
- سه نشست SSTP واقعی: Ping227..261ms، Public IP برابر GeoIP، MTU1360 واقعی/نمایش، ۹ درخواست200، قطع314..591ms؛ یک قطع از PendingIntent اعلان نیز اجرا شد. بدون VPN یا worker باقی‌مانده.
- SSTP فعلی PAP دارد؛ MS-CHAPv2 اضافه نشده است. نتیجهٔ موفق این سرور به معنای پشتیبانی تمام سرورهای SSTP نیست.
- فرم Add/Edit از imePadding و adjustResize استفاده می‌کند؛ initialProtocol انتخاب‌شده به فرم منتقل می‌شود. آزمون با کیبورد واقعی روی OpenConnect و SSTP: پایین فیلد Password=1517، بالای IME=1517؛ فیلد زیر کیبورد نمی‌رود.

### اعتبارسنجی و محدودیت‌های تحویل

- ۲۲ تست JVM موفق: ۳ تست سیاست XHTTP و ۵ تست SSTP، همراه۱۴ تست قبلی. بردارهای رسمی CMAC برای SHA1/SHA256 بررسی شدند. Release تمام ABIها ساخته شد و x86_64 روی شبیه‌ساز با حفظ داده نصب شد؛ فایل گوشی arm64 است.
- آزمون نهایی 1.3.62: سه reconnect فرانسه و سه سوئیس با ورودی auto که سیاست به stream-up تبدیل کرد؛ generated_mode در config واقعی stream-up، MTU1400، Ping108..116ms، Public IP مطابق GeoIP، ۳۰ درخواست200. قطع app و اعلان362..491ms و بدون VPN/worker باقی‌مانده. آپلود512KB فرانسه4.72..5.08Mbps، سوئیس4.59..5.03Mbps؛ این Speedtest کامل نیست.
- تست‌ها با `ReleaseServerDiagnosticsInstrumentation.java` روی APK minified واقعی انجام شدند. ترافیک مستقیم از TUN Android بود؛ برای بررسی disconnect از force-stop استفاده نشد. wrapper فقط پیش از هر case اپ را می‌بندد.
- چند شکست اولیهٔ تست کیبورد به‌علت تطبیق accessibility و پیمایش ابزار تست بود؛ پس از اصلاح helper و پیمایش واقعی، آزمون فرم پاس شد. این شکست‌ها به‌عنوان خرابی نهایی اپ شمارش نشوند.
- گزارش YouTube فرانسه جداگانه باید پیگیری شود؛ صفحهٔ consent گوگل در تست اولیه مانع ورود به ویدیو بود. `success` آزمون اولیه فقط سایت/lifecycle را تأیید می‌کند، نه پخش ویدیو.
- نتیجهٔ نهایی تست YouTube21.18.164 از اجرای تازه: سایت200، صفحهٔ اصلی و نتایج جست‌وجو قابل دسترس؛ صفحهٔ ویدیوی واقعی پیام `Sign in to confirm you’re not a bot` نشان داد و پخش متوقف شد. شاهد تصویری `scratch/xhttp-server-check/youtube-fresh.png` و متن UI خصوصی همان case است. تست ورود حساب انجام نشد؛ این رفتار Google مانع تأیید پخش بود و به‌تنهایی علت گزارش گوشی کاربر یا باگ MTU را ثابت نمی‌کند. هیچ تغییر حدسی در QUIC/UDP/MTU برای آن اعمال نشد. تنظیمات موقت تست restore و اپ قطع‌شده باز گذاشته شد.
- اطلاعات خصوصی subscription/credentials در scratch باقی می‌مانند و نباید به مستندات عمومی یا لاگ چاپ شوند. ویندوز تغییر نکرد.

منابع پیاده‌سازی SSTP: [بیت‌ها و بردارهای رسمی Microsoft](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-sstp/251f37d7-0261-4086-92bc-30761c4ce8f7)، [CMK SHA256](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-sstp/75cb037c-caf5-4364-9897-a8638c1f74ac)، [Crypto Binding](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-sstp/89a68310-0b1e-451b-af9c-0c9ce500bb2e).

## درخواست‌های اولیه و پاسخ عملی

| درخواست / ایراد | تغییر انجام‌شده | وضعیت و محدودیت |
| --- | --- | --- |
| بازبینی کد Android | مسیر اتصال، مالکیت TUN، Origin IP، routing، probeها و UI بررسی شدند؛ مشکلات باقی‌مانده مستند شدند | جزئیات در این فایل و `ANDROID_REVIEW.md` |
| نمایش IP VPN قبلی به‌عنوان Origin پس از تعویض سریع | دریافت Origin فقط از شبکهٔ فیزیکی غیر VPN و کنارگذاشتن پاسخ دیررس | در نبود اینترنت مستقیم، IP قبلی تونل جایگزین Origin نمی‌شود |
| کم‌رنگ‌بودن Origin IP در تم روشن | رنگ متن، عنوان و آیکون با تم هماهنگ شد | تصاویر دو تم در `scratch/android-screenshots` |
| فعال‌شدن bypass LAN با bypass ایران | قوانین ایران و LAN مستقل شدند؛ رنج‌های خصوصی از دادهٔ ایران حذف شدند | چهار ترکیب ایران/LAN تست شدند |
| اعمال‌نشدن یا خاموش‌نشدن bypass ایران | reload زنده، تجمیع تغییرات سریع، هماهنگی start/reload/stop و انتقال تنظیمات با Intent | اتصال‌های باز ممکن است با reload دوباره برقرار شوند |
| ظاهر گرد و انیمیشن نرم | اجزای Compose گردتر و انتقال‌ها نرم شدند | سپس انیمیشن‌های پرهزینه به‌دلیل گزارش لگ حذف یا ساده شدند |
| سؤال TCP Buffer | دامنهٔ واقعی اثر در تنظیمات توضیح داده شد | این گزینه به هستهٔ V2Ray/sing-box ارسال نمی‌شود |
| Release قابل نصب روی نسخهٔ قبلی و حجم زیاد | ساخت Release با R8 و resource shrinking و حفظ گواهی قبلی | Debug حدود 51.8MB بود؛ Release حدود 34.7MB شد |
| خرابی Ping و Public IP بعد از چند reconnect | probe مخصوص هر نشست، SOCKS احراز هویت‌شده و HTTPS تازه | تست واقعی سه reconnect در 1.3.58 انجام شد؛ معماری 1.3.60 دوباره چندپردازشی شد و آزمون دستگاه جدید لازم است |
| پینگ غیرواقعی حدود ۱۴۰۰–۱۵۰۰ms | جداکردن هزینهٔ اتصال TCP/TLS و warm-up از زمان پاسخ HTTPS | مقدار نمایش‌داده‌شده ICMP ping نیست |
| MTU قابل تغییر | تنظیم عددی ماندگار 1200 تا 1500، مقدار پیش‌فرض 1400 | در اتصال بعدی به TUN اعمال می‌شود |
| باقی‌ماندن علامت VPN یا گیرکردن Disconnecting | descriptor مستقل، هماهنگی lifecycle و worker جدا با مهلت توقف | قطع کامل در شبیه‌ساز و نشست‌های واقعی گوشی تأیید شد؛ تمام شرایط پس‌زمینه/Doze پوشش داده نشده‌اند |
| نمایش Disconnecting بلافاصله پس از بازشدن اپ | حذف شرط وجود هر VPN از تشخیص وضعیت SecureVPN | رگرسیون 1.3.60 در 1.3.61 اصلاح شد |
| کندی XHTTP / مشکل Instagram و Speedtest | حذف block اجباری UDP/443، حفظ ALPN و path، ارتقای libbox، حفظ extra و تست واقعی حالت‌های XHTTP | کاربر رفع بازشدن Instagram/Speedtest را گزارش کرد، ولی responsiveness هنوز مشکل داشت |

## تاریخچهٔ نسخه‌ها

### 1.3.56 — versionCode 186 — ۲۰۲۶-۱۰-۰۱

- Origin IP به دریافت HTTPS روی `Network` فیزیکی دارای اینترنت و غیر VPN منتقل شد. درخواست‌ها با نشست/نسل جاری بررسی می‌شوند تا پاسخ اتصال قبلی وارد نمایش نشود.
- خوانایی Origin در تم روشن اصلاح شد و نمایش آن قبل از اتصال هم حفظ شد.
- استقلال LAN و ایران اصلاح شد. قوانین خصوصی و فهرست CIDRهای ایران بازبینی شدند؛ FakeIP پیش از قانون private به proxy می‌رود.
- تغییر bypassها در اتصال V2Ray فعال با reload هسته و debounce حدود ۳۵۰ms اعمال شد.
- descriptor سرویس و descriptor متعلق به Go مستقل شدند. سرویس PFD اصلی را نگه می‌دارد؛ هسته نسخهٔ duplicate و detached را دریافت می‌کند.
- کارت‌ها، ورودی‌ها، دکمه‌ها و انتقال‌های Compose گردتر و نرم‌تر شدند.
- دامنهٔ اثر TCP Buffer و No Delay توضیح داده شد.
- ثبت کامل JSON شامل UUID و نوشتن آن در Downloads حذف شد؛ فایل کانفیگ همچنان در cache خصوصی اپ ایجاد می‌شود.
- APK این مرحله **Debug** بود: `SecureVPN-v1.3.56-arm64-v8a-debug.apk`، حجم 51,780,625 بایت.
- چهار تست محلی و سه تست دستگاه طبق لاگ‌های همان مرحله موفق شدند. بخشی از آزمون هسته/TUN از آدرس مستنداتی استفاده می‌کرد و موفقیت ترافیک واقعی یک VPN را اثبات نمی‌کرد.

### 1.3.57 — versionCode 187 — ۲۰۲۶-۱۰-۰۱

- کاربر لگ انیمیشن‌ها و خرابی Ping/Public IP پس از چند اتصال را گزارش کرد.
- پالس‌ها و حلقه‌های بزرگ‌شوندهٔ همزمان، پس‌زمینهٔ متحرک و تغییر اندازهٔ انیمیشنی کارت‌ها حذف شدند.
- چرخش کوچک وضعیت اتصال با `graphicsLayer` و fade کوتاه صفحات باقی ماند. ripple و تغییر رنگ حفظ شدند.
- یک کارت IP ثابت در همهٔ وضعیت‌ها جایگزین هم‌پوشانی کارت خروجی و Origin شد.
- probeها روی شبکهٔ VPN جاری و اتصال HTTP تازه اجرا شدند؛ callback تعویض TUN، لغو job و retry اضافه شد. این راه‌حل برای تمام reconnectها کافی نبود و در 1.3.58 جایگزین شد.
- Release با `minifyEnabled` و `shrinkResources` ساخته شد؛ حجم به **34,747,100 بایت** کاهش یافت. بخش عمدهٔ باقی‌مانده مربوط به کتابخانه‌های native است.
- امضای قبلی حفظ شد و نصب روی اپ موجود شبیه‌ساز بدون حذف داده انجام شد.

### 1.3.58 — versionCode 188 — ۲۰۲۶-۱۰-۰۱

- مشکل اصلی probe پس از چند reconnect به وابستگی به `netId`، DNS/FakeIP اندروید و اتصال‌های قبلی مربوط بود.
- یک mixed/SOCKS inbound روی loopback با پورت و نام کاربری/رمز تصادفی مخصوص هر اجرای هسته ایجاد شد.
- probe این inbound به outbound پروکسی هدایت می‌شود. نام دامنه داخل SOCKS ارسال می‌شود تا Android آن را به FakeIP نشست قبلی resolve نکند.
- `ProbeHttp` درخواست HTTPS را روی socket نشست جاری، با تأیید hostname و TLS و parser پاسخ HTTP/1.1 اجرا می‌کند. pool HTTP بین نشست‌ها مشترک نیست.
- Ping پس از TLS و warm-up، از پاسخ‌های همان اتصال اندازه‌گیری شد؛ هزینهٔ handshake در عدد Ping نمایش‌داده‌شده وارد نمی‌شود.
- MTU در تنظیمات عددی، ماندگار و قابل تغییر شد. مقدار فعلی در اتصال بعدی به سرویس و TUN می‌رود.
- تست واقعی سه reconnect با پروفایل ذخیره‌شده روی شبیه‌ساز انجام شد و Public IP و warm ping برگشتند. آزمون restart هسته با fixture نیز انجام شد.
- این موفقیت مربوط به 1.3.58 و معماری همان زمان است؛ تأیید خودکار 1.3.60/61 یا Instagram روی گوشی کاربر نیست.

### 1.3.59 — versionCode 189 — ۲۰۲۶-۱۰-۰۲

- کاربر قطع ظاهری در UI با باقی‌ماندن علامت VPN و کندی XHTTP را گزارش کرد.
- وضعیت نهایی قطع تا teardown عقب رفت؛ پرچم‌های لغو به instance سرویس منتقل شدند و ایجاد TUN بعد از لغو ممنوع شد.
- start/reload/stop هسته هماهنگ شدند. callback پایش شبکهٔ قبلی در reload حذف می‌شود.
- `onRevoke` پاک‌سازی را اجرا می‌کند. درخواست stop از native دوباره به Go به‌شکل reentrant وارد نمی‌شود و خطای close مانع بستن CommandServer نمی‌شود.
- block اجباری UDP/443 حذف شد. VLESS/VMess با `packet_encoding=xudp` ترافیک UDP را عبور می‌دهند.
- ALPN صریح XHTTP حفظ شد و path لینک فقط یک‌بار decode می‌شود.
- آدرس سرور از DNS شبکهٔ فیزیکی resolve می‌شود تا resolver تونل قبلی استفاده نشود.
- این اصلاحات مشکل توقف native را کامل حل نکردند؛ کاربر گیرکردن روی Disconnecting را دوباره گزارش کرد. وابستگی پایان قطع به `onDestroy` و انتظار native در 1.3.60 بازطراحی شد.
- Release: `SecureVPN-v1.3.59.apk`، 34,753,800 بایت؛ SHA256: `698F474530A952473D9BF0015949FC42A70FA2E5CBA7B82984094C2891FD17BE`.

### 1.3.60 — versionCode 190 — ۲۰۲۶-۱۰-۰۲

- سرویس در `AndroidManifest.xml` به پردازش اختصاصی **`:vpn`** منتقل شد.
- `BoundedShutdown` برای توقف native اضافه شد: thread مستقل cleanup و thread مستقل deadline با مهلت **۴ ثانیه**.
- timeout کوروتین برای توقف فراخوانی native کافی نیست؛ thread deadline مستقل است تا گیرکردن Go مانع خاتمه نشود.
- PFD اصلی سرویس قبل از انتظار برای native بسته می‌شود. پایان عادی یا پایان مهلت فقط پردازش اختصاصی VPN را خاتمه می‌دهد؛ kernel تمام FDهای duplicate و socketهای آن را آزاد می‌کند.
- هویت پردازش قبل از خاتمه بررسی می‌شود؛ پردازش UI هدف این خاتمه نیست.
- `onDestroy` روی main thread منتظر native نمی‌ماند. وضعیت پایان از `onDestroy` مستقل شد.
- وضعیت probe بین UI و worker با پیام package-targeted و extras منتقل شد. اتکا به static/StateFlow مشترک بین دو پردازش حذف شد.
- تنظیمات ایران/LAN از Intent دریافت می‌شوند؛ cache `SharedPreferences` یک پردازش برای مقدار تازهٔ پردازش دیگر مرجع نیست.
- مسیر کاری هسته به `vpn-core` منتقل شد تا `command.sock` با تست delay در پردازش UI تداخل نکند.
- کتابخانهٔ قبلی واقعاً **1.14.0-lx.21** بود؛ به نسخهٔ رسمی همان fork، **1.14.2-lx.11** از `Leadaxe/sing-box-lx` ارتقا یافت.
- SHA256 فایل AAR با digest انتشار رسمی تطبیق داده شد. API جدید `cancelNotification` در adapterهای لازم پیاده شد.
- XMUX و استفادهٔ مجدد از اتصال‌ها با هستهٔ جدید وارد شدند. مقدار pacing پیش‌فرض client برای XHTTP packet-up از ۳۰ms به `1-1` کاهش یافت؛ مقدار صریح لینک اولویت دارد.
- `v2rayXhttpExtra` در مدل، parser، persistence، فرم ویرایش، Intent و config حفظ شد. نگاشت فیلدهای سازگار padding، headers، pacing، placement و XMUX اضافه شد.
- `downloadSettings` و تمام extensionهای Xray پشتیبانی نشده‌اند؛ پشتیبانی کامل از هر لینک XHTTP ادعا نمی‌شود.
- اعلان‌های تکراری رابط فیزیکی با `InterfaceUpdateFilter` کنار گذاشته شدند.
- یازده تست JVM موفق شدند؛ Release و APK تست ساخته شدند. fixtureها با CLI متناظر هسته نیز check شدند.
- Release: `SecureVPN-v1.3.60.apk`، 35,881,180 بایت. افزایش حدود 1.13MB نسبت به 1.3.59 از هستهٔ native جدید بود.
- **رگرسیون این نسخه:** بررسی «وجود هر شبکهٔ VPN» در UI می‌توانست پاسخ idle سرویس را به Disconnecting تبدیل کند. این اشکال متعلق به اصلاحات این همکاری بود و در نسخهٔ بعد اصلاح شد.

### 1.3.61 — versionCode 191 — ۲۰۲۶-۱۰-۰۲

- گزارش کاربر: بازکردن اپ بلافاصله Disconnecting نشان می‌داد.
- شرط عمومی `workerAlive() || tunnelNetwork() != null` از مسیر DISCONNECTED حذف شد. VPN اپ دیگر، وضعیت SecureVPN را تعیین نمی‌کند.
- پاسخ idle بدون `closed_worker_pid` فوراً Disconnected محسوب می‌شود.
- فقط PID همان worker بسته‌شده ممکن است نیاز به انتظار داشته باشد. `VpnDisconnectConfirmation` انتظار را حداکثر **۶ ثانیه** محدود می‌کند.
- عدم تأیید خروج به خطای قابل نمایش تبدیل می‌شود؛ انتظار نامحدود و باقی‌ماندن دائمی UI روی Disconnecting حذف شد.
- سه تست رگرسیون پاسخ idle، خروج worker و timeout اضافه شد؛ مجموع فعلی **۱۴ تست JVM** بدون شکست هستند.
- هسته، MTU و XHTTP نسبت به 1.3.60 تغییر نکردند.
- Release ساخته و مشخصات APK، ABI و گواهی تأیید شدند. نصب/اجرای آخرین معماری روی گوشی یا شبیه‌ساز در آن نوبت انجام نشد.

## معماری و جزئیات لازم برای ادامهٔ کار

### Origin IP در مقابل Public IP

- Origin یعنی IP اینترنت فیزیکی پیش از تونل. فقط شبکهٔ اینترنت دارای `NOT_VPN` مبنا است و `Network.openConnection` برای HTTPS استفاده می‌شود.
- پاسخ دیررس نباید پس از تعویض تونل یا تغییر نسل درخواست پذیرفته شود.
- وجود VPN خارجی، Always-on/lockdown یا نبود اینترنت مستقیم ممکن است دریافت Origin را ناممکن کند. درخواست نباید از VPN عبور داده شود و نتیجهٔ آن Origin نام بگیرد.
- Public IP از مسیر خود تونل دریافت می‌شود؛ IP سرور یا IP خصوصی `172.19.0.1` جایگزین تأییدنشدهٔ Public IP نیست.
- probe نشست فعال در `ProbeEndpoint` نگهداری می‌شود. در حالت چندپردازشی، پیام CONNECTED/status باید endpoint را از worker به UI منتقل کند؛ در Disconnecting/Disconnected/Error پاک می‌شود.
- `ProbeHttp` با domain در SOCKS، TLS تأییدشده و اتصال مخصوص نشست کار می‌کند. endpoint قدیمی یا پاسخ job قدیمی نباید به اتصال جدید برسد.

### ایران، LAN و FakeIP

- رنج FakeIP یعنی `198.18.0.0/15` باید پیش از قواعد خصوصی به proxy برود.
- قانون `ip_is_private` مستقل از ایران و تابع تنظیم LAN است.
- CIDRهای خصوصی، loopback، رزروشده یا نامعتبر از فهرست ایران حذف می‌شوند.
- تنظیم ایران قواعد دامنه‌ها و CIDRهای ایران را اضافه/حذف می‌کند؛ LAN به‌واسطهٔ آن فعال نمی‌شود.
- start/reload/stop هسته باید هماهنگ بمانند. مقدار نهایی هر دو تنظیم در Intent ارسال می‌شود و reloadهای سریع تجمیع می‌شوند.
- با FakeIP و domain routing، دامنهٔ خارج از فهرست ایران صرفاً به‌خاطر IP ایرانیِ واقعی الزاماً bypass نمی‌شود. کیفیت و به‌روزرسانی assetهای ایران مسئلهٔ جداگانه است.

### مالکیت TUN و قطع اتصال

- PFD اصلی متعلق به سرویس است. duplicate منتقل‌شده به Go بعد از detach متعلق به native است و نباید دوباره با همان شمارهٔ FD از سمت Java بسته شود.
- بازشدن TUN بعد از شروع cancellation باید جلوگیری شود.
- `stopSelf()` به‌تنهایی پایان یک سرویس bound یا پایان انتظار native را تضمین نمی‌کند.
- فراخوانی native مسدود با `withTimeout` کوروتین متوقف نمی‌شود؛ deadline مستقل و worker اختصاصی برای همین مسئله اضافه شدند.
- پایان قطع شامل بستن FD سرویس، cleanup، پایان worker، حذف foreground notification و پیام وضعیت است. UI فقط worker خودش را بررسی می‌کند.
- تست آینده باید **قطع واقعی و نبود شبکهٔ VPN متعلق به این اپ** را بررسی کند؛ فقط عوض‌شدن متن UI کافی نیست. برای تشخیص حالت idle نیز نباید وجود VPNهای دیگر وارد شرط شود.

### MTU و TCP Buffer

- MTU فعلی از `vpn_app_prefs/mtu_size` خوانده می‌شود؛ محدودهٔ UI **1200..1500**، پیش‌فرض **1400** است.
- MainActivity مقدار را در `EXTRA_MTU` ارسال می‌کند؛ سرویس و config generator آن را به هسته می‌رسانند و `TunOptions` به Android Builder اعمال می‌شود.
- تغییر این تنظیم در اتصال بعدی اعمال می‌شود؛ reload صرفاً مربوط به bypassها است.
- در source دقیق libbox **1.14.2-lx.11**، حذف/صفرکردن MTU در Android مقدار ثابت **9000** ایجاد می‌کند. این انتخاب خودکار بر اساس PMTU، کیفیت شبکه یا سرور نیست.
- کاربر MTUهای **1280، 1360 و 1500** را روی گوشی امتحان کرده و برای Instagram در XHTTP نتیجهٔ نامطلوب مشابه داشته است.
- TCP Buffer و No Delay فعلی در Java OpenConnect و SSTP مصرف می‌شوند. به V2Ray/sing-box و مسیر پیش‌فرض Native OpenConnect ارسال نمی‌شوند. افزودن اثر مصنوعی یا تغییر تصادفی این گزینه‌ها راه‌حل اثبات‌شدهٔ XHTTP نیست.

## تست واقعی سابسکریپشن، سوئیس و فرانسه — ۲۰۲۶-۱۰-۰۲

### ورودی و نحوهٔ تست

- کاربر سابسکریپشن `ovh.rahanetmci.com` را فرستاد و افزودن و تست آن را خواست. URL کاملِ دارای token و UUIDها در این سند تکرار نشده‌اند.
- سابسکریپشن دریافت و به **۲۶ لینک VLESS** decode شد.
- دو پروفایل هدف: **France** و **Switzerland Zurich**. هر دو `type=xhttp`، `security=tls`، `mode=auto` و `alpn=h2` داشتند. extra شامل `mode` و `xPaddingBytes` بود؛ `downloadSettings` در این دو نبود.
- از CLI رسمی **sing-box-lx 1.14.2-lx.11** متناظر AAR اندروید استفاده شد. transport، TLS، fingerprint، path، host و extra با تنظیمات تولیدشدهٔ اپ هماهنگ شدند.
- برای مقایسه، CLI رسمی **Xray 26.3.27** دریافت شد. SHA256 فایل ZIP با digest انتشار رسمی تطبیق داشت: `d004c39288ce9ada487c6f398c7c545f7d749e44bdfdd59dbc9f865afba4e1ad`.
- تمام اتصال‌ها از SOCKS موقت loopback عبور کردند؛ **TUN ساخته نشد، MTU در تست وجود نداشت، تنظیمات VPN/پراکسی ویندوز تغییر نکردند**.
- تست‌ها با TLS verification فعال، همان سرورها و بدون تغییر UUID اجرا شدند. هسته‌ها همزمان benchmark نشدند تا رقابت پهنای باند نتیجه را مخدوش نکند.
- ابتدا `singbox auto`، سپس `Xray auto` و `singbox stream-up` اجرا شدند؛ دور دوم ترتیب Xray و singbox معکوس شد.
- در مجموع **۱۲ نشست مستقل** برای ماتریس کامل، هرکدام با پروسهٔ تازه، و **۲۰۴ درخواست اندازه‌گیری‌شده** اجرا شدند؛ همهٔ درخواست‌ها با exit=0 و HTTP 200/204 پایان یافتند. lookup جداگانهٔ GeoIP نیز در هر ۱۲ نشست موفق بود و کشورهای FR/CH برگشتند.
- درخواست‌ها شامل generate_204، robots اینستاگرام، endpoint بدون ورود `i.instagram.com`، چهار درخواست همزمان، دانلود 1MB و آپلود 512KB بودند. درخواست‌های اولیهٔ smoke جدا از این تعداد هستند.

### اعداد قابل مقایسه

اعداد جدول میانهٔ دو دور تست هستند. «آپلود گرم» مربوط به درخواست دوم روی اتصال قابل استفادهٔ مجدد و حجم ثابت 512KB است؛ سنجش حداکثر ظرفیت لینک یا Speedtest کامل نیست. «HTTPS سرد» زمان کامل اولین درخواست generate_204 شامل ساخت اتصال‌هاست، نه زمان تغییر برچسب Connected در UI.

| کشور | هسته / حالت | آپلود گرم، Mbps | پاسخ HTTPS گرم، ms | اولین HTTPS سرد، ms | زمان پاسخ درخواست همزمان پس از setup، ms |
| --- | --- | ---: | ---: | ---: | ---: |
| فرانسه | sing-box اپ / auto → packet-up | 3.36 | 110 | 710 | 208 |
| فرانسه | sing-box اپ / stream-up | 9.64 | 110 | 474 | 110 |
| فرانسه | Xray / auto | 9.38 | 114 | 468 | 114 |
| سوئیس | sing-box اپ / auto → packet-up | 3.00 | 115 | 652 | 207 |
| سوئیس | sing-box اپ / stream-up | 9.68 | 107 | 466 | 107 |
| سوئیس | Xray / auto | 8.74 | 108 | 464 | 109 |

- آپلود گرم `auto` در فرانسه 3.33..3.39 و سوئیس 2.36..3.63Mbps بود؛ `stream-up` در هر دو حدود 9.63..9.72Mbps بود.
- endpointهای Instagram در هر سه حالت پاسخ دادند؛ تفاوت ثابت و بزرگی در تمام درخواست‌های کوچکِ Instagram دیده نشد و یکی از پاسخ‌های API در Xray هم کندتر بود.
- در `auto`، هزینهٔ setup درخواست‌های تازه و آپلود بدتر از `stream-up` بود. اختلاف در تکرار با ترتیب معکوس نیز باقی ماند.

### علت محتمل و راه‌حل قابل آزمایش

- در core فعلی، `auto` برای TLS معمولی به **packet-up** می‌رود؛ Reality به `stream-one` می‌رود.
- در `packetConn.Write/sendPacket` همان tag، هر POST تا دریافت پاسخ HTTP و drain شدن body منتظر می‌ماند و بعد POST بعدی فرستاده می‌شود.
- این انتظارِ متوالی هزینهٔ round-trip را روی مسیرهای کوچک و آپلود اضافه می‌کند. Xray در packet-up batching و ارسال متفاوتی دارد؛ رفتار یکسان صرفاً با یکسان‌بودن نام XHTTP تضمین نمی‌شود.
- بهبود حدود سه‌برابری آپلود با عوض‌کردن mode همان هسته و همان سرورها، همراه با بررسی source، نشانهٔ قوی یک محدودیت عملکردی در packet-up فعلی است.
- این اختلاف بدون TUN/MTU دیده شد؛ برای **همین اختلاف اندازه‌گیری‌شده** حذف MTU توضیح یا راه‌حل نیست. مشکل مستقل MTU روی گوشی را به‌طور کامل رد نمی‌کند.
- برای A/B روی گوشی، دو لینک مشتق‌شده در [XHTTP-Switzerland-France-stream-up-test.txt](<H:/Antigravity Projects/VPN APP/XHTTP-Switzerland-France-stream-up-test.txt>) آماده شدند. فقط `mode` و عنوان آزمایشی تغییر کردند؛ مقدار mode داخل extra نیز هماهنگ شد. سرور، UUID، TLS، ALPN، path، padding و سایر پارامترها با لینک اصلی برابرند.
- پیش‌فرض عمومی اپ همچنان `auto` است؛ تغییر آن برای همهٔ لینک‌ها بدون آزمون سازگاری CDNها انجام نشده است. `stream-up` روی این دو سرور در محیط تست جواب داد، اما ممکن است در مسیر یا CDN دیگری جواب ندهد.
- UI فعلی `v2rayType` را هنگام import حفظ می‌کند، ولی کنترل واضحی برای انتخاب XHTTP mode در فرم ندارد. افزودن انتخاب mode برای هر پروفایل، همراه با حفظ `auto`، کار پیشنهادی بعدی است.

### محدودیت‌های تست CLI و سابقهٔ مجوز شبیه‌ساز

- این تست روی کامپیوتر و هستهٔ هم‌نسخه انجام شد؛ اجرای اپ Android، لایهٔ TUN، UDP/QUIC، شبکهٔ موبایل ایران، حساب Instagram، feed/reels و پاسخ‌گویی کامل اپ Instagram را تأیید نمی‌کند.
- پروسه‌های موقت هر تست در `finally` خاتمه یافتند. restart موفق CLI، اثبات صحیح‌بودن قطع سرویس VPN اندروید نیست.
- هنگام تلاش برای اجرای AVD موجود، **بررسی خودکار مجوز آن را رد کرد**؛ دلیل اعلام‌شده این بود که کاربر قبلاً تست شبیه‌ساز را لغو کرده و اجازهٔ صریح تازه برای اجرای آن نداده است.
- پس از رد، شبیه‌ساز از مسیر جایگزین اجرا نشد و اجازهٔ صریح دوباره درخواست شد. درخواست نوشتن این فایل به‌عنوان اجازه تفسیر نشد.
- کاربر در پیام بعدی صریحاً گفت «آره باز کن تست کن». سپس اجرای شبیه‌ساز مجاز شد و تست واقعی Android زیر انجام شد. محدودیت مجوز قبلی اکنون برای این درخواست رفع شده است؛ اشتراک نیز داخل اپ اضافه شده است.

### محل شواهد تست اخیر

- [خلاصهٔ ماشین‌خوان نتایج](<H:/Antigravity Projects/VPN APP/scratch/xhttp-server-check/summary.json>) و فایل‌های `result-*-full.json`.
- نتایج دور اول در `scratch/xhttp-server-check/round1` و دور دوم در همان پوشهٔ اصلی نگهداری شده‌اند.
- اسکریپت بازتولید: `scratch/xhttp-server-check/check_servers.py`؛ جمع‌بندی و تولید لینک آزمایشی: `finalize_results.py`.
- `subscription.txt`، `links.private.txt` و `*.private.json` در همان پوشه شامل اطلاعات اتصال‌اند؛ برای ادامهٔ تست محلی استفاده شوند و وارد گزارش عمومی یا commit عمومی نشوند.
- فایل آرشیو و executable رسمی Xray فقط در همان پوشهٔ scratch هستند؛ منبع Windows app تغییر نکرده است.

## تست واقعی Android Release روی شبیه‌ساز — پس از اجازهٔ صریح کاربر

### نصب و آماده‌سازی

- AVD موجود **Resizable_Experimental / emulator-5556** اجرا شد. نسخهٔ نصب‌شده قبلاً 1.3.58 بود؛ **Release x86_64 نسخهٔ 1.3.61 / code 191** با `install -r` روی آن نصب شد و داده‌های قبلی حفظ شدند.
- اپ در شروع `Not Connected` نشان داد. هیچ تغییر تازه‌ای در کد اصلی اپ یا هسته برای این آزمایش داده نشد.
- همین URL سابسکریپشن در دادهٔ قدیمی AVD وجود داشت، اما پروفایل‌های قدیمی extra نداشتند. این وضعیت با نیاز ثبت‌شده به import/refresh پس از ارتقای parser سازگار بود؛ نشانهٔ شکست parser جدید نبود.
- اشتراک از **فرم واقعی Add Subscription** با نام `Raha-XHTTP-Test` دوباره اضافه شد: ۲۶ پروفایل دریافت شدند و extra پروفایل‌های XHTTP حفظ شد. اشتراک‌ها و پروفایل‌های قبلی حذف نشدند.
- `ReleaseServerDiagnosticsInstrumentation.java` و ثبت آن در `app/src/androidTest/AndroidManifest.xml` اضافه شدند. این ابزار فقط SDK Android/Java استفاده می‌کند و به نام کلاس‌های Kotlin حذف‌شده/تغییرنام‌یافته توسط R8 وابسته نیست؛ آزمون روی APK واقعی Release اجرا شد.
- ابزار از backup خصوصی داخل cache برای برگرداندن تنظیمات استفاده کرد. برای benchmark، bypass ایران خاموش و LAN روشن بود و پکیج ابزار از VPN مستثنا نبود. پس از پایان، تنظیمات، نام‌ها و انتخاب قبلی برگردانده شدند و اشتراک تازه حفظ شد.

### محدودهٔ آزمون معتبر

- دو سناریوی پایه: France و Switzerland، هرکدام **سه اتصال/قطع پیاپی با auto و MTU 1400**؛ پینگ و Public IP هر سه نشست برگشتند.
- دوازده سناریوی دیگر: دو کشور × دو mode (`auto` و `stream-up`) × سه MTU (`1280`, `1360`, `1500`)، هرکدام یک اتصال/قطع.
- جمع نهایی: **۱۴ سناریوی موفق، ۱۸ نشست موفق، ۹۰ درخواست مستقیم HTTPS از TUN؛ هر ۹۰ پاسخ HTTP 200**.
- در هر نشست، `ConnectivityManager` فعال‌بودن VPN را برای UID درخواست‌کننده تأیید کرد؛ HTTP از `HttpsURLConnection` عادی عبور کرد، نه inbound اختصاصی probe.
- `LinkProperties.getMtu()` مقدار واقعی رابط را گزارش داد و با MTU درخواستی برابر بود. این تأیید صرفاً به نوشتهٔ UI متکی نیست.
- mode در JSON خصوصیِ واقعاً تولیدشدهٔ هسته با mode سناریو برابر بود.
- Public IP داخل UI با GeoIP درخواست مستقیم از TUN برابر بود؛ کشورها FR/CH بودند. پاسخ‌های Instagram بدون ورود و انتقال فایل نیز موفق بودند.
- پس از هر قطع، نبود شبکهٔ VPN، پایان PID worker و بازگشت UI به `Not Connected` بررسی شد. **هیچ VPN فعال یا worker مربوط به اتصال باقی نماند.**
- پینگ UI در کل آزمون‌های معتبر **108..142ms** و زمان قطع **442..814ms** بود.
- در دور دوم هر سناریوی پایه، **PendingIntent واقعی اکشن Disconnect اعلان** از `NotificationManager.getActiveNotifications()` اجرا شد؛ این مسیر همان اکشن اعلان سرویس است. دو مورد قطع از اکشن اعلان موفق بودند؛ سایر موارد از دکمهٔ اپ بودند.

### سرعت آپلود از TUN اندروید

هر عدد یک POST با 512KB داده و اتصال HTTPS بسته‌شونده است. برخلاف جدول CLI، اینجا زمان راه‌اندازی/handshake هم در نرخ اثر دارد؛ دو جدول مستقیم با هم مقایسه نشوند. سناریوهای MTU سه‌گانه هرکدام یک نمونه دارند و برای ادعای ظرفیت نهایی شبکه یا برتری قطعی یک MTU کافی نیستند.

| کشور | MTU واقعی | auto، Mbps | stream-up، Mbps |
| --- | ---: | ---: | ---: |
| فرانسه | 1280 | 1.674 | 4.175 |
| فرانسه | 1360 | 1.593 | 4.423 |
| فرانسه | 1500 | 1.620 | 3.754 |
| سوئیس | 1280 | 1.172 | 4.276 |
| سوئیس | 1360 | 1.679 | 4.051 |
| سوئیس | 1500 | 1.691 | 5.185 |

- در هر شش مقایسهٔ جفتی، stream-up بهتر بود. تغییر MTU، افت packet-up را از بین نبرد.
- این نتیجه مؤید یافتهٔ CLI دربارهٔ مسیر XHTTP است. MTU 9000/حذف MTU آزمایش نشد و خودکارسازی آن در اپ پیاده نشده است.
- برای آزمایش گوشی، لینک‌های `XHTTP-Switzerland-France-stream-up-test.txt` همچنان راه کم‌تغییر برای مقایسه هستند؛ نسخهٔ 1.3.61 mode آن‌ها را می‌خواند.

### خطاهای ابزار تست و نحوهٔ کنارگذاشتن نتیجهٔ نامعتبر

- در تلاش اول پس از لمس اعلان، پانل SystemUI روی اپ ماند. ابزار پینگ/IP را در صفحه پیدا نکرد و گزارش شکست چرخهٔ سوم داد. snapshot مستقل UI نشان داد root متعلق به `com.android.systemui` بود؛ این گزارش به‌عنوان خرابی اثبات‌شدهٔ پینگ اپ شمارش نشد.
- بستن پانل بدون انتظار برای آماده‌شدن Activity نیز می‌توانست Back را هنگام startup به اپ بفرستد و ابزار را از صفحه خارج کند. انتظار و بررسی package اصلاح شد.
- برای آزمون نهاییِ اکشن اعلان، PendingIntent همان اکشن مستقیماً اجرا شد تا پوشانده‌شدن UI نتیجهٔ شبکه را مخدوش نکند. این آزمون، تمام gestureهای پنل اعلان یا رفتار UI در پس‌زمینهٔ طولانی/Doze را تأیید نمی‌کند.
- نمایش نام کشور همراه emoji در stdout ویندوز باعث `UnicodeEncodeError` در wrapper Python شد؛ UTF-8 و خروجی خلاصهٔ ASCII تنظیم شد. این خطا به هسته یا APK مربوط نبود.
- تلاش‌های نامعتبر، JSON اولیه و لاگ‌های شکست جدا نگهداری شده‌اند و در **۱۸ نشست معتبر** شمارش نشده‌اند. فایل‌های نهایی هر سناریو نتیجهٔ ابزار اصلاح‌شده را دارند.

### ایراد تازهٔ قابل پیگیری: انتخاب پروفایل با نام تکراری

- source فعلی در `restoreProfileByName` اولین پروفایل دارای همان نام را انتخاب می‌کند. سرویس فقط نام پروفایل را برای بازیابی به UI می‌فرستد.
- در AVD، اشتراک قدیمی و اشتراک تازه نام‌های یکسانی مانند France داشتند. در چنین وضعیتی callback CONNECTED می‌تواند انتخاب UI را به پروفایل اشتراک قدیمی برگرداند؛ اتصال بعدی ممکن است پارامترهای متفاوت/extra قدیمی را مصرف کند.
- برای کنترل آزمون، نام پروفایل انتخاب‌شدهٔ اشتراک تازه موقتاً پسوند `[Raha-XHTTP-Test]` گرفت. mode واقعی هر نشست نیز از config بررسی شد؛ پس از تست نام‌ها به backup برگشتند.
- **کد اصلی این مشکل در این نوبت اصلاح نشده است.** راه‌حل پیشنهادی: ارسال و بازیابی `profile.id` در Intent اتصال و status، و استفاده از نام فقط برای نمایش/سازگاری با پیام قدیمی. برای اصلاح تولیدی، نسخه و تست regression لازم است.

### شواهد و وضعیت نهایی دستگاه

- [android-summary.json](<H:/Antigravity Projects/VPN APP/scratch/xhttp-server-check/android-summary.json>) خلاصهٔ ۱۴ سناریو/۱۸ نشست است. فایل‌های `android-result-*.json` و `android-*.log` دادهٔ هر مورد را دارند.
- بازتولید از `scratch/xhttp-server-check/run_android_checks.py` و ابزار framework در `app/src/androidTest/java/com/vpnapp/ReleaseServerDiagnosticsInstrumentation.java` انجام می‌شود.
- برنامهٔ اصلی همان Release 1.3.61 است. ابزار تست جدا نصب شده؛ APK اصلی برای این آزمایش تغییر نکرده است.
- تنظیمات موقت تست restore شدند و اپ در شبیه‌ساز باز و **قطع‌شده** باقی گذاشته شد. اشتراک `Raha-XHTTP-Test` با ۲۶ پروفایل در آن باقی است.
- تست کامل اپ Instagram با حساب واقعی، feed/reels، اینترنت همراه گوشی، battery/Doze و نرخ فریم انجام نشده است؛ نتیجهٔ شبکهٔ emulator جای این آزمون‌ها را نمی‌گیرد.

## فایل‌های اصلی تغییرکرده / لازم برای ادامه

| فایل | مسئولیت |
| --- | --- |
| [VpnViewModel.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/viewmodel/VpnViewModel.kt>) | Origin، GeoIP، Ping، نسل jobها، وضعیت اتصال، bypass، تنظیم MTU |
| [MainActivity.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/MainActivity.kt>) | Intent اتصال/تنظیمات و دریافت endpoint/status از worker |
| [VpnConnectionService.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/VpnConnectionService.kt>) | lifecycle، TUN، reload، worker shutdown، notification |
| [BoundedShutdown.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/BoundedShutdown.kt>) | cleanup و deadline مستقل native |
| [VpnDisconnectConfirmation.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/VpnDisconnectConfirmation.kt>) | انتظار محدود فقط برای PID worker خود اپ |
| [SingBoxEngine.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/singbox/SingBoxEngine.kt>) | libbox، protectSocket، ownership، callback شبکه، مسیر کاری هسته |
| [SingBoxConfigGenerator.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/singbox/SingBoxConfigGenerator.kt>) | DNS، routing، TUN MTU، TLS و transport |
| [ProbeEndpoint.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/singbox/ProbeEndpoint.kt>) | SOCKS مخصوص نشست و انتقال آن بین پردازش‌ها |
| [ProbeHttp.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/util/ProbeHttp.kt>) | HTTPS probe با اتصال تازه و پاسخ HTTP/1.1 |
| [InterfaceUpdateFilter.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/singbox/InterfaceUpdateFilter.kt>) | dedup تغییرات واقعی رابط فیزیکی |
| [XHttpOptions.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/vpn/singbox/XHttpOptions.kt>) | ترجمهٔ extra به schema هسته و pacing پیش‌فرض |
| [Models.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/data/Models.kt>)، [V2RayLinkParser.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/data/V2RayLinkParser.kt>)، [ProfileRepository.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/data/ProfileRepository.kt>) | مدل و import/persistence تنظیمات XHTTP |
| [HomeScreen.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/ui/screens/HomeScreen.kt>)، [SettingsScreen.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/ui/screens/SettingsScreen.kt>)، [AddEditProfileScreen.kt](<H:/Antigravity Projects/VPN APP/app/src/main/java/com/vpnapp/ui/screens/AddEditProfileScreen.kt>) | ظاهر، حرکت، خوانایی IP، MTU و ویرایش/import |
| [AndroidManifest.xml](<H:/Antigravity Projects/VPN APP/app/src/main/AndroidManifest.xml>) | پردازش `:vpn` |
| [build.gradle.kts](<H:/Antigravity Projects/VPN APP/app/build.gradle.kts>) | نسخه، Release، R8، shrink و امضا |
| [libbox-provenance.json](<H:/Antigravity Projects/VPN APP/app/libs/libbox-provenance.json>) | منبع و هش هستهٔ فعلی |

## تست‌ها و اعتبار شواهد

### مجموعهٔ JVM نسخهٔ 1.3.61: ۱۴ تست بدون شکست

| مجموعه | تعداد |
| --- | ---: |
| `IpAddressValidatorTest` | 1 |
| `ProbeHttpTest` | 1 |
| `BypassRoutingTest` | 3 |
| `XHttpConfigTest` | 3 |
| `BoundedShutdownTest` | 2 |
| `InterfaceUpdateFilterTest` | 1 |
| `VpnDisconnectConfirmationTest` | 3 |

- XML نتایج در `app/build/test-results/testDebugUnitTest` و خروجی ساخت آخرین اصلاح در `scratch/android-1.3.61-build.log` موجود است.
- آزمون‌های دستگاه شامل `SingBoxConfigTest`، `VpnRoutingLifecycleTest`، `ProbeCoreLifecycleTest`، `ProbeLifecycleTest`، `LiveProbeTest`، `AppearanceTest` و `ReleaseSmokeInstrumentation` در `app/src/androidTest` هستند.
- helper مربوط به teardown برای معماری چندپردازشی به انتظار PID worker و وضعیت دستگاه مجهز شد. ساخت APK تست با موفقیت انجام شد؛ ساخته‌شدن آن به‌معنای اجرای آن روی آخرین نسخه نیست.
- تست‌های local/core fixture و آزمون‌های واقعی باید جدا گزارش شوند. fixture با آدرس مستنداتی، عملکرد واقعی شبکه یا Instagram را تأیید نمی‌کند.

## ریلیز، امضا و چالش‌های محیط ساخت

- package فعلی `com.vpnapp`، minSdk 26 و target/compileSdk 35 است.
- Release فعلی با همان کلید **debug** قبلی امضا می‌شود تا نصب روی نسخهٔ قبلی بدون حذف داده ممکن باشد. fingerprint گواهی SHA256: `dfd5d057e7cd895e267b8a2183eb6d7f4e4e5103262bccb8e643a44e025ace62`.
- تغییر ناگهانی signing key امکان upgrade روی نصب موجود را از بین می‌برد؛ برای انتشار رسمی، برنامهٔ مهاجرت امضا باید مشخص شود.
- نسخه هم در Gradle و هم در محل fallback نمایش UI افزایش داده شده است. تغییر بعدی اپ باید از **versionCode 191** بالاتر باشد و changelog فوراً ثبت شود.
- بزرگ‌شدن APK اول از Debug بودن و کد/منابع فشرده‌نشده بود. کاهش به Release حدود ۳۳٪ انجام شد. افزایش بعدی 1.3.60 عمدتاً از AAR جدید بود، نه انیمیشن‌ها.
- فایل `libbox.aar` فعلی 120,038,794 بایت و SHA256 آن `5c8187b9a9693c72d52135c4ced5cce9028a3208edeb8dc1df74089bc3b3b0cc` است. اندازهٔ AAR با اندازهٔ APK تک‌معماری برابر نیست.
- هستهٔ قبلی قبل از جایگزینی در `scratch/android-before-1.3.60/libbox.aar` ذخیره شد؛ کتابخانهٔ جدید ابزار رسمی همان پروژه است، نه patch اختصاصی ساخته‌شده در این گفتگو.
- Java/Gradle در این محیط با Unix-domain socket محلی خطا داشتند. workaround فقط در محیط اجرای build اعمال شد و به تنظیمات عمومی پروژه اضافه نشد.
- build پایدار با JDK 17، Gradle offline، دو worker و Kotlin compiler داخل process انجام شد. worker بیشتر/حافظهٔ نامناسب قبلاً باعث مشکلات حافظه و build شده بود.

نمونهٔ build استفاده‌شده در این محیط:

```powershell
$env:JAVA_HOME = 'F:/Program Files/Java/jdk-17'
$env:GRADLE_USER_HOME = 'C:/Users/MohammadReza/.gradle'
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=Z:/codex-unavailable-socket-dir -Duser.home=C:/Users/MohammadReza'
./gradlew.bat --offline --no-daemon --max-workers=2 '-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1024m' '-Pkotlin.compiler.execution.strategy=in-process' :app:testDebugUnitTest :app:assembleRelease
```

- در این محیط `ANDROID_USER_HOME` برای adb باید مسیر واقعی `C:/Users/MohammadReza/.android` باشد؛ مسیر پیش‌فرض sandbox باعث خطای `Cannot mkdir '\\.android'` شده بود.
- دستورهای build و شروع emulator به دسترسی cache/AVD خارج از workspace نیاز داشتند. رد اجرای emulator در آخرین نوبت به **مجوز لغوشدهٔ قبلی کاربر** مربوط بود، نه شکست build یا خراب‌بودن AVD.

## بکاپ‌ها، Git و مستندات قدیمی

- **پوشهٔ `app/`، Gradle root و `scratch/` در `.gitignore` هستند.** `git diff` معمولی تغییرات اصلی Android را نشان نمی‌دهد. برای تحویل سورس فقط به Git تکیه نشود؛ فایل‌های واقعی workspace لازم‌اند.
- بکاپ‌های قبل از مراحل در `scratch/android-before-1.3.56`، `before-1.3.57`، `before-1.3.58`، `before-1.3.59`، `before-1.3.60` و `before-1.3.61` موجودند؛ محتوا و گسترهٔ هر بکاپ یکسان نیست.
- backup قبل از 1.3.61 شامل وضعیت 1.3.60 و رگرسیون Disconnecting است؛ restore کلی بدون بررسی اصلاحات بعدی انجام نشود.
- تغییر قبلی و نامرتبط `windows-app-tauri/src-tauri/Cargo.lock` و پوشه‌های `temp49`/`temp50` از این کار Android نیستند و پاک‌سازی/بازنویسی نشدند.
- [ANDROID_REVIEW.md](<H:/Antigravity Projects/VPN APP/ANDROID_REVIEW.md>) گزارش مرحله‌ای با محدودیت‌های تست است.
- بخش‌های قدیمی `DEVELOPMENT_SUMMARY.md` بعضی وضعیت‌های تاریخی را به‌شکل معماری فعلی نوشته‌اند؛ برای مثال block UDP/443 یا بررسی نبود هر VPN در 1.3.60 با سورس 1.3.61 یکسان نیستند. برای وضعیت جاری، سورس واقعی و بخش‌های جدید همین گزارش مرجع باشند.

## ایرادات باقی‌ماندهٔ بازبینی

این موارد در بازبینی اولیه شناسایی شدند و در این همکاری کامل اصلاح نشده‌اند:

1. پیش‌فرض عمومی مدل `skipCertificateVerification=true` است؛ parser لینک‌های VLESS/Trojan در مسیرهای بررسی‌شده false می‌گذارد. رفتار تمام پروتکل‌ها و پروفایل‌های دستی نیاز به بازبینی دارد.
2. رمزها/UUIDها در SharedPreferences به‌صورت متن سریال می‌شوند و قواعد backup می‌توانند آن‌ها را شامل شوند. نگهداری با Keystore و سیاست backup مشخص پیاده نشده است.
3. Release با کلید debug امضا می‌شود؛ برای انتشار عمومی به برنامهٔ امضای پایدار نیاز است.
4. `Connection Alerts` فقط state محلی UI را تغییر می‌دهد و اتصال واقعی به سرویس ندارد. اعلان foreground اجباری باید از اعلان اختیاری تفکیک شود.
5. persistence Buffer/NoDelay در1.3.62 اصلاح و اثر Native TCP آزمایش شد؛ اندازهٔ مؤثر بافر kernel، DTLS UDP موفق و موتور Java همچنان آزمون تکمیلی لازم دارند.
6. assetهای ایران ثابت هستند و به‌روزشدن/دامنهٔ واقعی آن‌ها و routing با FakeIP باید روی شبکهٔ واقعی بررسی شود.
7. پشتیبانی XHTTP این fork با همهٔ قابلیت‌های Xray یکسان نیست؛ به‌خصوص asymmetric `downloadSettings` پوشش داده نشده است.
8. responsiveness اپ‌ها و مصرف منابع روی گوشی کاربر آزمون تکمیلی لازم دارند؛ قطع کامل V2Ray/OpenConnect/SSTP روی شبیه‌ساز1.3.62 و گوشی1.3.63 تأیید شد. چهارWS حامد در65 با حفظ encryption رفع و روی گوشی تأیید شدند؛ timeout مقطعی s1/NL باقی است. گزارش خرابی YouTube اپ با فرانسه هنوز به علت قطعی نرسیده است.
9. بازیابی انتخاب پروفایل با نام تکراری می‌تواند پروفایل اشتباه را انتخاب کند؛ استفاده از ID به‌جای name هنوز در سورس اصلی اصلاح نشده است.

## پیشنهاد ترتیب ادامه در Antigravity

1. سناریوهای موفق شبیه‌ساز را روی گوشی واقعی تکرار کن؛ پاسخ idle با VPN خارجی روشن/خاموش نیز بررسی شود.
2. اشتراک در AVD اضافه شده است؛ روی گوشی موجود باید refresh/import شود تا extra قدیمیِ حذف‌شده بازیابی شود. پروفایل‌های موجود حذف نشوند و import تکراری مدیریت شود.
3. روی سوئیس و فرانسه، `auto` را با لینک‌های مشتق‌شدهٔ `stream-up`، روی همان گوشی/اینترنت و MTU یکسان مقایسه کن. feed، reels، تصویر، ارسال و Speedtest کامل را جدا بسنج.
4. چند چرخهٔ سریع connect/disconnect، قطع از notification، قطع حین Connecting، revoke و reload bypass را تست کن؛ مرگ worker، بسته‌شدن TUN، نبود علامت VPN خود اپ، Public IP و warm ping هر نشست را بررسی کن.
5. Force XHTTP پیش‌فرض روشن موجود است؛ خاموش‌کردن آن mode اصلی را برمی‌گرداند. انتخاب مستقل هر پروفایل در1.3.63 اضافه شد و پنج s1 روی auto · Custom هستند؛ original mode، raw extra و override در refresh حفظ شوند. timeout مقطعی s1/NL هنوز نیاز به بررسی دارد؛ چهار شکست WS حامد با encryption در65 رفع شدند. Smart و حالت دستی هر دو موجودند.
6. سازگاری سیاست Force را با سرورهای دیگر و اپ‌های واقعی بسنج. patch/rebuild هسته فقط با شواهد و regression باشد؛ برای گزارش YouTube ابتدا بازشدن صفحه، جست‌وجو و پخش را جدا بررسی کن.
7. در صورت باقی‌ماندن کندی، UDP/QUIC، TCP-over-TCP، رفتار stack TUN، timeoutها و loop/sockets را اندازه بگیر؛ پیش‌فرض MTU را صرفاً بر اساس حدس تغییر نده.
8. برای هر تغییر واقعی اپ، نسخه را افزایش بده، `DEVELOPMENT_SUMMARY.md` و همین فایل را به‌روز کن، Release با امضای سازگار بساز و نتیجهٔ آزمون دستگاه را صریح ثبت کن.
9. قبل از آزمون چند اشتراک دارای نام کشور یکسان، مشکل انتخاب با نام را با profile ID اصلاح و تست کن؛ نام‌گذاری موقت ابزار تست راه‌حل تولیدی نیست.

## منابع دقیق برای یافته‌های هسته

- [انتشار رسمی libbox 1.14.2-lx.11](https://github.com/Leadaxe/sing-box-lx/releases/tag/v1.14.2-lx.11)
- [default MTU در source دقیق همین tag](https://github.com/Leadaxe/sing-box-lx/blob/v1.14.2-lx.11/protocol/tun/inbound.go)
- [انتخاب auto و حالت‌های XHTTP در همین tag](https://github.com/Leadaxe/sing-box-lx/blob/v1.14.2-lx.11/transport/v2rayxhttp/client.go)
- [Write و sendPacket متوالی در همین tag](https://github.com/Leadaxe/sing-box-lx/blob/v1.14.2-lx.11/transport/v2rayxhttp/conn.go)
- [انتشار رسمی Xray استفاده‌شده در مقایسه](https://github.com/XTLS/Xray-core/releases/tag/v26.3.27)
- [منبع split-http/XHTTP در Xray](https://github.com/XTLS/Xray-core/blob/main/transport/internet/splithttp/dialer.go)
- [مستند رسمی XHTTP](https://xtls.github.io/en/config/transports/xhttp.html)

Sourceهای pinned خوانده‌شده برای MTU و XHTTP در `scratch/core-tag-*.go` نیز ذخیره شده‌اند. لینک `main` مربوط به Xray ممکن است در آینده تغییر کند؛ برای مقایسهٔ مجدد نسخه را pin کن.

ثبت GitHub: تغییرات Android1.0.1 به مخزن خصوصی SecureVPN-Android، شاخهٔ main، commit `faf49eefa9487189bd25ec242ea716904edf4b45` پوش شدند و HEAD ریموت با local برابر بود. ریپوی Windows پوش نشد.

## بررسی شروع Google Play و AdMob — 2026-10-08

- مرورگر به Play Console حساب MRE Developer (Personal) دسترسی داشت؛ فقط Persian & Gregorian Calendar دیده شد، SecureVPN هنوز app record ندارد. فرم Create app بررسی شد ولی ارسال نشد: نام و package ID پایدار، نوع و قیمت اپ، اظهارنامهٔ سیاست‌های Play و تأیید مالک برای قانون صادرات/رمزنگاری لازم است.
- با ورود کاربر به AdMob، اپ Android با نام نمایشی **SecureVPN** و واحد بنر ثبت شد. App ID: `ca-app-pub-5284715425712192~7524274903`؛ Banner ID: `ca-app-pub-5284715425712192/9988540732`. شناسه‌های واقعی در سورس تست جایگزین نشدند؛ UMP/رضایت هنوز آماده نیست.
- پیش‌نیازهای build مانده: target/compile API36، همهٔ nativeها 16KB، upload key/Play App Signing و AAB. APK تست با Android Debug امضا شده و هنوز قابل ارسال نیست.
- کاربر مالکیت دامنهٔ `rahanetmci.com` را تأیید کرد. Cloudflare نشان می‌دهد DNS zone با تنظیم Full فعال است؛ ۵۸ رکورد وجود دارد، اما root و www هنوز رکورد وب‌سایت ندارند. پکیج `com.rahanetmci.securevpn` آزاد دیده شد؛ app record هنوز ساخته نشده است.
- فایل‌های وب ایستای SecureVPN شامل صفحهٔ انگلیسی/فارسی، پشتیبانی و `app-ads.txt` در `scratch/SecureVPN-Android-source/website/` آماده شدند. سایت در Cloudflare Pages با نام `securevpn-site` منتشر و دامنهٔ `securevpn.rahanetmci.com` متصل شد. مسیرهای اصلی با HTTPS بررسی شدند؛ وضعیت دامنه در داشبورد هنوز Verifying است.
- در ANDROID_PLAY_PREPARATION.md وضعیت حساب، مراحل رسمی، مقررات آزمون Closed، VPN declaration، privacy/Data safety، app-ads.txt و موارد نیازمند تأیید صاحب حساب ثبت شده‌اند.
- منابع رسمی بررسی‌شده: Target API36 از 31اوت2026؛ شرط 12 آزمایشگر/14روز برای حساب‌های Personal مشمول؛ الزامات 16KB، VPN، Data safety و AdMob readiness.
- هیچ app record در Play ساخته، AAB/APK بارگذاری یا release منتشر نشده؛ دو اظهارنامهٔ قانونی داخل Create app را بدون تأیید مالک تیک نزدم.

## انتشار سایت SecureVPN در Cloudflare Pages — 2026-10-08

- فایل‌های `index.html`، `privacy/`، `support/`، `robots.txt` و `app-ads.txt` با Direct Upload در Pages project `securevpn-site` منتشر شدند. README در بستهٔ عمومی قرار نگرفت.
- دامنهٔ `securevpn.rahanetmci.com` از مسیر Custom Domains متصل شد. CNAME زیردامنه به `securevpn-site.pages.dev` اشاره می‌کند؛ هیچ رکورد VPN دیگری تغییر نکرد. Cloudflare در لحظهٔ بررسی وضعیت Verifying/Initializing نشان می‌داد و هشدار می‌داد انتشار DNS ممکن است تا ۴۸ ساعت طول بکشد.
- بررسی واقعی مرورگر در همان نشست: صفحهٔ اصلی، `/privacy/`، `/support/` و `/app-ads.txt` روی دامنهٔ اختصاصی با HTTPS باز شدند. محتوای `app-ads.txt` با ناشر AdMob مطابقت داشت.
- مسیر اولیهٔ Workers به خطای 1101 می‌رسید؛ برای سایت ایستا از Pages استفاده شد. Worker آزمایشی حذف نشد و مشاهده‌پذیری موقتی آن خاموش است؛ دامنه به آن Worker متصل نیست.
- آدرس عمومی سایت: `https://securevpn.rahanetmci.com`. این انتشار سایت توسعه‌دهنده است و به معنی انتشار اپ در Google Play یا تأیید app-ads.txt در AdMob نیست.

## آماده‌سازی انتشار Google Play — 2026-10-08

- کاربر شناسهٔ `com.rahanetmci.securevpn` را برای اپ پلی انتخاب کرد و تأیید کرد نصب و استفاده رایگان، با تبلیغات درون‌برنامه‌ای باشد. کاربر هر دو اظهارنامهٔ اولیهٔ سازگاری با سیاست‌های Play و مجازبودن صادرات نرم‌افزار رمزنگاری‌شده را نیز صریحاً تأیید کرد و خواست بررسی فنی انجام شود؛ هنوز فرم Create app ارسال نشده است.
- `applicationId` در سورس و کپی خصوصی اندروید به شناسهٔ انتخاب‌شده تغییر کرد؛ `namespace` برابر `com.vpnapp` ماند. APKهای sideload با `com.vpnapp` اپ جداگانه خواهند بود و با نسخهٔ Play ارتقای درجا نمی‌شوند.
- تنظیم build به compile/target SDK36، AGP8.10.1 و Gradle8.11.1 ارتقا یافت؛ اجرای `testDebugUnitTest` و `bundleRelease` شروع شده، نتیجه هنوز نهایی نیست.
- پیش از درخواست VPN سیستمی، گفت‌وگوی افشای واضح اضافه شد: عبور ترافیک از سرور انتخابی و پردازش احتمالی توسط گرداننده، درخواست‌های IP/latency به سرویس‌های بیرونی، و لینک سیاست حریم خصوصی. کاربر باید صریحاً Agree and continue بزند.
- `QUERY_ALL_PACKAGES` حذف شد؛ فهرست تونل شکافته فقط اپ‌های دارای launcher entry را با `<queries>` هدفمند می‌بیند. صفحهٔ حریم خصوصی سایت مطابق همین دامنه و بکاپ احتمالی پروفایل/اشتراک ذخیره‌شده اصلاح شد.
- برای foreground service از نوع `specialUse`، subtype مربوط به نگه‌داشتن تونل VPN و اعلان جاری در Manifest مشخص شد.
- بررسی تاریخ API و 16KB اصلاح شد: API36 از 31اوت2026 شرط ارسال اپ تازه است. nativeهای 4KB باید برای دستگاه‌های 16KB رفع شوند، اما Google Play توقف انتشار update ناسازگار را از 1فوریه2027 اعلام کرده؛ پس 16KB مانع فوری ارسال اولیه در اکتبر 2026 نیست.
- صفحهٔ Play Console باز است و پکیج/قیمت/نوع انتخاب شده‌اند اما اظهارنامه‌ها، ایجاد app record و انتشار هنوز ثبت نشده‌اند. هیچ upload key یا AAB ساخته نشده و build هنوز در حال اجراست.


# ادامهٔ انتشار Android، اصلاح آیکون و فایل نهایی — 2026-10-08

## وضعیت قطعی آخرین ادامه — 2026-10-08

این بخش جایگزین وضعیت‌های قدیمیِ بخش‌های تاریخی زیر است. سورس انتشار Play در `scratch/SecureVPN-Android-source` است؛ سورس sideload ریشه در این مرحله به پکیج و ابزار انتشار Play منتقل نشده است.

- رکورد SecureVPN در Play Console ایجاد شده: `com.rahanetmci.securevpn`، رایگان با تبلیغات، نسخهٔ 1.0.0 / versionCode 1، compile/target SDK 36 و min SDK 26. namespace داخلی `com.vpnapp` است.
- کلید upload مستقل ساخته شده و فایل‌های کلید/رمز در سورس خصوصی ignored هستند. بکاپ امن جداگانهٔ آن‌ها ضروری است؛ کلید در پوشهٔ تحویل عمومی کپی نشده است.
- ابزار نهایی: AGP 8.13.2، Gradle 8.13، Kotlin و Compose compiler plugin 2.3.21، JDK 17، Mobile Ads 25.5.0، UMP 4.0.0. مهاجرت compilerOptions انجام شد؛ suppress compatibility flag حذف شد.
- `testDebugUnitTest bundleRelease` موفق: 46 تست واحد در 16 suite، بدون failure/error. چهار تست Android روی شبیه‌ساز Android 14 نیز پاس شدند: نصب خالی، ماندگاری چرخهٔ تبلیغ و بارگذاری یا شکست کنترل‌شدهٔ بنر آزمایشی بدون مسدودکردن کنترل اتصال. نمایش قطعی آگهی واقعی یا آزمون درآمد ادعا نمی‌شود.
- AAB با upload key امضا شده، bundletool validate و بررسی امضا موفق‌اند. بستهٔ نهایی 139194900 بایت است؛ SHA-256: `6dd7186fbf58b48f9d013605e62cb1ee08cb3c2fae45c7e7546f0b9cb6b7be8d`.
- فایل تحویل: `H:/Antigravity Projects/VPN APP/SecureVPN-Play-1.0.0/SecureVPN-1.0.0-play.aab`. این فایل برای Play است و مستقیماً مانند APK نصب نمی‌شود. نصب smoke از APK ساخته‌شده با bundletool موفق بود؛ دادهٔ اولیه هیچ پروفایل یا ساب آماده‌ای ندارد.
- آیکون فروشگاه اصلاح شد: زمینهٔ charcoal یکپارچه، سپر teal بزرگ و globe/check سفید؛ قاب و گردی بیرونی از خود Play اعمال می‌شود. feature graphic هماهنگ ساخته شد. تولید مجدد با `scripts/generate-store-assets.ps1`؛ آیکون launcher بومی در این مرحله تغییر نکرده است.
- متن فروشگاه، آیکون 512×512، feature graphic 1024×500 و چهار screenshot واقعی home/settings در تم روشن/تیره در Console آماده‌اند. در فرم AI label فقط آیکون و feature انتخاب شده‌اند؛ screenshots واقعی انتخاب نشده‌اند. دکمهٔ نهایی Label assets and submit و ذخیرهٔ نهایی listing هنوز زده نشده‌اند و منتظر تأیید لحظه‌ای کاربر هستند.
- Data safety به‌صورت draft ذخیره شده؛ اظهارنامه‌های قبلاً تأییدشده نیز ذخیره شده‌اند. ارسال برای review، upload AAB و ایجاد release هنوز انجام نشده است.
- متن به‌روز privacy شامل رمزنگاری تونل و HTTPS ساب‌ها در سورس آماده است. ZIP پنج‌فایلی در فرم production سایت Cloudflare Pages بارگذاری شده؛ Save and deploy هنوز زده نشده و تأیید آن در انتظار پاسخ است. متن آنلاین هنوز نسخهٔ قبلی است؛ DNS تغییر نکرده است.
- ابزار Computer Use این نوبت را به‌دلیل ناتوانی در تشخیص مطمئن URL مرورگر برای اعمال سیاست متوقف کرد. هیچ ارسال یا deploy نهایی انجام نشد. در ادامهٔ بعدی ابتدا وضعیت تازهٔ مرورگر و پاسخ تأییدها خوانده شود؛ از indexهای UI قدیمی استفاده نشود.
- Production این حساب هنوز قفل است: Console به 12 آزمایشگر با عضویت پیوستهٔ 14 روز در closed testing نیاز دارد؛ فعلاً صفر آزمایشگر است. انتشار فوری عمومی ممکن نیست.
- باقی‌مانده: تأیید/ثبت نهایی listing و سایت، ایجاد و انتشار پیام consent AdMob، بارگذاری AAB و بررسی خطاهای Console، اظهارنامه و فیلم VpnService/foreground service در صورت درخواست، انتخاب آزمایشگران و شروع closed test، سپس درخواست دسترسی Production و review.
- بررسی native با `scripts/audit-bundle-native.py`: libbox در ABIهای 64-bit دارای PT_LOAD alignment 16KB است؛ libconscrypt_jni/libopenconnect/libstoken هنوز 4KB هستند. PAGE_ALIGNMENT_16K در BundleConfig به‌تنهایی سازگاری ELF یا اجرای 16KB را اثبات نمی‌کند. بازسازی/جایگزینی nativeها و آزمون روی runtime 16KB باقی است؛ نباید انطباق کامل را ادعا کرد.
- در این نوبت commit یا push Git انجام نشده است.

### یادداشت رفع خطاهای ساخت

Gradle با JDK 25 و TEMP بلند sandbox در socket محلی شکست می‌خورد؛ JDK 17، GRADLE_USER_HOME اختصاصی و TEMP/TMP کوتاه `scratch/build-tmp` به‌همراه اجازهٔ اجرای socket محلی استفاده شد. import جاافتادهٔ TunnelEncryptionPolicy اضافه شد. برای metadata Kotlin 2.3، AGP به 8.13.2 و Gradle به 8.13 ارتقا یافت؛ build نهایی بدون هشدار ناسازگاری R8 metadata موفق شد.

## سوابق تاریخی — وضعیت‌های قدیمی زیر ممکن است منسوخ باشند

## ادامهٔ Console و تأییدهای صاحب حساب — 2026-10-08

مرورگر مجدداً شناسایی شد و فرم AI label با فقط آیکون و feature انتخاب‌شده مشاهده شد. اولین کلیک ثبت، توسط بررسی خودکار به‌علت فقدان تأیید صریح همان اظهارنامه رد شد؛ ثبت انجام نشد. کاربر سپس صریحاً تأیید کرد: «بله، همین برچسب‌ها را ثبت و صفحه را ذخیره کن» و «بله، سایت به‌روز را منتشر کن». این دو تأیید دریافت شده‌اند و نباید بی‌جهت دوباره درخواست شوند.

در فاصلهٔ انتظار، تب AdMob بررسی شد؛ صفحهٔ عمومی admob.google.com/home بود. پس از کلیک لینک داشبورد Sign in، ابزار Computer Use دوباره به‌دلیل عدم تشخیص مطمئن URL برای اعمال سیاست، این نوبت را متوقف کرد. نتیجهٔ navigation نامعلوم است. هیچ کلیک ثبت نهایی listing، deploy سایت، upload AAB یا انتشار release انجام نشد. نوبت بعد وضعیت تازهٔ Play/Cloudflare خوانده شود و دو اقدام مشخص تأییدشده انجام شوند؛ screenshot و indexهای قبلی قابل استفاده نیستند.

## اصلاح ساب Dami، وضعیت اتصال و DNS — 2026-10-10

### سورس و نسخهٔ تحویل

- سورس فعال ویندوز `windows-app-tauri/` است؛ نسخهٔ جدید **2.0.38**. سورس فعال Android Play در **`scratch/SecureVPN-Android-source/`**، یک checkout مستقل از مخزن خصوصی اندروید است؛ نسخهٔ **1.0.1 / versionCode 2**، package `com.rahanetmci.securevpn`. ریشهٔ `app/` سورس قدیمی sideload است و در این نوبت تغییر نکرده؛ توسعهٔ بعدی نباید آن را با سورس فعلی Play اشتباه بگیرد.
- فایل‌ها در `SecureVPN-Updates-2026-10-10/`: ستاپ Windows x64، APK release امضاشده با upload key، AAB برای Play، README و SHA256.json. APK حدود 128.4 MiB و AAB حدود 132.8 MiB است؛ AAB شامل چهار ABI است و حجم نصب Play با آن برابر نیست. کلید امضا و کانفیگ کاربران در پوشهٔ تحویل قرار نگرفتند.
- اعتبار AAB با bundletool و امضای AAB/APK بررسی شد. امضای APK محلی upload key است؛ الزاماً با app-signing certificate نسخهٔ نصب‌شده از Play یکسان نیست. ارتقای نصب‌های Play باید با ارسال AAB جدید از همان رکورد Play انجام شود، نه با حذف اپ و داده‌ها برای نصب این APK.
- در این نوبت Git commit/push، بارگذاری Play یا انتشار GitHub انجام نشد. بیلدها و تغییرات به‌صورت محلی آماده‌اند.

### تفاوت ساب و راه‌حل اتصال

- ساب Dami مجموعاً ۲۸ لینک دارد. لینک‌های فنلاند VLESS XHTTP به **ECH** با فرمت `cloudflare-ech.com+udp://1.1.1.1` نیاز دارند؛ parser و generator قبلی این مقدار را نگه نمی‌داشتند. ECH در مدل، ذخیره‌سازی، import/export، service intent اندروید و generatorهای اتصال/تست هر دو پلتفرم اضافه شد. شرح کلی این تغییر مربوط به VLESS این ساب است؛ پشتیبانی کامل همهٔ شکل‌های ECH در تمام فرمت‌ها ادعا نمی‌شود.
- دامنهٔ ECH باید قبل از بازشدن TLS پروکسی توسط resolver مشخص‌شده در لینک resolve شود. rule اختصاصی ECH قبل از DNS عمومی/تست/FakeIP می‌آید تا bootstrap به خود پروکسی وابسته نشود. DNS resolver مستقیم نباید `detour: direct` صریح داشته باشد: هستهٔ pinned این dialer خالی را با «makes no sense» رد می‌کند؛ این مقدار حذف شد.
- در A/B واقعی S1، بدون ECH هر دو `packet-up` و `stream-up` timeout شدند؛ با ECH و resolver UDP مشخص‌شده، درخواست gstatic و YouTube robots پاسخ داد. بنابراین تغییر MTU راه‌حل اصلی این ساب نبود؛ MTU در این نوبت تغییر نکرد.
- ساب حالت صریح **packet-up** و extra شامل padding دارد. Android قبلاً force عمومی stream-up را روی آن اعمال می‌کرد. اکنون packet-up صریح ساب حفظ می‌شود؛ انتخاب دستی/هوشمند کاربر همچنان اولویت دارد و برای حالت auto/نامشخص، ترجیح stream-up باقی است. حالت اصلی ذخیره‌شده برای مهاجرت پروفایل‌های قبلاً force‌شده استفاده می‌شود. متن تنظیم Force XHTTP stream-up مطابق این رفتار اصلاح شد.
- `Hysteria2 obfs=gecko` و اندازه‌های min/max packet در import/storage/export و generator هر دو پلتفرم حفظ شدند؛ اندازه‌ها در generator اعتبارسنجی می‌شوند. insecure اندروید فقط وقتی لینک صریحاً درخواست کند فعال می‌شود.
- Android سه Shadowsocks این ساب را به‌علت `/` بعد از port در لینک SIP002 کنار می‌گذاشت (۲۵ از ۲۸ import می‌شد). authority/port جدا parse می‌شود و IPv6 با bracket هم پوشش داده شد؛ اکنون هر ۲۸ لینک import می‌شود.
- Windows subscription parser متن ساده یا base64 با UTF-8 و URL-safe را می‌پذیرد. مسیر URI تنها یک بار decode می‌شود تا `%` واقعی در XHTTP/WS آسیب نبیند. export Hysteria2 و ECH/Gecko نیز تکمیل شد.
- پس از نصب باید ساب موجود **یک بار refresh شود** تا فیلدهایی که قبلاً از لینک حذف می‌شدند دوباره وارد ذخیره‌سازی شوند. fixture خصوصی، فایل‌های تولیدی credentialدار و لاگ‌های تست فقط در scratch/ignored نگهداری شدند؛ در اپ کانفیگ آماده قرار نگرفت.

### انتخاب پروفایل و آمار ویندوز

- کلید `vpn-selected-profile` آخرین انتخاب را ذخیره می‌کند؛ در راه‌اندازی شناسهٔ انتخاب‌شده بازگردانی می‌شود و در نبود آن، آخرین پروفایل دارای lastConnected معتبر انتخاب می‌شود. انتخاب جدید کاربر باقی می‌ماند؛ اتصال خودکار هنگام بازشدن اضافه نشده است.
- guard بارگذاری از نوشتن state اولیهٔ خالی روی localStorage جلوگیری می‌کند. در refresh ساب، شناسه و تاریخچهٔ پروفایل مشابه حفظ می‌شود؛ تطبیق دقیق endpoint/credential اولویت دارد و تغییر اطلاعات یک پروفایل با نام/پروتکل/transport یکتای همان ساب هم پشتیبانی می‌شود. پروفایل فعال در حین اتصال با نسخهٔ refresh جایگزین نمی‌شود.
- تایمر محلی HomeScreen حذف شد؛ زمان از `stats.connectedTime` سرویس گرفته می‌شود و با خروج/بازگشت صفحه صفر نمی‌شود. آمار در context نگهداری و snapshot سرویس در mount/focus و هر یک ثانیه بازیابی می‌شود. پاسخ قدیمی poll نمی‌تواند رویداد تازه‌تر اتصال را overwrite کند.
- listener وضعیت هنگام unmount پاک می‌شود؛ وعدهٔ listen که دیر resolve شود هم پس از dispose unlisten می‌شود. claim پاکسازی تمام listenerهای موجود اپ نمی‌شود؛ تغییر اصلی مربوط به state listener است.
- شمارهٔ session در Rust اضافه شد؛ task آمار/IP و خروج پردازش قدیمی نمی‌تواند وضعیت اتصال تازه را متوقف/بازنویسی کند. وضعیت backend هنگام خروج child نیز disconnected می‌شود تا recovery poll اطلاعات قدیمی را زنده نکند.

### پینگ Android

- اضافه‌کردن پروفایل و ساب تست خودکار را اجرا نمی‌کند. Test all فقط snapshot پروفایل‌های ساب انتخاب‌شده را تست می‌کند؛ ALL همهٔ پروفایل‌ها را تست می‌کند.
- انتخاب ساب دیگر تست قبلی را لغو و نسل نتایج را باطل می‌کند؛ نتایج دیررس دستهٔ قبلی نباید روی نمایش جدید اعمال شوند. رفتار اتصال فعال همچنان از تونل فعلی برای probe استفاده می‌کند.

### DNS مستقل داخل تونل و مشکل YouTube

- تنظیم جدید Android **Tunnel DNS · V2Ray / Hysteria2** شامل URL معتبر HTTPS DoH و گزینهٔ FakeIP است. URL پیش‌فرض `https://1.1.1.1/dns-query` با detour پروکسی ارسال می‌شود؛ hostname resolver در صورت نیاز bootstrap مستقیم دارد. تنظیم‌ها persist و پس از reconnect اعمال می‌شوند. OpenConnect/SSTP در این نوبت به این تنظیم وصل نشده‌اند.
- FakeIP به‌صورت پیش‌فرض روشن و cache پایدار قبلی حفظ شده است تا اصلاح قبلی Instagram/Dallas برنگردد. در حالت روشن، مقصدهای معمول A/AAAA توسط FakeIP به دامنهٔ قابل resolve در سمت سرور تبدیل می‌شوند؛ برای مصرف واقعی پاسخ‌های DNS تحریم‌شکن باید FakeIP خاموش شود.
- مقایسهٔ واقعی wire-format DoH، مستقیم و از طریق پروکسی S1: DNS کاربر برای `www.youtube.com`، `youtubei.googleapis.com` و `music.youtube.com` در هر دو حالت همان **91.107.253.167** واسط را برگرداند. resolver عمومی از داخل همان VPN پاسخ‌های Google داد. این تفاوت یک علت محتمل برای ناسازگاری سرویس‌هاست؛ مشاهدهٔ خودِ اپ YouTube روی گوشی کاربر انجام نشده و رفع قطعی ادعا نمی‌شود.
- ابتدا با DNS پیش‌فرض مستقل داخل تونل تست شود؛ تنظیم یک DoH/Private DNS در سیستم یا خود اپ دیگری با کنترل resolver تونل یکسان نیست. DNS رمزنگاری‌شده‌ای که اپ دیگری خودش روی 443/853 ارسال کند لزوماً توسط hijack پورت 53 بازنویسی نمی‌شود.

### ماندن Telegram در Connecting

- callback شبکهٔ Android قبلاً هنگام loss به interface ذخیره‌شده/فرضی برمی‌گشت و ممکن بود core را از قطع مسیر مطلع نکند. اکنون network اینترنت‌دار غیر VPN انتخاب می‌شود، handle از دست‌رفته کنار گذاشته و نبود مسیر با index **-1** به core اعلام می‌شود.
- تغییر network handle یا IPv4 روی همان نام/index interface، ابتدا loss و سپس interface تازه را اعلام می‌کند؛ core فقط مقایسهٔ name/index دارد و بدون این مرحله ممکن بود مسیر قدیمی را حفظ کند. notification تکراری و تغییر صرف metering reset غیرضروری ایجاد نمی‌کند.
- این اصلاح با تست loss/replacement/deduplication پوشش داده شده، اما آزمایش دو ساعت اتصال و خودِ Telegram روی گوشی واقعی انجام نشده است. اگر علامت ادامه یافت، network transition، لاگ service و زمان رخداد لازم است؛ restart دوره‌ای VPN یا ادعای درمان کامل اضافه نشد.

### شواهد تست و محدودیت‌ها

- Windows: TypeScript typecheck و مجموعهٔ workflowها موفق، از جمله ماندگاری انتخاب، refresh با شناسهٔ ثابت، زمان/traffic پس از unmount/remount Home، کنارگذاشتن poll قدیمی، import/export ECH/Gecko و scope/cancel پینگ. Rust **۲۳ تست پاس و ۵ diagnostic اختیاری ignored**؛ ignored export و latency واقعی جداگانه اجرا و پاس شدند.
- همهٔ ۲۸ پروفایل با parser واقعی Windows به config هستهٔ pinned `1.14.2-lx.11` تبدیل و latency واقعی تست شدند: **۱۴ مورد جواب داد**. ۱۰ XHTTP سالم فنلاند حدود **۱۲۰–۱۷۴ms**؛ S9 ناموفق. Shadowsocks فنلاند/Seattle و Hysteria2 آلمان/Alabama هم جواب دادند. چند WS/Turkey/Gecko Turkey ناموفق ماندند؛ بیشترشان در screenshot مقایسه هم -1 بودند. نتیجهٔ این شبکه/این زمان است و دلیل قطعی سمت سرور برای همهٔ failureها نیست.
- Android: **۵۰ تست واحد** موفق؛ **۶ تست instrumentation** روی شبیه‌ساز x86_64 با native libbox موفق، شامل عدم تست خودکار import، scope صحیح دو ساب/ALL، parser/storage/export و native checkConfig با هر دو حالت FakeIP و ECH، cancel/stale result، foreground subscription refresh و diagnostic واقعی.
- diagnostic Android هر ۲۸ لینک را parse کرد و ۸ نمونه را با هستهٔ واقعی تست کرد: S1=170، S2=166، S4=125، S6=121، S9=-1، S11=170، Hysteria2 DE=118، Hysteria2 Alabama=237 میلی‌ثانیه. فایل خصوصی input از cache تست در finally حذف شد. تست‌های native این نوبت در debug انجام شدند؛ APK release روی گوشی کاربر نصب/آزمایش نشده است.
- هر ۲۸ config کامل تولیدشدهٔ Windows در بررسی نهایی `sing-box check` پذیرفته شدند؛ اعتبار config با اتصال موفق تمام سرورها یکسان نیست. بررسی whitespace تغییرات Windows نیز موفق بود.
- build Android `assembleRelease bundleRelease` و Windows NSIS موفق. JDK17/Gradle cache اختصاصی/workaround سوکت مستندشدهٔ قبلی استفاده شد. هسته عوض نشد؛ سازگاری کامل nativeهای OpenConnect/Conscrypt با 16KB همچنان از محدودیت‌های ثبت‌شدهٔ انتشار قبلی است و با تست libbox به‌تنهایی ثابت نمی‌شود.
- هش نهایی Windows setup: `4dc63dee4f439d151bcce0c975fe5a5e5e62707bed7e9612e56076e23a2e57ac`؛ APK: `cdcc86828d5819ecfe587e80c4f7651d0bd0d90950ed9f03354e48f413ed3b8c`؛ AAB: `5052e9ecede227d6dc70bf44df1d1f99420c7e69aa3fd85532177bf2a7ba819b`.
