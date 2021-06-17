<?php
    require_once('../resources/config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        require(TEMPLATES_PATH . '/main_site/head.php');
    ?>
    <style>
        .middlealign {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>

    <div class="shadow p-3 mb-5 bg-white rounded middlealign maincontainer">
        <h1 style="text-align: center">Snappy Book Review - The best website for reading book reviews</h1>
        <form action="/search/" method="get" style="text-align: center">
            <div class="mb-3">
                <input name="q" class="form-control" type="search" placeholder="Search for a book">
            </div>
            <button type="submit" class="btn btn-primary">Search</button>
        </form>
        <p><a href="/books/post-review/">Leave a review for a book</a></p>
    </div>

    <?php
        require(TEMPLATES_PATH . '/main_site/footer.php');
    ?>
</body>
</html>