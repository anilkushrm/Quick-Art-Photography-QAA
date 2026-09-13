<?php
// api/leads.php — Public endpoint for the lead form.
// Saves the lead to data/leads.json and fires the Aibotflow webhook.

require_once __DIR__ . '/_helpers.php';
send_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_err('Only POST allowed', 405);
}

$body = read_json_body();
foreach (['name', 'phone', 'city', 'course', 'message', 'source'] as $field) {
    if (isset($body[$field]) && !is_string($body[$field])) json_err('Invalid form field', 400);
}
$name  = trim($body['name']  ?? '');
$phone = trim($body['phone'] ?? '');
if ($name === '' || $phone === '') {
    json_err('Name and phone are required', 400);
}
if (strlen(preg_replace('/\D/', '', $phone)) < 8) json_err('Please enter a valid phone number', 400);

$lead = [
    'id'        => uuid4(),
    'name'      => substr($name, 0, 120),
    'phone'     => substr($phone, 0, 30),
    'city'      => substr(trim($body['city']    ?? ''), 0, 120),
    'course'    => substr(trim($body['course']  ?? ''), 0, 120),
    'message'   => substr(trim($body['message'] ?? ''), 0, 2000),
    'source'    => substr(trim($body['source']  ?? 'website'), 0, 60),
    'status'    => 'new',
    'createdAt' => date('c'),
];

// Lock the entire read-modify-write operation to preserve simultaneous enquiries.
if (!is_dir(DATA_DIR) && !@mkdir(DATA_DIR, 0755, true)) {
    json_err('Enquiry storage is unavailable. Please contact the academy.', 503);
}
$fp = @fopen(LEADS_FILE, 'c+');
if (!$fp || !flock($fp, LOCK_EX)) {
    if ($fp) fclose($fp);
    json_err('Unable to save enquiry. Please try again.', 503);
}
$raw = stream_get_contents($fp);
$leads = $raw === '' ? [] : json_decode($raw, true);
if (!is_array($leads)) {
    flock($fp, LOCK_UN); fclose($fp);
    json_err('Enquiry storage needs administrator attention.', 503);
}
array_unshift($leads, $lead);
$encoded = json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
rewind($fp);
$saved = $encoded !== false && fwrite($fp, $encoded) === strlen($encoded);
if ($saved) $saved = ftruncate($fp, strlen($encoded)) && fflush($fp);
flock($fp, LOCK_UN); fclose($fp);
if (!$saved) json_err('Unable to save enquiry. Please try again.', 503);

$whResult = trigger_webhook($lead);

// Persist the webhook delivery outcome onto the saved lead so a failure
// (bad URL, workflow paused, network hiccup) is visible in the admin
// dashboard instead of silently disappearing — previously $whResult was
// discarded here and never written anywhere.
$notConfigured = ($whResult['error'] ?? '') === 'webhook not configured';
$fp2 = @fopen(LEADS_FILE, 'c+');
if ($fp2 && flock($fp2, LOCK_EX)) {
    $raw2 = stream_get_contents($fp2);
    $leads2 = json_decode($raw2, true);
    if (is_array($leads2)) {
        foreach ($leads2 as &$l2) {
            if (($l2['id'] ?? '') === $lead['id']) {
                $l2['webhookConfigured'] = !$notConfigured;
                $l2['webhookOk']         = $notConfigured ? null : (bool)($whResult['ok'] ?? false);
                $l2['webhookError']      = $notConfigured ? null : ($whResult['error'] ?: null);
                $l2['webhookAt']         = date('c');
                break;
            }
        }
        unset($l2);
        $encoded2 = json_encode($leads2, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($encoded2 !== false) {
            rewind($fp2);
            fwrite($fp2, $encoded2);
            ftruncate($fp2, strlen($encoded2));
            fflush($fp2);
        }
    }
    flock($fp2, LOCK_UN);
    fclose($fp2);
} elseif ($fp2) {
    fclose($fp2);
}

json_ok(['id' => $lead['id']]);
