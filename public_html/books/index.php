<?php
    require_once('../../resources/config.php');

    $isbn = substr($_SERVER['REQUEST_URI'], strlen('/books/'));

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

    $query = "SELECT author, title, rating FROM books WHERE isbn='" . 
        $conn->real_escape_string($isbn) . "'";

    if (!$result = $conn->query($query)) {
        $conn->close();
        error_log('Failed to query book.');
        http_response_code(500);
        die('Internal server error.');
    }

    if($row = $result->fetch_assoc()) {
        $author = $row['author'];
        $title = $row['title'];
        $rating = $row['rating'];
    } else {
        $conn->close();
        $result->free_result();
        http_response_code(404);
        die('<h1>Not found</h1>');
    }
    $result->free_result();

    $query = "SELECT users.firstname, users.lastname, reviews.comment, " . 
        "reviews.rating FROM reviews INNER JOIN users ON users.id = " . 
        "reviews.userid WHERE reviews.bookisbn='" . 
        $conn->real_escape_string($isbn) . "'";

    if (!$result = $conn->query($query)) {
        $conn->close();
        error_log('Failed to query book reviews.');
        http_response_code(500);
        die('Internal server error.');
    }

    class Comment {
        public $firstname;
        public $lastname;
        public $commentText;
        public $rating;
    }

    $comments = array();
    while ($row = $result->fetch_assoc()) {
        $comment = new Comment();
        $comment->firstname = $row['firstname'];
        $comment->lastname = $row['lastname'];
        $comment->commentText = $row['comment'];
        $comment->rating = $row['rating'];
        $comments[] = $comment;
    }
    $result->free_result();
    $conn->close();

    $starRating = round($rating);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        require(TEMPLATES_PATH . '/main_site/head.php');
    ?>
</head>
<body>
    <script>
        <?php require(TEMPLATES_PATH . '/js/commonUIjs.php'); ?>
        function formsubmit(infobox) {
            let checkedStar;
            if (document.getElementById('rating1').checked) {
                checkedStar = 1;
            } else if (document.getElementById('rating2').checked) {
                checkedStar = 2;
            } else if (document.getElementById('rating3').checked) {
                checkedStar = 3;
            } else if (document.getElementById('rating4').checked) {
                checkedStar = 4;
            } else if (document.getElementById('rating5').checked) {
                checkedStar = 5;
            } else {
                errorMessage(infobox, 'Please select a rating.');
                return;
            }
            const comment = document.getElementById('commentTextArea').value;
            const isbn = location.pathname.substr('/books/'.length);
            loadingIcon(infobox);
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    successMessage(infobox, this.responseText);
                } else if(this.readyState == 4) {
                    errorMessage(infobox, this.responseText);
                }
            };
            xhttp.open('POST', 'post-review/submit/', true);
            const formData = new FormData();
            formData.append('isbn', isbn);
            formData.append('rating', checkedStar);
            formData.append('comment', comment);
            xhttp.send(formData);
        }
    </script>

    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>

    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1><?php echo $author . ": " . $title?></h1>
        <table>
            <tr>
                <td>
                    <div class="rating-star-css">
                        <input type="radio" id="rating5book" disabled <?php echo $starRating==5 ? 'checked' : ''; ?>>
                        <label for="rating5book" class="fa fa-star"></label>
                        <input type="radio" id="rating4book" disabled <?php echo $starRating==4 ? 'checked' : ''; ?>>
                        <label for="rating4book" class="fa fa-star"></label>
                        <input type="radio" id="rating3book" disabled <?php echo $starRating==3 ? 'checked' : ''; ?>>
                        <label for="rating3book" class="fa fa-star"></label>
                        <input type="radio" id="rating2book" disabled <?php echo $starRating==2 ? 'checked' : ''; ?>>
                        <label for="rating2book" class="fa fa-star"></label>
                        <input type="radio" id="rating1book" disabled <?php echo $starRating==1 ? 'checked' : ''; ?>>
                        <label for="rating1book" class="fa fa-star"></label>
                    </div>
                </td>
                <td>
                    <p class="rating-number"><?php echo $rating; ?></p>
                </td>
            </tr>
        </table>
        <button type="button" class="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#reviewformcontainer" aria-expanded="false" aria-controls="reviewformcontainer">Leave review</button>
        <div id="reviewformcontainer" class="border border-primary rounded collapse leave-review-box">
            <form id="reviewform">
                <div class="mb-3">
                    <label for="rating" class="form-label">Rating</label>
                    <div class="rating-star-css rating-star-css-dynamic">
                        <input type="radio" name="rating" id="rating5">
                        <label for="rating5" class="fa fa-star"></label>
                        <input type="radio" name="rating" id="rating4">
                        <label for="rating4" class="fa fa-star"></label>
                        <input type="radio" name="rating" id="rating3">
                        <label for="rating3" class="fa fa-star"></label>
                        <input type="radio" name="rating" id="rating2">
                        <label for="rating2" class="fa fa-star"></label>
                        <input type="radio" name="rating" id="rating1">
                        <label for="rating1" class="fa fa-star"></label>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="commentTextArea">Comment</label>
                    <textarea class="form-control" id="commentTextArea" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" id="formsubmitbtn">Submit review</button>
            </form>
            <div id="formSubmitInfo"></div>
            <script>
                document.getElementById('reviewform').addEventListener('submit',  
                    function() {
                        event.preventDefault();
                        formsubmit(document.getElementById('formSubmitInfo'));
                    });
            </script>
        </div>
        <p></p>
        <h4>Reviews:</h4>
        <?php 
            for ($i=0; $i<count($comments); $i++) {
                $comment = $comments[$i];
                echo '<span class="review-comment-name">' . 
                    $comment->firstname . ' ' . $comment->lastname . '</span>';
                $commentRating = $comment->rating;
        ?>
            <div class="rating-star-css">
                <input type="radio" id="rating5comment<?php echo $i; ?>" disabled <?php echo $commentRating==5 ? 'checked' : ''; ?>>
                <label for="rating5comment<?php echo $i; ?>" class="fa fa-star"></label>
                <input type="radio" id="rating4comment<?php echo $i; ?>" disabled <?php echo $commentRating==4 ? 'checked' : ''; ?>>
                <label for="rating4comment<?php echo $i; ?>" class="fa fa-star"></label>
                <input type="radio" id="rating3comment<?php echo $i; ?>" disabled <?php echo $commentRating==3 ? 'checked' : ''; ?>>
                <label for="rating3comment<?php echo $i; ?>" class="fa fa-star"></label>
                <input type="radio" id="rating2comment<?php echo $i; ?>" disabled <?php echo $commentRating==2 ? 'checked' : ''; ?>>
                <label for="rating2comment<?php echo $i; ?>" class="fa fa-star"></label>
                <input type="radio" id="rating1comment<?php echo $i; ?>" disabled <?php echo $commentRating==1 ? 'checked' : ''; ?>>
                <label for="rating1comment<?php echo $i; ?>" class="fa fa-star"></label>
            </div>
        <?php
                $text = str_replace("\r\n", '<br>', $comment->commentText);
                $text = str_replace("\n", '<br>', $text);
                $text = str_replace("\r", '<br>', $text);
                echo '<p>' . $text . '</p>';
                if ($i+1 < count($comments)) {
                    echo '<hr>';
                }
            }
            unset($comment);
        ?>
    </div>

    <?php
        require(TEMPLATES_PATH . '/main_site/footer.php');
    ?>
</body>
</html>