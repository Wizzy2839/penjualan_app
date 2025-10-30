<?php
// Izinkan akses dari mana saja [cite: 90]
header("Access-Control-Allow-Origin: *"); 
// Izinkan metode POST, GET, OPTIONS
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
// Izinkan header tertentu (penting untuk request JSON)
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$host = 'localhost';
$user = 'root'; // User default XAMPP [cite: 92]
$pass = ''; // Password default XAMPP [cite: 93]
$db = 'penjualan_db'; // Nama database [cite: 94]

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die("Koneksi gagal: " . $conn->connect_error);
}

// Set charset [cite: 100]
$conn->set_charset("utf8mb4");

// Tangani pre-flight request (OPTIONS) untuk CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>