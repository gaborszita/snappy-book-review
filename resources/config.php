<?php

defined("TEMPLATES_PATH")
    or define("TEMPLATES_PATH", realpath(dirname(__FILE__) . '/templates'));

defined("GLOBAL_DOMAIN_NAME")
    or define ("GLOBAL_DOMAIN_NAME", 'bookreviewpi.local');

defined("GLOBAL_URI")
    or define ("GLOBAL_URI", 'http://' . GLOBAL_DOMAIN_NAME . '/');

$config = array(
    'db' => array(
        'username' => 'db_username',
        'password' => 'db_password',
        'dbname' => 'db_name',
        'host' => 'db_host'
    ),

    'email' => array(
        'no-reply-adress' => 'no-reply@' . GLOBAL_DOMAIN_NAME
    )
    );
