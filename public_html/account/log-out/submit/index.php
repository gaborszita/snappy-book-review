<?php
require_once('../../../../resources/config.php');

if (isset( $_COOKIE[session_name()]))
    setcookie( session_name(), "", time()-3600, "/");

if(isset($_SESSION))
    session_destroy();

echo "Success!";