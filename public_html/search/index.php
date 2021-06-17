<?php
    require_once('../../resources/config.php');

    $originalSearchQuery = $_GET['q'];
    $searchQuery = $originalSearchQuery;
    $searchQuery = preg_replace('/[^a-zA-Z0-9 ]/', ' ', $searchQuery);
    $searchQuery = preg_replace('/  +/', '  ', $searchQuery);
    $searchKeywords = explode(' ', $searchQuery);

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

    $query = "SELECT isbn, author, author, title FROM books WHERE (";
    for ($i = 0; $i < count($searchKeywords); $i++) {
        $upperCaseKeyword = strtoupper(
            $conn->real_escape_string($searchKeywords[$i])
        );
        $query .= "(UPPER(author) LIKE '%$upperCaseKeyword%' " . 
            "OR UPPER(title) LIKE '%$upperCaseKeyword%')";
        if ($i+1 < count($searchKeywords)) {
            $query .= " AND ";
        }
    }
    $query .= ") ";
    $query .= "ORDER BY rating DESC ";
    $query .= "LIMIT 10 ";
    
    if (!$result = $conn->query($query)) {
        $conn->close();
        error_log('Failed to query search.');
        http_response_code(500);
        die('Internal server error.');
    }

    $searchResults = array();
    while ($row = $result->fetch_assoc()) {
        // print_r($row);
        $searchResults[] = $row;
    }

    $result->free_result();
    $conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        require(TEMPLATES_PATH . '/main_site/head.php');
    ?>
</head>
<body>
    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>
    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1>Search: <?= $originalSearchQuery ?></h1>
        <?php 
            foreach ($searchResults as &$book) {
                $book_href = '/books/' . $book['isbn'];
                echo '<p><a href="' . $book_href . '">' . $book['author'] . 
                    ': ' . $book['title'] . '</a></p>';
            }
        ?>
    </div>
    <?php
        require(TEMPLATES_PATH . '/main_site/footer.php');
    ?>
</body>
</html>
