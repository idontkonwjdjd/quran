// تهيئة مشغل الفيديو
const player = new Plyr('#player', {
    controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'fullscreen'
    ]
});

// تهيئة HLS
const video = document.querySelector('#player');
const source = video.getElementsByTagName('source')[0].src;
const hls = new Hls();

// دالة لجلب القنوات من API
async function fetchChannels() {
    try {
        const response = await fetch('https://mp3quran.net/api/v3/live-tv?language=ar');
        const data = await response.json();
        return data.livetv;
    } catch (error) {
        console.error('خطأ في جلب القنوات:', error);
        return [];
    }
}

// دالة لإنشاء أزرار القنوات
function createChannelButtons(channels) {
    const channelsContainer = document.getElementById('channels-buttons');
    channels.forEach((channel, index) => {
        const button = document.createElement('button');
        button.className = 'channel-button';
        button.textContent = channel.name;
        button.addEventListener('click', () => {
            // إزالة الفئة النشطة من جميع الأزرار
            document.querySelectorAll('.channel-button').forEach(btn => 
                btn.classList.remove('active')
            );
            // إضافة الفئة النشطة للزر المحدد
            button.classList.add('active');
            // تشغيل القناة
            playChannel(channel.url);
        });
        channelsContainer.appendChild(button);
        
        // تشغيل أول قناة تلقائياً
        if (index === 0) {
            button.classList.add('active');
            playChannel(channel.url);
        }
    });
}

// دالة لتشغيل القناة
function playChannel(url) {
    if (Hls.isSupported()) {
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // للمتصفحات التي تدعم HLS مباشرة مثل Safari
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    const channels = await fetchChannels();
    if (channels.length > 0) {
        createChannelButtons(channels);
    } else {
        document.getElementById('channels-buttons').innerHTML = 
            '<div class="error-message">عذراً، لا يمكن تحميل القنوات حالياً</div>';
    }
});