// ===============================================
// 1. IMPORTACIONES
// ===============================================
import { db, auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================================
// 2. REFERENCIAS A ELEMENTOS DEL DOM
// ===============================================
// Contenedores Principales
const dashboardContainer = document.getElementById('dashboard-container');
// Vistas
const views = document.querySelectorAll('.view');
// Navegación
const navLinks = document.querySelectorAll('.nav-link');
// Autenticación
const logoutButton = document.getElementById('logout-button');
const userEmailElements = document.querySelectorAll('#user-email');
// Grupos
const addGroupForm = document.getElementById('add-group-form');
const groupNameInput = document.getElementById('group-name');
const groupsListContainer = document.getElementById('groups-list');
// Alumnos
const addStudentForm = document.getElementById('add-student-form');
const studentNameInput = document.getElementById('student-name');
const groupSelect = document.getElementById('group-select');
const studentsListContainer = document.getElementById('students-list');
// Avisos
const sendAnnouncementForm = document.getElementById('send-announcement-form');
const announcementText = document.getElementById('announcement-text');
const announcementGroupSelect = document.getElementById('announcement-group-select');
// Modal QR
const qrModal = document.getElementById('qr-modal');
const qrStudentName = document.getElementById('qr-student-name');
const qrcodeContainer = document.getElementById('qrcode-container');
const closeModalBtn = document.getElementById('close-modal-btn');

// ===============================================
// 3. ESTADO GLOBAL
// ===============================================
let currentSchoolId = null;

// ===============================================
// 4. NAVEGACIÓN
// ===============================================
function navigateTo(hash) {
    const viewId = `view-${hash.replace('#', '')}`;
    views.forEach(view => view.classList.add('hidden'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = e.currentTarget.getAttribute('href');
        // Actualizar la URL para que el usuario pueda recargar la página en la misma vista
        window.location.hash = hash;
        navigateTo(hash);
    });
});

// ===============================================
// 5. LÓGICA DE AUTENTICACIÓN Y PROTECCIÓN DE RUTA
// ===============================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.role === 'admin') {
            currentSchoolId = idTokenResult.claims.schoolId;
            
            dashboardContainer.classList.remove('hidden');
            userEmailElements.forEach(el => el.textContent = user.email);
            
            await displayGroups(currentSchoolId);
            await displayStudents(currentSchoolId);
            
            // Navegar a la vista correcta (basado en el hash de la URL o al dashboard por defecto)
            navigateTo(window.location.hash || '#dashboard');
        } else {
            alert("No tienes permisos de administrador.");
            await signOut(auth);
        }
    } else {
        // Si no hay usuario, redirigir a la página de login.
        window.location.href = 'login.html';
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth).catch(error => console.error('Error al cerrar sesión:', error));
});


// ===============================================
// 6. GESTIÓN DE GRUPOS
// ===============================================
async function displayGroups(schoolId) {
    const groupsRef = collection(db, 'schools', schoolId, 'groups');
    const q = query(groupsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    populateGroupsDropdown(querySnapshot, groupSelect);
    populateGroupsDropdown(querySnapshot, announcementGroupSelect, true);
    
    groupsListContainer.innerHTML = '';
    
    const addStudentCard = addStudentForm.closest('.card');
    if (querySnapshot.empty) {
        groupsListContainer.innerHTML = '<p style="text-align:center; padding: 1rem;">Crea tu primer grupo.</p>';
        addStudentCard.style.opacity = '0.5';
        addStudentCard.style.pointerEvents = 'none';
        addStudentCard.title = "Debes crear un grupo antes de añadir alumnos.";
    } else {
        addStudentCard.style.opacity = '1';
        addStudentCard.style.pointerEvents = 'auto';
        addStudentCard.title = "";
        querySnapshot.forEach(doc => {
            const groupElement = document.createElement('div');
            groupElement.className = 'list-item';
            groupElement.innerHTML = `<p style="color: var(--text-primary); font-weight: 500;">${doc.data().name}</p><button data-id="${doc.id}" class="delete-btn">✖</button>`;
            groupsListContainer.appendChild(groupElement);
        });
    }
}

addGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = groupNameInput.value.trim();
    if (groupName && currentSchoolId) {
        await addDoc(collection(db, 'schools', currentSchoolId, 'groups'), { name: groupName });
        groupNameInput.value = '';
        showToast(`Grupo "${groupName}" creado.`);
        await displayGroups(currentSchoolId);
    }
});

groupsListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const groupId = e.target.dataset.id;
        
        const studentsRef = collection(db, 'schools', currentSchoolId, 'students');
        const q = query(studentsRef, where("groupId", "==", groupId));
        const countSnapshot = await getCountFromServer(q);
        const studentCount = countSnapshot.data().count;

        if (studentCount > 0) {
            showToast(`No se puede eliminar: hay ${studentCount} alumno(s) en este grupo.`, 'error');
            return;
        }

        if (confirm("¿Estás seguro de que quieres eliminar este grupo?")) {
            await deleteDoc(doc(db, 'schools', currentSchoolId, 'groups', groupId));
            showToast("Grupo eliminado correctamente.");
            await displayGroups(currentSchoolId);
        }
    }
});

// ===============================================
// 7. GESTIÓN DE ALUMNOS
// ===============================================
async function displayStudents(schoolId) {
    const studentsRef = collection(db, 'schools', schoolId, 'students');
    const q = query(studentsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    studentsListContainer.innerHTML = '';

    if (querySnapshot.empty) {
        studentsListContainer.innerHTML = '<p style="text-align:center; padding: 1rem;">Inscribe tu primer alumno.</p>';
        return;
    }

    const groupsSnapshot = await getDocs(collection(db, 'schools', schoolId, 'groups'));
    const groupsMap = new Map();
    groupsSnapshot.forEach(doc => groupsMap.set(doc.id, doc.data().name));

    querySnapshot.forEach(doc => {
        const student = doc.data();
        const groupName = groupsMap.get(student.groupId) || 'Sin grupo';
        const studentElement = document.createElement('div');
        studentElement.className = 'list-item';
        studentElement.innerHTML = `
            <div>
                <p style="color: var(--text-primary); font-weight: 500;">${student.name}</p>
                <p style="font-size: 0.875rem;">${groupName}</p>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <button data-qr="${student.qrId}" data-name="${student.name}" class="view-qr-btn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer;">Ver QR</button>
                <button data-id="${doc.id}" class="delete-btn">✖</button>
            </div>`;
        studentsListContainer.appendChild(studentElement);
    });
}

addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentName = studentNameInput.value.trim();
    const groupId = groupSelect.value;
    if (studentName && groupId && currentSchoolId) {
        const qrId = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await addDoc(collection(db, 'schools', currentSchoolId, 'students'), { name: studentName, groupId: groupId, qrId: qrId });
        addStudentForm.reset();
        showToast(`Alumno "${studentName}" inscrito.`);
        await displayStudents(currentSchoolId);
    } else {
        showToast("Por favor, completa todos los campos.", "error");
    }
});

studentsListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn') && confirm("¿Eliminar a este alumno?")) {
        await deleteDoc(doc(db, 'schools', currentSchoolId, 'students', e.target.dataset.id));
        showToast("Alumno eliminado.");
        await displayStudents(currentSchoolId);
    }
});

// ===============================================
// 8. LÓGICA ADICIONAL (QR, AVISOS, TOAST)
// ===============================================
function populateGroupsDropdown(querySnapshot, selectElement, includeAllOption = false) {
    selectElement.innerHTML = includeAllOption ? '<option value="all">Para Todos los Grupos</option>' : '<option value="">Seleccionar grupo...</option>';
    querySnapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.data().name;
        selectElement.appendChild(option);
    });
}

studentsListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-qr-btn')) {
        qrcodeContainer.innerHTML = '';
        qrStudentName.textContent = e.target.dataset.name;
        const qr = qrcode(0, 'L');
        qr.addData(e.target.dataset.qr);
        qr.make();
        qrcodeContainer.innerHTML = qr.createImgTag(6, 4);
        qrModal.classList.remove('hidden');
    }
});

closeModalBtn.addEventListener('click', () => {
    qrModal.classList.add('hidden');
});

sendAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = announcementText.value.trim();
    if (text && currentSchoolId) {
        await addDoc(collection(db, 'schools', currentSchoolId, 'announcements'), { text: text, target: announcementGroupSelect.value, createdAt: serverTimestamp() });
        showToast('¡Aviso enviado con éxito!');
        sendAnnouncementForm.reset();
    }
});

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    if (type === 'error') {
        toast.style.backgroundColor = '#e53e3e';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}