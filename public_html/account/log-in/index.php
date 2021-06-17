<?php
    require_once('../../../resources/config.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        require(TEMPLATES_PATH . '/main_site/head.php');
    ?>
    <script>
        <?php require(TEMPLATES_PATH . '/js/commonUIjs.php'); ?>
        function formsubmit(infobox) {
            const email = document.getElementById('email').value;
            if (email == '') {
                errorMessage(infobox, 'Email is required.');
                return;
            }
            const password = document.getElementById('password').value;
            if (password == '') {
                errorMessage(infobox, 'Password is required.');
                return;
            }
            loadingIcon(infobox);
            const xhttp = new XMLHttpRequest();
            /*xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseText == '0') {
                        successMessage(infobox, 'Successfully logged in!');
                    } else if (this.responseText == '1') {
                        errorMessage(infobox, 'Invalid username/password.');
                    } else {
                        errorMessage(infobox, 'Unknown error.');
                    }
                    checkLogin();
                }
                else if(this.readyState == 4) {
                    errorMessage(infobox, 'Unknown error.');
                }
            };
            xhttp.open('POST', '/api/v1/account/log-in/', true);*/
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) 
                {
                    successMessage(infobox, this.responseText);
                    checkLogin();
                }
                else if(this.readyState == 4)
                {
                    errorMessage(infobox, this.responseText);
                }
            };
            xhttp.open('POST', 'submit/', true);
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            xhttp.send(formData);
        }
    </script>
</head>
<body>
    <?php
        require(TEMPLATES_PATH . '/main_site/nav.php');
    ?>
    <div class="shadow p-3 mb-5 bg-white rounded maincontainer">
        <h1>Log in</h1>
        <p>Don't have an account? Click <a href="/account/create-account/">here</a> to create one.</p>
        <form id="loginform">
            <div class="mb-3">
                <label for="email" class="form-label">Email adress</label>
                <input type="email" class="form-control" id="email">
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password">
            </div>
            <button type="submit" class="btn btn-primary" id="formsubmitbtn">Log in</button>
        </form>
        <div id="formSubmitInfo"></div>
        <script>
            document.getElementById('loginform').addEventListener('submit',  
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