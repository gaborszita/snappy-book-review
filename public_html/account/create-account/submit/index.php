<?php
require_once('../../../../resources/config.php');

$nameregex = '/^[a-zA-Z ]{1,255}$/';
$emailregex = '/^(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){255,})(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){65,}@)(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22))(?:\.(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22)))*@(?:(?:(?!.*[^.]{64,})(?:(?:(?:xn--)?[a-z0-9]+(?:-[a-z0-9]+)*\.){1,126}){1,}(?:(?:[a-z][a-z0-9]*)|(?:(?:xn--)[a-z0-9]+))(?:-[a-z0-9]+)*)|(?:\[(?:(?:IPv6:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})|(?:(?!(?:.*[a-f0-9][:\]]){7,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?)))|(?:(?:IPv6:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){5}:)|(?:(?!(?:.*[a-f0-9]:){5,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3}:)?)))?(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))(?:\.(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))){3}))\]))$/iD';
$passwordregex = '/(?=.*\d)(?=.*[a-zA-Z]).{8,20}/';

$datavalid = isset($_POST['firstname']) && isset($_POST['lastname']) && 
    isset($_POST['email']) && isset($_POST['password']) && preg_match(
    $nameregex, $_POST['firstname']) && preg_match($nameregex, $_POST
    ['lastname']) && 
    preg_match($emailregex, $_POST['email']) && strlen($_POST
    ['email']) <= 254 && preg_match($passwordregex, $_POST['password']);

if(!$datavalid) {
    http_response_code(400);
    die('Invalid data.');
}

$passwordhash = password_hash($_POST['password'], PASSWORD_DEFAULT);

$conn = new mysqli(
    $config['db']['host'], 
    $config['db']['username'], 
    $config['db']['password'], 
    $config['db']['dbname']
);
if ($conn->connect_error) {
    error_log('Failed to connect to database.');
    http_response_code(500);
    die('Internal server error.');
}

$emailconfirmationhash = md5(openssl_random_pseudo_bytes(20));

$query = "INSERT INTO users (firstname, lastname, email, password, " .
"accountstatus, email_verification_link) VALUES ('" . 
$conn->real_escape_string($_POST['firstname']) . "', " . "'" . 
$conn->real_escape_string($_POST['lastname']) . "', '" . 
$conn->real_escape_string($_POST['email']) . "', '" . 
$conn->real_escape_string($passwordhash) . "', 'pendingactivation', '" . 
$conn->real_escape_string($emailconfirmationhash) . "')";

if (!$conn->query($query)) {
    if($conn->errno==1062) {
        http_response_code(400);
        die('An account with this email address already exists.');
    }
    $conn->close();
    error_log('Failed to create new account.');
    http_response_code(500);
    die('Internal server error.');
}

$conn->close();

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Cotent-type: text/plain\r\n";
$headers .= "From: Snappy Book Review <" . $config['email']['no-reply-adress'] 
    . ">\r\n";
$emailmsg = "Hello " . $_POST['firstname'] . "!\r\n" .
    "\r\n" .
    "Thank you registering at Snappy Book Review!\r\n" .
    "\r\n" .
    "This is your email verification link: \r\n" .
    GLOBAL_URI . 'account/verify-account/?email=' . $_POST['email'] . '&hash=' 
    . $emailconfirmationhash . "\r\n";

mail($_POST['email'], "Snappy Book Review email verification", $emailmsg, $headers);

echo 'We sent you a verification link to your email.';