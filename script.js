document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navToggleBtn = document.getElementById('navToggleBtn');
    const contentFrame = document.getElementById('contentFrame');
    const navButtons = document.querySelectorAll('.nav-btn');

    // 導覽列收合功能
    function toggleNavbar() {
        navbar.classList.toggle('expanded');
        navbar.classList.toggle('collapsed');
    }

    navToggle.addEventListener('click', toggleNavbar);
    navToggleBtn.addEventListener('click', toggleNavbar);

    // 按鈕點擊事件處理
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有按鈕的active狀態
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加當前按鈕的active狀態
            this.classList.add('active');
            
            // 獲取要載入的內容
            const contentUrl = this.getAttribute('data-content');
            
            // 載入內容到iframe
            if (contentUrl) {
                contentFrame.src = contentUrl;
            }
            
            // 在移動設備上自動收合導覽列
            if (window.innerWidth <= 768) {
                navbar.classList.remove('expanded');
                navbar.classList.add('collapsed');
            }
        });
    });

    // 點擊logo也可以收合導覽列
    const navLogo = document.getElementById('navLogo');
    navLogo.addEventListener('click', toggleNavbar);

    // 初始化導覽列狀態（預設為展開）
    navbar.classList.add('expanded');
    navbar.classList.remove('collapsed');

    // 響應式處理
    function handleResize() {
        if (window.innerWidth <= 768) {
            // 在移動設備上預設收合
            if (!navbar.classList.contains('collapsed')) {
                navbar.classList.remove('expanded');
                navbar.classList.add('collapsed');
            }
        }
    }

    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);
    
    // 初始化響應式狀態
    handleResize();
}); 