<?php
    require_once('../../../resources/config.php');
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
            const nameregex = /^[a-zA-Z ]{1,255}$/;
            // Check first name, last name validity
            const firstname = document.getElementById('firstNameInput').value;
            if (!firstname.match(nameregex)) {
                if(firstname.length>0) {
                    errorMessage(infobox, 'First name invalid.');
                } else {
                    errorMessage(infobox, 'First name required.');
                }
                return;
            }
            const lastname = document.getElementById('lastNameInput').value;
            if (!lastname.match(nameregex)) {
                if(lastname.length>0) {
                    errorMessage(infobox, 'Last name invalid.');
                } else {
                    errorMessage(infobox, 'Last name required.');
                }
                return;
            }
            const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            const email = document.getElementById('emailInput').value;
            if (!email.match(emailRegex) || email.length>254) {
                if(email.length>0) {
                    errorMessage(infobox, 'Email adress invalid.');
                } else {
                    errorMessage(infobox, 'Email adress required.');
                }
                return;
            }
            const passwordRegex = /(?=.*\d)(?=.*[a-zA-Z]).{8,20}/;
            const password = document.getElementById('passwordInput').value;
            if (password.length==0) {
                errorMessage(infobox, 'Password required.')
                return;
            }
            if (!password.match(passwordRegex)) {
                errorMessage(infobox, 'Password invalid. (Please check password constraints.)');
                return;
            }
            const verifypassword = document.getElementById('verifyPasswordInput').value;
            if (password !== verifypassword) {
                errorMessage(infobox, 'Passwords do not match.');
                return;
            }

            loadingIcon(infobox);

            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    successMessage(infobox, this.responseText);
                }
                else if (this.readyState == 4) {
                    errorMessage(infobox, this.responseText);
                }
            };
            xhttp.open('POST', 'submit/', true);
            const formData = new FormData();
            formData.append('firstname', firstname);
            formData.append('lastname', lastname);
            formData.append('email', email);
            formData.append('password', password);
            xhttp.send(formData);
        }
    </script>
    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>

    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1>Create an account</h1>
        <p>Want to log in? Click <a href="/account/log-in/">here</a> to log in.</p>
        <p>An account will let you leave reviews on books and much more.</p>
        <form id="signupform">
            <div class="row">
                <div class="mb-3 col">
                    <label for="firstNameInput" class="form-label">First name</label>
                    <input class="form-control" id="firstNameInput">
                </div>
                <div class="mb-3 col">
                    <label for="lastNameInput" class="form-label">Last name</label>
                    <input class="form-control" id="lastNameInput">
                </div>
            </div>
            <div class="mb-3">
                <label for="emailInput" class="form-label">Email adress</label>
                <input type="email" class="form-control" id="emailInput">
            </div>
            <div class="mb-3">
                <label for="passwordInput" class="form-label">Password</label>
                <input type="password" class="form-control" id="passwordInput" aria-describedby="passwordHelp">
                <div id="passwordHelp" class="form-text">
                    Your password must be 8-20 characters long, containing at least one letter and one number.
                </div>
            </div>
            <div class="mb-3">
                <label for="verifyPasswordInput" class="form-label">Verify password</label>
                <input type="password" class="form-control" id="verifyPasswordInput">
            </div>
            <button type="submit" class="btn btn-primary" id="formsubmitbtn">Create account</button>
        </form>
        <div id="formSubmitInfo"></div>
        <script>
            document.getElementById('signupform').addEventListener('submit', 
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