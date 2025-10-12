// ===============================================
// 1. IMPORTACIONES
// ===============================================
import { db, auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================================
// 2. REFERENCIAS A ELEMENTOS DEL DOM
// ===============================================
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const userEmailElements = document.querySelectorAll('#user-email'); // Seleccionamos ambos
const errorMessage = document.getElementById('error-message');
const addGroupForm = document.getElementById('add-group-form');
const groupNameInput = document.getElementById('group-name');
const groupsListContainer = document.getElementById('groups-list');
const addStudentForm = document.getElementById('add-student-form');
const studentNameInput = document.getElementById('student-name');
const groupSelect = document.getElementById('group-select');
const studentsListContainer = document.getElementById('students-list');
const sendAnnouncementForm = document.getElementById('send-announcement-form');
const announcementText = document.getElementById('announcement-text');
const announcementGroupSelect = document.getElementById('announcement-group-select');
const qrModal = document.getElementById('qr-modal');
const qrStudentName = document.getElementById('qr-student-name');
const qrcodeContainer = document.getElementById('qrcode-container');
const closeModalBtn = document.getElementById('close-modal-btn');

// ===============================================
// 3. ESTADO GLOBAL
// ===============================================
let currentSchoolId = null;

// ===============================================
// 4. LÓGICA DE AUTENTICACIÓN
// ===============================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorMessage.textContent = '';
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        errorMessage.textContent = 'Correo o contraseña incorrectos.';
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.role === 'admin') {
            currentSchoolId = idTokenResult.claims.schoolId;
            loginContainer.style.display = 'none'; // Usamos style.display para el login
            dashboardContainer.classList.remove('hidden');
            userEmailElements.forEach(el => el.textContent = user.email);
            
            displayGroups(currentSchoolId);
            displayStudents(currentSchoolId);
        } else {
            errorMessage.textContent = "No tienes permisos para acceder.";
            await signOut(auth);
        }
    } else {
        loginContainer.style.display = 'flex';
        dashboardContainer.classList.add('hidden');
        currentSchoolId = null;
    }
});

// ===============================================
// 5. GESTIÓN DE GRUPOS
// ===============================================
async function displayGroups(schoolId) {
    const groupsRef = collection(db, 'schools', schoolId, 'groups');
    const q = query(groupsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    populateGroupsDropdown(querySnapshot, groupSelect);
    populateGroupsDropdown(querySnapshot, announcementGroupSelect, true);
    
    groupsListContainer.innerHTML = '';
    if (querySnapshot.empty) {
        groupsListContainer.innerHTML = '<p style="text-align:center; padding: 1rem;">Crea tu primer grupo.</p>';
    } else {
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
        displayGroups(currentSchoolId);
    }
});

groupsListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn') && confirm("¿Eliminar este grupo?")) {
        await deleteDoc(doc(db, 'schools', currentSchoolId, 'groups', e.target.dataset.id));
        displayGroups(currentSchoolId);
    }
});

// ===============================================
// 6. GESTIÓN DE ALUMNOS
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
        displayStudents(currentSchoolId);
    } else {
        alert("Completa todos los campos.");
    }
});

studentsListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn') && confirm("¿Eliminar a este alumno?")) {
        await deleteDoc(doc(db, 'schools', currentSchoolId, 'students', e.target.dataset.id));
        displayStudents(currentSchoolId);
    }
});

// ===============================================
// 7. LÓGICA ADICIONAL (QR, AVISOS)
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
        alert('¡Aviso enviado con éxito!');
        sendAnnouncementForm.reset();
    }
});