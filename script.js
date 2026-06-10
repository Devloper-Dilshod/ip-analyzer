// elementlarni topib olamiz
const ipInput     = document.getElementById('ip-input');
const btnSearch   = document.getElementById('btn-search');
const btnMyip     = document.getElementById('btn-myip');
const btnCopy     = document.getElementById('btn-copy');
const btnCountry  = document.getElementById('btn-country');
const errBox      = document.getElementById('err-box');
const resultBlock = document.getElementById('result-block');
const ipFlag      = document.getElementById('ip-flag');
const introBlock  = document.getElementById('intro-block');

// modal uchun
const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const modalLoading = document.getElementById('modal-loading');
const modalBody    = document.getElementById('modal-body');
const modalErr     = document.getElementById('modal-err');

// keyinchalik modal da kerak bo'ladi
let currentCountry     = '';
let currentCountryCode = '';

// ---- utils ----

function setText(id, v) {
    document.getElementById(id).textContent = v || '—';
}

function showErr(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
}

function hideErr() {
    errBox.hidden = true;
}

// search paytida hamma narsani bloklymiz
function setLoad(on) {
    btnSearch.querySelector('.btn-label').hidden = on;
    btnSearch.querySelector('.btn-spin').hidden  = !on;
    btnSearch.disabled = on;
    btnMyip.disabled   = on;
}

// v4 va v6 ni tekshirib oladi
function isValidIP(s) {
    const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const v6 = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/;
    if (v4.test(s)) return s.split('.').every(n => +n <= 255);
    return v6.test(s);
}

// ---- natijani ekranga chiqarish ----

function render(d) {
    setText('r-ip',     d.ip);
    setText('r-city',   d.city);
    setText('r-region', d.region);
    setText('r-country',d.country_name);
    setText('r-cc',     d.country_code ? d.country_code.toUpperCase() : '');
    setText('r-call',   d.calling_code);
    setText('r-postal', d.postal);
    setText('r-tz',     d.timezone);
    setText('r-utc',    d.utc_offset);
    setText('r-asn',    d.asn);
    setText('r-org',    d.org);
    setText('r-net',    d.network);

    const c = d.latitude != null && d.longitude != null ? `${d.latitude}, ${d.longitude}` : null;
    setText('r-coords', c);

    // bayroqni yuklaymiz
    if (d.country_code) {
        ipFlag.src    = `https://flagcdn.com/w80/${d.country_code}.png`;
        ipFlag.alt    = d.country_name || '';
        ipFlag.hidden = false;
    } else {
        ipFlag.hidden = true;
    }

    currentCountry     = d.country_name    || '';
    currentCountryCode = d.country_code    || '';

    // davlat tugmasi faqat davlat ma'lumoti bo'lsa ko'rinadi
    btnCountry.hidden = !currentCountry;

    if (d.ip) ipInput.value = d.ip;
    resultBlock.hidden = false;
    if (introBlock) introBlock.hidden = true;
}

// ---- ip qidirish ----

async function lookupIP(ip) {
    hideErr();
    setLoad(true);
    resultBlock.hidden = true;
    if (introBlock) introBlock.hidden = true;

    try {
        const res  = await fetch(`backend/api.php?action=ip&ip=${encodeURIComponent(ip)}`);
        const data = await res.json();

        if (data.error) {
            showErr(data.reason || 'Could not fetch data.');
            if (introBlock) introBlock.hidden = false;
            return;
        }

        render(data);
    } catch (e) {
        // internet yo'q bo'lsa yoki server o'lik
        showErr('Request failed. Check your connection.');
        if (introBlock) introBlock.hidden = false;
    } finally {
        setLoad(false);
    }
}

function handleSearch() {
    const raw = ipInput.value.trim();
    if (!raw) { showErr('Please enter an IP address.'); return; }
    if (!isValidIP(raw)) { showErr('Not a valid IP address.'); return; }
    lookupIP(raw);
}

// ---- my ip - ipify dan real ip olib keyin yubramiz ----

async function handleMyIP() {
    hideErr();
    setLoad(true);
    resultBlock.hidden = true;
    if (introBlock) introBlock.hidden = true;
    try {
        const r   = await fetch('https://api.ipify.org?format=json');
        const obj = await r.json();
        ipInput.value = obj.ip;
        await lookupIP(obj.ip);
    } catch (e) {
        showErr('Could not detect your IP.');
        if (introBlock) introBlock.hidden = false;
        setLoad(false);
    }
}

// ---- country modal ----

async function openModal() {
    if (!currentCountry) return;

    // avval loadingni ko'rsatamiz, datani yashiramiz
    modalLoading.hidden = false;
    modalBody.hidden    = true;
    modalErr.hidden     = true;

    // bayroq va nomni darhol qo'yamiz
    const mf = document.getElementById('m-flag');
    if (currentCountryCode) {
        mf.src    = `https://flagcdn.com/w160/${currentCountryCode}.png`;
        mf.alt    = currentCountry;
        mf.hidden = false;
    }
    document.getElementById('m-name').textContent     = currentCountry;
    document.getElementById('m-official').textContent = '';

    // modalni ochamiz
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
        // alpha kod bilan yuboramiz (UZ, US) - nom bilan ko'p xato beradi
        const code = currentCountryCode.toUpperCase();
        const res  = await fetch(`backend/api.php?action=country&code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (data.error) {
            modalLoading.hidden  = true;
            modalErr.textContent = data.reason || 'No data found.';
            modalErr.hidden      = false;
            return;
        }

        fillModal(data);

        // data keldi - loadingni o'chiramiz
        modalLoading.hidden = true;
        modalBody.hidden    = false;

    } catch (e) {
        // timeout yoki network xato
        modalLoading.hidden  = true;
        modalErr.textContent = 'Failed to load. Try again.';
        modalErr.hidden      = false;
    }
}

function fillModal(d) {
    if (d.official) document.getElementById('m-official').textContent = d.official;

    // restcountriesdan kelgan bayroq aniqroq bo'ladi
    if (d.flag_png) {
        const mf  = document.getElementById('m-flag');
        mf.src    = d.flag_png;
        mf.alt    = d.flag_alt || d.name || '';
    }

    setText('m-capital',     d.capital);
    setText('m-population',  d.population);
    setText('m-area',        d.area);
    setText('m-region',      d.region);
    setText('m-subregion',   d.subregion);
    setText('m-tz',          d.timezones);
    setText('m-tld',         d.tld);
    setText('m-fifa',        d.fifa);
    setText('m-independent', d.independent);
    setText('m-un',          d.un_member);
    setText('m-drive',       d.driving_side);
    setText('m-week',        d.start_of_week);
    setText('m-langs',       d.languages);
    setText('m-currencies',  d.currencies);
    setText('m-borders',     d.borders || 'None');

    const link = document.getElementById('m-maps');
    if (d.google_maps) {
        link.href          = d.google_maps;
        link.style.display = 'inline-flex';
    } else {
        link.style.display = 'none';
    }
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// ---- event listeners ----

btnSearch.addEventListener('click', handleSearch);
ipInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
btnMyip.addEventListener('click', handleMyIP);
btnCountry.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal(); });

// backdrop bosib yopish
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

// ---- copy ----

btnCopy.addEventListener('click', () => {
    const ip = document.getElementById('r-ip').textContent;
    if (!ip || ip === '—') return;

    navigator.clipboard.writeText(ip).then(() => {
        btnCopy.textContent = 'Copied!';
        btnCopy.classList.add('ok');
        setTimeout(() => {
            btnCopy.textContent = 'Copy';
            btnCopy.classList.remove('ok');
        }, 2000);
    }).catch(() => {
        btnCopy.textContent = 'Error';
        setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1500);
    });
});
