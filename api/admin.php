<?php
// api/admin.php — All admin endpoints in one file, dispatched by ?action=
// Uses X-Admin-Pass header for auth (except ?action=login).

require_once __DIR__ . '/_helpers.php';
send_cors();

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ----- setup-admin (first-run only, public but idempotent) -----
if ($action === 'setup-admin' && $method === 'POST') {
    $settings = load_settings();
    if (!empty($settings['adminPasswordHash'])) {
        json_err('Admin password already set. Use login.', 409);
    }
    $body = read_json_body();
    $pw = $body['password'] ?? '';
    if (!is_string($pw) || strlen($pw) < 8) {
        json_err('Password must be at least 8 characters', 400);
    }
    $settings['adminPasswordHash'] = password_hash($pw, PASSWORD_DEFAULT);
    save_settings($settings);
    $token = create_session();
    json_ok(['token' => $token, 'setupComplete' => true]);
}

// ----- setup-status (public — tells admin.html which screen to show) -----
if ($action === 'setup-status' && $method === 'GET') {
    $settings = load_settings();
    json_ok(['setupComplete' => !empty($settings['adminPasswordHash'])]);
}

// ----- login (public, rate-limited) -----
if ($action === 'login' && $method === 'POST') {
    $store = login_rate_check();
    $body = read_json_body();
    $pw = $body['password'] ?? '';
    $settings = load_settings();
    if (empty($settings['adminPasswordHash'])) {
        json_err('Admin not set up yet. Use setup-admin first.', 409);
    }
    if (!is_string($pw) || !password_verify($pw, $settings['adminPasswordHash'])) {
        login_rate_record_fail($store);
        json_err('Invalid password', 401);
    }
    $token = create_session();
    json_ok(['token' => $token]);
}

// ----- logout -----
if ($action === 'logout' && $method === 'POST') {
    $tok = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? ($_SERVER['HTTP_X_ADMIN_PASS'] ?? '');
    if ($tok) destroy_session($tok);
    json_ok(['loggedOut' => true]);
}

$settings = require_admin();

if ($action === 'leads' && $method === 'GET') {
    $leads = load_leads();
    foreach ($leads as &$l) {
        if (!isset($l['status']))            $l['status']            = 'new';
        if (!isset($l['followUpDate']))      $l['followUpDate']      = null;
        if (!isset($l['notes']))             $l['notes']             = [];
        // Leads saved before webhook-status tracking existed won't have these.
        if (!array_key_exists('webhookConfigured', $l)) $l['webhookConfigured'] = null;
        if (!array_key_exists('webhookOk', $l))         $l['webhookOk']         = null;
        if (!array_key_exists('webhookError', $l))      $l['webhookError']      = null;
    }
    unset($l);
    json_ok(['leads' => $leads]);
}

if ($action === 'stats' && $method === 'GET') {
    $leads = load_leads();
    $total = count($leads);
    $today = date('Y-m-d');
    $sevenDaysAgo = date('c', time() - 7 * 24 * 60 * 60);
    $last7 = 0; $todayCount = 0; $byCourse = []; $byStatus = [];
    $dueToday = 0; $overdue = 0; $dueThisWeek = 0;
    $weekEnd = date('Y-m-d', time() + 7 * 24 * 60 * 60);
    foreach ($leads as $l) {
        $ca = $l['createdAt'] ?? '';
        if ($ca >= $sevenDaysAgo) $last7++;
        if (substr($ca, 0, 10) === $today) $todayCount++;
        $c = $l['course'] ?? 'Unspecified';
        if (!isset($byCourse[$c])) $byCourse[$c] = 0;
        $byCourse[$c]++;
        $status = $l['status'] ?? 'new';
        if (!isset($byStatus[$status])) $byStatus[$status] = 0;
        $byStatus[$status]++;
        $fu = $l['followUpDate'] ?? null;
        if ($fu && !in_array($status, ['enrolled','not-interested','junk'], true)) {
            if ($fu === $today) $dueToday++;
            elseif ($fu < $today) $overdue++;
            if ($fu >= $today && $fu <= $weekEnd) $dueThisWeek++;
        }
    }
    arsort($byCourse);
    $byCourseArr = [];
    foreach ($byCourse as $c => $n) $byCourseArr[] = ['course' => $c ?: 'Unspecified', 'count' => $n];
    json_ok([
        'total' => $total, 'last7' => $last7, 'today' => $todayCount,
        'byCourse' => $byCourseArr, 'byStatus' => $byStatus,
        'followUp' => ['dueToday' => $dueToday, 'overdue' => $overdue, 'dueThisWeek' => $dueThisWeek],
    ]);
}

if ($action === 'update-lead' && $method === 'POST') {
    $body = read_json_body();
    $id = trim($body['id'] ?? '');
    if ($id === '') json_err('id required', 400);
    $allowedStatuses = ['new','contacted','follow-up','interested','enrolled','not-interested','junk'];
    $leads = load_leads();
    $updated = null;
    foreach ($leads as &$l) {
        if (($l['id'] ?? '') !== $id) continue;
        if (!isset($l['notes'])) $l['notes'] = [];
        if (isset($body['status'])) {
            $s = trim($body['status']);
            if (!in_array($s, $allowedStatuses, true)) json_err('Invalid status', 400);
            $l['status'] = $s;
        }
        if (array_key_exists('followUpDate', $body)) {
            $fu = $body['followUpDate'];
            if ($fu === null || $fu === '') $l['followUpDate'] = null;
            elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fu)) $l['followUpDate'] = $fu;
            else json_err('followUpDate must be YYYY-MM-DD', 400);
        }
        if (!empty($body['note']) && is_string($body['note'])) {
            $l['notes'][] = ['at' => date('c'), 'text' => trim(substr($body['note'], 0, 1000))];
        }
        $l['updatedAt'] = date('c');
        $updated = $l;
        break;
    }
    unset($l);
    if (!$updated) json_err('Lead not found', 404);
    save_leads($leads);
    json_ok(['lead' => $updated]);
}

if ($action === 'lead' && $method === 'DELETE') {
    $body = read_json_body();
    if (empty($body['id'])) $body['id'] = $_GET['id'] ?? '';
    if (empty($body['id'])) json_err('id required', 400);
    $leads = load_leads();
    $before = count($leads);
    $leads = array_values(array_filter($leads, function ($l) use ($body) {
        return ($l['id'] ?? '') !== $body['id'];
    }));
    save_leads($leads);
    json_ok(['removed' => $before - count($leads)]);
}

if ($action === 'settings' && $method === 'GET') {
    json_ok([
        'webhookUrl'           => $settings['webhookUrl'] ?? '',
        'teamPhone'            => $settings['teamPhone']  ?? DEFAULT_TEAM_PHONE,
        'webhookMethod'        => $settings['webhookMethod'] ?? DEFAULT_METHOD,
        'webhookPayloadFormat' => $settings['webhookPayloadFormat'] ?? DEFAULT_PAYLOAD_FMT,
        'webhookHeaders'       => $settings['webhookHeaders'] ?? '',
        'updatedAt'            => $settings['updatedAt']  ?? null,
    ]);
}

if ($action === 'settings' && $method === 'POST') {
    $body = read_json_body();
    $webhook = isset($body['webhookUrl']) ? trim($body['webhookUrl']) : '';
    $phone   = isset($body['teamPhone']) ? trim($body['teamPhone']) : DEFAULT_TEAM_PHONE;
    $wMethod = strtoupper(trim($body['webhookMethod'] ?? DEFAULT_METHOD));
    $wFormat = strtolower(trim($body['webhookPayloadFormat'] ?? DEFAULT_PAYLOAD_FMT));
    $wHeaders = isset($body['webhookHeaders']) ? trim($body['webhookHeaders']) : '';

    if ($webhook !== '' && !preg_match('#^https?://.+#i', $webhook)) {
        json_err('Invalid webhook URL. Must start with http:// or https://', 400);
    }
    if (!in_array($wMethod, ['POST', 'GET'], true)) json_err('webhookMethod must be POST or GET', 400);
    if (!in_array($wFormat, ['json', 'form', 'query'], true)) json_err('webhookPayloadFormat must be json/form/query', 400);
    if ($wHeaders !== '') {
        // Try to parse — if it's JSON, validate; otherwise it must be Key: Value lines
        $tryJson = json_decode($wHeaders, true);
        if ($tryJson === null && json_last_error() !== JSON_ERROR_NONE) {
            // Not JSON — check line format
            foreach (preg_split('/\r?\n/', $wHeaders) as $line) {
                $line = trim($line);
                if ($line === '') continue;
                if (strpos($line, ':') === false) {
                    json_err('webhookHeaders: each line must be "Key: Value" or the whole field must be valid JSON', 400);
                }
            }
        }
    }

    $newSettings = [
        'adminPasswordHash'    => $settings['adminPasswordHash'],
        'webhookUrl'           => $webhook,
        'teamPhone'            => $phone,
        'webhookMethod'        => $wMethod,
        'webhookPayloadFormat' => $wFormat,
        'webhookHeaders'       => $wHeaders,
    ];

    if (!empty($body['newAdminPassword']) && is_string($body['newAdminPassword'])) {
        $np = trim($body['newAdminPassword']);
        if (strlen($np) < 8) json_err('newAdminPassword must be at least 8 chars', 400);
        $newSettings['adminPasswordHash'] = password_hash($np, PASSWORD_DEFAULT);
        // Invalidate all existing sessions so the old token stops working
        destroy_all_sessions();
    }

    save_settings($newSettings);
    json_ok([
        'webhookUrl'           => $newSettings['webhookUrl'],
        'teamPhone'            => $newSettings['teamPhone'],
        'webhookMethod'        => $newSettings['webhookMethod'],
        'webhookPayloadFormat' => $newSettings['webhookPayloadFormat'],
        'webhookHeaders'       => $newSettings['webhookHeaders'],
    ]);
}

if ($action === 'test-webhook' && $method === 'POST') {
    $body = read_json_body();
    $lead = [
        'id'        => 'test-' . time(),
        'name'      => $body['name']  ?? 'Test Lead',
        'phone'     => $body['phone'] ?? '+919999999999',
        'city'      => 'Siwan',
        'course'    => 'Webhook Test',
        'message'   => 'Yeh test webhook admin dashboard se bheja gaya.',
        'source'    => 'admin-test',
        'createdAt' => date('c'),
    ];
    $r = trigger_webhook($lead);
    json_ok(['result' => $r]);
}

json_err('Unknown action or method', 404);
