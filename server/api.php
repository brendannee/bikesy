<?php

  header('Content-Type: application/json');
  header('Access-Control-Allow-Origin: *');

  if ($_GET['scenario'] === '1' || $_GET['scenario'] === '2' || $_GET['scenario'] === '3'):
    $server = 'ec2-54-208-197-111.compute-1.amazonaws.com';
  elseif ($_GET['scenario'] === '4' || $_GET['scenario'] === '5' || $_GET['scenario'] === '6'):
    $server = 'ec2-54-84-66-250.compute-1.amazonaws.com';
  elseif ($_GET['scenario'] === '7' || $_GET['scenario'] === '8' || $_GET['scenario'] === '9'):
    $server = 'ec2-34-224-83-87.compute-1.amazonaws.com';
  else:
    http_response_code(500);
  endif;

  $endpoint = "http://" . $server . "?" . $_SERVER['QUERY_STRING'];

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
