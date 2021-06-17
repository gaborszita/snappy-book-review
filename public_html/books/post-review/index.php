<?php
    require_once('../../../resources/config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        require(TEMPLATES_PATH . '/main_site/head.php');
    ?>
    <link rel="stylesheet" href="/css/starrating1.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css">
    <script>
        if (!checkLogin()) {
            window.location.replace('/account/log-in/');
        }
    </script>
    <script>
        <?php require(TEMPLATES_PATH . '/js/commonUIjs.php'); ?>
        let isbnValid = false;
        function isbnAJAXchecker(infobox) {
            // successMessage(infobox, 'text changed yay!' + Math.random());
            isbnValid = false;
            loadingIcon(infobox);
            const isbn = document.getElementById('isbn').value.replace(/-/g, '');
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    successMessage(infobox, this.responseText);
                    isbnValid = true;
                }
                else if(this.readyState == 4) {
                    errorMessage(infobox, this.responseText);
                }
            };
            xhttp.open('GET', 'book-info-AJAX/?isbn=' + isbn, true);
            xhttp.send();
        }
        function formsubmit(infobox) {
            const isbn = document.getElementById('isbn').value.replace(/-/g, '');
            if (!isbnValid) {
                errorMessage(infobox, 'ISBN invalid.');
                return;
            }
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
            loadingIcon(infobox);
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    successMessage(infobox, this.responseText);
                } else if(this.readyState == 4) {
                    errorMessage(infobox, this.responseText);
                }
            };
            xhttp.open('POST', 'submit/', true);
            const formData = new FormData();
            formData.append('isbn', isbn);
            formData.append('rating', checkedStar);
            formData.append('comment', comment);
            xhttp.send(formData);
        }
    </script>
</head>
<body>
    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>
    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1>Leave a review for a book</h1>
        <form id="reviewform">
            <div class="mb-3">
                <label for="isbn" class="form-label">Book ISBN</label>
                <input class="form-control" id="isbn">
            </div>
            <div id="isbnAJAXresponsefield"></div>
            <script>
                document.getElementById('isbn').addEventListener('keyup',  
                function() {
                    event.preventDefault();
                    isbnAJAXchecker(document.getElementById('isbnAJAXresponsefield'));
                });
            </script>
            <div class="mb-3">
                <label for="rating" class="form-label">Rating</label>
                <div class="rating-css d-flex flex-row-reverse" style="justify-content: flex-end;">
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
    <?php
        require(TEMPLATES_PATH . '/main_site/footer.php');
    ?>
</body>
</html>