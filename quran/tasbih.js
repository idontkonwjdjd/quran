class TasbihCounter {
    constructor() {
        this.count = 0;
        this.currentDhikr = 'سبحان الله';
        this.setupElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.loadState();
    }

    setupElements() {
        this.counterElement = document.querySelector('.counter');
        this.countBtn = document.querySelector('.count-btn');
        this.resetBtn = document.querySelector('.reset-btn');
        this.dhikrBtn = document.querySelector('.dhikr-btn');
        this.dhikrList = document.querySelector('.dhikr-list');
        this.currentDhikrElement = document.querySelector('.current-dhikr');
        this.dhikrItems = document.querySelectorAll('.dhikr-item');
    }

    setupEventListeners() {
        // زر العد
        this.countBtn.addEventListener('click', () => {
            this.increment();
            this.playClickEffect();
        });
        
        // زر إعادة التعيين
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // زر قائمة الأذكار
        this.dhikrBtn.addEventListener('click', () => this.toggleDhikrList());
        
        // أزرار الأذكار
        this.dhikrItems.forEach(item => {
            item.addEventListener('click', () => this.changeDhikr(item));
        });

        // إضافة دعم لوحة المفاتيح
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.increment();
                this.playClickEffect();
            }
        });

        // حفظ البيانات عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => this.saveState());
    }

    increment() {
        this.count++;
        this.updateDisplay();
        // اهتزاز خفيف عند كل عدة
        if (window.navigator.vibrate) {
            window.navigator.vibrate(30);
        }
    }

    reset() {
        this.count = 0;
        this.updateDisplay();
        // اهتزاز أطول عند إعادة التعيين
        if (window.navigator.vibrate) {
            window.navigator.vibrate([50, 50, 50]);
        }
    }

    toggleDhikrList() {
        this.dhikrList.classList.toggle('active');
    }

    changeDhikr(item) {
        this.dhikrItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentDhikr = item.textContent;
        this.currentDhikrElement.textContent = this.currentDhikr;
        this.reset();
        this.dhikrList.classList.remove('active');
    }

    updateDisplay() {
        this.counterElement.textContent = this.count;
    }

    playClickEffect() {
        // تأثير النقر
        this.countBtn.classList.add('clicked');
        setTimeout(() => {
            this.countBtn.classList.remove('clicked');
        }, 150);
    }

    saveState() {
        const state = {
            count: this.count,
            currentDhikr: this.currentDhikr
        };
        localStorage.setItem('tasbihState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('tasbihState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.count = state.count;
            this.currentDhikr = state.currentDhikr;
            
            // تحديث الواجهة
            this.currentDhikrElement.textContent = this.currentDhikr;
            this.dhikrItems.forEach(item => {
                if (item.textContent === this.currentDhikr) {
                    item.classList.add('active');
                }
            });
            this.updateDisplay();
        }
    }
}

// تهيئة المسبحة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const tasbih = new TasbihCounter();
});