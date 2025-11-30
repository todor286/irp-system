function showPage(pageId) {
    // Скриваме всички страници
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    
    // Показваме избраната страница
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
    }
    
    // Премахваме активния клас от всички бутони
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Добавяме активен клас на кликнатия бутон
    event.target.classList.add('active');
}

// Инициализация при зареждане на страницата
document.addEventListener('DOMContentLoaded', function() {
    // Показваме първата страница по подразбиране
    showPage('page1');
    
    console.log('IRP System loaded successfully!');
});

// Допълнителни функции
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Формата е изпратена успешно!');
        });
    }
}