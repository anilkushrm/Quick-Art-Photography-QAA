<?php
// api/_notifications.php — Push Notifications & In-App Alerts Service
// Quick Art Photography Academy LMS

if (!defined('DATA_DIR')) {
    define('DATA_DIR', __DIR__ . '/../data');
}

if (!defined('LMS_PUSH_SUBS_FILE')) {
    define('LMS_PUSH_SUBS_FILE', DATA_DIR . '/push-subscriptions.json');
}

if (!defined('LMS_NOTIFICATIONS_FILE')) {
    define('LMS_NOTIFICATIONS_FILE', DATA_DIR . '/notifications.json');
}

function load_push_subscriptions() {
    if (!file_exists(LMS_PUSH_SUBS_FILE)) return [];
    $raw = @file_get_contents(LMS_PUSH_SUBS_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_push_subscriptions($subs) {
    if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0755, true);
    file_put_contents(LMS_PUSH_SUBS_FILE, json_encode(array_values($subs), JSON_PRETTY_PRINT), LOCK_EX);
}

function load_notifications() {
    if (!file_exists(LMS_NOTIFICATIONS_FILE)) return [];
    $raw = @file_get_contents(LMS_NOTIFICATIONS_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function save_notifications($notifs) {
    if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0755, true);
    // Keep max latest 200 notifications to prevent unbounded growth
    if (count($notifs) > 200) {
        $notifs = array_slice($notifs, 0, 200);
    }
    file_put_contents(LMS_NOTIFICATIONS_FILE, json_encode(array_values($notifs), JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * Register or update a student's push subscription
 */
function register_student_push_sub($studentId, $phone, $courses, $subData) {
    $endpoint = trim($subData['endpoint'] ?? '');
    if (!$endpoint) return false;

    $subs = load_push_subscriptions();
    $subKey = md5($endpoint);

    $entry = [
        'id'          => $subKey,
        'endpoint'    => $endpoint,
        'keys'        => $subData['keys'] ?? [],
        'studentId'   => trim((string)$studentId),
        'phone'       => clean_phone($phone),
        'courses'     => is_array($courses) ? $courses : [],
        'userAgent'   => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        'updatedAt'   => date('c')
    ];

    $subs[$subKey] = $entry;
    save_push_subscriptions($subs);
    return true;
}

/**
 * Find student IDs relevant to a live class or course
 */
function get_relevant_student_ids_for_course($courseId, $type = 'course') {
    $file = DATA_DIR . '/students.json';
    $students = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
    $matchedStudentIds = [];

    $isAll = ($courseId === 'all' || $courseId === '*' || $type === 'workshop');

    foreach ($students as $stu) {
        $sid = $stu['id'] ?? '';
        if (!$sid) continue;

        if ($isAll) {
            $matchedStudentIds[] = $sid;
            continue;
        }

        $enrolled = $stu['enrolledCourses'] ?? [];
        if (is_array($enrolled) && in_array($courseId, $enrolled)) {
            $matchedStudentIds[] = $sid;
        }
    }

    return array_values(array_unique($matchedStudentIds));
}

/**
 * Dispatch Push Notification & store in notification hub
 */
function send_live_class_push_notification($liveClass, $title = '', $bodyText = '', $targetUrl = '') {
    $classId  = $liveClass['id'] ?? '';
    $courseId = $liveClass['courseId'] ?? 'all';
    $type     = $liveClass['type'] ?? 'course';
    $classTitle = $liveClass['title'] ?? 'Live Masterclass';

    if (!$title) {
        $title = "🔴 Your Class is Live Now — Tap to Join";
    }
    if (!$bodyText) {
        $bodyText = "Mentor Anil Sharma is LIVE on '{$classTitle}'. Tap here to join the interactive studio!";
    }
    if (!$targetUrl) {
        $targetUrl = "/app/?tab=live&id=" . urlencode($classId);
    }

    $recipientStudentIds = get_relevant_student_ids_for_course($courseId, $type);

    $notifId = 'notif_live_' . substr(md5($classId . microtime()), 0, 10);
    $notif = [
        'id'          => $notifId,
        'type'        => 'live_class',
        'title'       => $title,
        'body'        => $bodyText,
        'url'         => $targetUrl,
        'classId'     => $classId,
        'courseId'    => $courseId,
        'classTitle'  => $classTitle,
        'recipients'  => $recipientStudentIds,
        'isBroadcast' => ($courseId === 'all' || $type === 'workshop'),
        'createdAt'   => date('c'),
        'readBy'      => []
    ];

    // Prepend to notifications list
    $allNotifs = load_notifications();
    array_unshift($allNotifs, $notif);
    save_notifications($allNotifs);

    // Send to web push endpoints
    dispatch_web_push_payload($recipientStudentIds, [
        'title' => $title,
        'body'  => $bodyText,
        'url'   => $targetUrl,
        'tag'   => 'live_' . $classId,
        'badge' => '/home-assets/ec55a6be3747a9.webp',
        'icon'  => '/home-assets/ec55a6be3747a9.webp'
    ]);

    return [
        'ok'          => true,
        'notification'=> $notif,
        'recipientCount' => count($recipientStudentIds)
    ];
}

/**
 * Dispatch manual announcement or class reminder from Admin
 */
function send_custom_push_announcement($title, $bodyText, $targetCourseId = 'all', $targetUrl = '/app/', $type = 'announcement') {
    $recipientStudentIds = get_relevant_student_ids_for_course($targetCourseId, 'course');

    $notifId = 'notif_ann_' . substr(md5(microtime()), 0, 10);
    $notif = [
        'id'          => $notifId,
        'type'        => $type,
        'title'       => $title,
        'body'        => $bodyText,
        'url'         => $targetUrl ?: '/app/',
        'courseId'    => $targetCourseId,
        'recipients'  => $recipientStudentIds,
        'isBroadcast' => ($targetCourseId === 'all'),
        'createdAt'   => date('c'),
        'readBy'      => []
    ];

    $allNotifs = load_notifications();
    array_unshift($allNotifs, $notif);
    save_notifications($allNotifs);

    dispatch_web_push_payload($recipientStudentIds, [
        'title' => $title,
        'body'  => $bodyText,
        'url'   => $targetUrl ?: '/app/',
        'tag'   => 'ann_' . $notifId,
        'badge' => '/home-assets/ec55a6be3747a9.webp',
        'icon'  => '/home-assets/ec55a6be3747a9.webp'
    ]);

    return [
        'ok'          => true,
        'notification'=> $notif,
        'recipientCount' => count($recipientStudentIds)
    ];
}

/**
 * Send WebPush payload via cURL to registered subscriptions
 */
function dispatch_web_push_payload($recipientStudentIds, $payload) {
    $subs = load_push_subscriptions();
    if (empty($subs)) return;

    $jsonPayload = json_encode($payload);

    foreach ($subs as $sub) {
        $sid = $sub['studentId'] ?? '';
        $endpoint = $sub['endpoint'] ?? '';
        if (!$endpoint) continue;

        // If recipient list is provided, filter; otherwise send if all
        if (!empty($recipientStudentIds) && !in_array($sid, $recipientStudentIds)) {
            continue;
        }

        // WebPush POST request
        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'TTL: 86400',
                'Urgency: high'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 3,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_SSL_VERIFYPEER => true
        ]);
        @curl_exec($ch);
        @curl_close($ch);
    }
}

/**
 * Get notifications for a student
 */
function get_student_notifications_list($studentId, $enrolledCourses = []) {
    $notifs = load_notifications();
    $result = [];

    foreach ($notifs as $n) {
        $isRecipient = false;

        if (!empty($n['isBroadcast'])) {
            $isRecipient = true;
        } elseif (!empty($n['recipients']) && in_array($studentId, $n['recipients'])) {
            $isRecipient = true;
        } elseif (!empty($n['courseId']) && in_array($n['courseId'], $enrolledCourses)) {
            $isRecipient = true;
        }

        if ($isRecipient) {
            $isRead = !empty($n['readBy']) && in_array($studentId, $n['readBy']);
            $copy = $n;
            unset($copy['recipients']); // Don't expose other student IDs
            $copy['isRead'] = $isRead;
            $result[] = $copy;
        }
    }

    return $result;
}
