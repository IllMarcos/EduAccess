// ===============================================
// 1. IMPORTACIONES (Añadimos getDoc y updateDoc)
// ===============================================
import { db, auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================================
// 2. REFERENCIAS A ELEMENTOS DEL DOM (Añadimos el modal de edición)
// ===============================================
const dashboardContainer = document.getElementById('dashboard-container');
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');
const logoutButton = document.getElementById('logout-button');
const userEmailElements = document.querySelectorAll('#user-email');
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
// NUEVO: Referencias para el modal de edición
const editStudentModal = document.getElementById('edit-student-modal');
const editStudentForm = document.getElementById('edit-student-form');
const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');

// ===============================================
// 3. ESTADO GLOBAL
// ===============================================
let currentSchoolId = null;
let currentEditingStudentId = null; // Guardará el ID del alumno que estamos editando

// ===============================================
// 4. NAVEGACIÓN
// ===============================================
function navigateTo(hash) {
    const viewId = `view-${hash.replace('#', '')}`;
    views.forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === hash));
}
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = e.currentTarget.getAttribute('href');
        window.location.hash = hash;
        navigateTo(hash);
    });
});

// ===============================================
// 5. LÓGICA DE AUTENTICACIÓN
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
            navigateTo(window.location.hash || '#dashboard');
        } else {
            alert("No tienes permisos de administrador.");
            await signOut(auth);
        }
    } else {
        window.location.href = 'login.html';
    }
});
logoutButton.addEventListener('click', () => signOut(auth));

// ===============================================
// 6. GESTIÓN DE GRUPOS
// ===============================================
async function getGroupsMap(schoolId) {
    const groupsSnapshot = await getDocs(collection(db, 'schools', schoolId, 'groups'));
    const map = new Map();
    groupsSnapshot.forEach(doc => map.set(doc.id, doc.data().name));
    return map;
}

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
            groupElement.innerHTML = `
                <div class="item-info"><p>${doc.data().name}</p></div>
                <div class="item-actions">
                    <button data-id="${doc.id}" class="action-btn delete delete-btn" title="Eliminar Grupo">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.91 2.75 6 3.704 6 4.834v.916m7.5 0z" /></svg>
                    </button>
                </div>`;
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
    const deleteButton = e.target.closest('.delete-btn');
    if (deleteButton) {
        const groupId = deleteButton.dataset.id;
        const studentCountSnapshot = await getDocs(query(collection(db, 'schools', currentSchoolId, 'students'), where("groupId", "==", groupId)));
        if (studentCountSnapshot.size > 0) {
            showToast(`No se puede eliminar: hay ${studentCountSnapshot.size} alumno(s) en este grupo.`, 'error');
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
// 7. GESTIÓN DE ALUMNOS (CON LÓGICA DE EDICIÓN)
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

    const groupsMap = await getGroupsMap(schoolId);
    querySnapshot.forEach(doc => {
        const student = doc.data();
        const groupName = groupsMap.get(student.groupId) || 'Sin grupo';
        const studentElement = document.createElement('div');
        studentElement.className = 'list-item';
        
        studentElement.innerHTML = `
            <div class="item-info">
                <p>${student.name}</p>
                <p>${groupName}</p>
            </div>
            <div class="item-actions">
                <button data-id="${doc.id}" class="action-btn edit-btn" title="Editar Alumno">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <button data-qr="${student.qrId}" data-name="${student.name}" class="action-btn view-qr-btn" title="Ver QR">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.5Q3.75 3 5.25 3h13.5Q20.25 3 20.25 4.5v13.5q0 1.5-1.5 1.5H5.25q-1.5 0-1.5-1.5V4.5zM8.25 8.25h1.5v1.5h-1.5V8.25zm3 0h1.5v1.5h-1.5V8.25zm-3 3h1.5v1.5h-1.5v-1.5zm3 0h1.5v1.5h-1.5v-1.5zm3 0h1.5v1.5h-1.5v-1.5zm-3 3h1.5v1.5h-1.5v-1.5zm3 0h1.5v1.5h-1.5v-1.5z"/></svg>
                </button>
                <button data-id="${doc.id}" class="action-btn delete delete-btn" title="Eliminar Alumno">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033C6.91 2.75 6 3.704 6 4.834v.916m7.5 0z" /></svg>
                </button>
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
    const targetButton = e.target.closest('.action-btn');
    if (!targetButton) return;
    const studentId = targetButton.dataset.id;

    if (targetButton.classList.contains('delete-btn')) {
        if (confirm("¿Eliminar a este alumno?")) {
            await deleteDoc(doc(db, 'schools', currentSchoolId, 'students', studentId));
            showToast("Alumno eliminado.");
            await displayStudents(currentSchoolId);
        }
    } else if (targetButton.classList.contains('view-qr-btn')) {
        qrcodeContainer.innerHTML = '';
        qrStudentName.textContent = targetButton.dataset.name;
        const qr = qrcode(0, 'L');
        qr.addData(targetButton.dataset.qr);
        qr.make();
        qrcodeContainer.innerHTML = qr.createImgTag(6, 4);
        qrModal.classList.remove('hidden');
    } else if (targetButton.classList.contains('edit-btn')) {
        const studentDoc = await getDoc(doc(db, 'schools', currentSchoolId, 'students', studentId));
        if (studentDoc.exists()) {
            const student = studentDoc.data();
            currentEditingStudentId = studentId;
            document.getElementById('edit-student-name').value = student.name;
            const editGroupSelect = document.getElementById('edit-group-select');
            const groupsSnapshot = await getDocs(query(collection(db, 'schools', currentSchoolId, 'groups')));
            populateGroupsDropdown(groupsSnapshot, editGroupSelect);
            editGroupSelect.value = student.groupId;
            editStudentModal.classList.remove('hidden');
        }
    }
});

editStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditingStudentId) return;
    const studentRef = doc(db, 'schools', currentSchoolId, 'students', currentEditingStudentId);
    try {
        await updateDoc(studentRef, {
            name: document.getElementById('edit-student-name').value.trim(),
            groupId: document.getElementById('edit-group-select').value
        });
        showToast("Alumno actualizado correctamente.");
    } catch (error) {
        showToast("Error al actualizar el alumno.", "error");
        console.error("Error updating document: ", error);
    }
    editStudentModal.classList.add('hidden');
    currentEditingStudentId = null;
    await displayStudents(currentSchoolId);
});
editModalCancelBtn.addEventListener('click', () => {
    editStudentModal.classList.add('hidden');
    currentEditingStudentId = null;
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
closeModalBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
sendAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = announcementText.value.trim();
    if (text && currentSchoolId) {
        await addDoc(collection(db, 'schools', currentSchoolId, 'announcements'), { text, target: announcementGroupSelect.value, createdAt: serverTimestamp() });
        showToast('¡Aviso enviado con éxito!');
        sendAnnouncementForm.reset();
    }
});
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') toast.classList.add('error');
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}