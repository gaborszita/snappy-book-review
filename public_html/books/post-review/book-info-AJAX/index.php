<?php

$errormessage = 'No such book found.';
if (!isset($_GET['isbn']) || $_GET['isbn']=='') {
    http_response_code(400);
    die($errormessage);
}
$isbn = $_GET['isbn'];

$url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
$url .= $isbn;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$output = curl_exec($ch);
curl_close($ch);

$decodedJSON = json_decode($output);
//print_r($decodedJSON);

if ($decodedJSON->totalItems > 0) {
    echo 'Book found!<br>';
    $authors = $decodedJSON->items[0]->volumeInfo->authors;
    $responseFullTitle = '';
    for ($i=0; $i<count($authors); $i++) {
        $responseFullTitle .= $authors[$i];
        if ($i+1<count($authors)) {
            $responseFullTitle .= ', ';
        }
    }
    $responseFullTitle .= ': ';
    $responseFullTitle .= $decodedJSON->items[0]->volumeInfo->title;
    echo $responseFullTitle;
}
else {
    http_response_code(400);
    die($errormessage);
}
