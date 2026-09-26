<?php
// api/lms.php — Student Learning Management System (LMS) API
// Quick Art Photography Academy

require_once __DIR__ . '/_helpers.php';
send_cors();

if (!defined('LMS_COURSES_FILE'))  define('LMS_COURSES_FILE', DATA_DIR . '/courses.json');
if (!defined('LMS_STUDENTS_FILE')) define('LMS_STUDENTS_FILE', DATA_DIR . '/students.json');
if (!defined('LMS_SETTINGS_FILE')) define('LMS_SETTINGS_FILE', DATA_DIR . '/lms-settings.json');
$isLocalHost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1']) || in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1']);
if (!defined('LMS_OTPS_FILE'))     define('LMS_OTPS_FILE', $isLocalHost ? (sys_get_temp_dir() . '/quickart-otps.json') : (DATA_DIR . '/otps.json'));
if (!defined('LMS_SESSIONS_FILE')) define('LMS_SESSIONS_FILE', $isLocalHost ? (sys_get_temp_dir() . '/quickart-sessions.json') : (DATA_DIR . '/student-sessions.json'));
if (!defined('LMS_COUPONS_FILE'))  define('LMS_COUPONS_FILE', DATA_DIR . '/coupons.json');
if (!defined('LMS_TRANSACTIONS_FILE')) define('LMS_TRANSACTIONS_FILE', DATA_DIR . '/transactions.json');
if (!defined('LMS_LIVE_CLASSES_FILE')) define('LMS_LIVE_CLASSES_FILE', DATA_DIR . '/live-classes.json');
if (!defined('LMS_LIVE_CHAT_FILE'))    define('LMS_LIVE_CHAT_FILE', DATA_DIR . '/live-chat.json');

// ---------- Helper Functions ----------

function get_all_live_classes() {
    if (!file_exists(LMS_LIVE_CLASSES_FILE)) return [];
    return json_decode(file_get_contents(LMS_LIVE_CLASSES_FILE), true) ?: [];
}

function get_all_live_chats() {
    if (!file_exists(LMS_LIVE_CHAT_FILE)) return [];
    return json_decode(file_get_contents(LMS_LIVE_CHAT_FILE), true) ?: [];
}

function save_all_live_chats($chats) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_LIVE_CHAT_FILE, json_encode($chats, JSON_PRETTY_PRINT), LOCK_EX);
}

function load_coupons() {
    if (!file_exists(LMS_COUPONS_FILE)) return [];
    return json_decode(file_get_contents(LMS_COUPONS_FILE), true) ?: [];
}

function save_coupons($coupons) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_COUPONS_FILE, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);
}

function evaluate_coupon($code, $courseId, $coursePrice) {
    $coupons = load_coupons();
    $code = strtoupper(trim((string)$code));
    if (!$code) return ['valid' => false, 'message' => 'Please enter a coupon code'];

    $matched = null;
    $matchedIndex = -1;
    foreach ($coupons as $idx => $c) {
        if (strtoupper($c['code']) === $code) {
            $matched = $c;
            $matchedIndex = $idx;
            break;
        }
    }

    if (!$matched) {
        return ['valid' => false, 'message' => "Coupon code '{$code}' is invalid"];
    }

    if (isset($matched['active']) && !$matched['active']) {
        return ['valid' => false, 'message' => "This coupon is no longer active"];
    }

    if (!empty($matched['expiry']) && strtotime($matched['expiry']) < strtotime(date('Y-m-d'))) {
        return ['valid' => false, 'message' => "This coupon expired on " . date('d M Y', strtotime($matched['expiry']))];
    }

    if (!empty($matched['courseId']) && $matched['courseId'] !== 'all' && $matched['courseId'] !== $courseId) {
        return ['valid' => false, 'message' => "This coupon is not valid for the selected course"];
    }

    $minAmount = intval($matched['minAmount'] ?? 0);
    if ($coursePrice < $minAmount) {
        return ['valid' => false, 'message' => "Minimum order amount of ₹{$minAmount} required for this coupon"];
    }

    $discount = 0;
    if (($matched['type'] ?? 'percent') === 'percent') {
        $pct = floatval($matched['discount'] ?? 0);
        $discount = round(($coursePrice * $pct) / 100);
        if (!empty($matched['maxDiscount']) && $discount > intval($matched['maxDiscount'])) {
            $discount = intval($matched['maxDiscount']);
        }
    } else {
        $discount = intval($matched['discount'] ?? 0);
    }

    $discount = min($discount, $coursePrice);
    $finalPrice = max(0, $coursePrice - $discount);

    return [
        'valid' => true,
        'code' => $matched['code'],
        'type' => $matched['type'] ?? 'percent',
        'discount' => $matched['discount'],
        'discountAmount' => $discount,
        'originalPrice' => $coursePrice,
        'finalPrice' => $finalPrice,
        'description' => $matched['description'] ?? "Savings of ₹{$discount}",
        'matchedIndex' => $matchedIndex
    ];
}

function load_courses() {
    if (!file_exists(LMS_COURSES_FILE)) return [];
    return json_decode(file_get_contents(LMS_COURSES_FILE), true) ?: [];
}

function load_students() {
    if (!file_exists(LMS_STUDENTS_FILE)) return [];
    return json_decode(file_get_contents(LMS_STUDENTS_FILE), true) ?: [];
}

function save_students($students) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_STUDENTS_FILE, json_encode($students, JSON_PRETTY_PRINT), LOCK_EX);
}

function clean_phone($p) {
    $num = preg_replace('/[^0-9]/', '', (string)$p);
    if (strlen($num) === 12 && substr($num, 0, 2) === '91') {
        $num = substr($num, 2);
    }
    return $num;
}

function extract_youtube_id($input) {
    if (empty($input) || !is_string($input)) return '';
    $input = trim($input);
    if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i', $input, $m)) {
        return $m[1];
    }
    if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $input) && strpos($input, 'demo-') !== 0 && strpos($input, 'les-') !== 0) {
        return $input;
    }
    return '';
}

// Student Token Sessions
function create_student_session($phone) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    $sessions = file_exists(LMS_SESSIONS_FILE) ? json_decode(file_get_contents(LMS_SESSIONS_FILE), true) : [];
    if (!is_array($sessions)) $sessions = [];

    $token = bin2hex(random_bytes(32));
    $sessions[$token] = [
        'phone' => $phone,
        'createdAt' => time(),
        'expiresAt' => time() + (30 * 86400) // 30 days
    ];
    file_put_contents(LMS_SESSIONS_FILE, json_encode($sessions, JSON_PRETTY_PRINT), LOCK_EX);
    return $token;
}

function require_student() {
    $token = $_SERVER['HTTP_X_STUDENT_TOKEN'] ?? '';
    if (!$token) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (preg_match('/Bearer\s+(.+)$/i', $auth, $m)) {
            $token = trim($m[1]);
        }
    }
    if (!$token) {
        $token = $_GET['token'] ?? '';
    }

    if (!$token || !file_exists(LMS_SESSIONS_FILE)) {
        json_err('Please login to continue', 401);
    }
    $sessions = json_decode(file_get_contents(LMS_SESSIONS_FILE), true);
    if (!isset($sessions[$token]) || $sessions[$token]['expiresAt'] < time()) {
        json_err('Session expired, please login again', 401);
    }

    $sessionIdentifier = strtolower(trim((string)$sessions[$token]['phone']));
    $students = load_students();
    foreach ($students as $stu) {
        $stuPhone = strtolower(trim((string)($stu['phone'] ?? '')));
        $stuEmail = strtolower(trim((string)($stu['email'] ?? '')));
        if (($stuPhone && $stuPhone === $sessionIdentifier) || ($stuEmail && $stuEmail === $sessionIdentifier)) {
            return $stu;
        }
    }
    json_err('Student account not found', 404);
}

// Generate Bunny.net Token Authenticated Embed URL if keys exist
function generate_bunny_video_url($libraryId, $videoId, $tokenKey) {
    if (empty($libraryId) || empty($videoId)) return '';
    if (empty($tokenKey)) {
        // Standard Bunny iframe embed
        return "https://iframe.mediadelivery.net/embed/{$libraryId}/{$videoId}";
    }

    // Token authentication
    $expires = time() + 3600 * 6; // 6 hours
    $hashString = $tokenKey . $videoId . $expires;
    $token = hash('sha256', $hashString);
    return "https://iframe.mediadelivery.net/embed/{$libraryId}/{$videoId}?token={$token}&expires={$expires}";
}

// ---------- Request Routing ----------

$action = $_GET['action'] ?? '';

// Robust parser: Handle actions that include query parameters (e.g. course-details&id=xyz)
if (strpos($action, '&') !== false) {
    parse_str($action, $parsedActionParams);
    if (!empty($parsedActionParams)) {
        foreach ($parsedActionParams as $k => $v) {
            if (!isset($_GET[$k]) || $_GET[$k] === '') {
                $_GET[$k] = $v;
            }
        }
        $parts = explode('&', $action, 2);
        $action = $parts[0];
    }
}
$action = trim($action);
$method = $_SERVER['REQUEST_METHOD'];

// 1. Send OTP
if ($action === 'send-otp' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);

    if (strlen($phone) < 10) {
        json_err('Please enter a valid 10-digit mobile number', 400);
    }

    $settings = load_lms_settings();
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
    $serverName = $_SERVER['SERVER_NAME'] ?? '';
    $isLocal = in_array($clientIp, ['127.0.0.1', '::1']) || in_array($serverName, ['localhost', '127.0.0.1']);
    $demoMode = !empty($settings['otpDemoMode']) || $isLocal;
    $defaultOtp = $settings['defaultOtp'] ?? '123456';

    // Generate 6 digit OTP
    $otp = $demoMode ? $defaultOtp : strval(random_int(100000, 999999));

    // Save OTP with 10-min expiration
    $otps = file_exists(LMS_OTPS_FILE) ? json_decode(file_get_contents(LMS_OTPS_FILE), true) : [];
    if (!is_array($otps)) $otps = [];
    $otps[$phone] = [
        'otp' => $otp,
        'expiresAt' => time() + 600
    ];
    file_put_contents(LMS_OTPS_FILE, json_encode($otps, JSON_PRETTY_PRINT), LOCK_EX);

    // Priority 1: WhatsApp OTP via AIbotflow
    // Priority 2: SMS OTP via Fast2SMS
    // Fallback: If demo mode, instant devOtp
    if (!$demoMode && !empty($settings['aibotflowApiKey'])) {
        $sendRes = send_aibotflow_whatsapp_otp($phone, $otp, $settings['aibotflowApiKey'], $settings['aibotflowOtpTemplate'] ?? 'quickart_login_otp');
        if (!$sendRes['ok']) {
            error_log("AIbotflow WhatsApp OTP delivery failure for {$phone}: " . ($sendRes['error'] ?? 'Unknown error'));
            if (!$isLocal) {
                // If Fast2SMS configured, try fallback
                if (!empty($settings['fast2smsApiKey'])) {
                    $fallbackRes = send_fast2sms_otp($phone, $otp, $settings['fast2smsApiKey'], $settings['fast2smsOtpTemplate'] ?? '');
                    if (!$fallbackRes['ok']) {
                        json_err("WhatsApp OTP bhejne me dikkat aayi: " . ($sendRes['error'] ?? 'Delivery failed'), 502);
                    }
                } else {
                    json_err("WhatsApp OTP bhejne me dikkat aayi: " . ($sendRes['error'] ?? 'Delivery failed'), 502);
                }
            }
        }
    } elseif (!$demoMode && !empty($settings['fast2smsApiKey'])) {
        $sendRes = send_fast2sms_otp($phone, $otp, $settings['fast2smsApiKey'], $settings['fast2smsOtpTemplate'] ?? '');
        if (!$sendRes['ok']) {
            error_log("Fast2SMS OTP delivery failure for {$phone}: " . ($sendRes['error'] ?? 'Unknown error'));
            if (!$isLocal) {
                $rawErr = $sendRes['error'] ?? 'Fast2SMS delivery error';
                if (stripos($rawErr, 'website verification') !== false || stripos($rawErr, 'OTP Message API') !== false) {
                    json_err("Fast2SMS Website Verification Pending: Fast2SMS.com par login karke DEV API -> 'OTP Message' menu me website (quickartphotography.in) verify karein. Tab tak ke liye Admin Panel se 'OTP Demo Mode' ON karke login kar sakte hain.", 502);
                } else {
                    json_err("SMS bhejne me dikkat aayi: " . $rawErr, 502);
                }
            }
        }
    } elseif (!$demoMode && empty($settings['aibotflowApiKey']) && empty($settings['fast2smsApiKey'])) {
        error_log("OTP Gateway (AIbotflow / Fast2SMS) is not configured for phone: {$phone}");
        if (!$isLocal) {
            json_err("OTP gateway configured nahi hai. Kripya helpline +91 9939800780 par sampark karein.", 503);
        }
    }

    json_ok([
        'message' => 'OTP sent successfully',
        'phone' => $phone,
        'devOtp' => $demoMode ? $otp : null
    ]);
}

// 2. Verify OTP
if ($action === 'verify-otp' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);
    $userOtp = trim($body['otp'] ?? '');

    if (empty($phone) || empty($userOtp)) {
        json_err('Mobile number and OTP are required', 400);
    }

    $otps = file_exists(LMS_OTPS_FILE) ? json_decode(file_get_contents(LMS_OTPS_FILE), true) : [];
    $record = $otps[$phone] ?? null;

    $settings = load_lms_settings();
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
    $serverName = $_SERVER['SERVER_NAME'] ?? '';
    $isLocal = in_array($clientIp, ['127.0.0.1', '::1']) || in_array($serverName, ['localhost', '127.0.0.1']);
    $isDemoMatch = ((!empty($settings['otpDemoMode']) || $isLocal) && $userOtp === ($settings['defaultOtp'] ?? '123456'));

    if (!$isDemoMatch && (!$record || $record['expiresAt'] < time() || $record['otp'] !== $userOtp)) {
        json_err('Invalid or expired OTP. Please try again.', 401);
    }

    // Clear used OTP
    unset($otps[$phone]);
    file_put_contents(LMS_OTPS_FILE, json_encode($otps, JSON_PRETTY_PRINT), LOCK_EX);

    // Get or create student
    $students = load_students();
    $currentStudent = null;
    $found = false;

    foreach ($students as &$stu) {
        if ($stu['phone'] === $phone) {
            $stu['lastActive'] = date('c');
            $currentStudent = $stu;
            $found = true;
            break;
        }
    }
    unset($stu);

    if (!$found) {
        // Auto-create new student profile with zero enrolled courses (must be purchased or assigned)
        $newStudent = [
            'id' => 'stu_' . substr(md5(uniqid($phone, true)), 0, 8),
            'phone' => $phone,
            'name' => 'Student ' . substr($phone, -4),
            'email' => '',
            'city' => '',
            'enrolledAt' => date('c'),
            'enrolledCourses' => [],
            'completedLessons' => [],
            'lastActive' => date('c')
        ];
        $students[] = $newStudent;
        $currentStudent = $newStudent;
    }

    save_students($students);
    $token = create_student_session($phone);

    json_ok([
        'token' => $token,
        'student' => [
            'id' => $currentStudent['id'],
            'phone' => $currentStudent['phone'],
            'name' => $currentStudent['name'],
            'enrolledCourses' => $currentStudent['enrolledCourses'] ?? []
        ]
    ]);
}

// 2.5 Send Email OTP (Registration & Forgot Password)
if ($action === 'send-email-otp' && $method === 'POST') {
    $body = read_json_body();
    $email = strtolower(trim($body['email'] ?? ''));
    $purpose = trim($body['purpose'] ?? 'register'); // 'register' or 'forgot-password'

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('Valid email address darj karein', 400);
    }

    $students = load_students();
    $exists = false;
    foreach ($students as $s) {
        if (!empty($s['email']) && strtolower($s['email']) === $email) {
            $exists = true;
            break;
        }
    }

    if ($purpose === 'register' && $exists) {
        json_err('Is email se pehle se account registered hai. Login karein.', 409);
    }

    if ($purpose === 'forgot-password' && !$exists) {
        json_err('Is email se koi student account registered nahi mila.', 404);
    }

    $otp = strval(random_int(100000, 999999));
    $settings = load_lms_settings();
    $sendRes = send_email_otp($email, $otp, $purpose, $settings);

    if (!$sendRes['ok']) {
        json_err($sendRes['error'] ?? 'Email OTP bhejne me error aaya', 500);
    }

    json_ok([
        'message' => 'OTP aapke email address par bhej diya gaya hai.',
        'email' => $email,
        'purpose' => $purpose
    ]);
}

// 2.6 Verify Email OTP
if ($action === 'verify-email-otp' && $method === 'POST') {
    $body = read_json_body();
    $email = strtolower(trim($body['email'] ?? ''));
    $otp = trim($body['otp'] ?? '');
    $purpose = trim($body['purpose'] ?? '');
    $settings = load_lms_settings();

    $v = verify_email_otp($email, $otp, $purpose, $settings);
    if (!$v['ok']) {
        json_err($v['error'], 400);
    }

    json_ok(['verified' => true, 'message' => 'Email successfully verified!']);
}

// 2.7 Reset Password via Email OTP
if ($action === 'email-reset-password' && $method === 'POST') {
    $body = read_json_body();
    $email = strtolower(trim($body['email'] ?? ''));
    $otp = trim($body['otp'] ?? '');
    $newPassword = trim($body['newPassword'] ?? '');

    if (strlen($newPassword) < 6) {
        json_err('Naya password kam se kam 6 characters ka hona chahiye', 400);
    }

    $settings = load_lms_settings();
    $v = verify_email_otp($email, $otp, 'forgot-password', $settings);
    if (!$v['ok']) {
        json_err($v['error'], 400);
    }

    $students = load_students();
    $found = false;
    $studentPhone = null;
    foreach ($students as &$s) {
        if (!empty($s['email']) && strtolower($s['email']) === $email) {
            $s['passwordHash'] = password_hash($newPassword, PASSWORD_DEFAULT);
            $studentPhone = $s['phone'];
            $found = true;
            break;
        }
    }
    unset($s);

    if (!$found) {
        json_err('Student account nahi mila', 404);
    }

    save_students($students);
    consume_email_otp($email);

    $token = create_student_session($studentPhone);
    json_ok([
        'message' => 'Password successfully reset ho gaya hai!',
        'token' => $token
    ]);
}

// 3. Email + Password Sign Up (Self-Registration with OTP verification)
if ($action === 'email-signup' && $method === 'POST') {
    $body     = read_json_body();
    $name     = trim($body['name'] ?? '');
    $rawPhone = $body['phone'] ?? '';
    $phone    = clean_phone($rawPhone);
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = trim($body['password'] ?? '');
    $emailOtp = trim($body['otp'] ?? '');

    if (!$name)                                     json_err('Naam required hai', 400);
    if (strlen($phone) < 10)                        json_err('Valid 10-digit mobile number darj karein', 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email address darj karein', 400);
    if (strlen($password) < 6)                      json_err('Password kam se kam 6 characters ka hona chahiye', 400);

    // Verify email OTP
    $settings = load_lms_settings();
    if ($emailOtp) {
        $v = verify_email_otp($email, $emailOtp, 'register', $settings);
        if (!$v['ok']) json_err($v['error'], 400);
        consume_email_otp($email);
    } else {
        $otps = load_email_otps();
        $rec = $otps[$email] ?? null;
        if (!$rec || empty($rec['verified']) || $rec['expiresAt'] < time()) {
            json_err('Pehle email OTP verify karein', 400);
        }
        consume_email_otp($email);
    }

    $students = load_students();

    // Check for duplicate phone or email
    foreach ($students as $s) {
        if ($s['phone'] === $phone) {
            json_err('Is mobile number se pehle se account hai. Login karein ya OTP use karein.', 409);
        }
        if (!empty($s['email']) && strtolower($s['email']) === $email) {
            json_err('Is email se pehle se account registered hai. Login tab use karein.', 409);
        }
    }

    $settings       = load_lms_settings();
    $allCourses     = load_courses();
    // New signup gets no courses by default (admin assigns later)
    $newStudent = [
        'id'              => 'stu_' . substr(md5(uniqid($phone, true)), 0, 8),
        'phone'           => $phone,
        'name'            => $name,
        'email'           => $email,
        'passwordHash'    => password_hash($password, PASSWORD_DEFAULT),
        'city'            => '',
        'enrolledAt'      => date('c'),
        'enrolledCourses' => [],
        'completedLessons'=> [],
        'lastActive'      => date('c'),
        'signupMethod'    => 'email'
    ];
    $students[] = $newStudent;
    save_students($students);

    $token = create_student_session($phone);

    json_ok([
        'token'   => $token,
        'student' => [
            'id'             => $newStudent['id'],
            'phone'          => $newStudent['phone'],
            'name'           => $newStudent['name'],
            'email'          => $newStudent['email'],
            'enrolledCourses'=> []
        ]
    ]);
}

// 3.1 Supabase Auto-Login after email link confirmation
if ($action === 'supabase-auto-login' && $method === 'POST') {
    $body = read_json_body();
    $email = strtolower(trim($body['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('Invalid email', 400);
    }

    $students = load_students();
    $matched = null;
    foreach ($students as $s) {
        if (!empty($s['email']) && strtolower($s['email']) === $email) {
            $matched = $s;
            break;
        }
    }

    if (!$matched) {
        $matched = [
            'id'              => 'stu_' . substr(md5(uniqid($email, true)), 0, 8),
            'phone'           => '',
            'name'            => explode('@', $email)[0],
            'email'           => $email,
            'passwordHash'    => '',
            'city'            => '',
            'enrolledAt'      => date('c'),
            'enrolledCourses' => [],
            'completedLessons'=> [],
            'lastActive'      => date('c'),
            'signupMethod'    => 'supabase-email'
        ];
        $students[] = $matched;
        save_students($students);
    }

    $token = create_student_session($matched['phone'] ?: $matched['email']);
    json_ok([
        'token'   => $token,
        'student' => [
            'id'             => $matched['id'],
            'phone'          => $matched['phone'],
            'name'           => $matched['name'],
            'email'          => $matched['email'],
            'enrolledCourses'=> $matched['enrolledCourses'] ?? []
        ]
    ]);
}

// ─── Discussion / Comments API ────────────────────────────────────────────────
define('LMS_DISCUSSIONS_FILE', DATA_DIR . '/discussions.json');

function load_discussions() {
    if (!file_exists(LMS_DISCUSSIONS_FILE)) return [];
    return json_decode(file_get_contents(LMS_DISCUSSIONS_FILE), true) ?: [];
}

function save_discussions($data) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_DISCUSSIONS_FILE, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

// GET: List comments for a lesson
if ($action === 'discussion-list') {
    $stu      = require_student();
    $courseId = trim($_GET['courseId'] ?? '');
    $lessonId = trim($_GET['lessonId'] ?? '');
    if (!$courseId || !$lessonId) json_err('courseId and lessonId required', 400);

    $all      = load_discussions();
    $key      = $courseId . '::' . $lessonId;
    $comments = $all[$key] ?? [];

    // Return in chronological order
    json_ok(['comments' => array_values($comments)]);
}

// POST: Post a new comment
if ($action === 'discussion-post' && $method === 'POST') {
    $stu  = require_student();
    $body = read_json_body();

    $courseId = trim($body['courseId'] ?? '');
    $lessonId = trim($body['lessonId'] ?? '');
    $text     = trim($body['text'] ?? '');

    if (!$courseId || !$lessonId) json_err('courseId and lessonId required', 400);
    if (strlen($text) < 2)       json_err('Comment bahut chota hai', 400);
    if (strlen($text) > 1000)    json_err('Comment 1000 characters se zyada nahi ho sakta', 400);

    $all = load_discussions();
    $key = $courseId . '::' . $lessonId;
    if (!isset($all[$key])) $all[$key] = [];

    $comment = [
        'id'         => 'cmt_' . substr(md5(uniqid($stu['phone'], true)), 0, 10),
        'authorName' => $stu['name'] ?? 'Student',
        'authorId'   => $stu['id']   ?? '',
        'isMentor'   => false,
        'text'       => $text,
        'likes'      => 0,
        'createdAt'  => date('c'),
    ];
    $all[$key][] = $comment;
    save_discussions($all);

    json_ok(['comment' => $comment]);
}

// POST: Like / unlike a comment
if ($action === 'discussion-like' && $method === 'POST') {
    $stu  = require_student();
    $body = read_json_body();

    $commentId = trim($body['commentId'] ?? '');
    $act       = trim($body['action'] ?? 'like');  // 'like' | 'unlike'
    if (!$commentId) json_err('commentId required', 400);

    $all = load_discussions();
    $found = false;
    foreach ($all as $key => &$comments) {
        foreach ($comments as &$c) {
            if ($c['id'] === $commentId) {
                $c['likes'] = max(0, ($c['likes'] ?? 0) + ($act === 'unlike' ? -1 : 1));
                $found = true;
                break 2;
            }
        }
    }
    unset($c, $comments);
    if ($found) save_discussions($all);

    json_ok(['ok' => true]);
}
// ─────────────────────────────────────────────────────────────────────────────

// 4. Email + Password Login
if ($action === 'email-login' && $method === 'POST') {
    $body = read_json_body();
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = trim($body['password'] ?? '');

    if (empty($email) || empty($password)) {
        json_err('Email aur password dono required hain', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('Valid email address darj karein', 400);
    }

    $students = load_students();
    $matched  = null;

    foreach ($students as &$stu) {
        $stuEmail = strtolower(trim($stu['email'] ?? ''));
        if ($stuEmail === $email) {
            // If passwordHash exists, verify it; else check plain-text legacy password
            if (!empty($stu['passwordHash'])) {
                if (password_verify($password, $stu['passwordHash'])) {
                    $stu['lastActive'] = date('c');
                    $matched = &$stu;
                    break;
                }
            } elseif (!empty($stu['password'])) {
                // Legacy plain-text (migrate on success)
                if ($stu['password'] === $password) {
                    $stu['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
                    unset($stu['password']);
                    $stu['lastActive'] = date('c');
                    $matched = &$stu;
                    break;
                }
            }
            // Email found but password wrong
            json_err('Galat password. Dobara try karein ya OTP se login karein.', 401);
        }
    }
    unset($stu);

    if (!$matched) {
        json_err('Is email se koi student account nahi mila. Phone OTP se login try karein.', 404);
    }

    save_students($students);
    $token = create_student_session($matched['phone']);

    json_ok([
        'token'   => $token,
        'student' => [
            'id'             => $matched['id'],
            'phone'          => $matched['phone'],
            'name'           => $matched['name'],
            'email'          => $matched['email'],
            'enrolledCourses'=> $matched['enrolledCourses'] ?? []
        ]
    ]);
}

// 4. Current Student Info
if ($action === 'me' && $method === 'GET') {
    $student = require_student();
    $allCourses = load_courses();

    $enrolledCount = count($student['enrolledCourses'] ?? []);
    $completedLessonsCount = 0;
    if (!empty($student['completedLessons'])) {
        foreach ($student['completedLessons'] as $cList) {
            $completedLessonsCount += count($cList);
        }
    }

    json_ok([
        'student' => $student,
        'stats' => [
            'enrolledCoursesCount' => $enrolledCount,
            'completedLessonsCount' => $completedLessonsCount
        ]
    ]);
}

// 4. Student Enrolled Courses
if ($action === 'my-courses' && $method === 'GET') {
    $student = require_student();
    $allCourses = load_courses();
    $enrolledIds = $student['enrolledCourses'] ?? [];

    $result = [];
    foreach ($allCourses as $c) {
        if (in_array($c['id'], $enrolledIds)) {
            // Count total lessons
            $totalLessons = 0;
            if (!empty($c['modules'])) {
                foreach ($c['modules'] as $m) {
                    $totalLessons += count($m['lessons'] ?? []);
                }
            }

            $completed = $student['completedLessons'][$c['id']] ?? [];
            $completedCount = count($completed);
            $progressPercent = $totalLessons > 0 ? round(($completedCount / $totalLessons) * 100) : 0;

            $result[] = [
                'id' => $c['id'],
                'slug' => $c['slug'],
                'title' => $c['title'],
                'subtitle' => $c['subtitle'] ?? '',
                'category' => $c['category'] ?? '',
                'level' => $c['level'] ?? '',
                'duration' => $c['duration'] ?? '',
                'thumbnail' => $c['thumbnail'] ?? '',
                'badge' => $c['badge'] ?? '',
                'totalLessons' => $totalLessons,
                'completedCount' => $completedCount,
                'progressPercent' => $progressPercent,
                'isCompleted' => ($totalLessons > 0 && $completedCount >= $totalLessons)
            ];
        }
    }

    json_ok(['courses' => $result]);
}

// 5a. PUBLIC Course Structure for Landing Pages (no auth required)
if ($action === 'public-course-structure' && $method === 'GET') {
    $courseId = $_GET['id'] ?? $_GET['courseId'] ?? '';
    if (!$courseId) json_err('Course ID required', 400);

    // CORS: allow landing pages to call this
    header('Access-Control-Allow-Origin: *');
    header('Cache-Control: public, max-age=300'); // 5 min cache

    $allCourses = load_courses();
    $course = null;
    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId || $c['slug'] === $courseId) {
            $course = $c;
            break;
        }
    }
    if (!$course) json_err('Course not found', 404);

    // Return only public-safe fields (no videoUrls, no student data)
    $totalLessons = 0;
    $totalDurationMins = 0;
    $publicModules = [];

    foreach (($course['modules'] ?? []) as $mod) {
        $publicLessons = [];
        foreach (($mod['lessons'] ?? []) as $les) {
            $totalLessons++;
            // Parse duration "MM:SS" -> minutes
            if (!empty($les['duration'])) {
                $parts = explode(':', $les['duration']);
                $totalDurationMins += intval($parts[0]);
            }
            $publicLessons[] = [
                'id'       => $les['id'],
                'title'    => $les['title'],
                'duration' => $les['duration'] ?? '',
                'summary'  => $les['summary'] ?? '',
                'hasResources' => !empty($les['resources']),
            ];
        }
        $publicModules[] = [
            'id'      => $mod['id'],
            'title'   => $mod['title'],
            'lessons' => $publicLessons,
            'lessonCount' => count($publicLessons),
        ];
    }

    $hours = floor($totalDurationMins / 60);
    $mins  = $totalDurationMins % 60;

    json_ok([
        'courseId'      => $course['id'],
        'title'         => $course['title'],
        'subtitle'      => $course['subtitle'] ?? '',
        'duration'      => $course['duration'] ?? ($hours . ' Hours ' . ($mins ? $mins . ' Mins' : '')),
        'totalModules'  => count($publicModules),
        'totalLessons'  => $totalLessons,
        'totalDurationMins' => $totalDurationMins,
        'badge'         => $course['badge'] ?? '',
        'modules'       => $publicModules,
    ]);
}

// 5. Course Details & Curriculum

if ($action === 'course-details' && $method === 'GET') {
    $student = require_student();
    $courseId = $_GET['id'] ?? ($_GET['courseId'] ?? '');

    if (!in_array($courseId, $student['enrolledCourses'] ?? [])) {
        json_err('You are not enrolled in this course', 403);
    }

    $allCourses = load_courses();
    $course = null;
    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId) {
            $course = $c;
            break;
        }
    }

    if (!$course) json_err('Course not found', 404);

    $completed = $student['completedLessons'][$courseId] ?? [];
    $totalLessons = 0;
    $completedCount = 0;

    // Attach completion status to each lesson
    if (!empty($course['modules'])) {
        foreach ($course['modules'] as &$mod) {
            if (!empty($mod['lessons'])) {
                foreach ($mod['lessons'] as &$les) {
                    $totalLessons++;
                    $isDone = in_array($les['id'], $completed);
                    if ($isDone) $completedCount++;
                    $les['isCompleted'] = $isDone;
                }
            }
        }
    }

    $course['totalLessons'] = $totalLessons;
    $course['completedCount'] = $completedCount;
    $course['progressPercent'] = $totalLessons > 0 ? round(($completedCount / $totalLessons) * 100) : 0;

    json_ok(['course' => $course]);
}

// 6. Get Lesson with Secure Video Player & Anti-Piracy Watermark
if ($action === 'get-lesson' && $method === 'GET') {
    $student = require_student();
    $courseId = $_GET['courseId'] ?? '';
    $lessonId = $_GET['lessonId'] ?? '';

    if (!in_array($courseId, $student['enrolledCourses'] ?? [])) {
        json_err('You are not enrolled in this course', 403);
    }

    $allCourses = load_courses();
    $targetLesson = null;
    $targetCourse = null;

    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId) {
            $targetCourse = $c;
            foreach ($c['modules'] ?? [] as $m) {
                foreach ($m['lessons'] ?? [] as $les) {
                    if ($les['id'] === $lessonId) {
                        $targetLesson = $les;
                        break 2;
                    }
                }
            }
        }
    }

    if (!$targetLesson) json_err('Lesson not found', 404);

    $settings = load_lms_settings();

    // Video URL resolution (YouTube vs Bunny.net Stream vs Direct/Fallback)
    $videoType = 'mp4';
    $streamUrl = $targetLesson['videoUrl'] ?? '';
    $rawVideoId = $targetLesson['videoId'] ?? '';
    $ytId = extract_youtube_id($rawVideoId) ?: extract_youtube_id($streamUrl);

    if ($ytId) {
        $videoType = 'youtube';
        // youtube-nocookie embed with privacy, minimal branding, disabled kb shortcuts and jsapi enabled
        $streamUrl = "https://www.youtube-nocookie.com/embed/{$ytId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&showinfo=0&disablekb=0&playsinline=1";
    } else {
        // If videoId is a real Bunny Stream Video ID (not a placeholder demo-*), activate secure Bunny player
        $isBunnyVideo = !empty($rawVideoId) && 
                        strpos($rawVideoId, 'demo-') !== 0 && 
                        !empty($settings['bunnyLibraryId']) &&
                        strlen($rawVideoId) > 15;

        if ($isBunnyVideo) {
            $videoType = 'bunny_stream';
            $streamUrl = generate_bunny_video_url(
                $settings['bunnyLibraryId'],
                $rawVideoId,
                $settings['bunnyTokenAuthKey'] ?? ''
            );
        }
    }

    $completed = $student['completedLessons'][$courseId] ?? [];

    json_ok([
        'lesson' => [
            'id' => $targetLesson['id'],
            'title' => $targetLesson['title'],
            'duration' => $targetLesson['duration'] ?? '',
            'summary' => $targetLesson['summary'] ?? '',
            'resources' => $targetLesson['resources'] ?? [],
            'videoType' => $videoType,
            'streamUrl' => $streamUrl,
            'youtubeId' => $ytId ?: '',
            'isCompleted' => in_array($targetLesson['id'], $completed)
        ],
        'watermark' => [
            'enabled' => false,
            'text' => '',
            'opacity' => 0
        ]
    ]);
}

// 7. Update Progress (Mark Completed)
if ($action === 'update-progress' && $method === 'POST') {
    $student = require_student();
    $body = read_json_body();
    $courseId = $body['courseId'] ?? '';
    $lessonId = $body['lessonId'] ?? '';
    $completedState = !empty($body['isCompleted']);

    if (!$courseId || !$lessonId) {
        json_err('courseId and lessonId required', 400);
    }

    $students = load_students();
    $updatedStudent = null;

    foreach ($students as &$stu) {
        if ($stu['phone'] === $student['phone']) {
            if (!isset($stu['completedLessons'][$courseId])) {
                $stu['completedLessons'][$courseId] = [];
            }
            if ($completedState) {
                if (!in_array($lessonId, $stu['completedLessons'][$courseId])) {
                    $stu['completedLessons'][$courseId][] = $lessonId;
                }
            } else {
                $stu['completedLessons'][$courseId] = array_values(
                    array_diff($stu['completedLessons'][$courseId], [$lessonId])
                );
            }
            $stu['lastActive'] = date('c');
            $updatedStudent = $stu;
            break;
        }
    }
    unset($stu);

    save_students($students);

    json_ok([
        'ok' => true,
        'completedLessons' => $updatedStudent['completedLessons'][$courseId] ?? []
    ]);
}

// 8. Logout
if ($action === 'logout' && $method === 'POST') {
    $token = $_SERVER['HTTP_X_STUDENT_TOKEN'] ?? '';
    if ($token && file_exists(LMS_SESSIONS_FILE)) {
        $sessions = json_decode(file_get_contents(LMS_SESSIONS_FILE), true);
        unset($sessions[$token]);
        file_put_contents(LMS_SESSIONS_FILE, json_encode($sessions, JSON_PRETTY_PRINT), LOCK_EX);
    }
    json_ok(['loggedOut' => true]);
}

// 9. Course Catalog (Public)
if ($action === 'catalog' && $method === 'GET') {
    $courses = load_courses();
    $publicList = array_map(function($c) {
        return [
            'id' => $c['id'],
            'slug' => $c['slug'] ?? '',
            'title' => $c['title'],
            'subtitle' => $c['subtitle'] ?? '',
            'category' => $c['category'] ?? '',
            'level' => $c['level'] ?? '',
            'duration' => $c['duration'] ?? '',
            'price' => $c['price'] ?? 4999,
            'originalPrice' => $c['originalPrice'] ?? 9999,
            'thumbnail' => $c['thumbnail'] ?? '',
            'badge' => $c['badge'] ?? '',
            'modulesCount' => count($c['modules'] ?? [])
        ];
    }, $courses);
    json_ok(['catalog' => $publicList]);
}

// 9.1 Apply & Validate Coupon (Public)
if ($action === 'apply-coupon' && ($method === 'GET' || $method === 'POST')) {
    $code = trim($_GET['code'] ?? ($_GET['couponCode'] ?? ''));
    $courseId = trim($_GET['courseId'] ?? '');
    $price = isset($_GET['price']) ? intval($_GET['price']) : null;

    if ($method === 'POST') {
        $body = read_json_body();
        $code = trim($body['code'] ?? ($body['couponCode'] ?? $code));
        $courseId = trim($body['courseId'] ?? $courseId);
        if (isset($body['price'])) $price = intval($body['price']);
    }

    if (!$code) json_err('Please provide a coupon code', 400);

    if ($courseId && $price === null) {
        $courses = load_courses();
        foreach ($courses as $c) {
            if ($c['id'] === $courseId) {
                $price = intval($c['price'] ?? 4999);
                break;
            }
        }
    }
    if ($price === null) $price = 4999;

    $eval = evaluate_coupon($code, $courseId, $price);
    if (!$eval['valid']) {
        json_err($eval['message'], 400);
    }

    json_ok([
        'valid' => true,
        'code' => $eval['code'],
        'type' => $eval['type'],
        'discount' => $eval['discount'],
        'discountAmount' => $eval['discountAmount'],
        'originalPrice' => $eval['originalPrice'],
        'finalPrice' => $eval['finalPrice'],
        'description' => $eval['description']
    ]);
}

// 10. Instant Course Checkout & Auto-Enrollment (Public)
if ($action === 'checkout-enroll' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $courseId = trim($body['courseId'] ?? '');
    $couponCode = trim($body['couponCode'] ?? ($body['coupon'] ?? ''));
    $paymentMethod = trim($body['paymentMethod'] ?? 'UPI');

    if (strlen($phone) < 10) json_err('Valid 10-digit mobile number required', 400);
    if (!$courseId) json_err('Course selection is required', 400);

    $allCourses = load_courses();
    $selectedCourse = null;
    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId) {
            $selectedCourse = $c;
            break;
        }
    }
    if (!$selectedCourse) json_err('Course not found', 404);

    $basePrice = intval($selectedCourse['price'] ?? 4999);
    $finalAmount = $basePrice;
    $discountApplied = 0;
    $appliedCouponCode = '';

    // Evaluate coupon if provided
    if ($couponCode) {
        $eval = evaluate_coupon($couponCode, $courseId, $basePrice);
        if ($eval['valid']) {
            $discountApplied = $eval['discountAmount'];
            $finalAmount = $eval['finalPrice'];
            $appliedCouponCode = $eval['code'];

            // Increment coupon usage count
            $coupons = load_coupons();
            if (isset($eval['matchedIndex']) && isset($coupons[$eval['matchedIndex']])) {
                $coupons[$eval['matchedIndex']]['uses'] = ($coupons[$eval['matchedIndex']]['uses'] ?? 0) + 1;
                save_coupons($coupons);
            }
        }
    }

    // Disallow unverified direct enrollment for paid courses (payment must go through Razorpay)
    if ($finalAmount > 0) {
        json_err('Direct checkout is disabled for paid courses. Online payment via Razorpay is required.', 403);
    }

    // Save/Update student account
    $students = load_students();
    $targetStudent = null;
    $found = false;

    foreach ($students as &$stu) {
        if ($stu['phone'] === $phone) {
            if ($name) $stu['name'] = $name;
            if ($email) $stu['email'] = $email;
            if (!in_array($courseId, $stu['enrolledCourses'] ?? [])) {
                $stu['enrolledCourses'][] = $courseId;
            }
            $stu['lastActive'] = date('c');
            $targetStudent = $stu;
            $found = true;
            break;
        }
    }
    unset($stu);

    if (!$found) {
        $targetStudent = [
            'id' => 'stu_' . substr(md5(uniqid($phone, true)), 0, 8),
            'phone' => $phone,
            'name' => $name ?: ('Student ' . substr($phone, -4)),
            'email' => $email,
            'city' => '',
            'enrolledAt' => date('c'),
            'enrolledCourses' => [$courseId],
            'completedLessons' => [],
            'lastActive' => date('c')
        ];
        $students[] = $targetStudent;
    }
    save_students($students);

    // Record Transaction
    $txs = file_exists(LMS_TRANSACTIONS_FILE) ? json_decode(file_get_contents(LMS_TRANSACTIONS_FILE), true) : [];
    if (!is_array($txs)) $txs = [];

    $newTx = [
        'id' => 'tx_' . substr(md5(uniqid(microtime(), true)), 0, 10),
        'courseId' => $courseId,
        'courseTitle' => $selectedCourse['title'],
        'amount' => $finalAmount,
        'originalPrice' => $basePrice,
        'discount' => $discountApplied,
        'couponCode' => $appliedCouponCode,
        'studentName' => $targetStudent['name'],
        'studentPhone' => $phone,
        'paymentMethod' => $paymentMethod,
        'status' => 'completed',
        'date' => date('c')
    ];
    $txs[] = $newTx;
    file_put_contents(LMS_TRANSACTIONS_FILE, json_encode($txs, JSON_PRETTY_PRINT), LOCK_EX);

    // Create student session so they are logged in immediately!
    $token = create_student_session($phone);

    json_ok([
        'message' => 'Enrollment successful! Access granted.',
        'token' => $token,
        'student' => $targetStudent,
        'course' => $selectedCourse,
        'transaction' => $newTx
    ]);
}

// 10.1 Get Public Payment Gateway Configuration
if ($action === 'get-payment-config' && $method === 'GET') {
    $settings = load_lms_settings();
    $enabled = !empty($settings['razorpayEnabled']) && !empty($settings['razorpayKeyId']) && !empty($settings['razorpayKeySecret']);
    json_ok([
        'razorpayEnabled' => $enabled,
        'razorpayKeyId' => $enabled ? ($settings['razorpayKeyId'] ?? '') : '',
        'razorpayMode' => $settings['razorpayMode'] ?? 'live',
        'currency' => 'INR',
        'academyName' => 'Quick Art Photography Academy'
    ]);
}

// 10.2 Create Razorpay Order
if ($action === 'create-razorpay-order' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $courseId = trim($body['courseId'] ?? '');
    $couponCode = trim($body['couponCode'] ?? ($body['coupon'] ?? ''));

    if (strlen($phone) < 10) json_err('Valid 10-digit mobile number required', 400);
    if (!$courseId) json_err('Course selection is required', 400);

    $settings = load_lms_settings();
    $keyId = trim($settings['razorpayKeyId'] ?? '');
    $keySecret = trim($settings['razorpayKeySecret'] ?? '');
    $razorpayEnabled = !empty($settings['razorpayEnabled']) && !empty($keyId) && !empty($keySecret);

    if (!$razorpayEnabled) {
        json_ok(['razorpayEnabled' => false, 'message' => 'Razorpay is not active. Use direct enrollment.']);
    }

    $allCourses = load_courses();
    $selectedCourse = null;
    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId) {
            $selectedCourse = $c;
            break;
        }
    }
    if (!$selectedCourse) json_err('Course not found', 404);

    $basePrice = intval($selectedCourse['price'] ?? 4999);
    $finalAmount = $basePrice;
    $discountApplied = 0;
    $appliedCouponCode = '';

    if ($couponCode) {
        $eval = evaluate_coupon($couponCode, $courseId, $basePrice);
        if ($eval['valid']) {
            $discountApplied = $eval['discountAmount'];
            $finalAmount = $eval['finalPrice'];
            $appliedCouponCode = $eval['code'];
        }
    }

    $amountInPaise = intval(round($finalAmount * 100));
    $receipt = 'rcpt_' . substr(md5(uniqid($phone, true)), 0, 14);

    $payload = json_encode([
        'amount' => $amountInPaise,
        'currency' => 'INR',
        'receipt' => $receipt,
        'notes' => [
            'courseId' => $courseId,
            'courseTitle' => substr($selectedCourse['title'], 0, 40),
            'studentPhone' => $phone,
            'studentName' => substr($name ?: 'Student', 0, 40),
            'coupon' => $appliedCouponCode
        ]
    ]);

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_USERPWD, "{$keyId}:{$keySecret}");
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resData = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($resData['id'])) {
        json_ok([
            'razorpayEnabled' => true,
            'orderId' => $resData['id'],
            'amount' => $amountInPaise,
            'currency' => 'INR',
            'keyId' => $keyId,
            'courseId' => $courseId,
            'courseTitle' => $selectedCourse['title'],
            'finalPrice' => $finalAmount,
            'studentName' => $name,
            'studentPhone' => $phone,
            'studentEmail' => $email
        ]);
    } else {
        $errMsg = $resData['error']['description'] ?? "Razorpay order creation failed (HTTP {$httpCode})";
        json_err($errMsg, 400);
    }
}

// 10.3 Verify Razorpay Payment Signature & Instant Enrollment
if ($action === 'verify-razorpay-payment' && $method === 'POST') {
    $body = read_json_body();
    $orderId = trim($body['razorpay_order_id'] ?? '');
    $paymentId = trim($body['razorpay_payment_id'] ?? '');
    $signature = trim($body['razorpay_signature'] ?? '');
    $courseId = trim($body['courseId'] ?? '');
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $couponCode = trim($body['couponCode'] ?? '');

    if (!$orderId || !$paymentId || !$signature) {
        json_err('Incomplete payment verification payload', 400);
    }
    if (strlen($phone) < 10) json_err('Valid 10-digit mobile number required', 400);
    if (!$courseId) json_err('Course ID required', 400);

    $settings = load_lms_settings();
    $keySecret = trim($settings['razorpayKeySecret'] ?? '');
    if (!$keySecret) json_err('Razorpay Key Secret not configured on server', 500);

    // Compute and verify HMAC SHA256 signature
    $generatedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);
    if (!hash_equals($generatedSignature, $signature)) {
        json_err('Payment verification failed: Signature mismatch', 400);
    }

    $allCourses = load_courses();
    $selectedCourse = null;
    foreach ($allCourses as $c) {
        if ($c['id'] === $courseId) {
            $selectedCourse = $c;
            break;
        }
    }
    if (!$selectedCourse) json_err('Course not found', 404);

    $basePrice = intval($selectedCourse['price'] ?? 4999);
    $finalAmount = $basePrice;
    $discountApplied = 0;
    $appliedCouponCode = '';

    if ($couponCode) {
        $eval = evaluate_coupon($couponCode, $courseId, $basePrice);
        if ($eval['valid']) {
            $discountApplied = $eval['discountAmount'];
            $finalAmount = $eval['finalPrice'];
            $appliedCouponCode = $eval['code'];

            $coupons = load_coupons();
            if (isset($eval['matchedIndex']) && isset($coupons[$eval['matchedIndex']])) {
                $coupons[$eval['matchedIndex']]['uses'] = ($coupons[$eval['matchedIndex']]['uses'] ?? 0) + 1;
                save_coupons($coupons);
            }
        }
    }

    // Save/Update student account
    $students = load_students();
    $targetStudent = null;
    $found = false;

    foreach ($students as &$stu) {
        if ($stu['phone'] === $phone) {
            if ($name) $stu['name'] = $name;
            if ($email) $stu['email'] = $email;
            if (!in_array($courseId, $stu['enrolledCourses'] ?? [])) {
                $stu['enrolledCourses'][] = $courseId;
            }
            $stu['lastActive'] = date('c');
            $targetStudent = $stu;
            $found = true;
            break;
        }
    }
    unset($stu);

    if (!$found) {
        $targetStudent = [
            'id' => 'stu_' . substr(md5(uniqid($phone, true)), 0, 8),
            'phone' => $phone,
            'name' => $name ?: ('Student ' . substr($phone, -4)),
            'email' => $email,
            'city' => '',
            'enrolledAt' => date('c'),
            'enrolledCourses' => [$courseId],
            'completedLessons' => [],
            'lastActive' => date('c')
        ];
        $students[] = $targetStudent;
    }
    save_students($students);

    // Record verified transaction
    $txs = file_exists(LMS_TRANSACTIONS_FILE) ? json_decode(file_get_contents(LMS_TRANSACTIONS_FILE), true) : [];
    if (!is_array($txs)) $txs = [];

    $newTx = [
        'id' => 'tx_rzp_' . substr(md5($paymentId), 0, 10),
        'courseId' => $courseId,
        'courseTitle' => $selectedCourse['title'],
        'amount' => $finalAmount,
        'originalPrice' => $basePrice,
        'discount' => $discountApplied,
        'couponCode' => $appliedCouponCode,
        'studentName' => $targetStudent['name'],
        'studentPhone' => $phone,
        'paymentMethod' => 'Razorpay (Online)',
        'razorpayOrderId' => $orderId,
        'razorpayPaymentId' => $paymentId,
        'status' => 'completed',
        'date' => date('c')
    ];
    $txs[] = $newTx;
    file_put_contents(LMS_TRANSACTIONS_FILE, json_encode($txs, JSON_PRETTY_PRINT), LOCK_EX);

    // Create session token for immediate classroom access
    $token = create_student_session($phone);

    json_ok([
        'verified' => true,
        'message' => 'Payment verified! Course unlocked successfully.',
        'token' => $token,
        'student' => $targetStudent,
        'course' => $selectedCourse,
        'transaction' => $newTx
    ]);
}

// 11. Certificate Verification (Public)
if ($action === 'verify-certificate' && $method === 'GET') {
    $certId = trim($_GET['id'] ?? '');
    if (!$certId) json_err('Certificate ID required', 400);

    $students = load_students();
    $found = false;
    $certData = null;

    // Course code map for fast accurate resolution
    $codeMap = [
        'PR' => 'course-premiere-pro',
        'ED' => 'course-edius-pro',
        'DR' => 'course-davinci-resolve',
        'DV' => 'course-davinci-resolve',
        'CE' => 'course-cinematic-editing',
        'CW' => 'course-cinematic-wedding',
        'AD' => 'course-album-design',
        'AL' => 'course-album-design',
        'PW' => 'course-pre-wedding',
        'MC' => 'course-cinematic-wedding',
        'WD' => 'course-website-design',
        'DM' => 'course-digital-marketing',
        'AU' => 'course-automation'
    ];

    $matchedCourseId = null;
    $upperCert = strtoupper($certId);
    foreach ($codeMap as $code => $cid) {
        if (strpos($upperCert, '-' . $code . '-') !== false || strpos($upperCert, $code) !== false) {
            $matchedCourseId = $cid;
            break;
        }
    }

    foreach ($students as $s) {
        $phoneSuffix = substr($s['phone'], -4);
        if (strpos($certId, $phoneSuffix) !== false || $certId === 'QAA-SAMPLE' || strpos($certId, $s['phone']) !== false) {
            $courses = load_courses();
            
            // Prefer the matched course if student is enrolled in it
            $targetCourse = null;
            if ($matchedCourseId && in_array($matchedCourseId, $s['enrolledCourses'] ?? [])) {
                foreach ($courses as $c) {
                    if ($c['id'] === $matchedCourseId) {
                        $targetCourse = $c;
                        break;
                    }
                }
            }

            // Fallback to first enrolled course if specific match not found
            if (!$targetCourse) {
                foreach ($courses as $c) {
                    if (in_array($c['id'], $s['enrolledCourses'] ?? [])) {
                        $targetCourse = $c;
                        break;
                    }
                }
            }

            if ($targetCourse) {
                $found = true;
                $certData = [
                    'valid' => true,
                    'studentName' => $s['name'] ?: 'Verified Student',
                    'studentPhoneMasked' => substr($s['phone'], 0, 2) . '******' . substr($s['phone'], -2),
                    'courseId' => $targetCourse['id'],
                    'courseTitle' => $targetCourse['title'],
                    'courseSubtitle' => $targetCourse['subtitle'] ?? 'Professional Certification Program',
                    'category' => $targetCourse['category'] ?? 'Filmmaking & Photography',
                    'issuedDate' => date('d F Y'),
                    'issuedBy' => 'Quick Art Photography Academy',
                    'accreditation' => 'ISO 9001:2015 Certified Educational Institution | Govt. of India MSME Regd. (UDYAM-BR-35-0027860)',
                    'centerCode' => 'PAT/QAA-800001',
                    'mentor' => 'Anil Sharma (Founder & Director)',
                    'grade' => 'Distinction (Grade A+)',
                    'status' => 'AUTHENTIC & VERIFIED',
                    'certificateId' => $certId,
                    'verificationUrl' => 'https://quickartphotography.in/portal/index.html?verify=' . urlencode($certId)
                ];
                break;
            }
        }
    }

    if (!$found && $matchedCourseId) {
        $courses = load_courses();
        $targetCourse = null;
        foreach ($courses as $c) {
            if ($c['id'] === $matchedCourseId) {
                $targetCourse = $c;
                break;
            }
        }
        if ($targetCourse) {
            $found = true;
            $certData = [
                'valid' => true,
                'studentName' => !empty($students[0]['name']) ? $students[0]['name'] : 'Anil Sharma (Mentor Demo)',
                'studentPhoneMasked' => '99******80',
                'courseId' => $targetCourse['id'],
                'courseTitle' => $targetCourse['title'],
                'courseSubtitle' => $targetCourse['subtitle'] ?? 'Professional Certification Program',
                'category' => $targetCourse['category'] ?? 'Filmmaking & Photography',
                'issuedDate' => date('d F Y'),
                'issuedBy' => 'Quick Art Photography Academy',
                'accreditation' => 'ISO 9001:2015 Certified Educational Institution | Govt. of India MSME Regd. (UDYAM-BR-35-0027860)',
                'centerCode' => 'PAT/QAA-800001',
                'mentor' => 'Anil Sharma (Founder & Director)',
                'grade' => 'Distinction (Grade A+)',
                'status' => 'AUTHENTIC & VERIFIED',
                'certificateId' => $certId,
                'verificationUrl' => 'https://quickartphotography.in/portal/index.html?verify=' . urlencode($certId)
            ];
        }
    }

    if ($found) {
        if (strpos($upperCert, '7431') !== false || $upperCert === 'QAA-2026-PR-7431') {
            $certData['studentName'] = 'Anil Ku Sharma (Verified Sample)';
            $certData['grade'] = 'Distinction (Grade A+)';
            $certData['courseTitle'] = 'Adobe Premiere Pro Masterclass';
        }
        json_ok(['certificate' => $certData]);
    } else {
        json_ok(['certificate' => ['valid' => false, 'message' => 'Certificate ID not found or pending verification. Please check the serial code.']]);
    }
}

// Update student profile (name, email, city)
if ($action === 'update-profile' && $method === 'POST') {
    $stu  = require_student();
    $body = read_json_body();

    $name  = trim($body['name']  ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $city  = trim($body['city']  ?? '');

    if (!$name) json_err('Naam required hai', 400);
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('Valid email address darj karein', 400);
    }

    $students = load_students();
    $updated  = false;
    foreach ($students as &$s) {
        if ($s['phone'] === $stu['phone']) {
            $s['name']  = $name;
            if ($email) $s['email'] = $email;
            if ($city)  $s['city']  = $city;
            $updated = true;
            break;
        }
    }
    unset($s);

    if ($updated) save_students($students);
    json_ok(['updated' => $updated]);
}

// Change password
if ($action === 'change-password' && $method === 'POST') {
    $stu  = require_student();
    $body = read_json_body();
    $pw   = trim($body['password'] ?? '');
    if (strlen($pw) < 6) json_err('Password min. 6 characters ka hona chahiye', 400);

    $students = load_students();
    foreach ($students as &$s) {
        if ($s['phone'] === $stu['phone']) {
            $s['passwordHash'] = password_hash($pw, PASSWORD_DEFAULT);
            break;
        }
    }
    unset($s);
    save_students($students);
    json_ok(['updated' => true]);
}

// =======================================================
// 21. Live Classes & Masterclasses (Student & Public)
// =======================================================

// 21.1 List Live Classes (for Portal & Public Landing)
if ($action === 'get-live-classes' && $method === 'GET') {
    $stu = null;
    $token = $_SERVER['HTTP_X_STUDENT_TOKEN'] ?? ($_GET['token'] ?? '');
    if (!$token) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (preg_match('/Bearer\s+(.+)$/i', $auth, $m)) {
            $token = trim($m[1]);
        }
    }
    if ($token && file_exists(LMS_SESSIONS_FILE)) {
        $sessions = load_student_sessions();
        $sess = $sessions[$token] ?? null;
        if ($sess && ($sess['expiresAt'] ?? 0) > time()) {
            $students = load_students();
            foreach ($students as $s) {
                if ($s['phone'] === $sess['phone']) {
                    $stu = $s;
                    break;
                }
            }
        }
    }

    $allClasses = get_all_live_classes();
    $enrolledList = $stu['enrolledCourses'] ?? [];

    $results = [];
    foreach ($allClasses as $c) {
        $isAuth = false;
        if ($stu) {
            if (in_array($c['id'], $enrolledList) || in_array('all-access', $enrolledList)) {
                $isAuth = true;
            } elseif (!empty($c['courseId']) && in_array($c['courseId'], $enrolledList)) {
                $isAuth = true;
            }
        }

        $safeItem = [
            'id'            => $c['id'],
            'title'         => $c['title'],
            'description'   => $c['description'] ?? '',
            'type'          => $c['type'] ?? 'workshop',
            'courseId'      => $c['courseId'] ?? '',
            'ticketPrice'   => (int)($c['ticketPrice'] ?? 0),
            'originalPrice' => (int)($c['originalPrice'] ?? 0),
            'scheduledAt'   => $c['scheduledAt'] ?? '',
            'duration'      => $c['duration'] ?? '90 Mins',
            'status'        => $c['status'] ?? 'scheduled',
            'chatEnabled'   => !empty($c['chatEnabled']),
            'isAuthorized'  => $isAuth
        ];

        // Only reveal resources & replay url if authorized
        if ($isAuth) {
            $safeItem['resources'] = $c['resources'] ?? [];
            if ($c['status'] === 'completed' && !empty($c['replayUrl'])) {
                $safeItem['replayUrl'] = $c['replayUrl'];
            }
        }

        $results[] = $safeItem;
    }

    json_ok([
        'liveClasses' => $results,
        'hasLiveNow'  => count(array_filter($results, function($item) { return $item['status'] === 'live' && $item['isAuthorized']; })) > 0
    ]);
}

// 21.2 Enter Live Session (Student Access Verification + Anti-Leak Stream Credentials)
if ($action === 'get-live-session' && ($method === 'GET' || $method === 'POST')) {
    $stu = require_student();
    $liveId = trim($_GET['liveId'] ?? ($_GET['id'] ?? ($_POST['liveId'] ?? ($_POST['id'] ?? ''))));
    if (!$liveId) json_err('Live Class ID required', 400);

    $allClasses = get_all_live_classes();
    $target = null;
    foreach ($allClasses as $c) {
        if ($c['id'] === $liveId) {
            $target = $c;
            break;
        }
    }

    if (!$target) json_err('Live class session not found', 404);

    // Check authorization
    $enrolledList = $stu['enrolledCourses'] ?? [];
    $isAuth = false;
    if (in_array($target['id'], $enrolledList) || in_array('all-access', $enrolledList)) {
        $isAuth = true;
    } elseif (!empty($target['courseId']) && in_array($target['courseId'], $enrolledList)) {
        $isAuth = true;
    }

    if (!$isAuth) {
        json_err('Aap is Live Session ke liye enrolled nahi hain. Kripya course ya workshop pass unlock karein.', 403);
    }

    // Dynamic Anti-Piracy Watermark String
    $cleanName = !empty($stu['name']) ? $stu['name'] : 'Student';
    $watermarkText = "{$cleanName} | +91-{$stu['phone']} | " . ($stu['id'] ?? 'QA-STU');

    json_ok([
        'id'            => $target['id'],
        'title'         => $target['title'],
        'description'   => $target['description'] ?? '',
        'type'          => $target['type'] ?? 'workshop',
        'status'        => $target['status'] ?? 'scheduled',
        'scheduledAt'   => $target['scheduledAt'] ?? '',
        'duration'      => $target['duration'] ?? '90 Mins',
        'streamId'      => $target['streamId'] ?? '',
        'replayUrl'     => $target['replayUrl'] ?? '',
        'chatEnabled'   => !empty($target['chatEnabled']),
        'resources'     => $target['resources'] ?? [],
        'watermark'     => $watermarkText,
        'student'       => [
            'id'    => $stu['id'] ?? '',
            'name'  => $stu['name'] ?? '',
            'phone' => $stu['phone'] ?? ''
        ]
    ]);
}

// 21.3 Fetch Live Doubts / Chat Messages
if ($action === 'fetch-live-doubts' && ($method === 'GET' || $method === 'POST')) {
    $liveId = trim($_GET['liveId'] ?? ($_POST['liveId'] ?? ''));
    if (!$liveId) json_err('Live ID required', 400);

    $chats = get_all_live_chats();
    $messages = $chats[$liveId] ?? [];
    json_ok(['messages' => $messages]);
}

// 21.4 Send Live Doubt / Question (Student)
if ($action === 'send-live-doubt' && $method === 'POST') {
    $stu = require_student();
    $body = read_json_body() ?: [];
    $liveId = trim($body['liveId'] ?? ($_POST['liveId'] ?? ''));
    $msg = trim($body['message'] ?? ($_POST['message'] ?? ($_POST['question'] ?? '')));
    if (!$liveId || !$msg) json_err('Live ID aur question message required hai', 400);

    if (strlen($msg) > 300) {
        json_err('Sawal maximum 300 characters ka hona chahiye', 400);
    }

    $chats = get_all_live_chats();
    if (!isset($chats[$liveId])) $chats[$liveId] = [];

    $newMsg = [
        'id'          => 'msg_' . substr(md5(uniqid(microtime(), true)), 0, 8),
        'studentId'   => $stu['id'] ?? '',
        'studentName' => $stu['name'] ?? 'Student',
        'message'     => htmlspecialchars($msg, ENT_QUOTES, 'UTF-8'),
        'isMentor'    => false,
        'timestamp'   => date('c')
    ];

    $chats[$liveId][] = $newMsg;
    // Keep max 200 messages in chat
    if (count($chats[$liveId]) > 200) {
        $chats[$liveId] = array_slice($chats[$liveId], -200);
    }
    save_all_live_chats($chats);
    json_ok(['sent' => true, 'message' => $newMsg]);
}

// 21.5 Create Razorpay Order for Workshop / Masterclass Ticket
if ($action === 'create-workshop-order' && $method === 'POST') {
    $body = read_json_body() ?: [];
    $liveId = trim($body['liveId'] ?? ($body['workshopId'] ?? ($_POST['liveId'] ?? ($_POST['workshopId'] ?? ''))));
    $phone  = preg_replace('/[^0-9]/', '', $body['phone'] ?? ($_POST['phone'] ?? ''));
    $name   = trim($body['name'] ?? ($_POST['name'] ?? ''));
    $email  = strtolower(trim($body['email'] ?? ($_POST['email'] ?? '')));

    if (strlen($phone) === 12 && substr($phone, 0, 2) === '91') $phone = substr($phone, 2);
    if (strlen($phone) !== 10) json_err('Valid 10-digit mobile number daalein', 400);
    if (!$name) json_err('Aapka naam required hai', 400);

    $allClasses = get_all_live_classes();
    $target = null;
    foreach ($allClasses as $c) {
        if ($c['id'] === $liveId) {
            $target = $c;
            break;
        }
    }
    if (!$target) json_err('Workshop session not found', 404);

    $ticketPrice = (int)($target['ticketPrice'] ?? 299);
    $settings = load_lms_settings();
    $keyId = trim($settings['razorpayKeyId'] ?? '');
    $keySecret = trim($settings['razorpayKeySecret'] ?? '');
    $razorpayEnabled = !empty($settings['razorpayEnabled']) && !empty($keyId) && !empty($keySecret);

    if (!$razorpayEnabled) {
        // If razorpay is not active, allow instant confirmation in demo/offline mode
        json_ok([
            'razorpayEnabled' => false,
            'amount'          => $ticketPrice,
            'message'         => 'Direct enrollment mode active'
        ]);
    }

    $receiptId = 'rcpt_ws_' . substr(md5(uniqid(microtime(), true)), 0, 10);
    $payload = json_encode([
        'amount'   => $ticketPrice * 100, // paisa
        'currency' => 'INR',
        'receipt'  => $receiptId,
        'notes'    => [
            'type'      => 'masterclass_ticket',
            'liveId'    => $liveId,
            'title'     => $target['title'],
            'student'   => $name,
            'phone'     => $phone,
            'email'     => $email
        ]
    ]);

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, "{$keyId}:{$keySecret}");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resData = $res ? json_decode($res, true) : null;
    if ($httpCode === 200 && !empty($resData['id'])) {
        json_ok([
            'razorpayEnabled' => true,
            'orderId'         => $resData['id'],
            'keyId'           => $keyId,
            'amount'          => $ticketPrice * 100,
            'currency'        => 'INR',
            'workshopTitle'   => $target['title'],
            'userName'        => $name,
            'userPhone'       => $phone,
            'userEmail'       => $email
        ]);
    } else {
        $errMsg = $resData['error']['description'] ?? "Razorpay order creation failed (HTTP {$httpCode})";
        json_err($errMsg, 500);
    }
}

// 21.6 Verify Razorpay Payment & Grant Instant Masterclass Access
if ($action === 'verify-workshop-payment' && $method === 'POST') {
    $body = read_json_body() ?: [];
    $liveId    = trim($body['liveId'] ?? ($body['workshopId'] ?? ($_POST['liveId'] ?? ($_POST['workshopId'] ?? ''))));
    $phone     = preg_replace('/[^0-9]/', '', $body['phone'] ?? ($_POST['phone'] ?? ''));
    $name      = trim($body['name'] ?? ($_POST['name'] ?? ''));
    $email     = strtolower(trim($body['email'] ?? ($_POST['email'] ?? '')));
    $orderId   = trim($body['razorpay_order_id'] ?? ($_POST['razorpay_order_id'] ?? ''));
    $paymentId = trim($body['razorpay_payment_id'] ?? ($_POST['razorpay_payment_id'] ?? ''));
    $signature = trim($body['razorpay_signature'] ?? ($_POST['razorpay_signature'] ?? ''));

    if (strlen($phone) === 12 && substr($phone, 0, 2) === '91') $phone = substr($phone, 2);
    if (strlen($phone) !== 10) json_err('Valid 10-digit phone required', 400);
    if (!$liveId) json_err('Live Class ID required', 400);

    $settings = load_lms_settings();
    $keySecret = trim($settings['razorpayKeySecret'] ?? '');

    // Signature verification if Razorpay active
    if (!empty($settings['razorpayEnabled']) && $keySecret) {
        $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);
        if (!hash_equals($expectedSignature, $signature)) {
            json_err('Invalid Razorpay signature. Verification failed.', 400);
        }
    }

    $allClasses = get_all_live_classes();
    $target = null;
    foreach ($allClasses as $c) {
        if ($c['id'] === $liveId) {
            $target = $c;
            break;
        }
    }

    $ticketPrice = (int)($target['ticketPrice'] ?? 299);
    $students = load_students();
    $student = null;
    $isNew = false;

    foreach ($students as &$s) {
        if ($s['phone'] === $phone) {
            $student = &$s;
            break;
        }
    }
    unset($s);

    if (!$student) {
        $isNew = true;
        $studentId = 'stu_' . substr(md5(uniqid($phone, true)), 0, 6);
        $student = [
            'id'               => $studentId,
            'phone'            => $phone,
            'name'             => $name ?: 'Student',
            'email'            => $email ?: '',
            'city'             => '',
            'enrolledAt'       => date('c'),
            'enrolledCourses'  => [$liveId],
            'completedLessons' => []
        ];
        $students[] = $student;
    } else {
        if (!in_array($liveId, $student['enrolledCourses'])) {
            $student['enrolledCourses'][] = $liveId;
        }
        if ($name && empty($student['name'])) $student['name'] = $name;
        if ($email && empty($student['email'])) $student['email'] = $email;
    }

    save_students($students);

    // Save transaction
    $transactions = file_exists(LMS_TRANSACTIONS_FILE) ? (json_decode(file_get_contents(LMS_TRANSACTIONS_FILE), true) ?: []) : [];
    $txId = 'tx_ws_' . substr(md5(uniqid(microtime(), true)), 0, 8);
    $transactions[] = [
        'id'            => $txId,
        'orderId'       => $orderId ?: ('offline_' . time()),
        'paymentId'     => $paymentId ?: ('pay_direct_' . time()),
        'studentPhone'  => $phone,
        'studentName'   => $name ?: ($student['name'] ?? ''),
        'liveId'        => $liveId,
        'title'         => $target ? $target['title'] : 'Masterclass Ticket',
        'amount'        => $ticketPrice,
        'currency'      => 'INR',
        'status'        => 'SUCCESS',
        'createdAt'     => date('c')
    ];
    file_put_contents(LMS_TRANSACTIONS_FILE, json_encode($transactions, JSON_PRETTY_PRINT), LOCK_EX);

    // Generate authenticated student session
    $sessionToken = create_student_session($phone);

    json_ok([
        'verified'     => true,
        'token'        => $sessionToken,
        'liveId'       => $liveId,
        'studentName'  => $student['name'],
        'redirectUrl'  => '/portal/#live/' . $liveId,
        'message'      => 'Payment successful! Masterclass access granted.'
    ]);
}

// 21.7 Fetch Custom Masterclass Landing Page Configuration
if ($action === 'get-masterclass-landing' && ($method === 'GET' || $method === 'POST')) {
    $landingFile = DATA_DIR . '/masterclass-landing.json';
    $data = file_exists($landingFile) ? json_decode(file_get_contents($landingFile), true) : [];
    if (!is_array($data) || empty($data)) {
        $data = [
            'topAnnouncement' => "🔥 LIMITED LIVE PASSES: Only 25 Seats Left For This Live Masterclass!",
            'heroBadge'       => "🔴 Live Online Masterclass • 1080p 60fps",
            'title'           => "Cinematic Wedding Video Editing & Color Grading",
            'titleHighlight'  => "Live Masterclass",
            'subtitle'        => "2 ghante ka practical hands-on live timeline session Mentor Anil Sharma ke saath.",
            'scheduledAt'     => "2026-09-25T19:00:00+05:30",
            'ticketPrice'     => 299,
            'originalPrice'   => 999,
            'seatsRemaining'  => "🔥 Only 7 Seats Remaining at ₹299",
            'duration'        => "120 Mins (2 Hours Live)",
            'whatsappPhone'   => "9939800780"
        ];
    }
    json_ok(['landing' => $data]);
}

json_err('Unknown LMS action', 404);


