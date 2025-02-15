// عنصر حديث اليوم في الصفحة
const hadithElement = document.getElementById('daily-hadith');

// دالة لجلب حديث عشوائي من API
async function fetchDailyHadith() {
    try {
        // إظهار رسالة التحميل
        hadithElement.innerHTML = 'جاري تحميل الحديث...';
        
        const response = await fetch('https://api.hadith.gading.dev/books/muslim?range=1-300');
        const data = await response.json();
        
        if (data.data && data.data.hadiths) {
            // اختيار حديث عشوائي من النتائج
            const randomIndex = Math.floor(Math.random() * data.data.hadiths.length);
            const hadith = data.data.hadiths[randomIndex];
            
            // تنسيق عرض الحديث
            hadithElement.innerHTML = `
                <div class="hadith-text">${hadith.arab}</div>
                <div class="hadith-number">رقم الحديث: ${hadith.number}</div>
            `;
        } else {
            throw new Error('لم يتم العثور على أحاديث');
        }
    } catch (error) {
        console.error('خطأ في جلب الحديث:', error);
        hadithElement.innerHTML = 'عذراً، حدث خطأ في تحميل الحديث. يرجى المحاولة مرة أخرى لاحقاً.';
    }
}

// تحميل حديث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    fetchDailyHadith();
});