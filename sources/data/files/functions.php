<?php

function _timestamp($absURL) {
    $absPath = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR . $absURL;
    return $absURL . '?' . filemtime(realpath($absPath));
}

function timestamp($absURL) {
    echo _timestamp($absURL);
}
