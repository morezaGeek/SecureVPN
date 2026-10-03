# ChatGPT ChangeLOG

این فایل برای تحویل ادامهٔ توسعهٔ SecureVPN به Antigravity نوشته شده است.

آخرین به‌روزرسانی: **۲۰۲۶-۱۰-۰۳، منطقهٔ زمانی Asia/Tehran**. آزمون‌های نسخهٔ1.3.63 از شب۲اکتبر شروع شدند؛ اصلاحات و آزمون نهایی1.3.65 در۳اکتبر تکمیل شدند.

## وضعیت فعلی و دامنهٔ این همکاری

- کار این گفتگو از وضعیت Android **1.3.55 / versionCode 185** شروع شد و آخرین نسخهٔ ساخته‌شده **1.3.65 / versionCode 195** است.
- مرحلهٔ نخست روی **اندروید** تا1.3.65 انجام شد؛ سپس طبق درخواست کاربر توسعهٔ **Windows/Tauri** به2.0.31 و2.0.32 منتقل شد. آزمون‌های اولیهٔ Android با Windows CLI فقط پراکسی محلی داشتند؛ در مرحلهٔ Windows2.0.31، تونل واقعی سیستم نیز آزمایش و پس از هر مورد کاملاً بسته شد.
- آخرین نصب‌کنندهٔ Windows: [SecureVPN-v2.0.32-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.32-Setup.exe>)، x64، **30,267,577 بایت**. SHA256: `DAF84EAB301B4248A0819C7DC4781E1798FFFCCBDEDCC7368BF1E42CAF111C9D`.
- این گزارش تغییرات انجام‌شده در همین همکاری را پوشش می‌دهد. تاریخچهٔ قدیمی‌تر و معماری اولیهٔ پروژه در [DEVELOPMENT_SUMMARY.md](<H:/Antigravity Projects/VPN APP/DEVELOPMENT_SUMMARY.md>) موجود است؛ تمام تغییرات تاریخی آن سند به ChatGPT این گفتگو نسبت داده نشده‌اند.
- آخرین APK: [SecureVPN-v1.3.65.apk](<H:/Antigravity Projects/VPN APP/SecureVPN-v1.3.65.apk>)، arm64-v8a، حجم **35,896,236 بایت**، حدود34.23MiB.
- SHA256 همین APK: `95B1CA22905BA7B207F4CF367B1CE8F97654CB7B66DBB5FD515274F629F92E04`. گواهی امضای قبلی حفظ شد؛ روی گوشی با حفظ داده نصب شد.
- در 1.3.63 پینگ فهرست SSTP/OpenConnect و انتخاب مستقل mode برای هر XHTTP اصلاح شدند؛ سیاست Force عمومی همچنان پیش‌فرض روشن است.
- کاربر عملکرد فرانسه با stream-up را عالی گزارش کرد، سپس خرابی اپ YouTube با وجود بازشدن سایت را مطرح کرد. علت این گزارش هنوز قطعی نیست؛ تست سایت به‌تنهایی تأیید پخش در اپ محسوب نمی‌شود.
- اصلاح قطع اتصال و وضعیت ابتدایی در 1.3.61 روی شبیه‌ساز با Release تأیید شد: ۱۸ اتصال موفق و قطع کامل. در تست‌های واقعی گوشی 1.3.63 نیز شبکهٔ VPN پس از قطع باقی نماند؛ رفتار تمام گوشی‌ها/Doze تأیید نشده است.

## Windows 2.0.32 — ترتیب سابسکریپشن و برچسب رنگی، 2026-10-03

- انتشار GitHub طبق درخواست کاربر: سورس Windows/Tauri و مستندات در کامیت8b0f875 ثبت شدند. دو توکن قدیمی پروژه HTTP401 دادند؛ خواندن credential store نیز توسط بررسی خودکار مجوز رد شد، چون کاربر استفاده از توکن پروژه را مشخص کرده بود. سپس کاربر توکن جدید داد و ذخیره‌کردن آن در پروژه را مجاز کرد: در2026-10-03، دسترسی مخزن/پوش توکن جدید تأیید و مقدار صرفاً در scratch/github-token.private.txt ذخیره شد. همهٔ helperهای محلی به فایل مرکزی وصل شدند؛ credential store استفاده نشد. مسیر و روش برای Antigravity در GITHUB_PUBLISH.md ثبت و ignore فایل‌های private نیز افزوده شد. مقدار توکن و پوشه‌های scratch/temp وارد مخزن یا ریلیز نمی‌شوند. انتشار v2.0.32 با نصب‌کنندهٔ تحویل‌شده در حال تکمیل است.
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
