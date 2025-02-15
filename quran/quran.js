class QuranPlayer {
    constructor() {
        this.setupElements();
        this.initializeData();
        this.setupEventListeners();
        this.isPlaying = false;
        this.reciters = [];
    }

    setupElements() {
        this.reciterSearchInput = document.getElementById('reciter-search');
        this.searchResults = document.querySelector('.search-results');
        this.rewayaSelect = document.getElementById('rewaya-select');
        this.surahsSelect = document.getElementById('surahs-select');
        this.audioPlayer = document.getElementById('quran-audio');
        this.currentSurahEl = document.getElementById('current-surah');
        this.currentReciterEl = document.getElementById('current-reciter');
        this.currentRewayaEl = document.getElementById('current-rewaya');
        this.playPauseBtn = document.getElementById('play-pause');
        this.stopBtn = document.getElementById('stop');
        this.volumeSlider = document.getElementById('volume');
        this.progressBar = document.querySelector('.progress');
        this.progressContainer = document.querySelector('.progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.forwardBtn = document.getElementById('forward');
        this.backwardBtn = document.getElementById('backward');
    }

    async initializeData() {
        try {
            await this.loadReciters();
            await this.loadSurahs();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showError('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
        }
    }

    setupEventListeners() {
        // أحداث البحث
        this.reciterSearchInput.addEventListener('input', () => this.handleSearch());
        this.reciterSearchInput.addEventListener('focus', () => this.handleSearch());
        
        // إخفاء نتائج البحث عند النقر خارج حقل البحث
        document.addEventListener('click', (e) => {
            if (!this.reciterSearchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.searchResults.style.display = 'none';
            }
        });

        // باقي الأحداث
        this.rewayaSelect.addEventListener('change', () => this.onRewayaChange());
        this.surahsSelect.addEventListener('change', () => this.onSurahChange());
        
        // أحداث مشغل الصوت
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.stopBtn.addEventListener('click', () => this.stopAudio());
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.progressContainer.addEventListener('click', (e) => this.seek(e));
        
        // أزرار التقديم والتأخير
        this.forwardBtn.addEventListener('click', () => this.forward10Seconds());
        this.backwardBtn.addEventListener('click', () => this.backward10Seconds());
        
        // تحديث أيقونة الصوت
        this.audioPlayer.addEventListener('play', () => this.updatePlayPauseIcon(true));
        this.audioPlayer.addEventListener('pause', () => this.updatePlayPauseIcon(false));
        this.audioPlayer.addEventListener('ended', () => {
            this.updatePlayPauseIcon(false);
            this.progressBar.style.width = '0%';
        });
    }

    async loadReciters() {
        try {
            this.searchResults.innerHTML = '<div class="search-result-item">جاري تحميل القراء...</div>';
            this.searchResults.style.display = 'block';
            
            const response = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
            const data = await response.json();
            
            if (!data.reciters) throw new Error('لم يتم العثور على قراء');
            
            this.reciters = data.reciters;
            if (this.reciterSearchInput.value) {
                this.handleSearch();
            } else {
                this.searchResults.style.display = 'none';
            }
        } catch (error) {
            console.error('خطأ في تحميل القراء:', error);
            this.searchResults.innerHTML = '<div class="search-result-item error">حدث خطأ في تحميل القراء</div>';
        }
    }

    async loadReciterRewayat(reciterId) {
        try {
            const response = await fetch(`https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=${reciterId}`);
            const data = await response.json();
            
            if (!data.reciters || !data.reciters[0]) {
                throw new Error('لم يتم العثور على القارئ');
            }

            const reciter = data.reciters[0];
            if (!reciter.moshaf || !reciter.moshaf.length) {
                throw new Error('لم يتم العثور على روايات للقارئ');
            }

            // تحديث قائمة الروايات
            const rewayatOptions = reciter.moshaf
                .map(moshaf => `
                    <option value="${moshaf.id}" 
                            data-server="${moshaf.server}"
                            data-surah-list="${moshaf.surah_list}">
                        ${moshaf.name}
                    </option>`)
                .join('');
            
            this.rewayaSelect.innerHTML = '<option value="">اختر الرواية...</option>' + rewayatOptions;
            this.rewayaSelect.disabled = false;
            this.surahsSelect.disabled = true;

            // حفظ معلومات القارئ الحالي
            this.currentReciter = reciter;
        } catch (error) {
            console.error('خطأ في تحميل الروايات:', error);
            // this.showError('لم نتمكن من تحميل روايات القارئ');
        }
    }

    async loadSurahs() {
        try {
            const response = await fetch('https://mp3quran.net/api/v3/suwar?language=ar');
            const data = await response.json();
            
            if (!data.suwar) throw new Error('لم يتم العثور على سور');
            
            const surahsOptions = data.suwar
                .map(surah => `<option value="${surah.id}">${surah.name}</option>`)
                .join('');
            
            this.surahsSelect.innerHTML = '<option value="">اختر السورة...</option>' + surahsOptions;
        } catch (error) {
            console.error('خطأ في تحميل السور:', error);
            // this.showError('لم نتمكن من تحميل قائمة السور');
        }
    }

    async onReciterChange() {
        const selectedReciterId = this.recitersSelect.value;
        if (selectedReciterId) {
            const reciterName = this.recitersSelect.options[this.recitersSelect.selectedIndex].text;
            this.currentReciterEl.textContent = reciterName;
            
            // إعادة تعيين حالة مشغل الصوت
            this.audioPlayer.src = '';
            this.currentSurahEl.textContent = 'لم يتم اختيار سورة';
            this.currentRewayaEl.textContent = '';
            
            await this.loadReciterRewayat(selectedReciterId);
        } else {
            this.rewayaSelect.disabled = true;
            this.surahsSelect.disabled = true;
            this.currentReciterEl.textContent = '';
            this.currentRewayaEl.textContent = '';
        }
    }

    onRewayaChange() {
        const selectedRewaya = this.rewayaSelect.value;
        if (selectedRewaya) {
            this.surahsSelect.disabled = false;
            const rewayaName = this.rewayaSelect.options[this.rewayaSelect.selectedIndex].text;
            this.currentRewayaEl.textContent = ` - ${rewayaName}`;

            // إعادة تعيين مشغل الصوت عند تغيير الرواية
            this.audioPlayer.src = '';
            this.currentSurahEl.textContent = 'لم يتم اختيار سورة';

            // إعادة تعيين قائمة السور
            this.surahsSelect.value = '';

            // تحديث قائمة السور المتاحة للرواية المحددة
            const surahList = this.rewayaSelect.options[this.rewayaSelect.selectedIndex]
                .dataset.surahList.split(',').map(Number);
            this.updateAvailableSurahs(surahList);
        } else {
            this.surahsSelect.disabled = true;
            this.currentRewayaEl.textContent = '';
            this.audioPlayer.src = '';
            this.currentSurahEl.textContent = 'لم يتم اختيار سورة';
        }
    }

    updateAvailableSurahs(availableSurahs) {
        // تحديث قائمة السور لإظهار فقط السور المتوفرة في الرواية المحددة
        Array.from(this.surahsSelect.options).forEach(option => {
            if (option.value === '') return; // تخطي الخيار الافتراضي
            const surahId = parseInt(option.value);
            option.disabled = !availableSurahs.includes(surahId);
        });
    }

    onSurahChange() {
        const selectedSurahId = this.surahsSelect.value;
        if (selectedSurahId) {
            const selectedRewaya = this.rewayaSelect.options[this.rewayaSelect.selectedIndex];
            const server = selectedRewaya.dataset.server;
            const surahNumber = selectedSurahId.toString().padStart(3, '0');
            const audioUrl = `${server}/${surahNumber}.mp3`;
            
            this.audioPlayer.src = audioUrl;
            this.audioPlayer.play()
                .then(() => {
                    this.updatePlayPauseIcon(true);
                })
                .catch(error => {
                    console.error('خطأ في تشغيل السورة:', error);
                    this.showError('حدث خطأ في تشغيل السورة');
                });
            
            const surahName = this.surahsSelect.options[this.surahsSelect.selectedIndex].text;
            this.currentSurahEl.textContent = surahName;
        }
    }

    handleSearch() {
        const searchTerm = this.reciterSearchInput.value.toLowerCase().trim();
        
        // إظهار جميع القراء إذا كان حقل البحث فارغاً وتم التركيز عليه
        if (!searchTerm && document.activeElement === this.reciterSearchInput) {
            this.showSearchResults(this.reciters);
            return;
        }
        
        // إخفاء النتائج إذا كان حقل البحث فارغاً ولم يتم التركيز عليه
        if (!searchTerm) {
            this.searchResults.style.display = 'none';
            return;
        }

        const filteredReciters = this.reciters.filter(reciter => 
            reciter.name.toLowerCase().includes(searchTerm)
        );
        
        this.showSearchResults(filteredReciters);
    }

    showSearchResults(results) {
        this.searchResults.innerHTML = '';
        
        if (results.length > 0) {
            const fragment = document.createDocumentFragment();
            results.forEach(reciter => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = reciter.name;
                div.addEventListener('click', () => this.selectReciter(reciter));
                
                // إضافة تأثير hover
                div.addEventListener('mouseenter', () => {
                    div.classList.add('selected');
                });
                div.addEventListener('mouseleave', () => {
                    div.classList.remove('selected');
                });
                
                fragment.appendChild(div);
            });
            this.searchResults.appendChild(fragment);
        } else {
            this.searchResults.innerHTML = '<div class="search-result-item">لا توجد نتائج للبحث</div>';
        }
        
        this.searchResults.style.display = 'block';
    }

    async selectReciter(reciter) {
        this.reciterSearchInput.value = reciter.name;
        this.searchResults.style.display = 'none';
        this.currentReciterEl.textContent = reciter.name;
        
        // إعادة تعيين حالة مشغل الصوت
        this.audioPlayer.src = '';
        this.currentSurahEl.textContent = 'لم يتم اختيار سورة';
        this.currentRewayaEl.textContent = '';
        
        await this.loadReciterRewayat(reciter.id);
    }

    togglePlayPause() {
        if (this.audioPlayer.paused) {
            this.audioPlayer.play();
        } else {
            this.audioPlayer.pause();
        }
    }

    stopAudio() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.updatePlayPauseIcon(false);
    }

    updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audioPlayer.volume = volume;
        // تحديث أيقونة الصوت
        const volumeIcon = this.volumeSlider.previousElementSibling;
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    updateProgress() {
        const duration = this.audioPlayer.duration;
        const currentTime = this.audioPlayer.currentTime;
        const progress = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.currentTimeEl.textContent = this.formatTime(currentTime);
    }

    updateDuration() {
        const duration = this.audioPlayer.duration;
        this.durationEl.textContent = this.formatTime(duration);
    }

    seek(event) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (event.clientX - rect.left) / rect.width;
        this.audioPlayer.currentTime = pos * this.audioPlayer.duration;
    }

    forward10Seconds() {
        if (this.audioPlayer.src) {
            const newTime = Math.min(this.audioPlayer.currentTime + 10, this.audioPlayer.duration);
            this.audioPlayer.currentTime = newTime;
            this.showTimeChangeNotification('تم التقديم 10 ثواني');
        }
    }

    backward10Seconds() {
        if (this.audioPlayer.src) {
            const newTime = Math.max(this.audioPlayer.currentTime - 10, 0);
            this.audioPlayer.currentTime = newTime;
            this.showTimeChangeNotification('تم الإرجاع 10 ثواني');
        }
    }

    showTimeChangeNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'time-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 1000);
    }

    updatePlayPauseIcon(isPlaying) {
        this.playPauseBtn.innerHTML = isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    showError(message) {
        alert(message);
    }
}

// تهيئة المشغل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new QuranPlayer();
});