<?php
// api/lms-admin.php — LMS Admin Console API
// Quick Art Photography Academy
// Requires Admin Authentication (X-Admin-Pass or X-Admin-Token)

require_once __DIR__ . '/_helpers.php';
send_cors();

const LMS_COURSES_FILE  = DATA_DIR . '/courses.json';
const LMS_STUDENTS_FILE = DATA_DIR . '/students.json';
const LMS_SETTINGS_FILE = DATA_DIR . '/lms-settings.json';
const LMS_COUPONS_FILE  = DATA_DIR . '/coupons.json';
const LMS_TRANSACTIONS_FILE = DATA_DIR . '/transactions.json';

// Ensure admin is logged in
$settings = require_admin();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper functions
function get_all_courses() {
    if (!file_exists(LMS_COURSES_FILE)) return [];
    return json_decode(file_get_contents(LMS_COURSES_FILE), true) ?: [];
}

function save_all_courses($courses) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_COURSES_FILE, json_encode($courses, JSON_PRETTY_PRINT), LOCK_EX);
}

function get_all_students() {
    if (!file_exists(LMS_STUDENTS_FILE)) return [];
    return json_decode(file_get_contents(LMS_STUDENTS_FILE), true) ?: [];
}

function save_all_students($students) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_STUDENTS_FILE, json_encode($students, JSON_PRETTY_PRINT), LOCK_EX);
}

function get_all_coupons() {
    if (!file_exists(LMS_COUPONS_FILE)) return [];
    return json_decode(file_get_contents(LMS_COUPONS_FILE), true) ?: [];
}

function save_all_coupons($coupons) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_COUPONS_FILE, json_encode($coupons, JSON_PRETTY_PRINT), LOCK_EX);
}

// 1. Get Courses List
if ($action === 'get-courses' && $method === 'GET') {
    json_ok(['courses' => get_all_courses()]);
}

// 2. Save Course (Create / Edit)
if ($action === 'save-course' && $method === 'POST') {
    $body = read_json_body();
    $course = $body['course'] ?? null;
    if (!is_array($course) || empty($course['title'])) {
        json_err('Course title is required', 400);
    }

    $courses = get_all_courses();
    $id = !empty($course['id']) ? $course['id'] : ('course-' . substr(md5(uniqid($course['title'], true)), 0, 8));
    $course['id'] = $id;
    if (empty($course['slug'])) {
        $course['slug'] = preg_replace('/[^a-z0-9]+/', '-', strtolower($course['title']));
    }

    $found = false;
    foreach ($courses as &$c) {
        if ($c['id'] === $id) {
            $c = $course;
            $found = true;
            break;
        }
    }
    unset($c);

    if (!$found) {
        $courses[] = $course;
    }

    save_all_courses($courses);
    json_ok(['course' => $course]);
}

// 3. Delete Course
if ($action === 'delete-course' && $method === 'POST') {
    $body = read_json_body();
    $id = $body['id'] ?? '';
    if (!$id) json_err('Course ID required', 400);

    $courses = get_all_courses();
    $filtered = array_values(array_filter($courses, function($c) use ($id) {
        return $c['id'] !== $id;
    }));

    save_all_courses($filtered);
    json_ok(['deleted' => true, 'id' => $id]);
}

// 4. Get Students List
if ($action === 'get-students' && $method === 'GET') {
    $students = get_all_students();
    $courses = get_all_courses();
    $courseMap = [];
    foreach ($courses as $c) {
        $courseMap[$c['id']] = $c['title'];
    }

    // Augment students with progress metrics
    foreach ($students as &$stu) {
        $enrolledNames = [];
        foreach ($stu['enrolledCourses'] ?? [] as $cid) {
            if (isset($courseMap[$cid])) $enrolledNames[] = $courseMap[$cid];
        }
        $stu['enrolledCourseNames'] = $enrolledNames;
        $totalCompleted = 0;
        foreach ($stu['completedLessons'] ?? [] as $lesList) {
            $totalCompleted += count($lesList);
        }
        $stu['totalCompletedLessons'] = $totalCompleted;
    }
    unset($stu);

    json_ok(['students' => $students, 'courses' => $courses]);
}

// 5. Enroll / Create Student (Manual Enrollment from Admin)
if ($action === 'enroll-student' && $method === 'POST') {
    $body = read_json_body();
    $phone = preg_replace('/[^0-9]/', '', (string)($body['phone'] ?? ''));
    if (strlen($phone) === 12 && substr($phone, 0, 2) === '91') $phone = substr($phone, 2);

    if (strlen($phone) < 10) {
        json_err('Valid 10-digit mobile number required', 400);
    }

    $name = trim($body['name'] ?? ('Student ' . substr($phone, -4)));
    $email = trim($body['email'] ?? '');
    $city = trim($body['city'] ?? '');
    $coursesToEnroll = $body['enrolledCourses'] ?? [];
    $paymentMethod = trim($body['paymentMethod'] ?? 'Manual Admin');
    $amountPaid = isset($body['amountPaid']) ? intval($body['amountPaid']) : 0;
    $notes = trim($body['notes'] ?? '');

    $students = get_all_students();
    $found = false;
    $targetStudent = null;

    foreach ($students as &$stu) {
        if ($stu['phone'] === $phone) {
            $stu['name'] = $name;
            if ($email) $stu['email'] = $email;
            if ($city) $stu['city'] = $city;
            $stu['enrolledCourses'] = array_values(array_unique(array_merge($stu['enrolledCourses'] ?? [], $coursesToEnroll)));
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
            'name' => $name,
            'email' => $email,
            'city' => $city,
            'enrolledAt' => date('c'),
            'enrolledCourses' => $coursesToEnroll,
            'completedLessons' => [],
            'lastActive' => date('c')
        ];
        $students[] = $targetStudent;
    }

    save_all_students($students);

    // Record Transaction in transactions.json
    $courses = get_all_courses();
    $courseTitles = [];
    foreach ($courses as $c) {
        if (in_array($c['id'], $coursesToEnroll)) {
            $courseTitles[] = $c['title'];
        }
    }
    $courseTitleStr = !empty($courseTitles) ? implode(', ', $courseTitles) : 'Manual Enrollment';

    $txs = file_exists(LMS_TRANSACTIONS_FILE) ? json_decode(file_get_contents(LMS_TRANSACTIONS_FILE), true) : [];
    if (!is_array($txs)) $txs = [];
    $newTx = [
        'id' => 'tx_adm_' . substr(md5(uniqid(microtime(), true)), 0, 8),
        'courseId' => implode(',', $coursesToEnroll),
        'courseTitle' => $courseTitleStr,
        'amount' => $amountPaid,
        'studentName' => $name,
        'studentPhone' => $phone,
        'paymentMethod' => $paymentMethod,
        'notes' => $notes,
        'status' => 'completed',
        'date' => date('c')
    ];
    $txs[] = $newTx;
    file_put_contents(LMS_TRANSACTIONS_FILE, json_encode($txs, JSON_PRETTY_PRINT), LOCK_EX);

    // Generate WhatsApp Welcome Link with direct portal access info
    $waMsg = "Namaste {$name}! 🙏\n\nWelcome to *Quick Art Photography Academy*!\n\nAapko successfully enroll kar diya gaya hai:\n📚 *Course:* {$courseTitleStr}\n💳 *Payment Status:* Confirmed ({$paymentMethod})\n\nApna course shuru karne ke liye neeche diye gaye link par click karein:\n🔗 *Student Portal:* https://www.quickartphotography.in/portal/\n📱 *Login Mobile:* {$phone}\n🔑 *Login OTP:* 123456\n\nKisi bhi help ke liye aap hume isi WhatsApp number par sampark kar sakte hain.\nHappy Learning! 📸🎬\n- Anil Sharma, Director";

    $waLink = "https://wa.me/91{$phone}?text=" . rawurlencode($waMsg);

    json_ok([
        'student' => $targetStudent,
        'transaction' => $newTx,
        'waLink' => $waLink
    ]);
}

// 6. Delete Student
if ($action === 'delete-student' && $method === 'POST') {
    $body = read_json_body();
    $phone = $body['phone'] ?? '';
    if (!$phone) json_err('Phone required', 400);

    $students = get_all_students();
    $filtered = array_values(array_filter($students, function($s) use ($phone) {
        return $s['phone'] !== $phone;
    }));

    save_all_students($filtered);
    json_ok(['deleted' => true, 'phone' => $phone]);
}

// 6.1 Set / Update Student Email & Password (Admin)
if ($action === 'set-student-password' && $method === 'POST') {
    $body     = read_json_body();
    $phone    = preg_replace('/[^0-9]/', '', (string)($body['phone'] ?? ''));
    if (strlen($phone) === 12 && substr($phone, 0, 2) === '91') $phone = substr($phone, 2);
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = trim($body['password'] ?? '');

    if (strlen($phone) < 10) json_err('Valid phone number required', 400);
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email required', 400);
    if (strlen($password) < 6) json_err('Password must be at least 6 characters', 400);

    // Check email not used by another student
    $students = get_all_students();
    foreach ($students as $s) {
        if (strtolower($s['email'] ?? '') === $email && $s['phone'] !== $phone) {
            json_err('Yeh email kisi aur student ke saath registered hai', 409);
        }
    }

    $found = false;
    foreach ($students as &$stu) {
        if ($stu['phone'] === $phone) {
            $stu['email']        = $email;
            $stu['passwordHash'] = password_hash($password, PASSWORD_DEFAULT);
            unset($stu['password']); // remove any legacy plain-text
            $found = true;
            break;
        }
    }
    unset($stu);

    if (!$found) json_err('Student not found', 404);

    save_all_students($students);
    json_ok(['ok' => true, 'message' => 'Email aur password set ho gaya']);
}



// 7. Get LMS Settings
if ($action === 'get-lms-settings' && $method === 'GET') {
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    json_ok(['settings' => $settings]);
}

// 8. Save LMS Settings
if ($action === 'save-lms-settings' && $method === 'POST') {
    $body = read_json_body();
    $currSettings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    if (!is_array($currSettings)) $currSettings = [];

    $newSettings = [
        'bunnyLibraryId' => isset($body['bunnyLibraryId']) ? trim($body['bunnyLibraryId']) : ($currSettings['bunnyLibraryId'] ?? '755385'),
        'bunnyApiKey' => isset($body['bunnyApiKey']) ? trim($body['bunnyApiKey']) : ($currSettings['bunnyApiKey'] ?? '50179050-0bf6-4266-bc61fb984600-4b08-47e3'),
        'bunnyTokenAuthKey' => isset($body['bunnyTokenAuthKey']) ? trim($body['bunnyTokenAuthKey']) : ($currSettings['bunnyTokenAuthKey'] ?? '436c7112-8150-409c-b5f3-d29a1856b06b'),
        'bunnyHostname' => isset($body['bunnyHostname']) ? trim($body['bunnyHostname']) : ($currSettings['bunnyHostname'] ?? 'iframe.mediadelivery.net'),
        'bunnyAccountApiKey' => isset($body['bunnyAccountApiKey']) ? trim($body['bunnyAccountApiKey']) : ($currSettings['bunnyAccountApiKey'] ?? '174c5167-ecb1-4d9d-9b47-d085ebf2e098dd0da2e5-9071-45ad-b088-9683075c7ed1'),
        'razorpayEnabled' => isset($body['razorpayEnabled']) ? !empty($body['razorpayEnabled']) : ($currSettings['razorpayEnabled'] ?? false),
        'razorpayKeyId' => isset($body['razorpayKeyId']) ? trim($body['razorpayKeyId']) : ($currSettings['razorpayKeyId'] ?? ''),
        'razorpayKeySecret' => isset($body['razorpayKeySecret']) ? trim($body['razorpayKeySecret']) : ($currSettings['razorpayKeySecret'] ?? ''),
        'razorpayWebhookSecret' => isset($body['razorpayWebhookSecret']) ? trim($body['razorpayWebhookSecret']) : ($currSettings['razorpayWebhookSecret'] ?? ''),
        'razorpayMode' => isset($body['razorpayMode']) ? trim($body['razorpayMode']) : ($currSettings['razorpayMode'] ?? 'live'),
        'watermarkEnabled' => isset($body['watermarkEnabled']) ? !empty($body['watermarkEnabled']) : ($currSettings['watermarkEnabled'] ?? true),
        'watermarkOpacity' => isset($body['watermarkOpacity']) ? floatval($body['watermarkOpacity']) : ($currSettings['watermarkOpacity'] ?? 0.35),
        'otpDemoMode' => isset($body['otpDemoMode']) ? !empty($body['otpDemoMode']) : ($currSettings['otpDemoMode'] ?? false),
        'defaultOtp' => isset($body['defaultOtp']) ? trim($body['defaultOtp']) : ($currSettings['defaultOtp'] ?? '123456'),
        'fast2smsApiKey' => isset($body['fast2smsApiKey']) ? clean_fast2sms_key($body['fast2smsApiKey']) : ($currSettings['fast2smsApiKey'] ?? ''),
        'fast2smsOtpTemplate' => isset($body['fast2smsOtpTemplate']) ? trim($body['fast2smsOtpTemplate']) : ($currSettings['fast2smsOtpTemplate'] ?? "Dear Student,\n\nYour Quick Art Photography Academy portal verification code is: {otp}\n\nValid for 10 minutes. Please do not share this OTP with anyone.\n\nWarm regards,\nAnil Sharma\nQuick Art Photography Academy\nHelpline: 9939800780"),
        'supabaseUrl' => isset($body['supabaseUrl']) ? rtrim(trim($body['supabaseUrl']), '/') : ($currSettings['supabaseUrl'] ?? ''),
        'supabaseAnonKey' => isset($body['supabaseAnonKey']) ? trim($body['supabaseAnonKey']) : ($currSettings['supabaseAnonKey'] ?? ''),
        'supabaseSecretKey' => isset($body['supabaseSecretKey']) ? trim($body['supabaseSecretKey']) : ($currSettings['supabaseSecretKey'] ?? ''),
        'emailSender' => isset($body['emailSender']) ? trim($body['emailSender']) : ($currSettings['emailSender'] ?? 'support@quickartphotography.in'),
        'emailSenderName' => isset($body['emailSenderName']) ? trim($body['emailSenderName']) : ($currSettings['emailSenderName'] ?? 'Quick Art Photography Academy'),
        'emailSubjectTemplate' => isset($body['emailSubjectTemplate']) ? trim($body['emailSubjectTemplate']) : ($currSettings['emailSubjectTemplate'] ?? 'Your Quick Art Academy Verification OTP: {otp}'),
        'emailMessageCustom' => isset($body['emailMessageCustom']) ? trim($body['emailMessageCustom']) : ($currSettings['emailMessageCustom'] ?? "Dear Student,\n\nYour Quick Art Photography Academy portal verification code is: {otp}\n\nValid for 10 minutes. Please do not share this OTP with anyone.\n\nWarm regards,\nAnil Sharma\nQuick Art Photography Academy\nHelpline: 9939800780"),
        'brevoApiKey' => isset($body['brevoApiKey']) ? trim($body['brevoApiKey']) : ($currSettings['brevoApiKey'] ?? ''),
        'smtpHost' => isset($body['smtpHost']) ? trim($body['smtpHost']) : ($currSettings['smtpHost'] ?? ''),
        'smtpPort' => isset($body['smtpPort']) ? intval($body['smtpPort']) : ($currSettings['smtpPort'] ?? 587),
        'smtpUser' => isset($body['smtpUser']) ? trim($body['smtpUser']) : ($currSettings['smtpUser'] ?? 'support@quickartphotography.in'),
        'smtpPass' => isset($body['smtpPass']) ? trim($body['smtpPass']) : ($currSettings['smtpPass'] ?? ''),
        'collections' => $currSettings['collections'] ?? [
            'course-premiere-pro' => 'e8c9044d-a305-465c-86ca-297e4e71436d',
            'course-edius-pro' => '22652727-657c-4280-8d97-08504a594235',
            'course-davinci-resolve' => '43e2437d-d1ac-4665-ad2b-15b5276d87b6',
            'course-cinematic-wedding' => 'e7173751-87b3-4662-b85a-a481500acded',
            'course-album-design' => '6a818a59-8758-4b3e-9d9f-0a33b8ff2d0e',
            'course-pre-wedding' => 'ed57f97b-fb42-42de-893e-862aa9e9b744',
            'course-website-design' => '9eb90731-0f25-42ee-91ae-190888872929',
            'course-digital-marketing' => '23e69417-3b15-436e-bc23-52066132738f',
            'course-automation' => 'e84c2f96-2763-490d-a250-111f8c7886e9'
        ],
        'academyName' => 'Quick Art Photography Academy',
        'mentorName' => 'Anil Sharma',
        'updatedAt' => date('c')
    ];

    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_SETTINGS_FILE, json_encode($newSettings, JSON_PRETTY_PRINT), LOCK_EX);

    json_ok(['settings' => $newSettings]);
}

// 8.1 Test Bunny.net Connection Handshake
if ($action === 'test-bunny' && ($method === 'GET' || $method === 'POST')) {
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    $libraryId = $settings['bunnyLibraryId'] ?? '755385';
    $accountKey = $settings['bunnyAccountApiKey'] ?? '174c5167-ecb1-4d9d-9b47-d085ebf2e098dd0da2e5-9071-45ad-b088-9683075c7ed1';

    $ch = curl_init("https://api.bunny.net/videolibrary/{$libraryId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "AccessKey: {$accountKey}",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $lib = json_decode($res, true);
        json_ok([
            'connected' => true,
            'libraryId' => $lib['Id'] ?? $libraryId,
            'libraryName' => $lib['Name'] ?? 'Quick Art Academy Stream',
            'videoCount' => $lib['VideoCount'] ?? 0,
            'storageUsage' => round(($lib['StorageUsage'] ?? 0) / (1024 * 1024), 2) . ' MB',
            'trafficUsage' => round(($lib['TrafficUsage'] ?? 0) / (1024 * 1024), 2) . ' MB',
            'pullZoneId' => $lib['PullZoneId'] ?? 6632506,
            'status' => 'Active & Secure',
            'trialBalance' => '$50.00'
        ]);
    } else {
        json_ok([
            'connected' => false,
            'message' => 'Bunny.net API response code: ' . $httpCode
        ]);
    }
}

// 8.2 Test Razorpay Connection Handshake
if ($action === 'test-razorpay' && ($method === 'GET' || $method === 'POST')) {
    $body = read_json_body();
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];

    $keyId = trim($body['razorpayKeyId'] ?? ($settings['razorpayKeyId'] ?? ''));
    $keySecret = trim($body['razorpayKeySecret'] ?? ($settings['razorpayKeySecret'] ?? ''));

    if (!$keyId || !$keySecret) {
        json_err('Please provide both Razorpay Key ID and Key Secret to test connection', 400);
    }

    $ch = curl_init("https://api.razorpay.com/v1/payments?count=1");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, "{$keyId}:{$keySecret}");
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $isTest = (strpos($keyId, 'test') !== false);
        json_ok([
            'connected' => true,
            'keyId' => $keyId,
            'mode' => $isTest ? 'Test Sandbox' : 'Live Production',
            'message' => 'Razorpay API credentials verified successfully! Ready to accept UPI & cards.'
        ]);
    } else {
        $data = json_decode($res, true);
        $errMsg = $data['error']['description'] ?? "HTTP {$httpCode} Unauthorized / Invalid credentials";
        json_err("Razorpay connection failed: {$errMsg}", 400);
    }
}

// 8.3 Test Fast2SMS Live OTP Delivery
if ($action === 'test-fast2sms' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $testPhone = preg_replace('/[^0-9]/', '', (string)$rawPhone);
    if (strlen($testPhone) === 12 && substr($testPhone, 0, 2) === '91') {
        $testPhone = substr($testPhone, 2);
    }

    $apiKey = clean_fast2sms_key($body['apiKey'] ?? '');
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    if (empty($apiKey)) {
        $apiKey = clean_fast2sms_key($settings['fast2smsApiKey'] ?? '');
    }
    $template = trim($body['template'] ?? ($settings['fast2smsOtpTemplate'] ?? ''));

    if (empty($apiKey)) {
        json_err('Fast2SMS API Key darj karein pehle', 400);
    }
    if (strlen($testPhone) < 10) {
        json_err('Valid 10-digit mobile number enter karein', 400);
    }

    $testOtp = strval(random_int(100000, 999999));
    $sendRes = send_fast2sms_otp($testPhone, $testOtp, $apiKey, $template);

    if ($sendRes['ok']) {
        json_ok([
            'success' => true,
            'message' => "Test OTP [{$testOtp}] successfully delivered to +91 {$testPhone} via Fast2SMS ({$sendRes['route']} route)!",
            'fast2smsResponse' => $sendRes['response'] ?? []
        ]);
    } else {
        json_err("Fast2SMS error: " . ($sendRes['error'] ?? 'Delivery failed'), 400);
    }
}

// 8.4 Check Fast2SMS Wallet Balance
if ($action === 'fast2sms-balance' && ($method === 'GET' || $method === 'POST')) {
    $body = read_json_body();
    $apiKey = clean_fast2sms_key($_GET['apiKey'] ?? ($body['apiKey'] ?? ''));
    if (empty($apiKey)) {
        $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
        $apiKey = clean_fast2sms_key($settings['fast2smsApiKey'] ?? '');
    }
    if (empty($apiKey)) {
        json_err('Fast2SMS API Key required', 400);
    }

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://www.fast2sms.com/dev/wallet",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "authorization: " . $apiKey,
            "Content-Type: application/json"
        ],
        CURLOPT_TIMEOUT => 8
    ]);
    $raw = curl_exec($curl);
    $curlErr = curl_error($curl);
    @curl_close($curl);

    if ($curlErr) {
        json_err("Connection failed: " . $curlErr, 502);
    }
    $res = json_decode($raw, true);
    if ($res && isset($res['wallet'])) {
        json_ok([
            'balance' => $res['wallet'],
            'currency' => 'INR'
        ]);
    } else {
        $msg = is_array($res['message'] ?? null) ? implode(', ', $res['message']) : ($res['message'] ?? 'Invalid key or wallet error');
        json_err($msg, 400);
    }
}

// 8.5 Test Brevo Live Email Delivery
if ($action === 'test-brevo' && $method === 'POST') {
    $body = read_json_body();
    $testEmail = strtolower(trim($body['email'] ?? ''));
    $apiKey = trim($body['apiKey'] ?? '');
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];

    if (empty($apiKey)) {
        $apiKey = trim($settings['brevoApiKey'] ?? '');
    }
    if (empty($apiKey)) {
        json_err('Brevo API Key darj karein pehle', 400);
    }
    if (!filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
        json_err('Valid email address enter karein', 400);
    }

    $testOtp = strval(random_int(100000, 999999));
    $senderEmail = !empty($settings['emailSender']) ? trim($settings['emailSender']) : 'support@quickartphotography.in';
    $senderName = !empty($settings['emailSenderName']) ? trim($settings['emailSenderName']) : 'Quick Art Photography Academy';
    $subject = "Your Quick Art Academy Verification OTP: {$testOtp}";

    $customMsg = !empty($settings['emailMessageCustom'])
        ? str_replace(['{otp}', '{email}'], [$testOtp, $testEmail], $settings['emailMessageCustom'])
        : "Dear Student,\n\nYour Quick Art Photography Academy portal verification code is: {$testOtp}\n\nValid for 10 minutes. Please do not share this OTP with anyone.\n\nWarm regards,\nAnil Sharma\nQuick Art Photography Academy\nHelpline: 9939800780";

    $html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0d1117;color:#e6edf3;padding:30px;margin:0;">'
          . '<div style="max-width:540px;margin:0 auto;background:#161b22;border:1px solid rgba(216,161,83,0.35);border-radius:14px;padding:32px;text-align:center;">'
          . '<div style="display:inline-block;padding:4px 12px;background:rgba(216,161,83,0.15);border:1px solid rgba(216,161,83,0.3);border-radius:9999px;font-size:11px;font-weight:700;color:#d8a153;letter-spacing:1px;margin-bottom:12px;">STUDENT LEARNING PORTAL</div>'
          . '<h2 style="color:#d8a153;margin:0 0 8px;font-size:22px;letter-spacing:0.5px;">Quick Art Photography Academy</h2>'
          . '<div style="background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:24px 20px;margin-bottom:24px;">'
          . '<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 18px;white-space:pre-line;">' . htmlspecialchars($customMsg) . '</p>'
          . '<div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#d8a153;background:rgba(216,161,83,0.1);padding:16px 24px;border-radius:8px;display:inline-block;border:1px solid rgba(216,161,83,0.35);">' . htmlspecialchars($testOtp) . '</div>'
          . '<p style="color:#f87171;font-size:12px;margin:18px 0 0;">Valid for 10 minutes. Do not share this OTP with anyone.</p>'
          . '</div>'
          . '</div></body></html>';

    $res = send_brevo_email($testEmail, $subject, $html, $apiKey, $senderEmail, $senderName);
    if ($res['ok']) {
        json_ok(['message' => "Test OTP [{$testOtp}] successfully delivered to {$testEmail} via Brevo!"]);
    } else {
        json_err("Brevo delivery failed: " . ($res['error'] ?? 'Unknown error'), 400);
    }
}

// 9. Get Transactions / Orders
if ($action === 'get-transactions' && $method === 'GET') {
    $txs = file_exists(LMS_TRANSACTIONS_FILE) ? json_decode(file_get_contents(LMS_TRANSACTIONS_FILE), true) : [];
    if (!is_array($txs)) $txs = [];
    $totalRevenue = 0;
    foreach ($txs as $t) {
        $totalRevenue += intval($t['amount'] ?? 0);
    }
    json_ok([
        'transactions' => array_reverse($txs),
        'totalRevenue' => $totalRevenue,
        'count' => count($txs)
    ]);
}

// 10. List Bunny.net Uploaded Videos
if ($action === 'list-bunny-videos' && $method === 'GET') {
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    $libraryId = $settings['bunnyLibraryId'] ?? '755385';
    $apiKey = $settings['bunnyApiKey'] ?? '';
    $collectionMap = array_flip($settings['collections'] ?? []);

    $ch = curl_init("https://video.bunnycdn.com/library/{$libraryId}/videos?page=1&itemsPerPage=100");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "AccessKey: {$apiKey}",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $data = json_decode($res, true);
        $items = $data['items'] ?? [];
        foreach ($items as &$item) {
            $colId = $item['collectionId'] ?? '';
            $item['courseKey'] = $collectionMap[$colId] ?? '';
        }
        unset($item);
        json_ok(['videos' => $items, 'total' => $data['totalItems'] ?? count($items)]);
    } else {
        json_ok(['videos' => [], 'total' => 0]);
    }
}

// 11. List Bunny.net Course Collections
if ($action === 'list-bunny-collections' && $method === 'GET') {
    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    $libraryId = $settings['bunnyLibraryId'] ?? '755385';
    $apiKey = $settings['bunnyApiKey'] ?? '';

    $ch = curl_init("https://video.bunnycdn.com/library/{$libraryId}/collections?page=1&itemsPerPage=50");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "AccessKey: {$apiKey}",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $res = curl_exec($ch);
    curl_close($ch);

    $data = $res ? json_decode($res, true) : null;
    json_ok(['collections' => $data['items'] ?? []]);
}

// 12. Create Video Object in Bunny Stream (Ready for Upload)
if ($action === 'create-bunny-video' && $method === 'POST') {
    $body = read_json_body();
    $title = trim($body['title'] ?? 'New Lesson Video');
    $collectionId = trim($body['collectionId'] ?? '');

    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    $libraryId = $settings['bunnyLibraryId'] ?? '755385';
    $apiKey = $settings['bunnyApiKey'] ?? '';

    $postData = ['title' => $title];
    if ($collectionId) {
        $postData['collectionId'] = $collectionId;
    }

    $ch = curl_init("https://video.bunnycdn.com/library/{$libraryId}/videos");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "AccessKey: {$apiKey}",
        "Content-Type: application/json",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $res) {
        $video = json_decode($res, true);
        json_ok([
            'created' => true,
            'videoId' => $video['guid'] ?? '',
            'libraryId' => $libraryId,
            'uploadApiKey' => $apiKey,
            'title' => $video['title'] ?? $title
        ]);
    } else {
        json_err('Failed to create video on Bunny.net (HTTP ' . $httpCode . ')', 500);
    }
}

// 13. Assign Bunny Video to Course Lesson
if ($action === 'assign-lesson-video' && $method === 'POST') {
    $body = read_json_body();
    $courseId = trim($body['courseId'] ?? '');
    $lessonId = trim($body['lessonId'] ?? '');
    $videoId  = trim($body['videoId'] ?? '');
    $duration = trim($body['duration'] ?? '');

    if (!$courseId || !$lessonId || !$videoId) {
        json_err('courseId, lessonId, and videoId are required', 400);
    }

    $courses = get_all_courses();
    $updated = false;
    foreach ($courses as &$c) {
        if ($c['id'] === $courseId) {
            foreach ($c['modules'] as &$m) {
                foreach ($m['lessons'] as &$l) {
                    if ($l['id'] === $lessonId) {
                        $l['videoId'] = $videoId;
                        if (preg_match('/^https?:\/\//i', $videoId)) {
                            $l['videoUrl'] = $videoId;
                        }
                        if ($duration) $l['duration'] = $duration;
                        $updated = true;
                        break 3;
                    }
                }
            }
        }
    }
    unset($c, $m, $l);

    if (!$updated) {
        json_err('Course or Lesson not found', 404);
    }

    save_all_courses($courses);
    json_ok(['updated' => true, 'message' => "Video {$videoId} successfully assigned to {$lessonId}"]);
}

// 14. Get Signed Bunny Video Preview for Admin
if ($action === 'get-bunny-preview' && ($method === 'GET' || $method === 'POST')) {
    $videoId = trim($_GET['videoId'] ?? ($_POST['videoId'] ?? ''));
    if (!$videoId) {
        $body = read_json_body();
        $videoId = trim($body['videoId'] ?? '');
    }
    if (!$videoId) json_err('videoId is required', 400);

    $settings = file_exists(LMS_SETTINGS_FILE) ? json_decode(file_get_contents(LMS_SETTINGS_FILE), true) : [];
    $libraryId = $settings['bunnyLibraryId'] ?? '755385';
    $tokenKey  = $settings['bunnyTokenAuthKey'] ?? '';

    $expires = time() + 3600 * 4; // 4 hours
    $hashString = $tokenKey . $videoId . $expires;
    $token = hash('sha256', $hashString);
    $embedUrl = "https://iframe.mediadelivery.net/embed/{$libraryId}/{$videoId}?token={$token}&expires={$expires}";

    json_ok([
        'videoId' => $videoId,
        'embedUrl' => $embedUrl,
        'expires' => $expires
    ]);
}

// 15. Get All Coupons
if ($action === 'get-coupons' && $method === 'GET') {
    $coupons = get_all_coupons();
    json_ok(['coupons' => $coupons]);
}

// 16. Save / Create Coupon
if ($action === 'save-coupon' && $method === 'POST') {
    $body = read_json_body();
    $coupon = $body['coupon'] ?? null;
    if (!is_array($coupon) || empty($coupon['code'])) {
        json_err('Coupon code is required', 400);
    }

    $coupon['code'] = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', trim($coupon['code'])));
    $coupon['discount'] = floatval($coupon['discount'] ?? 0);
    $coupon['type'] = in_array($coupon['type'] ?? '', ['flat', 'percent']) ? $coupon['type'] : 'percent';
    $coupon['maxDiscount'] = !empty($coupon['maxDiscount']) ? intval($coupon['maxDiscount']) : null;
    $coupon['minAmount'] = !empty($coupon['minAmount']) ? intval($coupon['minAmount']) : 0;
    $coupon['courseId'] = trim($coupon['courseId'] ?? 'all') ?: 'all';
    $coupon['expiry'] = trim($coupon['expiry'] ?? date('Y-12-31'));
    $coupon['active'] = !isset($coupon['active']) || !empty($coupon['active']);
    $coupon['uses'] = intval($coupon['uses'] ?? 0);
    $coupon['description'] = trim($coupon['description'] ?? '');

    $coupons = get_all_coupons();
    $found = false;
    foreach ($coupons as &$c) {
        if (strtoupper($c['code']) === $coupon['code']) {
            $coupon['uses'] = $c['uses'] ?? $coupon['uses']; // preserve uses count
            $c = $coupon;
            $found = true;
            break;
        }
    }
    unset($c);

    if (!$found) {
        $coupons[] = $coupon;
    }

    save_all_coupons($coupons);
    json_ok(['coupon' => $coupon]);
}

// 17. Delete Coupon
if ($action === 'delete-coupon' && $method === 'POST') {
    $body = read_json_body();
    $code = strtoupper(trim($body['code'] ?? ''));
    if (!$code) json_err('Coupon code is required', 400);

    $coupons = get_all_coupons();
    $filtered = array_values(array_filter($coupons, function($c) use ($code) {
        return strtoupper($c['code'] ?? '') !== $code;
    }));

    save_all_coupons($filtered);
    json_ok(['deleted' => true, 'code' => $code]);
}

// 18. Upload Practice File / Resource Attachment
if ($action === 'upload-resource' && $method === 'POST') {
    if (empty($_FILES['file'])) {
        json_err('No file uploaded', 400);
    }
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        json_err('Upload error code: ' . $file['error'], 400);
    }

    $uploadDir = __DIR__ . '/../uploads/practice-files';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $origName = basename($file['name']);
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $safeName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
    $finalName = $safeName . '_' . substr(md5(uniqid()), 0, 6) . ($ext ? '.' . $ext : '');
    $dest = $uploadDir . '/' . $finalName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_err('Failed to save uploaded file to disk', 500);
    }

    json_ok([
        'url'  => '/uploads/practice-files/' . $finalName,
        'name' => $origName,
        'size' => $sizeFormatted,
        'type' => $ext
    ]);
}

// 19. Upload Course Thumbnail / Poster Image
if ($action === 'upload-thumbnail' && $method === 'POST') {
    if (empty($_FILES['file'])) {
        json_err('No image file uploaded', 400);
    }
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        json_err('Upload error code: ' . $file['error'], 400);
    }

    $uploadDir = __DIR__ . '/../uploads/thumbnails';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $origName = basename($file['name']);
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($ext, $allowed)) {
        json_err('Invalid image format. Allowed: JPG, PNG, WEBP', 400);
    }

    $finalName = 'thumb_' . substr(md5(uniqid()), 0, 8) . '.' . $ext;
    $dest = $uploadDir . '/' . $finalName;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_err('Failed to save uploaded image to disk', 500);
    }

    json_ok([
        'url'  => 'uploads/thumbnails/' . $finalName,
        'name' => $origName
    ]);
}

json_err('Unknown action', 404);



