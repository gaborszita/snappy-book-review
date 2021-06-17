<?php
    require_once('../../../resources/config.php');
    $conn = new mysqli(
        $config['db']['host'], 
        $config['db']['username'], 
        $config['db']['password'], 
        $config['db']['dbname']
    );
    if($conn->connect_error) {
        error_log('Failed to connect to database.');
        http_response_code(500);
        die('Internal server error.');
    }
    

    $query = "UPDATE users SET accountstatus='active' WHERE email='" . 
    $_GET['email'] . "' AND accountstatus='pendingactivation' AND " . 
    "email_verification_link='" . $_GET['hash'] . "'";

    if (!$conn->query($query)) {
        $conn->close();
        error_log('Failed to verify account.');
        http_response_code(500);
        die('Internal server error.');
    }
    
    if ($conn->affected_rows==0) {
        http_response_code(400);
        $responsetext = "Couldn't activate account.";
    } else {
        $responsetext = "Account verification complete! You may now <a " . 
            "href=\"/account/log-in/\">" . 
            "log in</a>.";

    }

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
    <?php require(TEMPLATES_PATH . '/main_site/nav.php'); ?>
    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1>Account verification</h1>
        <p>
        <?php
            echo $responsetext;
        ?>
        </p>
    </div>
    <?php require(TEMPLATES_PATH . '/main_site/footer.php'); ?>
</body>
</html>