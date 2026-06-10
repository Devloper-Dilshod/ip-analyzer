<?php
// Productionda PHP xatoliklar JSONni buzmasligi uchun ularni yashiramiz
error_reporting(0);
ini_set('display_errors', 0);

// cors va json headerlarini o'rnatamiz
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// qaysi action kelganiga qarab ishaymiz - ip yoki country
$action = isset($_GET['action']) ? $_GET['action'] : 'ip';

// ------- ip lookup qismi --------
if ($action === 'ip') {

    $ip = isset($_GET['ip']) ? trim($_GET['ip']) : '';

    if ($ip === '') {
        echo json_encode(['error' => true, 'reason' => 'ip required']);
        exit;
    }

    // validate qilb olamiz
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        echo json_encode(['error' => true, 'reason' => 'Invalid IP address.']);
        exit;
    }

    // ipwho.is ga sorov yuboramiz - bepul va kalsiz ishlaydi
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => 'https://ipwho.is/' . $ip,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'Mozilla/5.0',
    ]);
    $body    = curl_exec($ch);
    $code    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlerr = curl_error($ch);
    curl_close($ch);

    if ($curlerr) {
        echo json_encode(['error' => true, 'reason' => 'Curl error: ' . $curlerr]);
        exit;
    }

    if (!$body || $code !== 200) {
        echo json_encode(['error' => true, 'reason' => 'API unreachable. Try again.']);
        exit;
    }

    $d = json_decode($body, true);

    if (!$d || (isset($d['success']) && $d['success'] === false)) {
        echo json_encode(['error' => true, 'reason' => $d['message'] ?? 'No data found.']);
        exit;
    }

    // ma'lumotlarni tekis formatga o'tkazamz
    $currency = '';
    if (!empty($d['currency']['code'])) {
        $currency = $d['currency']['code'];
        if (!empty($d['currency']['name'])) {
            $currency .= ' · ' . $d['currency']['name'];
        }
    }

    $calling = '';
    if (!empty($d['calling_code'])) {
        $calling = '+' . ltrim($d['calling_code'], '+');
    }

    $asn = '';
    if (!empty($d['connection']['asn'])) {
        $asn = 'AS' . $d['connection']['asn'];
    }

    echo json_encode([
        'ip'           => $d['ip'] ?? '',
        'city'         => $d['city'] ?? '',
        'region'       => $d['region'] ?? '',
        'country_name' => $d['country'] ?? '',
        'country_code' => strtolower($d['country_code'] ?? ''),
        'country_code_upper' => strtoupper($d['country_code'] ?? ''),
        'postal'       => $d['postal'] ?? '',
        'latitude'     => $d['latitude'] ?? null,
        'longitude'    => $d['longitude'] ?? null,
        'timezone'     => $d['timezone']['id'] ?? '',
        'utc_offset'   => $d['timezone']['utc'] ?? '',
        'currency'     => $currency,
        'calling_code' => $calling,
        'asn'          => $asn,
        'org'          => $d['connection']['isp'] ?? '',
        'network'      => $d['connection']['org'] ?? '',
    ]);
    exit;
}

// ------- davlat haqida malumot olish qismi --------
if ($action === 'country') {

    // ism orqali qidirish ishonchsiz - alpha kod (US, UZ) aniqroq
    $code = isset($_GET['code']) ? strtoupper(trim($_GET['code'])) : '';

    if ($code === '' || strlen($code) !== 2) {
        echo json_encode(['error' => true, 'reason' => 'Valid 2-letter country code required.']);
        exit;
    }

    // restcountries alpha endpoint - kod bilan ishlaydi, nom bilan emas
    $url = 'https://restcountries.com/v3.1/alpha/' . urlencode($code);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'Mozilla/5.0',
    ]);
    $body    = curl_exec($ch);
    $code    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlerr = curl_error($ch);
    curl_close($ch);

    if ($curlerr) {
        echo json_encode(['error' => true, 'reason' => 'Curl error: ' . $curlerr]);
        exit;
    }

    if (!$body || $code !== 200) {
        echo json_encode(['error' => true, 'reason' => 'Country API failed.']);
        exit;
    }

    $list = json_decode($body, true);

    if (!$list || !is_array($list) || empty($list)) {
        echo json_encode(['error' => true, 'reason' => 'Country not found.']);
        exit;
    }

    // birinchi natijani olamiz
    $c = $list[0];

    // tillarni string qilib chiqaramiz
    $langs = '';
    if (!empty($c['languages'])) {
        $langs = implode(', ', array_values($c['languages']));
    }

    // valyutalarni ham shunaqa
    $currencies = '';
    if (!empty($c['currencies'])) {
        $parts = [];
        foreach ($c['currencies'] as $code => $cur) {
            $parts[] = ($cur['name'] ?? $code) . ' (' . $code . ')';
        }
        $currencies = implode(', ', $parts);
    }

    // chegara davlatlari
    $borders = '';
    if (!empty($c['borders'])) {
        $borders = implode(', ', $c['borders']);
    }

    // aholini formatlash
    $pop = !empty($c['population']) ? number_format($c['population']) : '';

    // yuzasini formatlash
    $area = !empty($c['area']) ? number_format($c['area']) . ' km²' : '';

    echo json_encode([
        'name'         => $c['name']['common'] ?? '',
        'official'     => $c['name']['official'] ?? '',
        'capital'      => !empty($c['capital']) ? $c['capital'][0] : '',
        'population'   => $pop,
        'area'         => $area,
        'region'       => $c['region'] ?? '',
        'subregion'    => $c['subregion'] ?? '',
        'languages'    => $langs,
        'currencies'   => $currencies,
        'timezones'    => !empty($c['timezones']) ? implode(', ', $c['timezones']) : '',
        'tld'          => !empty($c['tld']) ? implode(', ', $c['tld']) : '',
        'borders'      => $borders,
        'independent'  => isset($c['independent']) ? ($c['independent'] ? 'Yes' : 'No') : '',
        'un_member'    => isset($c['unMember']) ? ($c['unMember'] ? 'Yes' : 'No') : '',
        'flag_png'     => $c['flags']['png'] ?? '',
        'flag_alt'     => $c['flags']['alt'] ?? '',
        'coat_of_arms' => $c['coatOfArms']['png'] ?? '',
        'google_maps'  => $c['maps']['googleMaps'] ?? '',
        'fifa'         => $c['fifa'] ?? '',
        'driving_side' => $c['car']['side'] ?? '',
        'start_of_week'=> $c['startOfWeek'] ?? '',
    ]);
    exit;
}

echo json_encode(['error' => true, 'reason' => 'Unknown action.']);
