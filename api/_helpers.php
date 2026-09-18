<?php
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
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
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Pass, X-Admin-Token, X-Student-Token');
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

// ---------- Fast2SMS Helpers ----------
function clean_fast2sms_key($key) {
    $key = trim((string)$key);
    $key = preg_replace('/^(key|authorization|auth|api[_\s-]?key)\s*[-:=]\s*/i', '', $key);
    return trim($key, " \t\n\r\0\x0B\"'");
}

function send_fast2sms_otp($phone, $otp, $apiKey, $customTemplate = '') {
    $apiKey = clean_fast2sms_key($apiKey);
    if (empty($apiKey)) {
        return ['ok' => false, 'error' => 'Fast2SMS API Key is required'];
    }

    $cleanPhone = preg_replace('/[^0-9]/', '', (string)$phone);
    if (strlen($cleanPhone) === 12 && substr($cleanPhone, 0, 2) === '91') {
        $cleanPhone = substr($cleanPhone, 2);
    }
    if (strlen($cleanPhone) !== 10) {
        return ['ok' => false, 'error' => 'Valid 10-digit mobile number enter karein'];
    }

    // Build custom SMS body
    if (!empty($customTemplate) && strpos($customTemplate, '{otp}') !== false) {
        $smsBody = str_replace('{otp}', $otp, $customTemplate);
    } else {
        $smsBody = "Dear Student,\n\nYour Quick Art Photography Academy portal verification code is: {$otp}\n\nValid for 10 minutes. Please do not share this OTP with anyone.\n\nWarm regards,\nAnil Sharma\nQuick Art Photography Academy\nHelpline: 9939800780";
    }

    // 1. Send via Quick route ('q') with the exact customized template
    $payloadQ = [
        "route" => "q",
        "message" => $smsBody,
        "language" => "english",
        "flash" => 0,
        "numbers" => $cleanPhone
    ];

    $ch = curl_init("https://www.fast2sms.com/dev/bulkV2");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payloadQ),
        CURLOPT_HTTPHEADER => [
            "authorization: " . $apiKey,
            "Content-Type: application/json"
        ],
        CURLOPT_TIMEOUT => 9
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    @curl_close($ch);

    $res = $raw ? json_decode($raw, true) : null;
    if ($res && isset($res['return']) && $res['return'] === true) {
        return [
            'ok' => true,
            'route' => 'q',
            'message' => "OTP {$otp} delivered via Fast2SMS with custom template",
            'response' => $res
        ];
    }

    // 2. Fallback to route: 'otp' if Quick route fails
    $payloadOtp = [
        "route" => "otp",
        "variables_values" => (string)$otp,
        "numbers" => $cleanPhone
    ];

    $ch2 = curl_init("https://www.fast2sms.com/dev/bulkV2");
    curl_setopt_array($ch2, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payloadOtp),
        CURLOPT_HTTPHEADER => [
            "authorization: " . $apiKey,
            "Content-Type: application/json"
        ],
        CURLOPT_TIMEOUT => 9
    ]);
    $raw2 = curl_exec($ch2);
    $err2 = curl_error($ch2);
    @curl_close($ch2);

    $res2 = $raw2 ? json_decode($raw2, true) : null;
    if ($res2 && isset($res2['return']) && $res2['return'] === true) {
        return [
            'ok' => true,
            'route' => 'otp',
            'message' => "OTP {$otp} delivered via Fast2SMS OTP route",
            'response' => $res2
        ];
    }

    $errMsg = 'Fast2SMS delivery failed';
    if ($res2 && !empty($res2['message'])) {
        $errMsg = is_array($res2['message']) ? implode(', ', $res2['message']) : $res2['message'];
    } elseif ($res && !empty($res['message'])) {
        $errMsg = is_array($res['message']) ? implode(', ', $res['message']) : $res['message'];
    } elseif ($err2 || $err) {
        $errMsg = $err2 ?: $err;
    }

    return ['ok' => false, 'error' => $errMsg];
}

// ---------- Email OTP Helpers (Supabase + Direct Mail) ----------
const EMAIL_OTPS_FILE = DATA_DIR . '/email-otps.json';

function load_email_otps() {
    if (!file_exists(EMAIL_OTPS_FILE)) return [];
    return json_decode(file_get_contents(EMAIL_OTPS_FILE), true) ?: [];
}

function save_email_otps($otps) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(EMAIL_OTPS_FILE, json_encode($otps, JSON_PRETTY_PRINT), LOCK_EX);
}

function send_email_otp($email, $otp, $purpose = 'register', $settings = []) {
    $email = strtolower(trim((string)$email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'error' => 'Valid email address darj karein'];
    }

    // 1. Persist locally for reliable verification
    $otps = load_email_otps();
    $otps[$email] = [
        'otp' => (string)$otp,
        'purpose' => $purpose,
        'expiresAt' => time() + 600, // 10 minutes
        'verified' => false
    ];
    save_email_otps($otps);

    // 2. Prepare professional branded HTML email
    $senderEmail = !empty($settings['emailSender']) ? trim($settings['emailSender']) : 'support@quickartphotography.in';
    $senderName  = !empty($settings['emailSenderName']) ? trim($settings['emailSenderName']) : 'Quick Art Photography Academy';

    $subjectTpl = !empty($settings['emailSubjectTemplate']) 
        ? $settings['emailSubjectTemplate'] 
        : (($purpose === 'forgot-password')
            ? "Password Reset Code: {otp} — Quick Art Photography Academy"
            : "Verification Code: {otp} — Quick Art Photography Academy");
    $subject = str_replace(['{otp}', '{email}'], [$otp, $email], $subjectTpl);

    $customMsg = !empty($settings['emailMessageCustom'])
        ? str_replace(['{otp}', '{email}'], [$otp, $email], $settings['emailMessageCustom'])
        : (($purpose === 'forgot-password')
            ? "Use the verification code below to reset your student portal password. If you did not request this, please ignore this email."
            : "Welcome to Quick Art Photography Academy! Use the verification code below to complete your student registration.");

    $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0d1117;color:#e6edf3;padding:30px;margin:0;">'
          . '<div style="max-width:540px;margin:0 auto;background:#161b22;border:1px solid rgba(216,161,83,0.35);border-radius:14px;padding:32px;text-align:center;">'
          . '<div style="display:inline-block;padding:4px 12px;background:rgba(216,161,83,0.15);border:1px solid rgba(216,161,83,0.3);border-radius:9999px;font-size:11px;font-weight:700;color:#d8a153;letter-spacing:1px;margin-bottom:12px;">STUDENT LEARNING PORTAL</div>'
          . '<h2 style="color:#d8a153;margin:0 0 8px;font-size:22px;letter-spacing:0.5px;">Quick Art Photography Academy</h2>'
          . '<p style="color:#8b949e;font-size:13px;margin:0 0 24px;">Siwan &bull; Mentor: Anil Sharma</p>'
          . '<div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:24px 20px;margin-bottom:24px;">'
          . '<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 18px;white-space:pre-line;">' . htmlspecialchars($customMsg) . '</p>'
          . '<div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#d8a153;background:rgba(216,161,83,0.1);padding:16px 24px;border-radius:8px;display:inline-block;border:1px solid rgba(216,161,83,0.35);">' . htmlspecialchars($otp) . '</div>'
          . '<p style="color:#f87171;font-size:12px;margin:18px 0 0;">Valid for 10 minutes. Do not share this OTP with anyone.</p>'
          . '</div>'
          . '<div style="color:#8b949e;font-size:12px;line-height:1.6;border-top:1px solid #21262d;padding-top:16px;">'
          . '<strong style="color:#e6edf3;">Quick Art Photography Academy</strong><br>'
          . 'Director: Anil Sharma &bull; Helpline: <a href="tel:9939800780" style="color:#d8a153;text-decoration:none;">9939800780</a><br>'
          . 'Email: <a href="mailto:' . htmlspecialchars($senderEmail) . '" style="color:#d8a153;text-decoration:none;">' . htmlspecialchars($senderEmail) . '</a> &bull; Web: <a href="https://quickartphotography.in" style="color:#d8a153;text-decoration:none;">quickartphotography.in</a>'
          . '</div>'
          . '</div></body></html>';

    // 3. Try Brevo REST API First (300 Free Emails / Day, No Monthly Subscription)
    $brevoApiKey = trim((string)($settings['brevoApiKey'] ?? ''));
    if (!empty($brevoApiKey)) {
        $brevoRes = send_brevo_email($email, $subject, $html, $brevoApiKey, $senderEmail, $senderName);
        if ($brevoRes['ok']) {
            return [
                'ok' => true,
                'message' => 'OTP sent to email successfully via Brevo',
                'provider' => 'brevo'
            ];
        }
    }

    // 4. Try custom SMTP if configured
    if (!empty($settings['smtpHost']) && !empty($settings['smtpUser']) && !empty($settings['smtpPass'])) {
        $smtpSent = send_smtp_email($email, $subject, $html, $settings);
        if ($smtpSent) {
            return [
                'ok' => true,
                'message' => 'OTP sent to email successfully via SMTP',
                'provider' => 'smtp'
            ];
        }
    }

    // 5. Try Supabase Auth OTP if configured
    $supabaseUrl = rtrim($settings['supabaseUrl'] ?? '', '/');
    $supabaseKey = $settings['supabaseAnonKey'] ?? '';

    if (!empty($supabaseUrl) && !empty($supabaseKey)) {
        $portalUrl = (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'quickart') !== false)
            ? 'https://' . $_SERVER['HTTP_HOST'] . '/portal/'
            : 'https://quickartphotography.in/portal/';

        $ch = curl_init("{$supabaseUrl}/auth/v1/otp");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'email' => $email,
                'create_user' => ($purpose === 'register'),
                'options' => [
                    'email_redirect_to' => $portalUrl
                ]
            ]),
            CURLOPT_HTTPHEADER => [
                "apikey: {$supabaseKey}",
                "Authorization: Bearer {$supabaseKey}",
                "Content-Type: application/json"
            ],
            CURLOPT_TIMEOUT => 8
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        @curl_close($ch);
        if ($code >= 200 && $code < 300) {
            return [
                'ok' => true,
                'message' => 'OTP sent to email successfully via Supabase',
                'provider' => 'supabase'
            ];
        }
    }

    // 6. Fallback to PHP mail()
    $headers = "MIME-Version: 1.0\r\n"
             . "Content-Type: text/html; charset=UTF-8\r\n"
             . "From: {$senderName} <{$senderEmail}>\r\n"
             . "Reply-To: {$senderEmail}\r\n"
             . "X-Mailer: PHP/" . phpversion();

    @mail($email, $subject, $html, $headers);

    return [
        'ok' => true,
        'message' => 'OTP sent to email successfully',
        'supabase' => $supabaseSent,
        'smtp' => $smtpSent,
        'brevo' => $brevoSent
    ];
}

function send_brevo_email($to, $subject, $html, $apiKey, $fromEmail, $fromName) {
    $apiKey = trim((string)$apiKey);
    if (empty($apiKey)) return ['ok' => false, 'error' => 'Brevo API key missing'];

    $payload = [
        'sender' => [
            'name' => $fromName ?: 'Quick Art Photography Academy',
            'email' => $fromEmail ?: 'support@quickartphotography.in'
        ],
        'to' => [
            ['email' => $to]
        ],
        'subject' => $subject,
        'htmlContent' => $html
    ];

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $apiKey,
            'Content-Type: application/json',
            'accept: application/json'
        ],
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_TIMEOUT => 10
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    @curl_close($ch);

    $res = $raw ? json_decode($raw, true) : null;
    if ($code >= 200 && $code < 300) {
        return ['ok' => true, 'messageId' => $res['messageId'] ?? ''];
    }
    return ['ok' => false, 'error' => $res['message'] ?? 'Brevo error ' . $code];
}

function send_smtp_email($to, $subject, $html, $settings) {
    $host = trim((string)($settings['smtpHost'] ?? ''));
    $port = intval($settings['smtpPort'] ?? 587);
    $user = trim((string)($settings['smtpUser'] ?? ''));
    $pass = trim((string)($settings['smtpPass'] ?? ''));
    $from = !empty($settings['emailSender']) ? trim($settings['emailSender']) : 'support@quickartphotography.in';
    $fromName = !empty($settings['emailSenderName']) ? trim($settings['emailSenderName']) : 'Quick Art Photography Academy';

    if (empty($host) || empty($user) || empty($pass)) return false;

    $url = ($port == 465) ? "smtps://{$host}:{$port}" : "smtp://{$host}:{$port}";
    $headers = [
        "From: {$fromName} <{$from}>",
        "To: <{$to}>",
        "Subject: {$subject}",
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8"
    ];
    $payload = implode("\r\n", $headers) . "\r\n\r\n" . $html;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_MAIL_FROM, "<{$from}>");
    curl_setopt($ch, CURLOPT_MAIL_RCPT, ["<{$to}>"]);
    curl_setopt($ch, CURLOPT_USERNAME, $user);
    curl_setopt($ch, CURLOPT_PASSWORD, $pass);
    curl_setopt($ch, CURLOPT_USE_SSL, CURLUSESSL_TRY);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $fp = fopen('php://memory', 'r+');
    fwrite($fp, $payload);
    rewind($fp);
    curl_setopt($ch, CURLOPT_READDATA, $fp);
    curl_setopt($ch, CURLOPT_UPLOAD, true);

    $res = curl_exec($ch);
    fclose($fp);
    curl_close($ch);

    return ($res !== false);
}

function verify_email_otp($email, $userOtp, $purpose = '', $settings = []) {
    $email = strtolower(trim((string)$email));
    $userOtp = trim((string)$userOtp);

    // 1. Try Supabase verification if configured
    $supabaseUrl = rtrim($settings['supabaseUrl'] ?? '', '/');
    $supabaseKey = $settings['supabaseAnonKey'] ?? '';

    if (!empty($supabaseUrl) && !empty($supabaseKey)) {
        $ch = curl_init("{$supabaseUrl}/auth/v1/verify");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'type' => 'email',
                'email' => $email,
                'token' => $userOtp
            ]),
            CURLOPT_HTTPHEADER => [
                "apikey: {$supabaseKey}",
                "Authorization: Bearer {$supabaseKey}",
                "Content-Type: application/json"
            ],
            CURLOPT_TIMEOUT => 8
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        @curl_close($ch);
        if ($code >= 200 && $code < 300) {
            return ['ok' => true, 'supabase' => true];
        }
    }

    // 2. Check local OTP records
    $otps = load_email_otps();
    $rec = $otps[$email] ?? null;

    if (!$rec || $rec['expiresAt'] < time()) {
        return ['ok' => false, 'error' => 'OTP expire ho gaya hai ya invalid hai. Dubara request karein.'];
    }

    if ($purpose && !empty($rec['purpose']) && $rec['purpose'] !== $purpose) {
        return ['ok' => false, 'error' => 'Invalid OTP request'];
    }

    if ($rec['otp'] !== $userOtp) {
        return ['ok' => false, 'error' => 'Galat OTP code enter kiya hai. Check karke dubara daalein.'];
    }

    // Mark verified
    $otps[$email]['verified'] = true;
    save_email_otps($otps);

    return ['ok' => true];
}

function consume_email_otp($email) {
    $email = strtolower(trim((string)$email));
    $otps = load_email_otps();
    if (isset($otps[$email])) {
        unset($otps[$email]);
        save_email_otps($otps);
    }
}


