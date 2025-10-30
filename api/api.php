<?php
require 'db.php'; // Sertakan file koneksi database [cite: 108]

// Set header untuk output JSON [cite: 110]
header('Content-Type: application/json');

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Switch case untuk routing aksi [cite: 112]
switch ($action) {
    case 'get_products':
        get_products($conn);
        break;
    case 'get_product':
        get_product($conn);
        break;
    case 'add_product':
        add_product($conn);
        break;
    case 'update_product':
        update_product($conn);
        break;
    case 'delete_product':
        delete_product($conn);
        break;
    default:
        echo json_encode(['error' => 'Aksi tidak valid']);
        break;
}

/**
 * Mengambil semua produk [cite: 135]
 */
function get_products($conn) {
    $sql = "SELECT * FROM products";
    $result = $conn->query($sql);
    $products = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $row['id'] = intval($row['id']);
            $row['price'] = floatval($row['price']);
            $products[] = $row;
        }
    }
    echo json_encode($products);
}

/**
 * Mengambil satu produk berdasarkan ID [cite: 154]
 */
function get_product($conn) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        if ($product) {
            $product['id'] = intval($product['id']);
            $product['price'] = floatval($product['price']);
            echo json_encode($product);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Produk tidak ditemukan']);
        }
        $stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID tidak valid']);
    }
}

/**
 * Menambahkan produk baru [cite: 178]
 */
function add_product($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405); 
        echo json_encode(['error' => 'Metode request tidak diizinkan. Gunakan POST.']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['title']) || empty($data['price']) || empty($data['description']) || empty($data['category']) || empty($data['image'])) {
        http_response_code(400); 
        echo json_encode(['error' => 'Semua field harus diisi.']);
        return;
    }

    $title = htmlspecialchars(strip_tags($data['title']));
    $price = floatval($data['price']);
    $description = htmlspecialchars(strip_tags($data['description']));
    $category = htmlspecialchars(strip_tags($data['category']));
    $image = filter_var($data['image'], FILTER_SANITIZE_URL);

    $stmt = $conn->prepare("INSERT INTO products (title, price, description, category, image) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sdsss", $title, $price, $description, $category, $image);

    if ($stmt->execute()) {
        http_response_code(201); 
        echo json_encode(['success' => 'Produk berhasil ditambahkan.', 'id' => $conn->insert_id]);
    } else {
        http_response_code(500); 
        echo json_encode(['error' => 'Gagal menyimpan produk ke database.', 'details' => $stmt->error]);
    }
    $stmt->close();
}


/**
 * Memperbarui produk [cite: 190]
 */
function update_product($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Metode request tidak diizinkan. Gunakan POST.']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id']) || empty($data['title']) || empty($data['price']) || empty($data['description']) || empty($data['category']) || empty($data['image'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Semua field (termasuk ID) harus diisi.']);
        return;
    }

    $id = intval($data['id']);
    $title = htmlspecialchars(strip_tags($data['title']));
    $price = floatval($data['price']);
    $description = htmlspecialchars(strip_tags($data['description']));
    $category = htmlspecialchars(strip_tags($data['category']));
    $image = filter_var($data['image'], FILTER_SANITIZE_URL);

    $stmt = $conn->prepare("UPDATE products SET title = ?, price = ?, description = ?, category = ?, image = ? WHERE id = ?");
    $stmt->bind_param("sdsssi", $title, $price, $description, $category, $image, $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => 'Produk berhasil diperbarui.']);
        } else {
            echo json_encode(['success' => 'Produk diperbarui (tidak ada data yang berubah).']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal memperbarui produk di database.', 'details' => $stmt->error]);
    }
    $stmt->close();
}

/**
 * Menghapus produk [cite: 198]
 */
function delete_product($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Metode request tidak diizinkan. Gunakan POST.']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID produk harus disertakan.']);
        return;
    }

    $id = intval($data['id']);

    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            http_response_code(200); // OK
            echo json_encode(['success' => 'Produk berhasil dihapus.']);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(['error' => 'Produk tidak ditemukan atau sudah dihapus.']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Gagal menghapus produk.', 'details' => $stmt->error]);
    }
    $stmt->close();
}

$conn->close();
?>