# GitHub publication handoff — 2026-10-06

مخزن: `morezaGeek/SecureVPN`، شاخهٔ `main`.

## آخرین انتشار Windows2.0.36، 2026-10-06

[SecureVPN-v2.0.36-Setup.exe](<H:/Antigravity Projects/VPN APP/SecureVPN-v2.0.36-Setup.exe>)، x64، **36,785,885 بایت**، حدود35.08MiB. SHA256: `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`.
helper محلی `scratch/windows-diagnostics/publish-2.0.36.cjs`؛ سورس `057dd859b4158c8e1e160ceaf4e335be0b9d598b` ابتدا push، فایل در draft آپلود/download/hash و سپس عمومی و digest/tag تأیید شدند. نسخهٔ نصب‌شده35 باقی می‌ماند تا نشان Update بعد از انتشار36 بررسی شود؛ نصب دستی36 انجام نشده است.

- انتشار36 تکمیل شد: سورس `057dd859b4158c8e1e160ceaf4e335be0b9d598b` روی main پوش و tag v2.0.36 روی همان commit تأیید شد. [ریلیز عمومی36](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.36) و [installer](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.36/SecureVPN-v2.0.36-Setup.exe)، 36,785,885بایت، SHA256 `D5F74AC646B1C19644FDA4CD445A1402D3F0E8CF3D354A9A857C78EC879BDBA8`. فایل draft قبل از عمومی‌شدن دانلود مجدد و hash، سپس digest/اندازه/tag عمومی تأیید شدند.
- بررسی UI بعد از انتشار: نسخهٔ نصب‌شده35 در Profiles/Sale باز است و هنوز Releases نشان می‌دهد؛ اجرای Administrator طبق پیام ابزار higher Windows integrity دسترسی به دکمه‌ها را محدود کرده است. از کاربر خواسته شد در35 Check for Updates را بزند. این آزمون تا دریافت پاسخ کاربر تأییدشده نیست؛36 دستی نصب نشده است.

کاربر دانلود/نصب35 را در۶اکتبر تأیید کرد؛ تصویر UI نسخه35 را نشان می‌دهد. نتیجهٔ آزمون35 تکمیل‌شده است؛ این به‌تنهایی آزمون ارتقای35به36 نیست.

## انتشار قبلی Windows2.0.35 — 2026-10-06

[ریلیز35](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.35)، commit/tag `b1fc54c49d0781f3c299379c5c0639056770cd93`. [فایل نصب](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.35/SecureVPN-v2.0.35-Setup.exe)،36,827,328بایت؛ SHA256 `EF38A372368614DF7530CFD19E91CC83AB46F07A2C46F29FF64725889757D25D`. سورس اول push شد؛ فایل draft دانلود مجدد/hash و سپس انتشار عمومی/digest/tag تأیید شدند.

helper محلی `scratch/windows-diagnostics/publish-2.0.35.cjs` و گزارش `published-2.0.35.json`؛ فقط توکن مرکزی پروژه را می‌خواند. نسخه/hash helperهای قبلی برای انتشار جدید مناسب نیستند.

نصب دستی35 قبل از آزمون نشان انجام نشد. نسخهٔ نصب‌شده34 با Administrator اجرا شده و ابزار UI نمی‌تواند کلیک کند؛ از کاربر خواسته شد Settings/About/Check for Updates و نصب از نشان را امتحان کند. نتیجهٔ واقعی این آزمون جدا در ChatGPT ChangeLOG.md ثبت می‌شود؛ انتشار/تست downloader، جای آزمون UI را نمی‌گیرد.

توکن پروژه در **2026-10-03** به‌روز و دسترسی خواندن مخزن/پوش با GitHub API تأیید شد. مقدار توکن تنها در فایل محلی `scratch/github-token.private.txt` نگهداری می‌شود. این فایل و تمام پوشهٔ scratch توسط Git نادیده گرفته می‌شوند؛ مقدار توکن در مستندات، کامیت، URL ریموت یا asset ریلیز قرار نگیرد.

برای Antigravity در همین workspace: توکن را از این فایل بخوان؛ از مقادیر قدیمی داخل اسکریپت‌ها یا اطلاعات ورود ذخیره‌شدهٔ Git استفاده نکن. چهار helper قدیمی در scratch اکنون از فایل مرکزی می‌خوانند. این helperها نسخه‌های قدیمی را هدف گرفته‌اند و برای انتشار تازه اجرا نشوند.

اسکریپت محلی انتشار Windows2.0.32: `scratch/windows-diagnostics/publish-2.0.32.cjs`. عملیات `inspect`، `push`، `release` و `verify` دارد؛ release پس از پوش سورس، نصب‌کننده را در draft آپلود می‌کند، فایل آپلودشده را دانلود و SHA256 را بررسی می‌کند، سپس ریلیز را عمومی می‌کند و تطبیق tag با کامیت را تأیید می‌کند. verify وضعیت عمومی و لینک نهایی را بررسی می‌کند. اسکریپت صرفاً از توکن پروژه استفاده می‌کند و از credential store چیزی نمی‌خواند.

توکن خصوصی روی GitHub منتشر نمی‌شود؛ clone تازه آن را ندارد و باید توکن اختصاصی محیطش را فراهم کند.

فایل انتشار: `SecureVPN-v2.0.32-Setup.exe`، **30,267,577 بایت**.

SHA256: `DAF84EAB301B4248A0819C7DC4781E1798FFFCCBDEDCC7368BF1E42CAF111C9D`.

انتشار در2026-10-03 تکمیل شد: [Windows v2.0.32](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.32)، tag روی کامیت `8f59c382e41ea570c4fd7d6e3f7a7efaad685f18`. سورس روی main پوش و ریلیز عمومی شد؛ فایل آپلودشده با دانلود مجدد و SHA256 بررسی شد.

[دانلود نصب‌کننده](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.32/SecureVPN-v2.0.32-Setup.exe).

## قرارداد آپدیت داخل اپ، از Windows2.0.34

### ترتیب الزامی نسخهٔ بعد — درخواست کاربر، 2026-10-04

نسخهٔ بعد ابتدا باید با سورس و نصب‌کنندهٔ معتبر روی GitHub منتشر شود؛ سپس نشان Update از داخل نسخهٔ قبلی آزمایش شود. پیش از این آزمون، نصب‌کنندهٔ نسخهٔ جدید را دستی روی نسخهٔ قبلی نصب نکن، چون امکان بررسی تشخیص آپدیت از بین می‌رود.

1. برای شروع آزمون، نسخهٔ2.0.34 باید نصب باشد؛ نسخه‌های قدیمی‌تر این قابلیت را ندارند. نسخهٔ آزمایش‌شونده باید بزرگ‌تر از2.0.34 باشد.
2. سورس را push و ریلیز stable با asset دقیق و digest معتبر منتشر کن؛ دانلود عمومی و SHA256 را تأیید کن.
3. در نسخهٔ2.0.34 از Settings/About بررسی دستی را اجرا کن؛ نمایش نشان Update پایین sidebar و نسخهٔ پیشنهادی را بررسی کن.
4. با همان نشان، دانلود/درصد/اجرای نصب‌کننده و حفظ تنظیمات پیش‌فرض را بررسی کن؛ بعد از نصب، نسخهٔ جدید و ناپدیدشدن نشانِ آپدیت نسخهٔ برابر را تأیید کن.
5. نتیجهٔ واقعی و هر محدودیت آزمون را در ChatGPT ChangeLOG.md ثبت کن. انتشار موفق به‌تنهایی اثبات کارکرد نشان و مسیر نصب نیست.

اپ فقط ریلیزهای عمومی stable همین مخزن با tag `v<semver>` و asset دقیق `SecureVPN-v<semver>-Setup.exe` را برای ارتقا می‌پذیرد. فایل باید به‌عنوان GitHub release asset آپلود شود تا metadata آن `digest` معتبر SHA256 داشته باشد. draft/prerelease، فایل Android، نسخهٔ برابر/قدیمی و URL خارجی نادیده گرفته می‌شوند. هیچ PAT در کلاینت آپدیت وجود ندارد.

آخرین نسخهٔ منتشرشده در۴اکتبر۲۰۲۶: [Windows2.0.34](https://github.com/morezaGeek/SecureVPN/releases/tag/v2.0.34)، tag روی کامیت `bbd3de728ae069c1dbd0a8a381640aa740f51024`. سورس روی main پوش و فایل آپلودشده با دانلود مجدد/SHA256 تأیید شد. [دانلود نصب‌کننده34](https://github.com/morezaGeek/SecureVPN/releases/download/v2.0.34/SecureVPN-v2.0.34-Setup.exe).

helper این انتشار `scratch/windows-diagnostics/publish-2.0.34.cjs` است؛ عملیات inspect/push/release/verify با توکن خصوصی مرکزی انجام می‌شود و helper Git از credential store استفاده نمی‌کند. گزارش دقیق انتشار در `scratch/windows-diagnostics/published-2.0.34.json` است. برای نسخهٔ بعدی، helper34 یا32 را بدون تطبیق نسخه/نام/hash اجرا نکن. SHA256 فایل34: `BC4B501E084CFF4DE8DC2C86F2273709FB46256E2D0425BA94563BF00AB1B326`، حجم30,339,736بایت؛ metadata عمومی digest معتبر دارد. قرارداد و آزمون‌ها در `windows-app-tauri/src-tauri/installer/README.md` ثبت شده‌اند. توکن وارد asset یا سورس نشده است.
