<?php
require_once('../../../../resources/config.php');

$errorstring = 'Invalid email/password';
if (!isset($_POST['email']) || !isset($_POST['password'])) {
    http_response_code(400);
    die($errorstring);
}

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

$query = "SELECT id, firstname, lastname, email, password FROM users WHERE " . 
          "email='" . $conn->real_escape_string($_POST['email']) . 
          "' AND accountstatus='active'";

if ($result = $conn->query($query)) {
    if($row = $result->fetch_assoc()) {
        $id = $row['id'];
        $firstname = $row['firstname'];
        $lastname = $row['lastname'];
        $email = $row['email'];
        $password = $row['password'];
    }
} else {
    $conn->close();
    error_log('Failed to log in user.');
    http_response_code(500);
    die('Internal server error.');
}

$result->free_result();
$conn->close();

if (isset($password) && password_verify($_POST['password'], $password)) {
    session_start();
    $_SESSION['id'] = $id;
    $_SESSION['firstname'] = $firstname;
    $_SESSION['lastname'] = $lastname;
    $_SESSION['email'] = $email;
    echo "Successfully logged in!";
} else {
    http_response_code(400);
    die($errorstring);
}