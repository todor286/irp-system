// Данни за приложението
let currentUser = null;
let tasks = [];
let materials = [];
let reports = [];
let users = [];
let currentTaskForQR = null;
let currentMaterialForQR = null;

// DOM елементи
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');

// Проверка за текущ потребител при зареждане
document.addEventListener('DOMContentLoaded', function() {
    // Зареждане на всички данни от localStorage
    loadAllData();
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUI();
        
        // Автоматично зареждане на данните при логнат потребител
        refreshAllData();
    }
});

// Функция за зареждане на всички данни от localStorage
function loadAllData() {
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    materials = JSON.parse(localStorage.getItem('materials')) || [];
    reports = JSON.parse(localStorage.getItem('reports')) || [];
    users = JSON.parse(localStorage.getItem('users')) || [];
}

// Функция за обновяване на всички данни в интерфейса
function refreshAllData() {
    loadTasks();
    loadMaterials();
    loadReports();
    loadRecentReports();
    loadStats();
    
    // Възстановяване на последните QR кодове
    if (tasks.length > 0) {
        currentTaskForQR = tasks[tasks.length - 1];
        generateTaskQRCode();
    }
    
    if (materials.length > 0) {
        currentMaterialForQR = materials[materials.length - 1];
        generateMaterialQRCode();
    }
}

// Функции за навигация
function showPage(pageId) {
    // Скриване на всички страници
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Показване на избраната страница
    document.getElementById(pageId).classList.add('active');
    
    // Специални действия за определени страници
    if (pageId === 'sync') {
        loadStats();
    }
}

// Функции за потребители
function registerUser(name, email, password) {
    const user = {
        id: Date.now().toString(),
        name,
        email,
        password,
        avatar: name.charAt(0).toUpperCase()
    };
    
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    return user;
}

function loginUser(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    return user;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUI();
    showPage('home');
}

function updateUI() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userAvatar.textContent = currentUser.avatar;
        userName.textContent = currentUser.name;
    } else {
        authButtons.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// Функции за задачи
function createTask(name, description, materialsList) {
    const task = {
        id: Date.now().toString(),
        name,
        description,
        materials: materialsList.split(',').map(m => m.trim()),
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser ? currentUser.name : 'Анонимен',
        createdById: currentUser ? currentUser.id : 'anonymous'
    };
    
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    currentTaskForQR = task;
    
    return task;
}

function deleteTask(taskId) {
    if (confirm('Сигурни ли сте, че искате да изтриете тази задача?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Премахване на отчетите за тази задача
        reports = reports.filter(report => report.itemId !== taskId);
        localStorage.setItem('reports', JSON.stringify(reports));
        
        refreshAllData();
        
        // Актуализиране на QR кода
        if (currentTaskForQR && currentTaskForQR.id === taskId) {
            currentTaskForQR = tasks.length > 0 ? tasks[tasks.length - 1] : null;
            generateTaskQRCode();
        }
    }
}

function resetTask(taskId) {
    if (confirm('Сигурни ли сте, че искате да нулирате тази задача?')) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = false;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Премахване на отчетите за тази задача
            reports = reports.filter(report => report.itemId !== taskId);
            localStorage.setItem('reports', JSON.stringify(reports));
            
            refreshAllData();
        }
    }
}

function markTaskAsCompleted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Създаване на отчет за задачата
        if (currentUser) {
            createReport(taskId, 'task', task.name);
        } else {
            refreshAllData();
        }
    }
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p>Няма създадени задачи.</p>';
        return;
    }
    
    // Сортиране на задачите по дата на създаване (най-новите първи)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    sortedTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        const statusClass = task.completed ? 'status-completed' : 'status-pending';
        const statusText = task.completed ? 'Завършена' : 'Изчакваща';
        
        taskCard.innerHTML = `
            <div class="task-title">${task.name}</div>
            <div class="task-materials">Материали: ${task.materials.join(', ')}</div>
            <div class="task-description">${task.description}</div>
            <div class="task-status ${statusClass}">${statusText}</div>
            <div class="task-creator">Създадена от: ${task.createdBy}</div>
            <div class="task-actions">
                <button class="btn-success" onclick="markTaskAsCompleted('${task.id}')">Отбележи като завършена</button>
                <button class="btn-warning" onclick="resetTask('${task.id}')">Нулирай задача</button>
                <button class="btn-danger" onclick="deleteTask('${task.id}')">Изтрий</button>
            </div>
        `;
        
        taskList.appendChild(taskCard);
    });
}

function generateTaskQRCode() {
    const qrCodeDiv = document.getElementById('qrCode');
    qrCodeDiv.innerHTML = '';
    
    if (currentTaskForQR) {
        const qrData = `TASK:${currentTaskForQR.id}:${currentTaskForQR.name}`;
        
        // Генериране на QR код
        const typeNumber = 0;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(qrData);
        qr.make();
        
        // Създаване на изображение
        const qrImage = qr.createDataURL(10, 0);
        const img = document.createElement('img');
        img.src = qrImage;
        img.alt = 'QR код за задача: ' + currentTaskForQR.name;
        img.style.width = '200px';
        img.style.height = '200px';
        qrCodeDiv.appendChild(img);
        
        // Добавяне на информация под QR кода
        const info = document.createElement('p');
        info.textContent = `Задача: ${currentTaskForQR.name}`;
        info.style.marginTop = '10px';
        info.style.fontWeight = 'bold';
        qrCodeDiv.appendChild(info);
        
        const taskIdInfo = document.createElement('p');
        taskIdInfo.textContent = `ID: ${currentTaskForQR.id}`;
        taskIdInfo.style.fontSize = '0.8rem';
        taskIdInfo.style.color = '#666';
        qrCodeDiv.appendChild(taskIdInfo);
    } else if (tasks.length > 0) {
        currentTaskForQR = tasks[tasks.length - 1];
        generateTaskQRCode();
    } else {
        qrCodeDiv.innerHTML = '<p>Няма създадени задачи. Създайте задача, за да генерирате QR код.</p>';
    }
}

function generateQRForSelectedTask() {
    if (tasks.length === 0) {
        alert('Няма създадени задачи.');
        return;
    }
    
    // Създаване на списък с задачи за избор
    let taskOptions = 'Изберете задача за QR код:\n';
    tasks.forEach((task, index) => {
        taskOptions += `${index + 1}. ${task.name} ${task.completed ? '(завършена)' : ''}\n`;
    });
    
    const choice = prompt(taskOptions);
    if (choice && !isNaN(choice) && choice > 0 && choice <= tasks.length) {
        currentTaskForQR = tasks[choice - 1];
        generateTaskQRCode();
    }
}

// Функции за материали
function createMaterial(name, quantity, description) {
    const material = {
        id: Date.now().toString(),
        name,
        quantity,
        description,
        used: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser ? currentUser.name : 'Анонимен',
        createdById: currentUser ? currentUser.id : 'anonymous'
    };
    
    materials.push(material);
    localStorage.setItem('materials', JSON.stringify(materials));
    currentMaterialForQR = material;
    
    return material;
}

function deleteMaterial(materialId) {
    if (confirm('Сигурни ли сте, че искате да изтриете този материал?')) {
        materials = materials.filter(material => material.id !== materialId);
        localStorage.setItem('materials', JSON.stringify(materials));
        
        // Премахване на отчетите за този материал
        reports = reports.filter(report => report.itemId !== materialId);
        localStorage.setItem('reports', JSON.stringify(reports));
        
        refreshAllData();
        
        // Актуализиране на QR кода
        if (currentMaterialForQR && currentMaterialForQR.id === materialId) {
            currentMaterialForQR = materials.length > 0 ? materials[materials.length - 1] : null;
            generateMaterialQRCode();
        }
    }
}

function resetMaterial(materialId) {
    if (confirm('Сигурни ли сте, че искате да нулирате този материал?')) {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            material.used = false;
            localStorage.setItem('materials', JSON.stringify(materials));
            
            // Премахване на отчетите за този материал
            reports = reports.filter(report => report.itemId !== materialId);
            localStorage.setItem('reports', JSON.stringify(reports));
            
            refreshAllData();
        }
    }
}

function loadMaterials() {
    const materialList = document.getElementById('materialList');
    materialList.innerHTML = '';
    
    if (materials.length === 0) {
        materialList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Няма създадени материали.</td></tr>';
        return;
    }
    
    // Сортиране на материалите по дата на създаване (най-новите първи)
    const sortedMaterials = [...materials].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    sortedMaterials.forEach(material => {
        const statusClass = material.used ? 'status-completed' : 'status-pending';
        const statusText = material.used ? 'Използван' : 'Наличен';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.quantity}</td>
            <td>${material.description}</td>
            <td>${material.createdBy}</td>
            <td><span class="task-status ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-warning" onclick="resetMaterial('${material.id}')">Нулирай</button>
                <button class="btn-danger" onclick="deleteMaterial('${material.id}')">Изтрий</button>
            </td>
        `;
        
        materialList.appendChild(row);
    });
}

function generateMaterialQRCode() {
    const qrCodeDiv = document.getElementById('materialQrCode');
    qrCodeDiv.innerHTML = '';
    
    if (currentMaterialForQR) {
        const qrData = `MATERIAL:${currentMaterialForQR.id}:${currentMaterialForQR.name}`;
        
        // Генериране на QR код
        const typeNumber = 0;
        const errorCorrectionLevel = 'L';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(qrData);
        qr.make();
        
        // Създаване на изображение
        const qrImage = qr.createDataURL(10, 0);
        const img = document.createElement('img');
        img.src = qrImage;
        img.alt = 'QR код за материал: ' + currentMaterialForQR.name;
        img.style.width = '200px';
        img.style.height = '200px';
        qrCodeDiv.appendChild(img);
        
        // Добавяне на информация под QR кода
        const info = document.createElement('p');
        info.textContent = `Материал: ${currentMaterialForQR.name}`;
        info.style.marginTop = '10px';
        info.style.fontWeight = 'bold';
        qrCodeDiv.appendChild(info);
        
        const materialIdInfo = document.createElement('p');
        materialIdInfo.textContent = `ID: ${currentMaterialForQR.id}`;
        materialIdInfo.style.fontSize = '0.8rem';
        materialIdInfo.style.color = '#666';
        qrCodeDiv.appendChild(materialIdInfo);
    } else if (materials.length > 0) {
        currentMaterialForQR = materials[materials.length - 1];
        generateMaterialQRCode();
    } else {
        qrCodeDiv.innerHTML = '<p>Няма създадени материали. Създайте материал, за да генерирате QR код.</p>';
    }
}

// Функции за отчитания
function createReport(itemId, itemType, itemName) {
    const report = {
        id: Date.now().toString(),
        itemId,
        itemType,
        itemName,
        userId: currentUser ? currentUser.id : 'anonymous',
        userName: currentUser ? currentUser.name : 'Анонимен',
        date: new Date().toISOString(),
        status: 'Отчетено'
    };
    
    reports.push(report);
    localStorage.setItem('reports', JSON.stringify(reports));
    
    // Маркиране на задачата/материала като завършен/използван
    if (itemType === 'task') {
        const task = tasks.find(t => t.id === itemId);
        if (task) {
            task.completed = true;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    } else if (itemType === 'material') {
        const material = materials.find(m => m.id === itemId);
        if (material) {
            material.used = true;
            localStorage.setItem('materials', JSON.stringify(materials));
        }
    }
    
    // Презареждане на списъците
    refreshAllData();
    
    return report;
}

function clearAllReports() {
    if (confirm('Сигурни ли сте, че искате да изтриете ВСИЧКИ отчети? Това действие не може да бъде отменено!')) {
        reports = [];
        localStorage.setItem('reports', JSON.stringify(reports));
        refreshAllData();
    }
}

function loadReports() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = '';
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<tr><td colspan="5" style="text-align: center;">Няма отчитания</td></tr>';
        return;
    }
    
    // Сортиране на отчетите от най-нови към най-стари
    const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedReports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.itemName}</td>
            <td>${report.userName}</td>
            <td>${new Date(report.date).toLocaleDateString('bg-BG')} ${new Date(report.date).toLocaleTimeString('bg-BG')}</td>
            <td>${report.itemType === 'task' ? 'Задача' : 'Материал'}</td>
            <td>${report.status}</td>
        `;
        
        reportsList.appendChild(row);
    });
}

function loadRecentReports() {
    const recentReports = document.getElementById('recentReports');
    recentReports.innerHTML = '';
    
    // Вземаме последните 5 отчитания
    const recent = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recent.length === 0) {
        recentReports.innerHTML = '<tr><td colspan="4" style="text-align: center;">Няма отчитания</td></tr>';
        return;
    }
    
    recent.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.itemName}</td>
            <td>${report.userName}</td>
            <td>${new Date(report.date).toLocaleDateString('bg-BG')}</td>
            <td>${report.status}</td>
        `;
        
        recentReports.appendChild(row);
    });
}

// Функции за синхронизация
function exportData() {
    const data = {
        tasks: tasks,
        materials: materials,
        reports: reports,
        users: users,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `worktrack_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    document.getElementById('syncResult').innerHTML = '<div class="success">Данните са експортирани успешно!</div>';
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Сигурни ли сте, че искате да импортирате тези данни? Това ще презапише текущите данни.')) {
                if (data.tasks) {
                    tasks = data.tasks;
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
                if (data.materials) {
                    materials = data.materials;
                    localStorage.setItem('materials', JSON.stringify(materials));
                }
                if (data.reports) {
                    reports = data.reports;
                    localStorage.setItem('reports', JSON.stringify(reports));
                }
                if (data.users) {
                    users = data.users;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                document.getElementById('syncResult').innerHTML = '<div class="success">Данните са импортирани успешно!</div>';
                
                // Презареждане на всички данни
                refreshAllData();
            }
        } catch (error) {
            document.getElementById('syncResult').innerHTML = '<div class="error">Грешка при импортиране на данните: ' + error.message + '</div>';
        }
    };
    reader.readAsText(file);
}

function generateDataQR() {
    const data = {
        tasks: tasks,
        materials: materials,
        reports: reports,
        users: users,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data);
    const qrCodeDiv = document.getElementById('dataQRCode');
    qrCodeDiv.style.display = 'block';
    qrCodeDiv.innerHTML = '<h3>QR код с данните</h3><p>Сканирайте този QR код на друго устройство за да импортирате данните</p>';
    
    // Генериране на QR код
    const typeNumber = 0;
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(dataStr);
    qr.make();
    
    // Създаване на изображение
    const qrImage = qr.createDataURL(10, 0);
    const img = document.createElement('img');
    img.src = qrImage;
    img.alt = 'QR код с данните на системата';
    img.style.width = '300px';
    img.style.height = '300px';
    qrCodeDiv.appendChild(img);
    
    document.getElementById('syncResult').innerHTML = '<div class="success">QR код с данните е генериран. Сканирайте го с друго устройство.</div>';
}

function clearAllData() {
    if (confirm('СИГУРНИ ЛИ СТЕ? Това ще изтрие ВСИЧКИ данни - задачи, материали, отчети и потребители! Това действие не може да бъде отменено!')) {
        localStorage.clear();
        loadAllData();
        currentUser = null;
        
        document.getElementById('syncResult').innerHTML = '<div class="success">Всички данни са изтрити!</div>';
        
        // Презареждане на всички данни
        refreshAllData();
        updateUI();
    }
}

function loadStats() {
    const statsDiv = document.getElementById('stats');
    const completedTasks = tasks.filter(task => task.completed).length;
    const usedMaterials = materials.filter(material => material.used).length;
    
    statsDiv.innerHTML = `
        <p><strong>Общо задачи:</strong> ${tasks.length}</p>
        <p><strong>Завършени задачи:</strong> ${completedTasks}</p>
        <p><strong>Общо материали:</strong> ${materials.length}</p>
        <p><strong>Използвани материали:</strong> ${usedMaterials}</p>
        <p><strong>Общо отчети:</strong> ${reports.length}</p>
        <p><strong>Регистрирани потребители:</strong> ${users.length}</p>
    `;
}

// Функции за сканиране
let scanning = false;
let videoStream = null;

document.getElementById('startScan').addEventListener('click', startScanning);
document.getElementById('stopScan').addEventListener('click', stopScanning);

function startScanning() {
    if (!currentUser) {
        alert('Моля, влезте в системата, за да сканирате QR кодове.');
        showPage('login');
        return;
    }
    
    scanning = true;
    document.getElementById('startScan').style.display = 'none';
    document.getElementById('stopScan').style.display = 'inline-block';
    document.getElementById('scanResult').innerHTML = '';
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function(stream) {
            videoStream = stream;
            const video = document.getElementById('video');
            video.srcObject = stream;
            
            // Започване на сканирането
            scanQRCode();
        })
        .catch(function(err) {
            console.error("Грешка при достъп до камерата: ", err);
            document.getElementById('scanResult').innerHTML = '<div class="error">Грешка при достъп до камерата. Моля, проверете разрешенията.</div>';
            stopScanning();
        });
}

function stopScanning() {
    scanning = false;
    document.getElementById('startScan').style.display = 'inline-block';
    document.getElementById('stopScan').style.display = 'none';
    
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

function scanQRCode() {
    if (!scanning) return;
    
    const video = document.getElementById('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            console.log("Открит QR код:", code.data);
            
            // Обработка на прочетения QR код
            processScannedQRCode(code.data);
        }
    }
    
    // Продължаване на сканирането
    requestAnimationFrame(scanQRCode);
}

function processScannedQRCode(qrData) {
    try {
        // Проверка дали е QR код с данни
        if (qrData.includes('"tasks":') && qrData.includes('"materials":')) {
            // Това е QR код с данни за импорт
            if (confirm('Открит е QR код с данни. Искате ли да импортирате тези данни?')) {
                const data = JSON.parse(qrData);
                
                if (data.tasks) {
                    tasks = data.tasks;
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
                if (data.materials) {
                    materials = data.materials;
                    localStorage.setItem('materials', JSON.stringify(materials));
                }
                if (data.reports) {
                    reports = data.reports;
                    localStorage.setItem('reports', JSON.stringify(reports));
                }
                if (data.users) {
                    users = data.users;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                document.getElementById('scanResult').innerHTML = `
                    <div class="success">
                        <h3>Данните са импортирани успешно!</h3>
                        <p><strong>Задачи:</strong> ${data.tasks ? data.tasks.length : 0}</p>
                        <p><strong>Материали:</strong> ${data.materials ? data.materials.length : 0}</p>
                        <p><strong>Отчети:</strong> ${data.reports ? data.reports.length : 0}</p>
                    </div>
                `;
                
                // Презареждане на всички данни
                refreshAllData();
                
                // Спиране на сканирането
                setTimeout(() => {
                    stopScanning();
                    showPage('home');
                }, 3000);
                return;
            }
        }
        
        // Опитваме се да обработим QR кода като прост текст формат
        if (qrData.includes('TASK:') || qrData.includes('MATERIAL:')) {
            const parts = qrData.split(':');
            if (parts.length >= 3) {
                const type = parts[0] === 'TASK' ? 'task' : 'material';
                const id = parts[1];
                const name = parts.slice(2).join(':'); // В случай, че името съдържа ':'
                
                // Проверка дали задачата/материала съществува
                let itemExists = false;
                if (type === 'task') {
                    itemExists = tasks.some(task => task.id === id);
                } else if (type === 'material') {
                    itemExists = materials.some(material => material.id === id);
                }
                
                if (!itemExists) {
                    document.getElementById('scanResult').innerHTML = '<div class="error">Този QR код сочи към несъществуваща задача/материал.</div>';
                    setTimeout(() => {
                        document.getElementById('scanResult').innerHTML = '';
                    }, 3000);
                    return;
                }
                
                // Създаване на отчет
                const report = createReport(id, type, name);
                
                // Показване на резултата
                document.getElementById('scanResult').innerHTML = `
                    <div class="success">
                        <h3>Успешно отчитане!</h3>
                        <p><strong>${type === 'task' ? 'Задача' : 'Материал'}:</strong> ${name}</p>
                        <p><strong>Потребител:</strong> ${currentUser.name}</p>
                        <p><strong>Дата:</strong> ${new Date().toLocaleString('bg-BG')}</p>
                    </div>
                `;
                
                // Автоматично прехвърляне към отчетите след 2 секунди
                setTimeout(() => {
                    stopScanning();
                    showPage('reports');
                }, 2000);
                return;
            }
        } else {
            // Опитваме се да обработим като JSON (за обратна съвместимост)
            const data = JSON.parse(qrData);
            
            if (data.type && data.id && data.name) {
                // Проверка дали задачата/материала съществува
                let itemExists = false;
                if (data.type === 'task') {
                    itemExists = tasks.some(task => task.id === data.id);
                } else if (data.type === 'material') {
                    itemExists = materials.some(material => material.id === data.id);
                }
                
                if (!itemExists) {
                    document.getElementById('scanResult').innerHTML = '<div class="error">Този QR код сочи към несъществуваща задача/материал.</div>';
                    setTimeout(() => {
                        document.getElementById('scanResult').innerHTML = '';
                    }, 3000);
                    return;
                }
                
                // Създаване на отчет
                const report = createReport(data.id, data.type, data.name);
                
                // Показване на резултата
                document.getElementById('scanResult').innerHTML = `
                    <div class="success">
                        <h3>Успешно отчитане!</h3>
                        <p><strong>${data.type === 'task' ? 'Задача' : 'Материал'}:</strong> ${data.name}</p>
                        <p><strong>Потребител:</strong> ${currentUser.name}</p>
                        <p><strong>Дата:</strong> ${new Date().toLocaleString('bg-BG')}</p>
                    </div>
                `;
                
                // Автоматично прехвърляне към отчетите след 2 секунди
                setTimeout(() => {
                    stopScanning();
                    showPage('reports');
                }, 2000);
                return;
            }
        }
    } catch (e) {
        console.error("Грешка при обработка на QR кода: ", e);
        document.getElementById('scanResult').innerHTML = '<div class="error">Невалиден QR код.</div>';
    }
    
    setTimeout(() => {
        document.getElementById('scanResult').innerHTML = '';
    }, 3000);
}

// Обработка на формите
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = loginUser(email, password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUI();
        
        // Автоматично зареждане на данните след успешен вход
        refreshAllData();
        
        showPage('home');
        
        document.getElementById('loginForm').reset();
    } else {
        alert('Грешен имейл или парола!');
    }
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Проверка дали имейлът вече съществува
    if (users.find(u => u.email === email)) {
        alert('Потребител с този имейл вече съществува!');
        return;
    }
    
    const user = registerUser(name, email, password);
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUI();
    
    // Автоматично зареждане на данните след успешна регистрация
    refreshAllData();
    
    showPage('home');
    
    document.getElementById('registerForm').reset();
});

document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Моля, влезте в системата, за да създавате задачи.');
        showPage('login');
        return;
    }
    
    const name = document.getElementById('taskName').value;
    const description = document.getElementById('taskDescription').value;
    const materialsList = document.getElementById('taskMaterials').value;
    
    createTask(name, description, materialsList);
    refreshAllData();
    
    document.getElementById('taskForm').reset();
});

document.getElementById('materialForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Моля, влезте в системата, за да създавате материали.');
        showPage('login');
        return;
    }
    
    const name = document.getElementById('materialName').value;
    const quantity = document.getElementById('materialQuantity').value;
    const description = document.getElementById('materialDescription').value;
    
    createMaterial(name, quantity, description);
    refreshAllData();
    
    document.getElementById('materialForm').reset();
});