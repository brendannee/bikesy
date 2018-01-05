<?php

  header('Content-Type: application/json');

  $endpoint = "http://ec2-52-3-253-79.compute-1.amazonaws.com/?" . $_SERVER['QUERY_STRING'];

  //  Initiate curl
  $ch = curl_init();

  // Set The Response Format to Json
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json'));

  // Will return the response, if false it print the response
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  // Set the url
  curl_setopt($ch, CURLOPT_URL,$endpoint);

  // Execute
  $result=curl_exec($ch);

  // Closing
  curl_close($ch);

  if ($result == '') {
    http_response_code(500);
  }

  echo $result;

 ?>
