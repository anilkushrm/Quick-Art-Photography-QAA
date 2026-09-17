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
        'bunnyLibraryId' => trim($body['bunnyLibraryId'] ?? ''),
        'bunnyApiKey' => trim($body['bunnyApiKey'] ?? ''),
        'bunnyTokenAuthKey' => trim($body['bunnyTokenAuthKey'] ?? ''),
        'bunnyHostname' => trim($body['bunnyHostname'] ?? 'iframe.mediadelivery.net'),
        'bunnyAccountApiKey' => trim($body['bunnyAccountApiKey'] ?? ($currSettings['bunnyAccountApiKey'] ?? '')),
        'watermarkEnabled' => !empty($body['watermarkEnabled']),
        'watermarkOpacity' => floatval($body['watermarkOpacity'] ?? 0.35),
        'otpDemoMode' => !empty($body['otpDemoMode']),
        'defaultOtp' => trim($body['defaultOtp'] ?? '123456'),
        'fast2smsApiKey' => trim($body['fast2smsApiKey'] ?? ''),
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

json_err('Unknown action', 404);



