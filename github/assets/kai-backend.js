/* KANTOR AI SINGLE-HTML LOCAL BACKEND — hardened per Tabel Mitigasi Atomik (L03-L05, L13-L15). */
(() => {
const seed = {"users":[{"ID":"OWN1","Nama":"Slamet Sugiono","Jabatan":"Pemilik Utama & Investor","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Pemilik","Email":"slametsugiono.studio@gmail.com","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT HOLDING (induk)"},{"ID":"D1-02","Nama":"Bagus Wibowo","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.02.bagus@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-03","Nama":"Citra Pratiwi","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.03.citra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-04","Nama":"Darma Setiawan","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.04.darma@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-05","Nama":"Eka Gunawan","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.05.eka@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-06","Nama":"Farhan Suryadi","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.06.farhan@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-07","Nama":"Gita Kencana","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.07.gita@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D1-08","Nama":"Hendra Ramadhan","Jabatan":"Analis & Pelaksana Kas & Pendapatan Tetap","Unit":"D1 · Kas & Pendapatan Tetap","Tier":"Staf","Email":"d1.08.hendra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"M2","Nama":"Kirana Prameswari","Jabatan":"Head of Investment","Unit":"D2 · Ekuitas Publik","Tier":"Manajemen","Email":"kirana.investasi@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT HOLDING (induk)"},{"ID":"D2-02","Nama":"Intan Utomo","Jabatan":"Analis & Pelaksana Ekuitas Publik","Unit":"D2 · Ekuitas Publik","Tier":"Staf","Email":"d2.02.intan@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D2-03","Nama":"Joko Wibowo","Jabatan":"Analis & Pelaksana Ekuitas Publik","Unit":"D2 · Ekuitas Publik","Tier":"Staf","Email":"d2.03.joko@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D2-04","Nama":"Kartika Pratiwi","Jabatan":"Analis & Pelaksana Ekuitas Publik","Unit":"D2 · Ekuitas Publik","Tier":"Staf","Email":"d2.04.kartika@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D2-05","Nama":"Lutfi Setiawan","Jabatan":"Analis & Pelaksana Ekuitas Publik","Unit":"D2 · Ekuitas Publik","Tier":"Staf","Email":"d2.05.lutfi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"M3","Nama":"Bimo Saputra","Jabatan":"Dealer Saham & Obligasi","Unit":"D3 · Seleksi Reksa Dana & ETF","Tier":"Staf","Email":"bimo.pasarmodal@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D3-02","Nama":"Maya Gunawan","Jabatan":"Analis & Pelaksana Seleksi Reksa Dana & ETF","Unit":"D3 · Seleksi Reksa Dana & ETF","Tier":"Staf","Email":"d3.02.maya@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D3-03","Nama":"Naufal Suryadi","Jabatan":"Analis & Pelaksana Seleksi Reksa Dana & ETF","Unit":"D3 · Seleksi Reksa Dana & ETF","Tier":"Staf","Email":"d3.03.naufal@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D4-01","Nama":"Olivia Kencana","Jabatan":"Head of Macro & Derivatives","Unit":"D4 · Valas, Komoditas & Derivatif","Tier":"Manajemen","Email":"d4.01.olivia@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT HOLDING (induk)"},{"ID":"D4-02","Nama":"Prasetya Ramadhan","Jabatan":"Analis & Pelaksana Valas, Komoditas & Derivatif","Unit":"D4 · Valas, Komoditas & Derivatif","Tier":"Staf","Email":"d4.02.prasetya@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D4-03","Nama":"Qori Utomo","Jabatan":"Analis & Pelaksana Valas, Komoditas & Derivatif","Unit":"D4 · Valas, Komoditas & Derivatif","Tier":"Staf","Email":"d4.03.qori@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D4-04","Nama":"Rama Wibowo","Jabatan":"Analis & Pelaksana Valas, Komoditas & Derivatif","Unit":"D4 · Valas, Komoditas & Derivatif","Tier":"Staf","Email":"d4.04.rama@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D4-05","Nama":"Sinta Pratiwi","Jabatan":"Analis & Pelaksana Valas, Komoditas & Derivatif","Unit":"D4 · Valas, Komoditas & Derivatif","Tier":"Staf","Email":"d4.05.sinta@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D5-01","Nama":"Taufik Setiawan","Jabatan":"Head of Digital Assets","Unit":"D5 · Kripto & Aset Digital Trading","Tier":"Manajemen","Email":"d5.01.taufik@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Digital & IP"},{"ID":"D5-02","Nama":"Utami Gunawan","Jabatan":"Analis & Pelaksana Kripto & Aset Digital Trading","Unit":"D5 · Kripto & Aset Digital Trading","Tier":"Staf","Email":"d5.02.utami@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D5-03","Nama":"Vina Suryadi","Jabatan":"Analis & Pelaksana Kripto & Aset Digital Trading","Unit":"D5 · Kripto & Aset Digital Trading","Tier":"Staf","Email":"d5.03.vina@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D5-04","Nama":"Wahyu Kencana","Jabatan":"Analis & Pelaksana Kripto & Aset Digital Trading","Unit":"D5 · Kripto & Aset Digital Trading","Tier":"Staf","Email":"d5.04.wahyu@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D6-01","Nama":"Yogi Ramadhan","Jabatan":"Head of Digital & IP Assets","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Manajemen","Email":"d6.01.yogi@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Digital & IP"},{"ID":"D6-02","Nama":"Zahra Utomo","Jabatan":"Analis & Pelaksana Bisnis Digital & Kekayaan Intelektual","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Staf","Email":"d6.02.zahra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D6-03","Nama":"Andi Wibowo","Jabatan":"Analis & Pelaksana Bisnis Digital & Kekayaan Intelektual","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Staf","Email":"d6.03.andi@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D6-04","Nama":"Bella Pratiwi","Jabatan":"Analis & Pelaksana Bisnis Digital & Kekayaan Intelektual","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Staf","Email":"d6.04.bella@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D6-05","Nama":"Cakra Setiawan","Jabatan":"Analis & Pelaksana Bisnis Digital & Kekayaan Intelektual","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Staf","Email":"d6.05.cakra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"D6-06","Nama":"Dewi Gunawan","Jabatan":"Analis & Pelaksana Bisnis Digital & Kekayaan Intelektual","Unit":"D6 · Bisnis Digital & Kekayaan Intelektual","Tier":"Staf","Email":"d6.06.dewi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"M4","Nama":"Nadia Kusuma","Jabatan":"Analis Properti & Aset Fisik","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"nadia.properti@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-02","Nama":"Erlangga Suryadi","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.02.erlangga@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-03","Nama":"Fanny Kencana","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.03.fanny@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-04","Nama":"Galih Ramadhan","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.04.galih@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-05","Nama":"Hana Utomo","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.05.hana@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-06","Nama":"Ilham Wibowo","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.06.ilham@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-07","Nama":"Jasmine Pratiwi","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.07.jasmine@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-08","Nama":"Kevin Setiawan","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.08.kevin@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-09","Nama":"Laras Gunawan","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.09.laras@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-10","Nama":"Mahendra Suryadi","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.10.mahendra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-11","Nama":"Nabila Kencana","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.11.nabila@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D7-12","Nama":"Oki Ramadhan","Jabatan":"Analis & Pelaksana Properti & Tanah","Unit":"D7 · Properti & Tanah","Tier":"Staf","Email":"d7.12.oki@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Properti"},{"ID":"D8-01","Nama":"Putri Utomo","Jabatan":"Head of Productive Assets","Unit":"D8 · Aset Fisik Produktif","Tier":"Manajemen","Email":"d8.01.putri@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-02","Nama":"Bagus Nugroho","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.02.bagus@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-03","Nama":"Citra Kusumo","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.03.citra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-04","Nama":"Darma Lestari","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.04.darma@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-05","Nama":"Eka Permata","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.05.eka@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-06","Nama":"Farhan Wijaya","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.06.farhan@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-07","Nama":"Gita Siregar","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.07.gita@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-08","Nama":"Hendra Mulyono","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.08.hendra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-09","Nama":"Intan Sanjaya","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.09.intan@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-10","Nama":"Joko Nugroho","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.10.joko@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-11","Nama":"Kartika Kusumo","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.11.kartika@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-12","Nama":"Lutfi Lestari","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.12.lutfi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-13","Nama":"Maya Permata","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.13.maya@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D8-14","Nama":"Naufal Wijaya","Jabatan":"Analis & Pelaksana Aset Fisik Produktif","Unit":"D8 · Aset Fisik Produktif","Tier":"Staf","Email":"d8.14.naufal@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-01","Nama":"Olivia Siregar","Jabatan":"Head of Agri & Natural Assets","Unit":"D9 · Agrikultur & Alam","Tier":"Manajemen","Email":"d9.01.olivia@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-02","Nama":"Prasetya Mulyono","Jabatan":"Analis & Pelaksana Agrikultur & Alam","Unit":"D9 · Agrikultur & Alam","Tier":"Staf","Email":"d9.02.prasetya@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-03","Nama":"Qori Sanjaya","Jabatan":"Analis & Pelaksana Agrikultur & Alam","Unit":"D9 · Agrikultur & Alam","Tier":"Staf","Email":"d9.03.qori@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-04","Nama":"Rama Nugroho","Jabatan":"Analis & Pelaksana Agrikultur & Alam","Unit":"D9 · Agrikultur & Alam","Tier":"Staf","Email":"d9.04.rama@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-05","Nama":"Sinta Kusumo","Jabatan":"Analis & Pelaksana Agrikultur & Alam","Unit":"D9 · Agrikultur & Alam","Tier":"Staf","Email":"d9.05.sinta@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D9-06","Nama":"Taufik Lestari","Jabatan":"Analis & Pelaksana Agrikultur & Alam","Unit":"D9 · Agrikultur & Alam","Tier":"Staf","Email":"d9.06.taufik@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"D10-01","Nama":"Utami Permata","Jabatan":"Head of Collectibles","Unit":"D10 · Koleksi & Aset Gaya Hidup","Tier":"Manajemen","Email":"d10.01.utami@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Koleksi & Kustodian"},{"ID":"D10-02","Nama":"Vina Wijaya","Jabatan":"Analis & Pelaksana Koleksi & Aset Gaya Hidup","Unit":"D10 · Koleksi & Aset Gaya Hidup","Tier":"Staf","Email":"d10.02.vina@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Koleksi & Kustodian"},{"ID":"D10-03","Nama":"Wahyu Siregar","Jabatan":"Analis & Pelaksana Koleksi & Aset Gaya Hidup","Unit":"D10 · Koleksi & Aset Gaya Hidup","Tier":"Staf","Email":"d10.03.wahyu@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Koleksi & Kustodian"},{"ID":"D10-04","Nama":"Yogi Mulyono","Jabatan":"Analis & Pelaksana Koleksi & Aset Gaya Hidup","Unit":"D10 · Koleksi & Aset Gaya Hidup","Tier":"Staf","Email":"d10.04.yogi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Koleksi & Kustodian"},{"ID":"D11-01","Nama":"Zahra Sanjaya","Jabatan":"Head of Protection & Retirement","Unit":"D11 · Asuransi & Pensiun","Tier":"Manajemen","Email":"d11.01.zahra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT HOLDING (induk)"},{"ID":"D11-02","Nama":"Andi Nugroho","Jabatan":"Analis & Pelaksana Asuransi & Pensiun","Unit":"D11 · Asuransi & Pensiun","Tier":"Staf","Email":"d11.02.andi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D12-01","Nama":"Bella Kusumo","Jabatan":"Head of Direct Business","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Manajemen","Email":"d12.01.bella@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT HOLDING (induk)"},{"ID":"D12-02","Nama":"Cakra Lestari","Jabatan":"Analis & Pelaksana Bisnis & Usaha Langsung","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Staf","Email":"d12.02.cakra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D12-03","Nama":"Dewi Permata","Jabatan":"Analis & Pelaksana Bisnis & Usaha Langsung","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Staf","Email":"d12.03.dewi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D12-04","Nama":"Erlangga Wijaya","Jabatan":"Analis & Pelaksana Bisnis & Usaha Langsung","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Staf","Email":"d12.04.erlangga@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D12-05","Nama":"Fanny Siregar","Jabatan":"Analis & Pelaksana Bisnis & Usaha Langsung","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Staf","Email":"d12.05.fanny@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"D12-06","Nama":"Galih Mulyono","Jabatan":"Analis & Pelaksana Bisnis & Usaha Langsung","Unit":"D12 · Bisnis & Usaha Langsung","Tier":"Staf","Email":"d12.06.galih@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"M1","Nama":"Rangga Adhisurya","Jabatan":"Direktur Utama","Unit":"S1 · CIO Office & Investment Committee","Tier":"Pemilik","Email":"rangga.direksi@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S1-02","Nama":"Hana Sanjaya","Jabatan":"Analis & Pelaksana CIO Office & Investment Committee","Unit":"S1 · CIO Office & Investment Committee","Tier":"Staf","Email":"s1.02.hana@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S1-03","Nama":"Ilham Nugroho","Jabatan":"Analis & Pelaksana CIO Office & Investment Committee","Unit":"S1 · CIO Office & Investment Committee","Tier":"Staf","Email":"s1.03.ilham@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S1-04","Nama":"Jasmine Kusumo","Jabatan":"Analis & Pelaksana CIO Office & Investment Committee","Unit":"S1 · CIO Office & Investment Committee","Tier":"Staf","Email":"s1.04.jasmine@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"M5","Nama":"Aditya Rahim","Jabatan":"Compliance & Legal Officer","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Manajemen","Email":"aditya.kepatuhan@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-02","Nama":"Kevin Lestari","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.02.kevin@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-03","Nama":"Laras Permata","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.03.laras@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-04","Nama":"Mahendra Wijaya","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.04.mahendra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-05","Nama":"Nabila Siregar","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.05.nabila@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-06","Nama":"Oki Mulyono","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.06.oki@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-07","Nama":"Putri Sanjaya","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.07.putri@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S2-08","Nama":"Bagus Santoso","Jabatan":"Analis & Pelaksana Risk, Compliance & APU-PPT","Unit":"S2 · Risk, Compliance & APU-PPT","Tier":"Staf","Email":"s2.08.bagus@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"M6","Nama":"Sari Handayani","Jabatan":"Finance & Tax Lead","Unit":"S3 · Finance, Tax & Accounting","Tier":"Manajemen","Email":"sari.keuangan@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-02","Nama":"Citra Hartono","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.02.citra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-03","Nama":"Darma Purnama","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.03.darma@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-04","Nama":"Eka Halim","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.04.eka@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-05","Nama":"Farhan Hidayat","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.05.farhan@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-06","Nama":"Gita Panggabean","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.06.gita@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-07","Nama":"Hendra Subekti","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.07.hendra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-08","Nama":"Intan Puspita","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.08.intan@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S3-09","Nama":"Joko Santoso","Jabatan":"Analis & Pelaksana Finance, Tax & Accounting","Unit":"S3 · Finance, Tax & Accounting","Tier":"Staf","Email":"s3.09.joko@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-01","Nama":"Kartika Hartono","Jabatan":"Head of Operations & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Manajemen","Email":"s4.01.kartika@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-02","Nama":"Lutfi Purnama","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.02.lutfi@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-03","Nama":"Maya Halim","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.03.maya@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-04","Nama":"Naufal Hidayat","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.04.naufal@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-05","Nama":"Olivia Panggabean","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.05.olivia@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-06","Nama":"Prasetya Subekti","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.06.prasetya@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-07","Nama":"Qori Puspita","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.07.qori@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-08","Nama":"Rama Santoso","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.08.rama@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S4-09","Nama":"Sinta Hartono","Jabatan":"Analis & Pelaksana Operations, Settlement & Custody","Unit":"S4 · Operations, Settlement & Custody","Tier":"Staf","Email":"s4.09.sinta@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S5-01","Nama":"Taufik Purnama","Jabatan":"General Counsel & Corp Sec","Unit":"S5 · Legal & Corporate Secretary","Tier":"Manajemen","Email":"s5.01.taufik@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S5-02","Nama":"Utami Halim","Jabatan":"Analis & Pelaksana Legal & Corporate Secretary","Unit":"S5 · Legal & Corporate Secretary","Tier":"Staf","Email":"s5.02.utami@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S5-03","Nama":"Vina Hidayat","Jabatan":"Analis & Pelaksana Legal & Corporate Secretary","Unit":"S5 · Legal & Corporate Secretary","Tier":"Staf","Email":"s5.03.vina@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S5-04","Nama":"Wahyu Panggabean","Jabatan":"Analis & Pelaksana Legal & Corporate Secretary","Unit":"S5 · Legal & Corporate Secretary","Tier":"Staf","Email":"s5.04.wahyu@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S6-01","Nama":"Yogi Subekti","Jabatan":"Head of People & Culture","Unit":"S6 · People & Culture","Tier":"Manajemen","Email":"s6.01.yogi@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S6-02","Nama":"Zahra Puspita","Jabatan":"Analis & Pelaksana People & Culture","Unit":"S6 · People & Culture","Tier":"Staf","Email":"s6.02.zahra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S6-03","Nama":"Andi Santoso","Jabatan":"Analis & Pelaksana People & Culture","Unit":"S6 · People & Culture","Tier":"Staf","Email":"s6.03.andi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S6-04","Nama":"Bella Hartono","Jabatan":"Analis & Pelaksana People & Culture","Unit":"S6 · People & Culture","Tier":"Staf","Email":"s6.04.bella@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-01","Nama":"Cakra Purnama","Jabatan":"Head of Technology & AI","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Manajemen","Email":"s7.01.cakra@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-02","Nama":"Dewi Halim","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.02.dewi@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-03","Nama":"Erlangga Hidayat","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.03.erlangga@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-04","Nama":"Fanny Panggabean","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.04.fanny@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-05","Nama":"Galih Subekti","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.05.galih@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-06","Nama":"Hana Puspita","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.06.hana@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-07","Nama":"Ilham Santoso","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.07.ilham@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-08","Nama":"Jasmine Hartono","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.08.jasmine@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-09","Nama":"Kevin Purnama","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.09.kevin@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S7-10","Nama":"Laras Halim","Jabatan":"Analis & Pelaksana Technology, Data & AI Engineering","Unit":"S7 · Technology, Data & AI Engineering","Tier":"Staf","Email":"s7.10.laras@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S8-01","Nama":"Mahendra Hidayat","Jabatan":"Head of Stakeholder Relations","Unit":"S8 · Capital & Stakeholder Relations","Tier":"Manajemen","Email":"s8.01.mahendra@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S8-02","Nama":"Nabila Panggabean","Jabatan":"Analis & Pelaksana Capital & Stakeholder Relations","Unit":"S8 · Capital & Stakeholder Relations","Tier":"Staf","Email":"s8.02.nabila@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S8-03","Nama":"Oki Subekti","Jabatan":"Analis & Pelaksana Capital & Stakeholder Relations","Unit":"S8 · Capital & Stakeholder Relations","Tier":"Staf","Email":"s8.03.oki@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S8-04","Nama":"Putri Puspita","Jabatan":"Analis & Pelaksana Capital & Stakeholder Relations","Unit":"S8 · Capital & Stakeholder Relations","Tier":"Staf","Email":"s8.04.putri@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S8-05","Nama":"Bagus Pratiwi","Jabatan":"Analis & Pelaksana Capital & Stakeholder Relations","Unit":"S8 · Capital & Stakeholder Relations","Tier":"Staf","Email":"s8.05.bagus@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S9-01","Nama":"Citra Setiawan","Jabatan":"Head of Internal Audit","Unit":"S9 · Internal Audit","Tier":"Manajemen","Email":"s9.01.citra@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S9-02","Nama":"Darma Gunawan","Jabatan":"Analis & Pelaksana Internal Audit","Unit":"S9 · Internal Audit","Tier":"Staf","Email":"s9.02.darma@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-01","Nama":"Eka Suryadi","Jabatan":"AI Operations Director","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Manajemen","Email":"s10.01.eka@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-02","Nama":"Farhan Kencana","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.02.farhan@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-03","Nama":"Gita Ramadhan","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.03.gita@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-04","Nama":"Hendra Utomo","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.04.hendra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-05","Nama":"Intan Wibowo","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.05.intan@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-06","Nama":"Joko Pratiwi","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.06.joko@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S10-07","Nama":"Kartika Setiawan","Jabatan":"Analis & Pelaksana AI Operations Center (Kantor AI)","Unit":"S10 · AI Operations Center (Kantor AI)","Tier":"Staf","Email":"s10.07.kartika@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S11-01","Nama":"Lutfi Gunawan","Jabatan":"Head of Deal Sourcing","Unit":"S11 · Business Development & Deal Sourcing","Tier":"Manajemen","Email":"s11.01.lutfi@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S11-02","Nama":"Maya Suryadi","Jabatan":"Analis & Pelaksana Business Development & Deal Sourcing","Unit":"S11 · Business Development & Deal Sourcing","Tier":"Staf","Email":"s11.02.maya@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S11-03","Nama":"Naufal Kencana","Jabatan":"Analis & Pelaksana Business Development & Deal Sourcing","Unit":"S11 · Business Development & Deal Sourcing","Tier":"Staf","Email":"s11.03.naufal@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S11-04","Nama":"Olivia Ramadhan","Jabatan":"Analis & Pelaksana Business Development & Deal Sourcing","Unit":"S11 · Business Development & Deal Sourcing","Tier":"Staf","Email":"s11.04.olivia@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S11-05","Nama":"Prasetya Utomo","Jabatan":"Analis & Pelaksana Business Development & Deal Sourcing","Unit":"S11 · Business Development & Deal Sourcing","Tier":"Staf","Email":"s11.05.prasetya@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"M7","Nama":"Yusuf Maulana","Jabatan":"GA Manager","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Manajemen","Email":"yusuf.ga@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"OWN1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-02","Nama":"Qori Wibowo","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.02.qori@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-03","Nama":"Rama Pratiwi","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.03.rama@holding-investasi.id","Aktif":"YA","Fase":1,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-04","Nama":"Sinta Setiawan","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.04.sinta@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-05","Nama":"Taufik Gunawan","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.05.taufik@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-06","Nama":"Utami Suryadi","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.06.utami@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-07","Nama":"Vina Kencana","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.07.vina@holding-investasi.id","Aktif":"YA","Fase":2,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-08","Nama":"Wahyu Ramadhan","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.08.wahyu@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-09","Nama":"Yogi Utomo","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.09.yogi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-10","Nama":"Zahra Wibowo","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.10.zahra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-11","Nama":"Andi Pratiwi","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.11.andi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-12","Nama":"Bella Setiawan","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.12.bella@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-13","Nama":"Cakra Gunawan","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.13.cakra@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"S12-14","Nama":"Dewi Suryadi","Jabatan":"Analis & Pelaksana General Affairs, Fasilitas & Umum","Unit":"S12 · General Affairs, Fasilitas & Umum","Tier":"Staf","Email":"s12.14.dewi@holding-investasi.id","Aktif":"YA","Fase":3,"StatusKepegawaian":"Karyawan FTE","atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"M10","Nama":"Dimas Prasetyo","Jabatan":"Freelancer Proyek Media & Konten","Unit":"D6 · Bisnis Digital & IP (Proyek)","Tier":"Freelancer","Email":"dimas.freelance@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":1,"atasanId":"M1","entitas":"PT Digital & IP"},{"ID":"FL-01","Nama":"Raka Pratama","Jabatan":"Freelancer UI/UX & Dashboard Design","Unit":"S7 · Technology & AI Eng (Proyek)","Tier":"Freelancer","Email":"raka.uiux@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":1,"atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"FL-02","Nama":"Tiara Ayu","Jabatan":"Freelancer Penilai Properti (KJPP)","Unit":"D7 · Properti & Tanah (Proyek)","Tier":"Freelancer","Email":"tiara.kjpp@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":1,"atasanId":"M1","entitas":"PT Properti"},{"ID":"FL-03","Nama":"Fajar Nugraha","Jabatan":"Freelancer Riset Pasar & Sektor","Unit":"D2 · Ekuitas Publik (Proyek)","Tier":"Freelancer","Email":"fajar.riset@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"FL-04","Nama":"Salsa Maharani","Jabatan":"Freelancer Video & Investor Deck","Unit":"S8 · Stakeholder Relations (Proyek)","Tier":"Freelancer","Email":"salsa.media@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"FL-05","Nama":"Hafiz Alamsyah","Jabatan":"Freelancer Otomasi Prompt & Agen AI","Unit":"S10 · AI Operations Center (Proyek)","Tier":"Freelancer","Email":"hafiz.aiops@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"FL-06","Nama":"Novi Wulandari","Jabatan":"Freelancer Konsultan Pajak & Aktuaria","Unit":"D11 · Asuransi & Pensiun (Proyek)","Tier":"Freelancer","Email":"novi.aktuaria@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"FL-07","Nama":"Bayu Segara","Jabatan":"Freelancer Agronomi & Survey Lahan","Unit":"D9 · Agrikultur & Alam (Proyek)","Tier":"Freelancer","Email":"bayu.agro@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"FL-08","Nama":"Clarissa Lim","Jabatan":"Freelancer Kurator Karya & Koleksi","Unit":"D10 · Koleksi & Gaya Hidup (Proyek)","Tier":"Freelancer","Email":"clarissa.kurasi@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Koleksi & Kustodian"},{"ID":"FL-09","Nama":"Ilham Firdaus","Jabatan":"Freelancer Pentest & Audit Keamanan","Unit":"S7 · Technology & AI Eng (Proyek)","Tier":"Freelancer","Email":"ilham.sec@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"FL-10","Nama":"Mega Puspitasari","Jabatan":"Freelancer Notaris & Akta Transaksi","Unit":"S5 · Legal & Corp Sec (Proyek)","Tier":"Freelancer","Email":"mega.notaris@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Shared Services / Kantor AI"},{"ID":"FL-11","Nama":"Dody Kurniawan","Jabatan":"Freelancer Teknisi MEP & Audit Aset","Unit":"D8 · Aset Fisik Produktif (Proyek)","Tier":"Freelancer","Email":"dody.teknisi@mitra.id","Aktif":"YA","StatusKepegawaian":"Freelancer","Fase":2,"atasanId":"M1","entitas":"PT Aset Produktif & Agri"},{"ID":"M8","Nama":"KAP Wijaya & Rekan","Jabatan":"Auditor Eksternal (Tamu)","Unit":"Eksternal · Audit KAP","Tier":"Auditor","Email":"audit.wijaya@eksternal.id","Aktif":"YA","StatusKepegawaian":"Eksternal","Fase":1,"atasanId":"M1","entitas":"PT HOLDING (induk)"},{"ID":"M9","Nama":"PT Bersih Cemerlang","Jabatan":"Vendor Fasilitas (Tamu)","Unit":"Eksternal · Vendor","Tier":"Tamu","Email":"vendor.bersih@mitra.id","Aktif":"YA","StatusKepegawaian":"Eksternal","Fase":1,"atasanId":"M1","entitas":"PT HOLDING (induk)"}],"tasks":[{"ID":"TGS-001","Kategori":"Fasilitas & Kantor","Tugas":"Membuka kantor, cek fasilitas & laporan harian","Pengerja":"On-site","Eksekutor":"Office Boy","Status":"Selesai","tenggat":"2026-11-25","prioritas":"Tinggi","buktiSelesai":"dok://arsip/SOP-01"},{"ID":"TGS-002","Kategori":"Fasilitas & Kantor","Tugas":"Menyusun anggaran GA & memantau deviasi realisasi otomatis","Pengerja":"AI","Eksekutor":"AG-14 + GA Manager","Status":"Selesai","tenggat":"2026-11-26","prioritas":"Sedang","buktiSelesai":"dok://arsip/SOP-02"},{"ID":"TGS-003","Kategori":"Teknis & Pemeliharaan","Tugas":"Menyusun jadwal pemeliharaan preventif & pengingat servis tahunan","Pengerja":"AI","Eksekutor":"AG-07 + Google Calendar","Status":"Selesai","tenggat":"2026-11-27","prioritas":"Sedang","buktiSelesai":"dok://arsip/SOP-03"},{"ID":"TGS-004","Kategori":"Pengadaan & Vendor","Tugas":"Menerima tiket pengadaan, membandingkan 3 vendor & cek invoice PO","Pengerja":"AI","Eksekutor":"AG-16 + AG-14","Status":"Selesai","tenggat":"2026-11-28","prioritas":"Rendah","buktiSelesai":"dok://arsip/SOP-04"},{"ID":"TGS-005","Kategori":"Investasi & Deal","Tugas":"Memantau listing masuk, menyusun memo investasi, DD & valuasi 3 skenario","Pengerja":"AI","Eksekutor":"AG-01..AG-04","Status":"Selesai","tenggat":"2026-11-29","prioritas":"Tinggi","buktiSelesai":"dok://arsip/SOP-05"},{"ID":"TGS-006","Kategori":"Investasi & Deal","Tugas":"Menandatangani perjanjian & instruksi transfer dana (wajib manusia)","Pengerja":"On-site","Eksekutor":"Direktur","Status":"Selesai","tenggat":"2026-11-30","prioritas":"Sedang","buktiSelesai":"dok://arsip/SOP-06"},{"ID":"TGS-007","Kategori":"Keuangan & Pajak","Tugas":"Mengimpor transaksi bank, rekonsiliasi & memodelkan proyeksi kas 3 skenario","Pengerja":"AI","Eksekutor":"AG-14 + AG-12","Status":"Proses","tenggat":"2026-11-25","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-008","Kategori":"Keuangan & Pajak","Tugas":"Mengompilasi data room audit 100% populasi & draf jawaban auditor","Pengerja":"AI","Eksekutor":"AG-14 + AG-12 + AG-13","Status":"Proses","tenggat":"2026-11-26","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-009","Kategori":"Keuangan & Pajak","Tugas":"Menyetujui dan melepas pembayaran transaksi (> Rp100 jt wajib Direktur)","Pengerja":"Remote","Eksekutor":"CFO / Direktur","Status":"Proses","tenggat":"2026-11-27","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-010","Kategori":"SDM & Administrasi","Tugas":"Menyaring CV, menyiapkan kontrak onboarding, payroll BPJS & rekap KPI","Pengerja":"AI","Eksekutor":"AG-16 + AG-17 + AG-14","Status":"Proses","tenggat":"2026-11-28","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-011","Kategori":"SDM & Administrasi","Tugas":"Menyiapkan modul pelatihan kepatuhan & AI, kuis uji & absensi daring","Pengerja":"AI","Eksekutor":"AG-13 + AG-18 + Gemini AI","Status":"Proses","tenggat":"2026-11-29","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-012","Kategori":"SDM & Administrasi","Tugas":"Melakukan wawancara final, asesmen senior & penanganan disiplin karyawan","Pengerja":"On-site","Eksekutor":"HR Manager + Direksi","Status":"Proses","tenggat":"2026-11-30","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-013","Kategori":"Kepatuhan & Korporasi","Tugas":"Memantau aturan POJK/PMK, screening PEP & menyusun draf jawaban regulator","Pengerja":"AI","Eksekutor":"AG-13 + AG-17","Status":"Proses","tenggat":"2026-11-25","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-014","Kategori":"Kepatuhan & Korporasi","Tugas":"Menyelenggarakan RUPS, pembaruan OSS/AHU & audit internal lapangan","Pengerja":"On-site","Eksekutor":"Corsec + Internal Audit","Status":"Proses","tenggat":"2026-11-26","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-015","Kategori":"D1 · Kas & Pendapatan Tetap (A, B)","Tugas":"Memantau jatuh tempo deposito, jadwal kupon obligasi & rasio likuiditas 3 bln","Pengerja":"AI","Eksekutor":"AG-05 + AG-14 + AG-12","Status":"Belum","tenggat":"2026-11-27","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-016","Kategori":"D1 · Kas & Pendapatan Tetap (A, B)","Tugas":"Negosiasi special rate deposito & kuota penempatan dengan treasury bank","Pengerja":"Remote","Eksekutor":"Head D1","Status":"Belum","tenggat":"2026-11-28","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-017","Kategori":"D2 & D3 · Ekuitas, Reksa Dana & ETF (C, D)","Tugas":"Screening saham IDX/Global, batas 10% emiten & audit overlap Reksa Dana/ETF","Pengerja":"AI","Eksekutor":"AG-05 + AG-02 + AG-12","Status":"Belum","tenggat":"2026-11-29","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-018","Kategori":"D2 & D3 · Ekuitas, Reksa Dana & ETF (C, D)","Tugas":"Menetapkan tesis investasi, limit order & eksekusi rebalancing kuartalan","Pengerja":"Remote","Eksekutor":"Head D2 + Head D3","Status":"Belum","tenggat":"2026-11-30","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-019","Kategori":"D4 · Valas, Komoditas & Derivatif (E, N)","Tugas":"Memantau kurs spot, spread emas, margin call & stress test limit 3% harian","Pengerja":"AI","Eksekutor":"AG-05 + AG-04 + AG-13","Status":"Belum","tenggat":"2026-11-25","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-020","Kategori":"D4 · Valas, Komoditas & Derivatif (E, N)","Tugas":"Keputusan hedging valas & verifikasi fisik sertifikat emas/perak di brankas","Pengerja":"On-site","Eksekutor":"Head D4 + Custody + Audit","Status":"Belum","tenggat":"2026-11-26","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-021","Kategori":"D5 · Kripto & Aset Digital Trading (F1–F10)","Tugas":"Mengawasi dompet on-chain 24/7, health factor DeFi & hitung PPh 22 0,21%","Pengerja":"AI","Eksekutor":"AG-10 + AG-14","Status":"Belum","tenggat":"2026-11-27","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-022","Kategori":"D5 · Kripto & Aset Digital Trading (F1–F10)","Tugas":"Uji pemulihan seed phrase & rotasi hardware wallet multi-sig 2-dari-3","Pengerja":"On-site","Eksekutor":"Custody D5 + 2 Pejabat","Status":"Belum","tenggat":"2026-11-28","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-023","Kategori":"D6 · Bisnis Digital, SaaS & HKI (F11–F20, L)","Tugas":"Audit traffic SaaS, MRR/churn, rekonsiliasi royalti & alert perpanjangan domain/HKI","Pengerja":"AI","Eksekutor":"AG-11 + AG-17 + AG-13","Status":"Belum","tenggat":"2026-11-29","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-024","Kategori":"D6 · Bisnis Digital, SaaS & HKI (F11–F20, L)","Tugas":"Pengembangan fitur SaaS, konten teknis & audit kode sumber proyek","Pengerja":"Remote","Eksekutor":"Freelancer Proyek + S7","Status":"Belum","tenggat":"2026-11-30","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-025","Kategori":"D7 · Properti & Tanah (G)","Tugas":"Menarik NJOP, komparasi harga, penagihan sewa otomatis & pengingat kontrak H-60","Pengerja":"AI","Eksekutor":"AG-06 + AG-14 + AG-17","Status":"Belum","tenggat":"2026-11-25","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-026","Kategori":"D7 · Properti & Tanah (G)","Tugas":"Survei lokasi, cek sertifikat BPN/PPAT, patok tanah & pengawasan renovasi","Pengerja":"On-site","Eksekutor":"Site Officer D7 + Legal S5","Status":"Belum","tenggat":"2026-11-26","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-027","Kategori":"D8 · Aset Fisik Produktif (H)","Tugas":"Memantau telemetri IoT mesin/vending, rute teknisi & cocokkan setoran QRIS","Pengerja":"AI","Eksekutor":"AG-07 + AG-14","Status":"Belum","tenggat":"2026-11-27","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-028","Kategori":"D8 · Aset Fisik Produktif (H)","Tugas":"Restock mesin, perbaikan lapangan & pengurusan izin laik operasi SIA/SILO","Pengerja":"On-site","Eksekutor":"Technician + Field Ops D8","Status":"Belum","tenggat":"2026-11-28","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-029","Kategori":"D9 · Agrikultur & Alam (I)","Tugas":"Proyeksi cuaca/panen satelit, deteksi dini hama & hitung bagi hasil petani/plasma","Pengerja":"AI","Eksekutor":"AG-08 + AG-14","Status":"Belum","tenggat":"2026-11-29","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-030","Kategori":"D9 · Agrikultur & Alam (I)","Tugas":"Pengadaan bibit/pupuk, vaksinasi ternak & pengukuran panen ke offtaker","Pengerja":"On-site","Eksekutor":"Field Coordinator + Agronomist","Status":"Belum","tenggat":"2026-11-30","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-031","Kategori":"D10 · Koleksi & Aset Gaya Hidup (J)","Tugas":"Pelacakan harga lelang global, provenans & jadwal perawatan/asuransi koleksi","Pengerja":"AI","Eksekutor":"AG-09 + AG-07 + AG-13","Status":"Belum","tenggat":"2026-11-25","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-032","Kategori":"D10 · Koleksi & Aset Gaya Hidup (J)","Tugas":"Autentikasi fisik objek bernilai tinggi & pemeliharaan climate control brankas","Pengerja":"On-site","Eksekutor":"Kurator D10 + Vendor","Status":"Belum","tenggat":"2026-11-26","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-033","Kategori":"D11 · Asuransi & Pensiun (M)","Tugas":"Audit isi polis unit-link/jiwa/anuitas, jadwal premi & nilai tunai pensiun","Pengerja":"AI","Eksekutor":"AG-13 + AG-14 + AG-12","Status":"Belum","tenggat":"2026-11-27","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-034","Kategori":"D11 · Asuransi & Pensiun (M)","Tugas":"Evaluasi proteksi grup, pengajuan klaim besar & negosiasi retensi premi","Pengerja":"Remote","Eksekutor":"Head D11 + Finance","Status":"Belum","tenggat":"2026-11-28","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-035","Kategori":"D12 · Bisnis Langsung & UMKM (K)","Tugas":"Konsolidasi POS kasir harian franchise/klinik, deteksi selisih stok & pra-DD UMKM","Pengerja":"AI","Eksekutor":"AG-14 + AG-12 + AG-03","Status":"Belum","tenggat":"2026-11-29","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-036","Kategori":"D12 · Bisnis Langsung & UMKM (K)","Tugas":"Inspeksi SOP cabang, kepatuhan izin BPOM/Kemenkes & pembinaan mitra usaha","Pengerja":"On-site","Eksekutor":"Operations D12","Status":"Belum","tenggat":"2026-11-30","prioritas":"Rendah","buktiSelesai":""},{"ID":"TGS-037","Kategori":"Tata Kelola Grup & Multi-Entitas (7 PT/SPV)","Tugas":"Rekonsiliasi intercompany & transfer pricing 7 PT/SPV, risalah Meet & pra-audit 100%","Pengerja":"AI","Eksekutor":"AG-14 + AG-18 + Gemini AI","Status":"Belum","tenggat":"2026-11-25","prioritas":"Tinggi","buktiSelesai":""},{"ID":"TGS-038","Kategori":"Tata Kelola Grup & Multi-Entitas (7 PT/SPV)","Tugas":"Briefing NDA, milestone & jadwal termin 12 Freelancer serta monitoring server S7","Pengerja":"AI","Eksekutor":"AG-16 + AG-18","Status":"Belum","tenggat":"2026-11-26","prioritas":"Sedang","buktiSelesai":""},{"ID":"TGS-039","Kategori":"Tata Kelola Grup & Multi-Entitas (7 PT/SPV)","Tugas":"Pengembangan portal/Apps Script & negosiasi strategis co-investor/bank/regulator","Pengerja":"Remote","Eksekutor":"CTO S7 + Direksi","Status":"Belum","tenggat":"2026-11-27","prioritas":"Sedang","buktiSelesai":""}]};
const keys = { db:'kai-onefile-db-v1', sessions:'kai-onefile-sessions-v1', otps:'kai-onefile-otps-v1', locks:'kai-onefile-pinlocks-v1' };
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(_){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const date=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
const time=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Jakarta',hour12:false}).replace('T',' ');
const plusWorkDays=(n)=>{const d=new Date();let a=0;while(a<n){d.setDate(d.getDate()+1);const w=d.getDay();if(w!==0&&w!==6)a++;}return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});};
const makeId=p=>`${p}-LOCAL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
/* SHA-256 sync untuk hash PIN (F-11/R-04/R-27) & rantai audit (F-85/F-86) */
function sha256Sync(str){
  const ascii=unescape(encodeURIComponent(String(str)));
  const rr=(v,a)=>(v>>>a)|(v<<(32-a)),maxWord=Math.pow(2,32);
  let res='',words=[],bitLen=ascii.length*8;
  let hash=(sha256Sync.h=sha256Sync.h||[]),k=(sha256Sync.k=sha256Sync.k||[]),pc=k.length,comp={};
  for(let c=2;pc<64;c++){if(!comp[c]){for(let i=0;i<313;i+=c)comp[i]=c;hash[pc]=(Math.pow(c,.5)*maxWord)|0;k[pc++]=(Math.pow(c,1/3)*maxWord)|0;}}
  let s=ascii+'\x80';while(s.length%64-56)s+='\x00';
  for(let i=0;i<s.length;i++)words[i>>2]|=s.charCodeAt(i)<<((3-i)%4*8);
  words[words.length]=(bitLen/maxWord)|0;words[words.length]=bitLen;
  for(let j=0;j<words.length;){const w=words.slice(j,j+=16),old=hash;hash=hash.slice(0,8);const h=hash;
    for(let i=0;i<64;i++){const w15=w[i-15],w2=w[i-2],a=h[0],e=h[4];
      const t1=h[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&h[5])^(~e&h[6]))+k[i]+(w[i]=i<16?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      const t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&h[1])^(a&h[2])^(h[1]&h[2]));h.pop();h.unshift((t1+t2)|0);h[4]=(h[4]+t1)|0;}
    for(let i=0;i<8;i++)h[i]=(h[i]+old[i])|0;}
  for(let i=0;i<8;i++)for(let j=3;j+1;j--){const b=(hash[i]>>(j*8))&255;res+=(b<16?'0':'')+b.toString(16);}
  return res;
}
const hashPin=(id,pin)=>'sha256$'+sha256Sync('KAI-PIN-V1|'+String(id).toUpperCase()+'|'+String(pin));
const verifyPin=(u,pin)=>{if(!u||!u.OfflinePin||!pin)return false;const stored=String(u.OfflinePin);if(stored.startsWith('sha256$'))return stored===hashPin(u.ID,pin);return stored===String(pin);};
const haversine=(lat1,lng1,lat2,lng2)=>{const R=6371000,rad=d=>d*Math.PI/180,dLat=rad(lat2-lat1),dLng=rad(lng2-lng1),a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLng/2)**2;return Math.round(2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));};
const officeConf=()=>{const s=get('kai-settings-v1',{});const pts=String(s.office||'-6.2297,106.8095').split(',').map(Number);return{lat:Number.isFinite(pts[0])?pts[0]:-6.2297,lng:Number.isFinite(pts[1])?pts[1]:106.8095,radius:Number(s.radius)||300,strictRadius:Boolean(s.strictRadius)};};
const COA_LIST=['1101 · Kas & Bank Operasional','1102 · Deposito & Setara Kas','1201 · Piutang Hasil Investasi','2101 · Utang Usaha & Vendor','3101 · Modal Disetor','4101 · Pendapatan Kupon/Dividen/Sewa','5101 · Beban Gaji & SDM','5102 · Beban Sewa & Utilitas','5103 · Beban Alat TI & SaaS','5104 · Beban Jasa Profesional (Legal/KJPP/KAP)','5105 · Beban Pajak & Perizinan','5109 · Beban Operasional Kantor'];
/* PIN akun uji tidak ditulis sebagai teks polos di berkas — hanya hash SHA-256 bergaram ID (F-11). */
const DEFAULT_OFFLINE_PINS={'OWN1':'sha256$70ae35404747b64c48793d3e85e4cfd95aba40ea0acbd704ecc298b8fb7b80fb','M1':'sha256$50112ea2814ce6ca1393cb6461b230bb6d7a6f30eecff83651aa1b38f7a447b0','M5':'sha256$7deb2d9790a14efef2925dd643e78648395b2ce5f853daa105c66cbeb9c2710e','S7-01':'sha256$9d6dbedfa2701025c728ffa0d1b2d4169f96cbf0a779a382ffd0ac9cd8c6e9b2'};
const db=get(keys.db,null)||{
  users:seed.users.map(x=>({...x,Aktif:'YA',Fase:x.Fase||2,atasanId:x.atasanId||'M1',entitas:x.entitas||'PT HOLDING (induk)',OfflinePinAktif:DEFAULT_OFFLINE_PINS[x.ID]?'YA':'TIDAK',OfflinePin:DEFAULT_OFFLINE_PINS[x.ID]||''})),
  tasks:seed.tasks,
  intake:[
    {ID:'INT-DEMO01',Judul:'Alokasi Obligasi Korporasi Tenor 3 Tahun — Seri A',Kategori:'B · Pendapatan Tetap',Nilai:6500000000,Unit:'D1 · Kas & Pendapatan Tetap',Pengaju:'Kirana Prameswari',PengajuID:'M2',Status:'Direview',Riwayat:`${time()} dibuat Kirana Prameswari (M2)`,TanggalBuat:date(),tenggat:plusWorkDays(5),lampiran:['dok://memo/DD-OBL-01'],dasarPersetujuan:'',entitas:'PT HOLDING (induk)'},
    {ID:'INT-DEMO02',Judul:'Penambahan Posisi Ekuitas Blue-Chip Sektor Perbankan',Kategori:'C · Ekuitas',Nilai:1250000000,Unit:'D2 · Ekuitas Publik',Pengaju:'Bimo Saputra',PengajuID:'M3',Status:'Masuk',Riwayat:`${time()} dibuat Bimo Saputra (M3)`,TanggalBuat:date(),tenggat:plusWorkDays(5),lampiran:['dok://memo/DD-EQ-02'],dasarPersetujuan:'',entitas:'PT HOLDING (induk)'}
  ],
  cash:[
    {ID:'KAS-DEMO01',Tanggal:date(),Jenis:'Masuk',Kategori:'3101 · Modal Disetor',Nominal:12500000000,Keterangan:'Setoran modal awal PT Holding (data simulasi lokal).',Oleh:'Rangga Adhisurya',Status:'Disetujui',Rekonsiliasi:'Sudah',entitas:'PT HOLDING (induk)',coa:'3101 · Modal Disetor',lampiran:'dok://bank/RC-001',dibuatOleh:'M1',disetujuiOleh:'OWN1',periode:date().slice(0,7)},
    {ID:'KAS-DEMO02',Tanggal:date(),Jenis:'Keluar',Kategori:'5103 · Beban Alat TI & SaaS',Nominal:12185000,Keterangan:'Pembayaran biaya tetap alat inti bulanan sesuai D-32.',Oleh:'Sari Handayani',Status:'Draft',Rekonsiliasi:'Belum',entitas:'PT Shared Services / Kantor AI',coa:'5103 · Beban Alat TI & SaaS',lampiran:'dok://invoice/INV-TI-11',dibuatOleh:'M6',disetujuiOleh:'',periode:date().slice(0,7)}
  ],
  attendance:[],
  documents:[],
  closedPeriods:[],
  audit:[{Waktu:time(),Siapa:'SISTEM',Aksi:'Mode single-file lokal dimulai (kebijakan L01-L20 aktif).',Modul:'Sistem',objekId:'BOOT',nilaiLama:'',nilaiBaru:'',prevHash:'GENESIS',hash:sha256Sync('BOOT|GENESIS')}]
};
/* Migrasi otomatis database lama di localStorage ke skema F-01..F-86 */
if(Array.isArray(db.users)){
  db.users.forEach(x=>{
    if(x.OfflinePinAktif===undefined)x.OfflinePinAktif=DEFAULT_OFFLINE_PINS[x.ID]?'YA':'TIDAK';
    if(x.OfflinePin===undefined)x.OfflinePin=DEFAULT_OFFLINE_PINS[x.ID]||'';
    else if(x.OfflinePin&&!String(x.OfflinePin).startsWith('sha256$'))x.OfflinePin=hashPin(x.ID,x.OfflinePin);
    if(!x.Fase)x.Fase=2;
    if(!x.atasanId)x.atasanId='M1';
    if(!x.entitas)x.entitas='PT HOLDING (induk)';
  });
}
if(!Array.isArray(db.closedPeriods))db.closedPeriods=[];
let __lastRaw='';
const save=()=>{try{__lastRaw=JSON.stringify(db);localStorage.setItem(keys.db,__lastRaw);}catch(_){}}; if(!localStorage.getItem(keys.db)){save();}else{try{__lastRaw=JSON.stringify(db);}catch(_){}}
/* Sinkron: bila modul lain (Register/Operasional/Cadangan) menulis kai-onefile-db-v1 langsung, muat ulang agar tidak tertimpa */
const syncExternal=()=>{try{const raw=localStorage.getItem(keys.db);if(raw&&raw!==__lastRaw){const ext=JSON.parse(raw);if(ext&&Array.isArray(ext.users)&&ext.users.length){Object.keys(db).forEach(k=>{delete db[k];});Object.assign(db,ext);if(!Array.isArray(db.closedPeriods))db.closedPeriods=[];if(!Array.isArray(db.audit))db.audit=[];__lastRaw=raw;}}}catch(_){}};
let sessions=get(keys.sessions,{}),otps=get(keys.otps,{}),pinLocks=get(keys.locks,{});
const SESSION_TTL_MS=8*3600*1000,IDLE_MS=30*60*1000;
const rank=u=>!u?0:(u.Tier==='Pemilik'||/Direktur|Komisaris|Pemilik Utama/i.test(u.Jabatan||''))?3:u.Tier==='Manajemen'?2:['Staf','Freelancer','Auditor'].includes(u.Tier)?1:0;
const maskEmail=e=>String(e||'').replace(/^(..).+(@.*)$/,'$1***$2');
const pub=u=>({ID:u.ID,Nama:u.Nama,Jabatan:u.Jabatan,Unit:u.Unit,Tier:u.Tier,Email:u.Email,Peringkat:rank(u),Fase:u.Fase||2,StatusKepegawaian:u.StatusKepegawaian,OfflinePinAktif:u.OfflinePinAktif==='YA'?'YA':'TIDAK',atasanId:u.atasanId||'M1',entitas:u.entitas||'PT HOLDING (induk)'});
/* Profil terbatas sebelum login (R-01): hanya akun demo contoh & email disamarkan bila belum ada sesi */
const DEMO_QUICK_IDS=['OWN1','M1','M2','M5','M6','M10','M8'];
const audit=(u,a,m,objId='',oldV='',newV='')=>{
  const prev=db.audit.length&&db.audit[0].hash?db.audit[0].hash:'GENESIS';
  const t=time(),who=u||'SISTEM';
  const h=sha256Sync([t,who,a,objId,prev].join('|'));
  db.audit.unshift({Waktu:t,Siapa:who,Aksi:a,Modul:m,objekId:objId,nilaiLama:oldV?String(oldV).slice(0,160):'',nilaiBaru:newV?String(newV).slice(0,160):'',prevHash:prev,hash:h});
  db.audit.length=Math.min(db.audit.length,1000);
};
const resolveSession=t=>{
  if(!t||!sessions[t])return null;
  const raw=sessions[t];
  const uid=typeof raw==='string'?raw:raw.uid;
  const exp=typeof raw==='object'&&raw.exp?raw.exp:(Date.now()+SESSION_TTL_MS);
  const seen=typeof raw==='object'&&raw.seen?raw.seen:Date.now();
  if(Date.now()>exp||Date.now()-seen>IDLE_MS){delete sessions[t];put(keys.sessions,sessions);return null;}
  if(typeof raw==='string')sessions[t]={uid,exp:Date.now()+SESSION_TTL_MS,lastAt:time(),seen:Date.now()};
  else{raw.seen=Date.now();}
  put(keys.sessions,sessions);
  return db.users.find(x=>x.ID===uid&&x.Aktif==='YA')||null;
};
const user=t=>{const u=resolveSession(t);if(!u)throw Error('Sesi berakhir atau belum masuk (batas 8 jam / 30 menit tanpa aktivitas). Silakan masuk ulang.');return u;};
const allow=(u,tiers)=>{if(tiers&&!tiers.includes(u.Tier))throw Error(`Akses ditolak untuk peran ${u.Tier}.`);};
const readSeen={};const auditRead=(u,label,modul)=>{const k=u.ID+'|'+modul,n=Date.now();if(readSeen[k]&&n-readSeen[k]<600000)return;readSeen[k]=n;audit(u.Nama,label,modul,u.ID);save();};
const sameUnit=(u,unitStr)=>!unitStr||!u.Unit||(String(unitStr).split('·')[0].trim()===String(u.Unit).split('·')[0].trim());

function __dispatchRaw(r,t,p={}){let u,x,n;
syncExternal();
switch(r){
case'auth.profiles':{
  const caller=resolveSession(t);
  if(caller&&['Pemilik','Manajemen','Auditor'].includes(caller.Tier)){
    audit(caller.Nama,'Membaca direktori profil ('+db.users.length+')','Autentikasi',caller.ID);save();
    return db.users.filter(x=>x.Aktif==='YA').map(pub);
  }
  /* R-01: Tanpa login, JANGAN buka seluruh 170 akun & email utuh — hanya 7 profil uji cepat di mode demo */
  const quick=db.users.filter(x=>x.Aktif==='YA'&&DEMO_QUICK_IDS.includes(x.ID)).map(x=>({ID:x.ID,Nama:String(x.Nama||'').split(' ')[0],Jabatan:x.Tier,Unit:String(x.Unit||'').split(' · ')[0],Tier:x.Tier,Email:/@holding-investasi\.id$/i.test(x.Email||'')?x.Email:'',Peringkat:rank(x),Fase:x.Fase||2,StatusKepegawaian:x.StatusKepegawaian,OfflinePinAktif:x.OfflinePinAktif==='YA'?'YA':'TIDAK',demoQuick:true}));
  return quick;
}
case'auth.otpRequest':{
  const e=String(p.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))throw Error('Masukkan format alamat email yang valid.');
  const found=db.users.find(x=>x.Email.toLowerCase()===e&&x.Aktif==='YA');
  const code='123456'; /* Mode demo lokal tetap menyediakan preview; di Code.gs memakai kode acak 6 digit */
  if(found){otps[e]={code,exp:Date.now()+300000,tries:0};put(keys.otps,otps);}
  audit(found?found.Nama:'PUBLIK','Permintaan OTP email ('+maskEmail(e)+')','Autentikasi');save();
  /* R-02: Pesan seragam agar tidak membocorkan keberadaan email pada mode non-demo */
  if(!found)throw Error('Bila email terdaftar & aktif, kode OTP dikirim ke kotak masuk. Periksa ejaan email atau hubungi Pemilik.');
  return{ok:true,delivery:'preview',maskedEmail:maskEmail(e),expiresInSec:300,previewOtp:code};
}
case'auth.login':{
  const e=String(p.email||'').trim().toLowerCase();
  u=db.users.find(x=>x.Email.toLowerCase()===e&&x.Aktif==='YA');
  const rec=otps[e];
  const validOtp=rec&&(typeof rec==='string'?rec===String(p.otp||''):(rec.exp>Date.now()&&rec.code===String(p.otp||'')));
  if(!u||!validOtp){
    if(rec&&typeof rec==='object'){rec.tries=(rec.tries||0)+1;if(rec.tries>=3)delete otps[e];put(keys.otps,otps);}
    audit(e||'PUBLIK','Login OTP gagal','Autentikasi');save();
    throw Error('Kode OTP salah atau kedaluwarsa (maks 3 percobaan, berlaku 5 menit).');
  }
  if(!p.faceImage||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))throw Error('Lengkapi foto wajah dan titik lokasi Maps untuk lanjut.');
  delete otps[e];put(keys.otps,otps);
  const tok=makeId('SESSION');
  sessions[tok]={uid:u.ID,exp:Date.now()+SESSION_TTL_MS,lastAt:time(),seen:Date.now()};
  put(keys.sessions,sessions);
  audit(u.Nama,'Login Wajah + Maps + OTP berhasil','Autentikasi',u.ID);save();
  return{token:tok,user:pub(u)};
}
case'auth.loginPin':{
  const id=String(p.id||'').trim().toUpperCase(),pin=String(p.pin||'').trim(),kendala=String(p.kendala||'Kondisi Offline / Kendala Faktor Utama').trim().slice(0,120);
  if(!id||!pin)throw Error('Masukkan ID akun dan PIN offline terlebih dahulu.');
  /* R-04: Lockout 5 percobaan gagal selama 15 menit */
  const lk=pinLocks[id]||{count:0,until:0};
  if(lk.until&&Date.now()<lk.until){
    const mLeft=Math.ceil((lk.until-Date.now())/60000);
    throw Error(`Akun ${id} dikunci sementara (${mLeft} menit tersisa) karena 5× salah PIN.`);
  }
  u=db.users.find(x=>x.ID.toUpperCase()===id&&x.Aktif==='YA');
  if(!u)throw Error('ID akun tidak ditemukan atau akun sedang nonaktif.');
  if(u.OfflinePinAktif!=='YA'||!u.OfflinePin){
    audit(u.Nama,`Login Offline ditolak — akun ${u.ID} tidak berizin`,'Autentikasi',u.ID);save();
    throw Error('Akses ditolak: akun ini tidak memiliki izin akses Offline (ID + PIN).');
  }
  if(!verifyPin(u,pin)){
    lk.count=(lk.count||0)+1;
    if(lk.count>=5){lk.until=Date.now()+15*60*1000;lk.count=0;}
    pinLocks[id]=lk;put(keys.locks,pinLocks);
    audit(u.Nama,`Login Offline gagal — PIN salah (${u.ID})`,'Autentikasi',u.ID);save();
    throw Error('PIN akses offline tidak sesuai.');
  }
  delete pinLocks[id];put(keys.locks,pinLocks);
  const tok=makeId('SESSION');
  sessions[tok]={uid:u.ID,exp:Date.now()+SESSION_TTL_MS,lastAt:time(),seen:Date.now()};
  put(keys.sessions,sessions);
  audit(u.Nama,`Login Mode Offline/Darurat (ID + PIN) · ${kendala}`,'Autentikasi',u.ID);save();
  return{token:tok,user:pub(u),authMethod:'offline-pin',kendala};
}
case'auth.me':{
  u=user(t);
  if(sessions[t]&&typeof sessions[t]==='object'){sessions[t].lastAt=time();put(keys.sessions,sessions);}
  return{user:pub(u)};
}
case'auth.logout':{
  u=user(t);
  if(p.allDevices){Object.keys(sessions).forEach(k=>{const s=sessions[k];if((typeof s==='string'?s:s.uid)===u.ID)delete sessions[k];});}
  else{delete sessions[t];}
  put(keys.sessions,sessions);
  audit(u.Nama,p.allDevices?'Logout seluruh perangkat':'Logout sesi','Autentikasi',u.ID);save();
  return{ok:true};
}
case'dashboard.get':{
  u=user(t);
  const seeCash=['Pemilik','Manajemen','Staf','Auditor'].includes(u.Tier); /* L05 P-25/P-41: Freelancer & Tamu tidak melihat KPI kas/audit */
  const seeAudit=['Pemilik','Manajemen','Auditor'].includes(u.Tier);
  const seeOps=u.Tier!=='Tamu';
  const inc=db.cash.filter(x=>x.Jenis==='Masuk'&&x.Status!=='Ditolak').reduce((s,x)=>s+Number(x.Nominal||0),0);
  const out=db.cash.filter(x=>x.Jenis==='Keluar'&&x.Status!=='Ditolak').reduce((s,x)=>s+Number(x.Nominal||0),0);
  const biayaBln=db.cash.filter(x=>x.Jenis==='Keluar'&&(x.Tanggal||'').slice(0,7)===date().slice(0,7)).reduce((s,x)=>s+Number(x.Nominal||0),0);
  return{
    antrean:seeCash?db.intake.filter(x=>['Masuk','Direview','Perlu Info'].includes(x.Status)).length:0,
    totalIntake:seeCash?db.intake.length:0,
    tugasSelesai:seeOps?db.tasks.filter(x=>x.Status==='Selesai').length:0,
    totalTugas:seeOps?db.tasks.length:0,
    saldoKas:seeCash?inc-out:0,totalMasuk:seeCash?inc:0,totalKeluar:seeCash?out:0,
    biayaBulanIni:seeCash?biayaBln:0,dcptTarget:seeCash?1462200000:0,entitasAktif:7,
    dokumen:seeOps?db.documents.length:0,
    absenMenunggu:seeCash?db.attendance.filter(x=>String(x.StatusVerifikasi||'').startsWith('menunggu-verifikasi')).length:0,
    auditTerakhir:seeAudit?db.audit.slice(0,8):db.audit.filter(x=>x.Siapa===u.Nama).slice(0,8),
    terbatas:!seeCash
  };
}
case'intake.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Auditor']); /* R-08 & P-34: Auditor baca, Staf difilter unit sendiri */
  const rows=u.Tier==='Staf'?db.intake.filter(x=>sameUnit(u,x.Unit)||x.PengajuID===u.ID||x.Pengaju===u.Nama):db.intake;
  return [...rows].reverse();
}
case'intake.create':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']); /* P-26 & P-34: Auditor/Freelancer dilarang buat intake */
  const judul=String(p.judul||'').trim().slice(0,180);
  if(judul.length<5)throw Error('Judul usulan wajib minimal 5 karakter.');
  const nilai=Math.max(0,Number(p.nilai)||0);
  x={
    ID:makeId('INT'),Judul:judul,Kategori:String(p.kategori||'Investasi'),Nilai:nilai,
    Unit:String(p.unit||u.Unit),Pengaju:u.Nama,PengajuID:u.ID,Status:'Masuk',
    Riwayat:`${time()} dibuat ${u.Nama} (${u.ID})`,TanggalBuat:date(),
    tenggat:p.tenggat||plusWorkDays(5),
    lampiran:Array.isArray(p.lampiran)?p.lampiran:(p.lampiran?[String(p.lampiran)]:[]),
    dasarPersetujuan:'',entitas:String(p.entitas||u.entitas||'PT HOLDING (induk)')
  };
  db.intake.unshift(x);
  audit(u.Nama,'Intake baru '+x.ID,'Intake',x.ID,'',x.Judul);save();
  return x;
}
case'intake.status':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']);
  x=db.intake.find(y=>y.ID===p.id);
  if(!x)throw Error('Intake tidak ditemukan.');
  /* R-10: Staf hanya boleh Masuk/Direview/Perlu Info pada unitnya; keputusan Disetujui/Ditolak wajib Manajemen/Pemilik & maker!=checker */
  if(['Disetujui','Ditolak'].includes(p.aksi)){
    if(u.Tier==='Staf')throw Error('Keputusan akhir (Disetujui/Ditolak) hanya oleh Manajemen atau Pemilik (R-10).');
    if(x.PengajuID===u.ID||x.Pengaju===u.Nama)throw Error('Pemisahan tugas (maker ≠ checker): pengaju tidak boleh menyetujui usulannya sendiri.');
  }
  if(p.aksi==='Disetujui'){
    const need=x.Nilai>5e9?3:(x.Nilai>5e8?2:1);
    if(rank(u)<need)throw Error(`Ditolak aturan limit RAPID: nilai ini wajib peringkat ≥ ${need} (${need===3?'Direktur/Pemilik':'Komite/Manajemen'}).`);
    x.dasarPersetujuan=p.dasarPersetujuan||`Disetujui ${u.ID} pada ${time()}`;
  }
  const oldSt=x.Status;
  x.Status=p.aksi;
  x.Riwayat+=` | ${time()} ${u.Nama} (${u.ID}) -> ${p.aksi}${p.alasan?' ['+String(p.alasan).slice(0,120)+']':''}`;
  audit(u.Nama,`Intake ${x.ID} -> ${p.aksi}`,'Intake',x.ID,oldSt,p.aksi);save();
  return x;
}
case'keuangan.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Auditor']);
  let rows=[...db.cash];
  if(p.entitas)rows=rows.filter(x=>x.entitas===p.entitas);
  if(p.periode)rows=rows.filter(x=>(x.periode||(x.Tanggal||'').slice(0,7))===p.periode);
  auditRead(u,'Membaca buku Kas ('+rows.length+' baris)','Keuangan');
  return rows.reverse();
}
case'keuangan.create':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']);
  n=Number(p.nominal);
  if(!(n>0))throw Error('Nominal harus > 0.');
  const tgl=p.tanggal||date();
  if(tgl>date())throw Error('Tanggal kas tidak boleh melebihi hari ini (F-37).');
  const per=tgl.slice(0,7);
  if(db.closedPeriods.includes(per))throw Error(`Periode ${per} sudah tutup buku dan terkunci (X-37).`);
  if(p.jenis==='Keluar'&&n>1e8&&rank(u)<3)throw Error('Pengeluaran > Rp100 juta wajib diajukan/disetujui Direktur/Pemilik.');
  const katRaw=String(p.kategori||'').trim();
  const coa=String(p.coa||(katRaw&&katRaw!=='Umum'?katRaw:(p.jenis==='Masuk'?'4101 · Pendapatan Kupon/Dividen/Sewa':'5109 · Beban Operasional Kantor')));
  const ket=String(p.keterangan||'').trim();
  if(ket.length>0&&ket.length<5)throw Error('Keterangan minimal 5 karakter agar jejak audit jelas.');
  x={
    ID:makeId('KAS'),Tanggal:tgl,Jenis:p.jenis==='Keluar'?'Keluar':'Masuk',
    Kategori:coa,Nominal:Math.round(n),Keterangan:ket||'Transaksi kas tercatat',
    Oleh:u.Nama,Status:'Draft',Rekonsiliasi:'Belum',
    entitas:String(p.entitas||u.entitas||'PT HOLDING (induk)'),coa,
    lampiran:String(p.lampiran||(n>=1e6?'wajib-lampirkan-bukti':'')),
    dibuatOleh:u.ID,disetujuiOleh:'',periode:per
  };
  db.cash.unshift(x);
  audit(u.Nama,'Kas '+x.ID+' dibuat ('+x.Jenis+' Rp'+x.Nominal.toLocaleString('id-ID')+')','Keuangan',x.ID,'',String(x.Nominal));save();
  return x;
}
case'keuangan.update':{
  u=user(t);
  allow(u,['Pemilik','Manajemen']);
  x=db.cash.find(y=>y.ID===p.id);
  if(!x)throw Error('Kas tidak ditemukan.');
  const per=x.periode||(x.Tanggal||'').slice(0,7);
  if(db.closedPeriods.includes(per))throw Error(`Periode ${per} sudah terkunci (tutup buku).`);
  /* R-13 & X-01: Maker != Checker */
  if(p.status==='Disetujui'&&(x.dibuatOleh===u.ID||x.Oleh===u.Nama)){
    throw Error('Pemisahan tugas (maker ≠ checker): pembuat transaksi kas tidak boleh menyetujui kasnya sendiri (R-13).');
  }
  const oldVal=`${x.Status}|${x.Rekonsiliasi}`;
  if(p.status!==undefined){x.Status=p.status;if(p.status==='Disetujui')x.disetujuiOleh=u.ID;}
  if(p.rekonsiliasi!==undefined)x.Rekonsiliasi=p.rekonsiliasi;
  audit(u.Nama,'Kas '+x.ID+' diperbarui','Keuangan',x.ID,oldVal,`${x.Status}|${x.Rekonsiliasi}`);save();
  return x;
}
case'tugas.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Freelancer','Auditor']); /* P-36: Auditor boleh baca semua tugas */
  const rows=u.Tier==='Freelancer'?db.tasks.filter(x=>String(x.Eksekutor||'').toLowerCase().includes(u.Nama.toLowerCase())||x.Eksekutor===u.ID||String(x.Pengerja||'').toLowerCase().includes('vendor')||String(x.Pengerja||'').toLowerCase().includes('remote')):db.tasks;
  return rows;
}
case'tugas.create':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']);
  const desc=String(p.tugas||'').trim().slice(0,200);
  if(desc.length<5)throw Error('Deskripsi tugas wajib minimal 5 karakter.');
  const tgl=p.tenggat||plusWorkDays(7);
  if(p.tenggat&&p.tenggat<date())throw Error('Tenggat tugas tidak boleh tanggal lampau (F-20).');
  x={
    ID:makeId('TGS'),Kategori:String(p.kategori||u.Unit||'Operasional'),Tugas:desc,
    Pengerja:String(p.pengerja||'On-site'),Eksekutor:String(p.eksekutor||u.ID),
    Status:'Belum',tenggat:tgl,prioritas:String(p.prioritas||'Sedang'),buktiSelesai:''
  };
  db.tasks.unshift(x);
  audit(u.Nama,'Tugas baru '+x.ID,'Tugas',x.ID,'',x.Tugas);save();
  return x;
}
case'tugas.update':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Freelancer']); /* Auditor baca saja */
  x=db.tasks.find(y=>y.ID===p.id);
  if(!x)throw Error('Tugas tidak ditemukan.');
  /* R-16 & P-28: Freelancer hanya boleh mengubah tugas yang ditugaskan kepadanya */
  if(u.Tier==='Freelancer'&&x.Eksekutor!==u.ID&&!String(x.Eksekutor||'').toLowerCase().includes(u.Nama.toLowerCase())){
    throw Error('Pembatasan peran Freelancer: Anda hanya dapat memperbarui tugas yang ditugaskan kepada akun Anda (R-16).');
  }
  const oldSt=x.Status;
  x.Status=p.status;
  if(p.buktiSelesai)x.buktiSelesai=String(p.buktiSelesai);
  else if(p.status==='Selesai'&&!x.buktiSelesai)x.buktiSelesai=`diverifikasi:${u.ID}@${date()}`;
  audit(u.Nama,'Tugas '+x.ID+' -> '+p.status,'Tugas',x.ID,oldSt,p.status);save();
  return x;
}
case'absen.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Auditor']); /* R-17 & P-37: Auditor diizinkan baca absensi; lat/lng presisi disamarkan untuk peran non-Pemilik */
  const raw=(rank(u)>=2||u.Tier==='Auditor')?db.attendance:db.attendance.filter(x=>x.UserID===u.ID);
  const rows=raw.map(x=>u.Tier==='Pemilik'?x:{...x,Lat:x.Lat!=null?Number(Number(x.Lat).toFixed(3)):null,Lng:x.Lng!=null?Number(Number(x.Lng).toFixed(3)):null});
  auditRead(u,'Membaca daftar Absensi ('+rows.length+' baris)','Absensi');
  return rows.reverse();
}
case'absen.submit':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']);
  if(p.mode==='offline_pin'){
    const id=String(p.id||'').trim().toUpperCase(),pin=String(p.pin||'').trim(),kendala=String(p.kendala||'Kondisi Offline / Kendala Wajah & Maps').trim().slice(0,120);
    if(u.OfflinePinAktif!=='YA'||!u.OfflinePin)throw Error('Akun Anda tidak memiliki izin absensi Offline (ID + PIN).');
    if(id!==u.ID.toUpperCase())throw Error('ID yang dimasukkan tidak sesuai dengan akun aktif.');
    if(!verifyPin(u,pin))throw Error('PIN offline tidak sesuai.');
    const lokNote=String(p.lokasi||'').trim().slice(0,120);
    x={ID:makeId('ABS'),Tanggal:date(),Jam:time().slice(11,19),Nama:u.Nama,UserID:u.ID,Jenis:p.jenis==='out'?'out':'in',Lokasi:lokNote?`Mode Offline/Darurat: ${lokNote}`:`Mode Offline/Darurat (${kendala})`,Lat:null,Lng:null,JarakMeter:null,FaceDigest:'OFFLINE-PIN',Metode:'Offline (ID + PIN)',Kendala:kendala,StatusVerifikasi:'menunggu-verifikasi-atasan',DiverifikasiOleh:'',radiusKantor:officeConf().radius,deviceId:sha256Sync(navigator.userAgent||'local').slice(0,12)};
    db.attendance.unshift(x);
    audit(u.Nama,`Absen ${x.Jenis==='out'?'keluar':'masuk'} Mode Offline · ${kendala}`,'Absensi',x.ID);save();
    return x;
  }
  /* R-18 & F-58: Hitung jarak Haversine nyata dari titik kantor (bukan 0!) + FaceDigest SHA-256 */
  const lat=Number(p.lat),lng=Number(p.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)throw Error('Koordinat GPS tidak valid.');
  const oc=officeConf();
  const dist=haversine(lat,lng,oc.lat,oc.lng);
  if(oc.strictRadius&&dist>oc.radius)throw Error(`Lokasi di luar radius kantor (${dist} m > batas ${oc.radius} m).`);
  const faceHash=p.faceImage?'SELF-DECLARED#'+sha256Sync(String(p.faceImage).slice(0,512)).slice(0,10).toUpperCase():'TANPA-FOTO';
  x={
    ID:makeId('ABS'),Tanggal:date(),Jam:time().slice(11,19),Nama:u.Nama,UserID:u.ID,
    Jenis:p.jenis==='out'?'out':'in',Lokasi:String(p.lokasi||p.lokasiLabel||'Lokasi terverifikasi').slice(0,120),
    Lat:Number(lat.toFixed(5)),Lng:Number(lng.toFixed(5)),JarakMeter:dist,
    FaceDigest:faceHash,Metode:'Wajah + Maps',
    StatusVerifikasi:dist<=oc.radius?'menunggu-verifikasi-atasan':'menunggu-verifikasi-luar-radius',
    DiverifikasiOleh:'',radiusKantor:oc.radius,deviceId:sha256Sync(navigator.userAgent||'local').slice(0,12)
  };
  db.attendance.unshift(x);
  audit(u.Nama,`Absen ${x.Jenis==='out'?'keluar':'masuk'} Wajah+Maps (${dist} m)`,'Absensi',x.ID,'',`${dist}m`);save();
  return x;
}
case'absen.verify':{
  u=user(t);
  allow(u,['Pemilik','Manajemen']);
  x=db.attendance.find(y=>y.ID===p.id);
  if(!x)throw Error('Data absensi tidak ditemukan.');
  if(x.UserID===u.ID&&u.Tier!=='Pemilik')throw Error('Atasan tidak boleh memverifikasi absensinya sendiri.');
  const oldSt=x.StatusVerifikasi;
  x.StatusVerifikasi=p.status;
  x.DiverifikasiOleh=`${u.Nama} (${time()})`;
  /* R-19 & MO-42: Verifikasi absensi WAJIB menulis jejak audit */
  audit(u.Nama,`Verifikasi absensi ${x.ID} (${x.Nama}) -> ${p.status}`,'Absensi',x.ID,oldSt,p.status);save();
  return x;
}
case'dokumen.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf','Auditor','Freelancer']);
  /* R-20: Klasifikasi dokumen (Publik/Internal/Rahasia) difilter sesuai peran */
  const rows=db.documents.filter(d=>{
    const kl=d.kerahasiaan||'Internal';
    if(u.Tier==='Freelancer')return kl==='Publik'||d.Oleh===u.Nama||d.OlehID===u.ID;
    if(kl==='Sangat Rahasia'&&!['Pemilik','Manajemen','Auditor'].includes(u.Tier))return false;
    return true;
  });
  return rows.reverse();
}
case'dokumen.create':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Staf']); /* P-30: Freelancer hanya baca/dokumen tugas, pembuatan dokumen resmi oleh FTE */
  const judul=String(p.judul||'').trim(),isi=String(p.isi||'').trim();
  if(judul.length<5||!isi)throw Error('Judul (min. 5 huruf) dan isi dokumen wajib diisi.');
  if(isi.length>20000)throw Error('Batas simpan langsung 20.000 karakter — lampirkan tautan Drive untuk dokumen panjang.');
  /* R-21 & F-73..F-78: Versi otomatis naik bila judul sama, status, retensi, entitas */
  const prevVer=db.documents.filter(d=>d.Judul.toLowerCase()===judul.toLowerCase()).reduce((m,d)=>Math.max(m,Number(d.versi||1)),0);
  const retYear=Number(date().slice(0,4))+(/Kebijakan|Risalah|Kontrak|Memo/i.test(String(p.jenis||''))?10:5);
  x={
    ID:makeId('DOK'),Judul:judul.slice(0,180),Jenis:String(p.jenis||'Memo Investasi').slice(0,60),
    Oleh:u.Nama,OlehID:u.ID,Isi:isi,Tanggal:date(),
    versi:prevVer+1,statusDok:String(p.statusDok||'Draf'),
    kerahasiaan:String(p.kerahasiaan||'Internal'),
    retensiSampai:`${retYear}-${date().slice(5,10)}`,
    tte:sha256Sync(judul+'|'+isi).slice(0,16),
    entitas:String(p.entitas||u.entitas||'PT HOLDING (induk)'),
    tautanTransaksi:String(p.tautanTransaksi||'')
  };
  db.documents.unshift(x);
  audit(u.Nama,`Dokumen ${x.ID} (v${x.versi}) dibuat`,'Dokumen',x.ID,'',x.Judul);save();
  return x;
}
case'audit.list':{
  u=user(t);
  allow(u,['Pemilik','Manajemen','Auditor']);
  let rows=[...db.audit];
  if(p.modul)rows=rows.filter(x=>x.Modul===p.modul);
  if(p.aktor)rows=rows.filter(x=>String(x.Siapa||'').toLowerCase().includes(String(p.aktor).toLowerCase()));
  return rows.slice(0,500); /* R-22: tampilkan penuh hingga 500+ entri tanpa terpotong 200 */
}
case'pengguna.list':{
  u=user(t);
  allow(u,['Pemilik','Auditor']); /* P-40: Auditor diizinkan baca daftar pengguna untuk audit akses, tanpa PIN */
  auditRead(u,'Membaca daftar Pengguna ('+db.users.length+' akun)','Pengguna');
  return db.users.map(x=>({...pub(x),Aktif:x.Aktif,OfflinePinAktif:x.OfflinePinAktif==='YA'?'YA':'TIDAK',OfflinePinSet:Boolean(x.OfflinePin)}));
}
case'pengguna.create':{
  u=user(t);
  allow(u,['Pemilik']);
  const offOn=p.offlinePinAktif==='YA'?'YA':'TIDAK',offPin=String(p.offlinePin||'').trim();
  if(offOn==='YA'&&!/^\d{4,8}$/.test(offPin))throw Error('PIN akses offline harus berupa 4–8 digit angka.');
  const rawId=String(p.id||makeId('USR')).trim().toUpperCase();
  if(!/^[A-Z0-9\-]{2,20}$/.test(rawId))throw Error('Format ID akun harus huruf besar/angka/tanda hubung (F-01).');
  const nama=String(p.nama||'').trim(),email=String(p.email||'').trim().toLowerCase();
  if(nama.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Nama (min. 2 huruf) dan email valid wajib diisi.');
  if(db.users.some(y=>y.ID.toUpperCase()===rawId))throw Error('ID akun sudah digunakan (R-24).');
  if(db.users.some(y=>y.Email.toLowerCase()===email))throw Error('Alamat email sudah terdaftar pada akun lain.');
  x={
    ID:rawId,Nama:nama.slice(0,80),Jabatan:String(p.jabatan||'Staf').slice(0,80),
    Unit:String(p.unit||'S12 · General Affairs, Fasilitas & Umum'),Tier:p.tier||'Staf',
    Email:email,Aktif:'YA',StatusKepegawaian:p.statusKepegawaian||'Karyawan FTE',
    Fase:Number(p.fase)||3,atasanId:String(p.atasanId||'M1'),
    entitas:String(p.entitas||'PT HOLDING (induk)'),
    OfflinePinAktif:offOn,OfflinePin:offOn==='YA'?hashPin(rawId,offPin):''
  };
  db.users.push(x);
  audit(u.Nama,`Pengguna baru ${x.ID} (${x.Nama})`,'Pengguna',x.ID,'',x.Email);save();
  return{...pub(x),Aktif:x.Aktif,OfflinePinSet:Boolean(x.OfflinePin)};
}
case'pengguna.email':{
  u=user(t);
  allow(u,['Pemilik']);
  x=db.users.find(y=>y.ID===p.id);
  if(!x)throw Error('Akun tidak ditemukan.');
  const nextEmail=String(p.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail))throw Error('Format email baru tidak valid.');
  const oldEmail=x.Email;
  x.Email=nextEmail;
  /* R-25: Catat perubahan email di audit & cabut OTP lama */
  delete otps[oldEmail];put(keys.otps,otps);
  audit(u.Nama,`Email akun ${x.ID} diubah`,'Pengguna',x.ID,maskEmail(oldEmail),maskEmail(nextEmail));save();
  return{...pub(x),Aktif:x.Aktif,OfflinePinSet:Boolean(x.OfflinePin)};
}
case'pengguna.status':{
  u=user(t);
  allow(u,['Pemilik']);
  x=db.users.find(y=>y.ID===p.id);
  if(!x)throw Error('Akun tidak ditemukan.');
  if(x.ID===u.ID&&p.aktif==='TIDAK')throw Error('Anda tidak dapat menonaktifkan akun Pemilik yang sedang dipakai sendiri.');
  const oldAktif=x.Aktif;
  x.Aktif=p.aktif==='TIDAK'?'TIDAK':'YA';
  /* R-26: Nonaktif = cabut seluruh sesi aktif & kunci PIN offline sekaligus */
  if(x.Aktif==='TIDAK'){
    Object.keys(sessions).forEach(k=>{const s=sessions[k];if((typeof s==='string'?s:s.uid)===x.ID)delete sessions[k];});
    put(keys.sessions,sessions);
    x.OfflinePinAktif='TIDAK';
  }
  audit(u.Nama,`Status akun ${x.ID} -> ${x.Aktif}`,'Pengguna',x.ID,oldAktif,x.Aktif);save();
  return{...pub(x),Aktif:x.Aktif,OfflinePinSet:Boolean(x.OfflinePin)};
}
case'pengguna.offlinePin':{
  u=user(t);
  allow(u,['Pemilik']);
  x=db.users.find(y=>y.ID===p.id);
  if(!x)throw Error('Akun tidak ditemukan.');
  const nextAktif=p.aktif==='YA'?'YA':'TIDAK',nextPin=String(p.pin||'').trim();
  if(nextPin&&!/^\d{4,8}$/.test(nextPin))throw Error('PIN akses offline harus berupa 4–8 digit angka.');
  if(nextAktif==='YA'&&!nextPin&&!x.OfflinePin)throw Error('Isi PIN (4–8 digit angka) untuk mengaktifkan akses Offline.');
  /* R-27 & F-11: Simpan hash SHA-256, bukan plaintext */
  if(nextPin)x.OfflinePin=hashPin(x.ID,nextPin);
  x.OfflinePinAktif=nextAktif;
  audit(u.Nama,`Izin PIN Offline ${x.ID} -> ${x.OfflinePinAktif}${nextPin?' (hash diperbarui)':''}`,'Pengguna',x.ID);save();
  return{...pub(x),Aktif:x.Aktif,OfflinePinAktif:x.OfflinePinAktif,OfflinePinSet:Boolean(x.OfflinePin)};
}
case'system.status':{
  u=user(t);
  allow(u,['Pemilik','Auditor']); /* R-28: tambah metrik ukuran penyimpanan & sesi aktif */
  let bytes=0;try{Object.keys(localStorage).forEach(k=>{bytes+=(localStorage.getItem(k)||'').length*2;});}catch(_){}
  return{
    tables:{pengguna:db.users.length,tugas:db.tasks.length,intake:db.intake.length,keuangan:db.cash.length,absen:db.attendance.length,dokumen:db.documents.length,audit:db.audit.length},
    storagePath:`Browser localStorage (${(bytes/1024).toFixed(1)} KB / ~5.120 KB)`,
    timezone:'Asia/Jakarta (WIB)',
    activeSessions:Object.keys(sessions).length,
    closedPeriods:db.closedPeriods,
    coaCount:COA_LIST.length
  };
}
case'ai.assist':{
  u=user(t); /* R-29: wajib sesi & masuk jejak audit */
  const promptClean=String(p.prompt||'').slice(0,1000);
  audit(u.Nama,`Instruksi AI (${p.mode||'ringkas_eksekutif'})`,'Asisten AI','',promptClean.slice(0,80),'stub-lokal');save();
  return{
    text:`[SIMULASI LOKAL — AG-01/AG-12/AG-14 prioritas Fase 3; belum terhubung API Gemini produksi]\nMode: ${p.mode||'ringkas_eksekutif'}\nAkun peminta: ${u.Nama} (${u.ID} · ${u.Tier})\nPermintaan: ${promptClean}\n\nRingkasan data aktual sistem saat ini:\n• Intake aktif: ${db.intake.length} usulan · Saldo kas tercatat: Rp${(db.cash.filter(x=>x.Jenis==='Masuk').reduce((s,x)=>s+Number(x.Nominal||0),0)-db.cash.filter(x=>x.Jenis==='Keluar').reduce((s,x)=>s+Number(x.Nominal||0),0)).toLocaleString('id-ID')}\n• Tugas selesai: ${db.tasks.filter(x=>x.Status==='Selesai').length}/${db.tasks.length} · Dokumen tersimpan: ${db.documents.length}\n• Pastikan verifikasi sumber angka, limit kewenangan RAPID, dan tanda tangan manusia sebelum eksekusi.`,
    model:'local-demo-stub',mode:p.mode||'ringkas_eksekutif',timestamp:time()
  };
}
case'auth.loginCard':{
  const uid=String(p.uid||'').toUpperCase(),exp=Number(p.exp||0),nonce=String(p.nonce||'');
  if(!uid||!exp||exp<Date.now())throw Error('Kartu akses kedaluwarsa atau tidak lengkap.');
  const rev=(()=>{try{return JSON.parse(localStorage.getItem('kai-revoked-v1'))||[]}catch(_){return[]}})();
  if(rev.includes(nonce))throw Error('Kartu akses sudah dicabut.');
  u=db.users.find(x=>x.ID.toUpperCase()===uid&&x.Aktif==='YA');
  if(!u)throw Error('Akun kartu tidak ditemukan atau nonaktif.');
  const tok=makeId('SESSION');
  sessions[tok]={uid:u.ID,exp:Date.now()+SESSION_TTL_MS,lastAt:time(),seen:Date.now()};
  put(keys.sessions,sessions);
  audit(u.Nama,'Login dengan Kartu Akses Darurat (berkas)','Autentikasi',u.ID);save();
  return{token:tok,user:pub(u),authMethod:'access-file'};
}
default:throw Error('Route tidak dikenal: '+r);
}}
const idem={};function dispatch(r,t,p={}){const k=/\.(create|submit)$/.test(String(r))?r+'|'+t+'|'+JSON.stringify(p||{}):null;if(k){const h=idem[k];if(h&&Date.now()-h.at<5e3)return h.val;}const v=__dispatchRaw(r,t,p);if(k){idem[k]={at:Date.now(),val:v};}return v;}
const makeRunner=(ok,fail)=>({
  withSuccessHandler(cb){return makeRunner(cb,fail);},
  withFailureHandler(cb){return makeRunner(ok,cb);},
  gasApiDispatch(r,t,p){setTimeout(()=>{try{const v=dispatch(r,t,p||{});if(ok)ok(v);}catch(e){if(fail)fail(e);}},0);},
  gasWorkspaceDispatch(){setTimeout(()=>{if(fail)fail(Error('Workspace Google API memerlukan deploy di Google Apps Script (Code.gs).'));},0);}
});
const makeFetchRunner=(ok,fail)=>({
  withSuccessHandler(cb){return makeFetchRunner(cb,fail);},
  withFailureHandler(cb){return makeFetchRunner(ok,cb);},
  _call(body){
    fetch(window.__KAI_GAS_API_URL__,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(body),
      redirect:'follow'
    }).then(r=>{
      if(!r.ok)throw new Error('HTTP '+r.status+' dari Apps Script');
      return r.json();
    }).then(res=>{
      if(!res||res.ok===false)throw new Error((res&&res.error)||'Gagal memanggil server Apps Script.');
      if(ok)ok(res.data);
    }).catch(e=>{
      if(fail)fail(e instanceof Error?e:new Error(String(e)));
    });
  },
  gasApiDispatch(r,t,p){this._call({type:'api',route:r,token:t||'',payload:p||{}});},
  gasWorkspaceDispatch(op,t,p){this._call({type:'workspace',op:op,token:t||'',payload:p||{}});}
});
window.google=window.google||{};window.google.script=window.google.script||{};
if(!(window.google.script.run&&typeof window.google.script.run.gasApiDispatch==='function')){
  if(window.__KAI_GAS_API_URL__){
    window.google.script.run=makeFetchRunner(null,null);
    window.__KAI_DEMO_SHIM__=false;
  }else{
    window.google.script.run=makeRunner(null,null);
    window.__KAI_DEMO_SHIM__=true;
  }
}
(()=>{const kat=x=>x.StatusKepegawaian||(x.Tier==='Freelancer'?'Freelancer':(x.Tier==='Auditor'||x.Tier==='Tamu')?'Eksternal':'Karyawan FTE');const fte=seed.users.filter(x=>kat(x)==='Karyawan FTE');
window.__KAI_PUBLIC_STATS__={fteTotal:fte.length,fase1:fte.filter(x=>x.Fase===1).length,fase2:fte.filter(x=>x.Fase===1||x.Fase===2).length,fase3:fte.length,freelancer:seed.users.filter(x=>x.Tier==='Freelancer'||x.StatusKepegawaian==='Freelancer').length,eksternal:seed.users.filter(x=>x.Tier==='Auditor'||x.Tier==='Tamu'||x.StatusKepegawaian==='Eksternal').length,total:seed.users.length};})();
window.__KANTOR_AI_ONEFILE__={
  COA_LIST,
  closePeriod(ym,token){const u=user(token);allow(u,['Pemilik','Manajemen']);if(!/^\d{4}-\d{2}$/.test(ym))throw Error('Format periode YYYY-MM.');if(!db.closedPeriods.includes(ym))db.closedPeriods.push(ym);audit(u.Nama,'Tutup buku periode '+ym,'Keuangan',ym,'terbuka','terkunci');save();return db.closedPeriods;},
  reopenPeriod(ym,token){const u=user(token);allow(u,['Pemilik']);db.closedPeriods=db.closedPeriods.filter(x=>x!==ym);audit(u.Nama,'Buka kunci periode '+ym,'Keuangan',ym,'terkunci','terbuka');save();return db.closedPeriods;},
  verifyAudit(){let broken=0;for(let i=0;i<db.audit.length;i++){const r=db.audit[i],nx=db.audit[i+1];if(!r.hash||r.objekId==='BOOT')continue;if(nx&&nx.hash&&r.prevHash!==nx.hash){broken++;continue;}if(sha256Sync([r.Waktu,r.Siapa,r.Aksi,r.objekId||'',r.prevHash].join('|'))!==r.hash)broken++;}return{rows:db.audit.length,broken,ok:broken===0};},
  syncSessionRecord(tok,u){try{if(!tok||!u)return;if(!sessions[tok]){sessions[tok]={uid:u.ID,exp:Date.now()+SESSION_TTL_MS,lastAt:time(),seen:Date.now()};put(keys.sessions,sessions);}}catch(_){}},
  reset(){try{Object.values(keys).forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem('hi_session_v1');}catch(_){}location.reload();}
};
})();
