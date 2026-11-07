# نشر الموقع والأدمن على Render

## ما الذي سيعمل وأين؟

- **Render Static Site:** الموقع، الفيديو والصور، `/start`، دراسات المشاريع، `/admin` ومعاينة المسودات.
- **Supabase الحالي:** حساب الأدمن، المحتوى، الصور المرفوعة من الأدمن، الرسائل، الحجوزات وEdge Function.
- لا تحتاج إنشاء PostgreSQL أو تشغيل API Server منفصل على Render. لا تعِد تشغيل سكربت نقل البيانات أو إنشاء الجداول.

## 1. رفع المستودع وإنشاء الخدمة

ارفع **المستودع بالكامل من الجذر** إلى GitHub/GitLab/Bitbucket، وليس مجلد `artifacts/portfolio` وحده؛ ملفات pnpm workspace والـlockfile مطلوبة.

في Render اختر **New → Blueprint** واربط المستودع. الملف `render.yaml` يحدد الإعدادات تلقائيًا، بما فيها بيانات Supabase **العامة فقط**.
اسم الخدمة في الملف مجرد اسم مقترح، وليس رابط نشر تم إنشاؤه أو حجزه.

لو ستنشئ الخدمة يدويًا، اختر **Static Site**:

| الإعداد | القيمة |
|---|---|
| Root Directory | اتركه فارغًا، أي جذر المستودع |
| Build Command | `bash scripts/render-build.sh` |
| Publish Directory | `artifacts/portfolio/dist/public` |
| Node | `24.22.1`، محددة في `.node-version` |
| Start Command | لا يوجد، لأنها Static Site |

انسخ المتغيرين العامين `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` من `render.yaml` إلى إعدادات Environment في الخدمة اليدوية.
لا تستخدم `npm install` ولا تجعل مجلد المشروع الفرعي Root Directory.
أضف Rewrite: المصدر `/*`، الوجهة `/index.html`، النوع **Rewrite**؛ هذا يحمي فتح `/admin` و`/start` مباشرة وإعادة تحميلهما من خطأ 404.

## 2. تفعيل رابط Render الفعلي على Supabase

بعد أول نشر، انسخ رابط الخدمة الحقيقي من Render. لا تستخدم اسمًا افتراضيًا أو نطاقًا عامًا مثل `*.onrender.com`.
من Replit، حيث `SUPABASE_ACCESS_TOKEN` محفوظ في Secrets، شغّل:

```bash
SUPABASE_TARGET_REF=ifljomfujnlamnduldaz \
node artifacts/portfolio/scripts/configure-production-origin.mjs \
  --origin=https://YOUR-ACTUAL-SERVICE.onrender.com
```

هذا فحص مبدئي بلا تغييرات. بعد التأكد من الرابط، أضف `--apply`:

```bash
SUPABASE_TARGET_REF=ifljomfujnlamnduldaz \
node artifacts/portfolio/scripts/configure-production-origin.mjs \
  --origin=https://YOUR-ACTUAL-SERVICE.onrender.com --apply
```

يمكن تمرير `--origin=` ثانية للدومين الخاص. الرابط الأول يصبح Site URL الأساسي.
السكربت يحتفظ بروابط تسجيل الدخول الموجودة، ويضيف `/admin` و`/admin?setup=1` لكل رابط، ويضبط CORS للإرسال ثم يتحقق من الإعدادات وطلب OPTIONS الحقيقي.
قائمة CORS تشمل النطاقات الدقيقة الموجودة في إعدادات Auth والنطاقات الممرّرة؛ لو عندك نطاق إرسال إضافي غير مسجّل في Auth، مرّره أيضًا.
لا يغيّر الحسابات أو كلمات السر أو الحجوزات ولا يرسل إيميلات.

البديل اليدوي:

1. Supabase → Authentication → URL Configuration: ضع رابط الإنتاج في **Site URL**.
2. أضف رابط الإنتاج مع `/admin` و`/admin?setup=1` إلى Redirect URLs.
3. في Edge Functions Secrets اضبط `ALLOWED_ORIGINS` على روابط الأصول الكاملة مفصولة بفواصل، مع الاحتفاظ بأصل معاينة Replit إن أردت استمرارها.

بدون هذه الخطوة قد يظهر الموقع، لكن إرسال الطلبات وروابط تعيين/استعادة كلمة سر الأدمن لن تكون مضبوطة للنطاق الجديد.
روابط البريد التي أُرسلت قبل النقل قد ترجع إلى نطاق المعاينة؛ اطلب رابطًا جديدًا من شاشة Forgot password بعد تفعيل نطاق الإنتاج.

## 3. مراجعة ما بعد النشر

- افتح الصفحة الرئيسية ومشروعًا وصوره والفيديو.
- افتح `/admin` و`/start` مباشرة، ثم أعد تحميلهما.
- سجّل دخول الأدمن بنفس الحساب الحالي؛ إدارة المشاريع والمحتوى والرسائل والحجوزات تستخدم نفس Supabase.
- احفظ تعديلًا بسيطًا كمسودة وتأكد من معاينته، ولا تنشر تعديل اختبار على المحتوى الحقيقي دون مراجعته.
- تأكد من تحميل المواعيد وإرسال طلب تجريبي واحد، ثم حرر موعده ونظّف بياناته.

## أمان مهم

لا تضع `SUPABASE_SECRET_KEY` أو service-role key أو `SUPABASE_ACCESS_TOKEN` في Render Static Site أو أي متغير يبدأ بـ`VITE_`.
سكربت البناء يرفض الأنواع الخاصة المعروفة. المفتاح العام المصمم للمتصفح ظاهر للمستخدمين بطبيعته؛ الحماية تتم بصلاحيات Supabase.
المفتاح السري الذي انكشف سابقًا يجب إلغاؤه من Supabase قبل استقبال بيانات عملاء حقيقية؛ تهيئة Render لا تلغيه تلقائيًا.

## فحص محلي لنفس بناء Render

```bash
bash scripts/render-build.sh --skip-install
node --test artifacts/portfolio/tests/render-deployment.test.mjs
```

خيار `--skip-install` للاختبار داخل مساحة العمل التي تحتوي بالفعل على الحزم؛ Render يستخدم الأمر العادي ويثبت من الـlockfile.
بيانات Supabase العامة مطلوبة وقت البناء، وأي تغيير لها في Render يحتاج إعادة نشر.
