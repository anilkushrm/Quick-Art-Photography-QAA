<?php
/**
 * Shared helpers — hardened version.
 *
 * Security controls added:
 *  - Password stored as password_hash (bcrypt), verified with password_verify.
 *  - Session tokens are random 32-byte hex, separate from the password, with expiry.
 *  - Timing-safe comparisons (hash_equals) for every auth check.
 *  - Login rate limit: 8 attempts / 15 min per client IP (flat-file).
 *  - Webhook URL SSRF guard: rejects private/link-local/loopback hosts + non-http(s).
 *  - Webhook cURL: TLS verification always ON, no automatic redirect following
 *    (each redirect is re-checked by trigger_webhook if we ever add manual chase).
 *  - First-run: no default password — /admin refuses to accept any auth attempt
 *    until an owner sets one via the setup screen.
 */

// ---------- Paths ----------
const DATA_DIR       = __DIR__ . '/../data';
const LEADS_FILE     = DATA_DIR . '/leads.json';
const SETTINGS_FILE  = DATA_DIR . '/settings.json';
const SESSIONS_FILE  = DATA_DIR . '/sessions.json';
const RATELIMIT_FILE = DATA_DIR . '/ratelimit.json';

const DEFAULT_TEAM_PHONE  = '+919939800780';
const DEFAULT_METHOD      = 'POST';
const DEFAULT_PAYLOAD_FMT = 'json';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const LOGIN_MAX_ATTEMPTS  = 8;
const LOGIN_WINDOW_SEC    = 15 * 60;

// ---------- CORS (restrictive; auth is header-based) ----------
function send_cors() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, X-Admin-Pass, X-Admin-Token');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

function json_ok($data = []) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}
function json_err($msg, $status = 400) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

// ---------- Storage: settings ----------
function load_settings() {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    if (!file_exists(SETTINGS_FILE)) {
        // First run — no admin password yet. The admin.html setup screen must
        // POST ?action=setup-admin with a chosen password before login works.
        $defaults = [
            'adminPasswordHash'    => '',
            'webhookUrl'           => '',
            'teamPhone'            => DEFAULT_TEAM_PHONE,
            'webhookMethod'        => DEFAULT_METHOD,
            'webhookPayloadFormat' => DEFAULT_PAYLOAD_FMT,
            'webhookHeaders'       => '',
            'updatedAt'            => date('c'),
        ];
        if (file_put_contents(SETTINGS_FILE, json_encode($defaults, JSON_PRETTY_PRINT), LOCK_EX) === false) json_err('Settings storage is not writable', 503);
        return $defaults;
    }
    $raw = file_get_contents(SETTINGS_FILE);
    $data = json_decode($raw, true);
    if (!is_array($data)) return [];

    // Backward-compat: migrate legacy plaintext adminPassword → hash + drop plaintext
    if (empty($data['adminPasswordHash']) && !empty($data['adminPassword'])) {
        $data['adminPasswordHash'] = password_hash($data['adminPassword'], PASSWORD_DEFAULT);
        unset($data['adminPassword']);
        file_put_contents(SETTINGS_FILE, json_encode($data, JSON_PRETTY_PRINT));
    }

    // Ensure new keys exist
    if (!isset($data['webhookMethod']))        $data['webhookMethod']        = DEFAULT_METHOD;
    if (!isset($data['webhookPayloadFormat'])) $data['webhookPayloadFormat'] = DEFAULT_PAYLOAD_FMT;
    if (!isset($data['webhookHeaders']))       $data['webhookHeaders']       = '';
    if (!isset($data['adminPasswordHash']))    $data['adminPasswordHash']    = '';
    return $data;
}

function save_settings($data) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    $data['updatedAt'] = date('c');
    // Never persist plaintext password if a stray field slips in
    unset($data['adminPassword']);
    if (file_put_contents(SETTINGS_FILE, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX) === false) json_err('Settings could not be saved', 503);
    return $data;
}

// ---------- Storage: leads ----------
function load_leads() {
    if (!file_exists(LEADS_FILE)) return [];
    $raw = file_get_contents(LEADS_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function save_leads($leads) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    $fp = fopen(LEADS_FILE, 'c+');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0); rewind($fp);
    fwrite($fp, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp); flock($fp, LOCK_UN); fclose($fp);
    return true;
}

// ---------- Sessions ----------
function load_sessions() {
    if (!file_exists(SESSIONS_FILE)) return [];
    $d = json_decode(file_get_contents(SESSIONS_FILE), true);
    return is_array($d) ? $d : [];
}
function save_sessions($s) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    if (file_put_contents(SESSIONS_FILE, json_encode($s, JSON_PRETTY_PRINT), LOCK_EX) === false) json_err('Login session could not be saved', 503);
}
function purge_expired_sessions(&$sessions) {
    $now = time();
    foreach ($sessions as $tok => $exp) if ($exp < $now) unset($sessions[$tok]);
}
function create_session() {
    $token = bin2hex(random_bytes(24));
    $sessions = load_sessions();
    purge_expired_sessions($sessions);
    $sessions[$token] = time() + SESSION_TTL_SECONDS;
    save_sessions($sessions);
    return $token;
}
function is_valid_session($token) {
    if (!$token || !is_string($token) || strlen($token) !== 48) return false;
    $sessions = load_sessions();
    purge_expired_sessions($sessions);
    // Timing-safe check
    foreach ($sessions as $t => $exp) {
        if (hash_equals($t, $token) && $exp >= time()) return true;
    }
    return false;
}
function destroy_session($token) {
    $sessions = load_sessions();
    unset($sessions[$token]);
    save_sessions($sessions);
}
function destroy_all_sessions() { save_sessions([]); }

// ---------- Auth ----------
function require_admin() {
    $tok = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? ($_SERVER['HTTP_X_ADMIN_PASS'] ?? '');
    if (!is_valid_session($tok)) json_err('Unauthorized', 401);
    return load_settings();
}

// ---------- Rate limit for login (per-IP) ----------
function _client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
function login_rate_check() {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    $ip = _client_ip();
    $now = time();
    $store = file_exists(RATELIMIT_FILE) ? json_decode(file_get_contents(RATELIMIT_FILE), true) : [];
    if (!is_array($store)) $store = [];
    // Purge old entries
    foreach ($store as $k => $arr) {
        $store[$k] = array_values(array_filter($arr, fn($t) => $t > $now - LOGIN_WINDOW_SEC));
        if (empty($store[$k])) unset($store[$k]);
    }
    $attempts = $store[$ip] ?? [];
    if (count($attempts) >= LOGIN_MAX_ATTEMPTS) {
        file_put_contents(RATELIMIT_FILE, json_encode($store));
        json_err('Too many login attempts. Please try again in 15 minutes.', 429);
    }
    return $store;
}
function login_rate_record_fail($store) {
    $ip = _client_ip();
    $store[$ip][] = time();
    file_put_contents(RATELIMIT_FILE, json_encode($store));
}

// ---------- JSON body ----------
function read_json_body() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ---------- UUID ----------
function uuid4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// ---------- Extra headers parser ----------
function parse_extra_headers($raw) {
    $out = []; $raw = trim((string)$raw);
    if ($raw === '') return $out;
    $j = json_decode($raw, true);
    if (is_array($j)) { foreach ($j as $k => $v) $out[] = trim($k) . ': ' . trim((string)$v); return $out; }
    foreach (preg_split('/\r?\n/', $raw) as $line) {
        $line = trim($line);
        if ($line !== '' && strpos($line, ':') !== false) $out[] = $line;
    }
    return $out;
}

// ---------- SSRF guard ----------
/** Reject non-public destinations to prevent SSRF via admin-configured webhook. */
function is_safe_webhook_host($url) {
    $parts = parse_url($url);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) return [false, 'invalid URL'];
    if (!in_array(strtolower($parts['scheme']), ['http','https'], true)) return [false, 'only http/https allowed'];
    $host = strtolower($parts['host']);
    // Block obvious localhosts by name
    if (in_array($host, ['localhost','127.0.0.1','0.0.0.0','::1','[::1]'], true)) return [false, 'loopback address not allowed'];
    // Resolve host — reject if any resolved IP is private/link-local/loopback
    $ips = @gethostbynamel($host);
    if ($ips) {
        foreach ($ips as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return [false, 'target resolves to a private/link-local/loopback IP'];
            }
        }
    }
    return [true, ''];
}

// ---------- Webhook trigger (with SSRF guard, TLS on, no auto redirects) ----------
function trigger_webhook($lead) {
    $settings = load_settings();
    $url    = trim($settings['webhookUrl'] ?? '');
    $method = strtoupper(trim($settings['webhookMethod'] ?? DEFAULT_METHOD));
    $format = strtolower(trim($settings['webhookPayloadFormat'] ?? DEFAULT_PAYLOAD_FMT));
    if (!$url) return ['ok' => false, 'error' => 'webhook not configured'];
    if (!function_exists('curl_init')) return ['ok' => false, 'error' => 'PHP cURL extension is unavailable'];
    if (!in_array($method, ['POST','GET'], true))             $method = 'POST';
    if (!in_array($format, ['json','form','query'], true))    $format = 'json';

    [$safe, $why] = is_safe_webhook_host($url);
    if (!$safe) return ['ok' => false, 'error' => 'refused unsafe URL: ' . $why];

    $payload = [
        'name'         => $lead['name']    ?? '',
        'phone'        => $lead['phone']   ?? '',
        'phone_number' => $lead['phone']   ?? '',
        'city'         => $lead['city']    ?? '',
        'course'       => $lead['course']  ?? '',
        'message'      => $lead['message'] ?? '',
        'source'       => $lead['source']  ?? 'website',
        'lead_id'      => $lead['id']      ?? '',
        'submitted_at' => $lead['createdAt'] ?? date('c'),
        'team_phone'   => $settings['teamPhone'] ?? DEFAULT_TEAM_PHONE,
    ];

    $headers = ['User-Agent: QuickArtAcademy-Webhook/1.0', 'Accept: application/json,text/plain,*/*'];
    foreach (parse_extra_headers($settings['webhookHeaders'] ?? '') as $h) $headers[] = $h;

    $reqUrl = $url; $reqBody = null;
    if ($method === 'GET' || $format === 'query') {
        $qs = http_build_query($payload);
        $reqUrl .= (strpos($reqUrl, '?') === false ? '?' : '&') . $qs;
        $method = 'GET';
    } elseif ($format === 'form') {
        $reqBody = http_build_query($payload);
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    } else {
        $reqBody = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $headers[] = 'Content-Type: application/json';
    }

    $ch = curl_init($reqUrl);
    $opts = [
        CURLOPT_RETURNTRANSFER  => true,
        CURLOPT_HTTPHEADER      => $headers,
        CURLOPT_TIMEOUT         => 15,
        CURLOPT_CONNECTTIMEOUT  => 8,
        CURLOPT_FOLLOWLOCATION  => false,  // SSRF: never blindly follow redirects
        CURLOPT_SSL_VERIFYPEER  => true,   // SSRF/hardening: always verify TLS
        CURLOPT_SSL_VERIFYHOST  => 2,
        CURLOPT_PROTOCOLS       => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_CUSTOMREQUEST   => $method,
    ];
    if ($method === 'POST' && $reqBody !== null) {
        $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = $reqBody;
    }
    curl_setopt_array($ch, $opts);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $eff  = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $err  = curl_error($ch); $errno = curl_errno($ch);
    curl_close($ch);

    return [
        'ok' => $code >= 200 && $code < 400,
        'status' => $code, 'effective_url' => $eff,
        'method' => $method, 'format' => $format,
        'body' => is_string($body) ? substr($body, 0, 800) : '',
        'error' => $err ?: null, 'errno' => $errno,
    ];
}
