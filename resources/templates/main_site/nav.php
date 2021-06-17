<noscript>
    <div class="alert alert-warning" role="alert" style="margin: 0px; text-align: center;">
        Your browser has javascript disabled. Some site features may not work properly.
    </div>
</noscript>

<nav class="navbar navbar-expand-lg navbar-light navbar-custom-1" style="z-index: 10">
    <div class="container-fluid">
        <a class="navbar-brand" href="/">Snappy Book Review</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link" href="/">Home</a>
                </li>
            </ul>
            <form class="d-flex me-auto ml-auto" action="/search" method="get">
                <input name="q" class="form-control me-2" type="search" placeholder="Search for a book">
                <button class="btn btn-outline-success" type="submit">Search</button>
            </form>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" id="login-button" href="/account/log-in">Log in</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="signup-button" href="/account/create-account/">Create account</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="logout-button" href="/">Log out</a>
                    <script>
                        document.getElementById('logout-button').addEventListener('click', 
                            function() {
                                event.preventDefault();
                                var xhttp = new XMLHttpRequest();
                                xhttp.onreadystatechange = function() {
                                    if (this.readyState == 4 && this.status == 200) {
                                        checkLogin();
                                    }
                                };
                                xhttp.open('GET', '/account/log-out/', true);
                                xhttp.send();
                            });
                    </script>
                </li>
            </ul>
        </div>
    </div>
</nav>