<?php
require_once('../../../../resources/config.php');
session_start();

$invalidDataErrorMessage = 'Invalid data.';

if (!isset($_SESSION['id'])) {
    http_response_code(400);
    die('Not logged in!');
}

if (!isset($_POST['rating']) || !(intval($_POST['rating'])>=1 && intval($_POST
    ['rating'])<=5)
) {
    http_response_code(400);
    die($invalidDataErrorMessage);
}
$rating = intval($_POST['rating']);

if (!isset($_POST['comment'])) {
    http_response_code(400);
    die($invalidDataErrorMessage);
}
$comment = $_POST['comment'];

if (!isset($_POST['isbn'])) {
    http_response_code(400);
    die($invalidDataErrorMessage);
}

$isbn = $_POST['isbn'];

$url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
$url .= $isbn;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$output = curl_exec($ch);
curl_close($ch);

$decodedJSON = json_decode($output);
//print_r($decodedJSON);

if ($decodedJSON->totalItems == 0) {
    http_response_code(400);
    die($invalidDataErrorMessage);
}

$industryIdentifiers = $decodedJSON->items[0]->volumeInfo->industryIdentifiers;
foreach ($industryIdentifiers as &$identifier) {
    if ($identifier->type == 'ISBN_13') {
        $isbn13 = $identifier->identifier;
    } else if ($identifier->type == 'ISBN_10') {
        $isbn10 = $identifier->identifier;
    }
}
unset($identifier);

if (isset($isbn13)) {
    $isbn = $isbn13;
} else if (isset($isbn10)) {
    $isbn = $isbn10;
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

if (!$conn->autocommit(FALSE)) {
    $conn->close();
    error_log('Failed to disable autocommit when submitting review');
    http_response_code(500);
    die('Internal server error.');
}

// Check if book is in the database
$query = "SELECT * FROM books WHERE isbn='" . 
    $conn->real_escape_string($isbn) . "' LOCK IN SHARE MODE";

if (!$result = $conn->query($query)) {
    $conn->close();
    error_log('Failed to query book (leaving review).');
    http_response_code(500);
    die('Internal server error.');
}

// Add book if it isn't already in database
if ($result->num_rows==0) {
    $authors = $decodedJSON->items[0]->volumeInfo->authors;
    $authors_str = '';
    for ($i=0; $i<count($authors); $i++) {
        $authors_str .= $authors[$i];
        if ($i+1 < count($authors)) {
            $authors_str .= ", ";
        }
    }
    $title = $decodedJSON->items[0]->volumeInfo->title;

    $query = "INSERT INTO books (isbn, author, title, rating) VALUES ('" . 
        $conn->real_escape_string($isbn) . "', '" . 
        $conn->real_escape_string($authors_str) . "', '" . 
        $conn->real_escape_string($title) . "', '0')";

    if (!$conn->query($query)) {
        $result->free_result();
        $conn->close();
        error_log('Failed add book to database (leaving review).');
        http_response_code(500);
        die('Internal server error.');
    }

    $result->free_result();

    if (!$conn->commit()) {
        $conn->close();
        error_log('Failed to commit after adding book to database (leaving review)');
        http_response_code(500);
        die('Internal server error.');
    }
}

// Add review to database
$query = "SELECT * FROM reviews WHERE userid='" . 
    $conn->real_escape_string($_SESSION['id']) . "' AND " . "bookisbn='" . 
    $conn->real_escape_string($isbn) . "' LOCK IN SHARE MODE";

if (!$result = $conn->query($query)) {
    $conn->close();
    error_log('Failed to query review (leaving review).');
    http_response_code(500);
    die('Internal server error.');
}

if ($result->num_rows==0) {
    $query = "INSERT INTO reviews (userid, rating, bookisbn, comment) " . 
    "VALUES ('" . $conn->real_escape_string($_SESSION['id']) . "', '" . 
    $conn->real_escape_string($rating) . "', '" . 
    $conn->real_escape_string($isbn) . "', '" . 
    $conn->real_escape_string($comment) . "')";

    if (!$conn->query($query)) {
        $result->free_result();
        $conn->close();
        error_log('Failed to create review.');
        http_response_code(500);
        die('Internal server error.');
    }

    $responseText = "Review added!";
} else {
    $query = "UPDATE reviews SET rating='" . 
        $conn->real_escape_string($rating) . "', comment='" . 
        $conn->real_escape_string($comment) . "' " . "WHERE userid='" . 
        $conn->real_escape_string($_SESSION['id']) . "' AND bookisbn='" . 
        $conn->real_escape_string($isbn) . "'";

    if (!$conn->query($query)) {
        $result->free_result();
        $conn->close();
        error_log('Failed to create review.');
        http_response_code(500);
        die('Internal server error.');
    }

    $responseText = "Review updated!";
}
$result->free_result();

if (!$conn->commit()) {
    $conn->close();
    error_log('Failed to commit after adding/updating user review (leaving review)');
    http_response_code(500);
    die('Internal server error.');
}

$query = "SELECT * FROM reviews WHERE bookisbn='" . 
    $conn->real_escape_string($isbn) . "' LOCK IN SHARE MODE";

if (!$result = $conn->query($query)) {
    $conn->close();
    error_log('Failed to query reviews for a specific book (leaving review).');
    http_response_code(500);
    die('Internal server error.');
}

$total = 0;
$sum = 0;
while ($row = $result->fetch_assoc()) {
    $sum += $row['rating'];
    $total += 1;
}
$bookRating = round($sum/$total, 1);

$result->free_result();

$query = "UPDATE books SET rating='" . $conn->real_escape_string($bookRating) . 
    "' WHERE isbn='" . $conn->real_escape_string($isbn) . "'";

if (!$conn->query($query)) {
    $conn->close();
    error_log('Failed to update reviews for book (leaving review).');
    http_response_code(500);
    die('Internal server error.');
}


if (!$conn->autocommit(TRUE)) {
    $conn->close();
    error_log('Failed to enable autocommit when submitting review');
    http_response_code(500);
    die('Internal server error.');
}

$conn->close();

echo $responseText;