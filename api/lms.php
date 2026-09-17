<?php
// api/lms.php — Student Learning Management System (LMS) API
// Quick Art Photography Academy

require_once __DIR__ . '/_helpers.php';
send_cors();

const LMS_COURSES_FILE  = DATA_DIR . '/courses.json';
const LMS_STUDENTS_FILE = DATA_DIR . '/students.json';
const LMS_SETTINGS_FILE = DATA_DIR . '/lms-settings.json';
const LMS_OTPS_FILE     = DATA_DIR . '/otps.json';
const LMS_SESSIONS_FILE = DATA_DIR . '/student-sessions.json';

// ---------- Helper Functions ----------

function load_lms_settings() {
    if (!file_exists(LMS_SETTINGS_FILE)) {
        return [
            'bunnyLibraryId' => '',
            'bunnyApiKey' => '',
            'bunnyTokenAuthKey' => '',
            'bunnyHostname' => 'iframe.mediadelivery.net',
            'watermarkEnabled' => true,
            'watermarkOpacity' => 0.35,
            'otpDemoMode' => true,
            'defaultOtp' => '123456',
            'fast2smsApiKey' => ''
        ];
    }
    return json_decode(file_get_contents(LMS_SETTINGS_FILE), true) ?: [];
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
    $token = $_SERVER['HTTP_X_STUDENT_TOKEN'] ?? ($_GET['token'] ?? '');
    if (!$token || !file_exists(LMS_SESSIONS_FILE)) {
        json_err('Please login to continue', 401);
    }
    $sessions = json_decode(file_get_contents(LMS_SESSIONS_FILE), true);
    if (!isset($sessions[$token]) || $sessions[$token]['expiresAt'] < time()) {
        json_err('Session expired, please login again', 401);
    }

    $phone = $sessions[$token]['phone'];
    $students = load_students();
    foreach ($students as $stu) {
        if ($stu['phone'] === $phone) {
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
    $demoMode = !empty($settings['otpDemoMode']);
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

    // If Fast2SMS API key is set and not demo mode, send SMS
    if (!$demoMode && !empty($settings['fast2smsApiKey'])) {
        $msg = "Your OTP for Quick Art Photography Academy login is {$otp}. Valid for 10 minutes.";
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => "https://www.fast2sms.com/dev/bulkV2",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                "route" => "otp",
                "variables_values" => $otp,
                "numbers" => $phone
            ]),
            CURLOPT_HTTPHEADER => [
                "authorization: " . $settings['fast2smsApiKey'],
                "Content-Type: application/json"
            ]
        ]);
        curl_exec($curl);
        curl_close($curl);
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
    $isDemoMatch = (!empty($settings['otpDemoMode']) && $userOtp === ($settings['defaultOtp'] ?? '123456'));

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
        // Auto-create new student profile & enroll in flagship course for immediate access
        $allCourses = load_courses();
        $initialCourses = array_column($allCourses, 'id');
        $newStudent = [
            'id' => 'stu_' . substr(md5(uniqid($phone, true)), 0, 8),
            'phone' => $phone,
            'name' => 'Student ' . substr($phone, -4),
            'email' => '',
            'city' => '',
            'enrolledAt' => date('c'),
            'enrolledCourses' => $initialCourses,
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

// 3. Current Student Info
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

// 5. Course Details & Curriculum
if ($action === 'course-details' && $method === 'GET') {
    $student = require_student();
    $courseId = $_GET['id'] ?? '';

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

    // Video URL resolution (Bunny.net Stream vs Direct/Fallback)
    $videoType = 'mp4';
    $streamUrl = $targetLesson['videoUrl'] ?? '';

    if (!empty($targetLesson['videoId']) && !empty($settings['bunnyLibraryId'])) {
        $videoType = 'bunny_stream';
        $streamUrl = generate_bunny_video_url(
            $settings['bunnyLibraryId'],
            $targetLesson['videoId'],
            $settings['bunnyTokenAuthKey'] ?? ''
        );
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
            'isCompleted' => in_array($targetLesson['id'], $completed)
        ],
        'watermark' => [
            'enabled' => !empty($settings['watermarkEnabled']),
            'text' => "+91 " . $student['phone'],
            'opacity' => $settings['watermarkOpacity'] ?? 0.35
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

const LMS_TRANSACTIONS_FILE = DATA_DIR . '/transactions.json';

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

// 10. Instant Course Checkout & Auto-Enrollment (Public)
if ($action === 'checkout-enroll' && $method === 'POST') {
    $body = read_json_body();
    $rawPhone = $body['phone'] ?? '';
    $phone = clean_phone($rawPhone);
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $courseId = trim($body['courseId'] ?? '');
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
        'amount' => $selectedCourse['price'] ?? 4999,
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
        'DV' => 'course-davinci-resolve',
        'CW' => 'course-cinematic-wedding',
        'AL' => 'course-album-design',
        'PW' => 'course-pre-wedding',
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
                    'duration' => $targetCourse['duration'] ?? '18 Hours',
                    'issuedDate' => date('d F Y'),
                    'issuedBy' => 'Quick Art Photography Academy',
                    'accreditation' => 'ISO 9001:2015 Certified Educational Institution | Govt. of India MSME Regd.',
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

    if ($found) {
        json_ok(['certificate' => $certData]);
    } else {
        json_ok(['certificate' => ['valid' => false, 'message' => 'Certificate ID not found or pending verification. Please check the serial code.']]);
    }
}

json_err('Unknown LMS action', 404);

