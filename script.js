/* ==========================================================================
   script.js — Student Registration & Login System
   Vanilla JavaScript only. Written against the EXISTING index.html/style.css
   structure — no HTML elements, IDs, or CSS classes were invented.

   SECURITY NOTE (read before reusing this anywhere real):
   This project has no backend. Student records are kept in localStorage
   and the "logged in" session is kept in sessionStorage, entirely in the
   visitor's own browser. Passwords are stored in plain text here purely
   for a front-end demo. NONE of this is secure. A real application must:
     - hash passwords server-side (e.g. bcrypt/argon2), never store them
       in plain text or in any client-accessible storage
     - issue sessions/JWTs from a server and validate them server-side
     - serve everything over HTTPS
     - re-validate all input on the server, not just in the browser
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Storage keys
     ------------------------------------------------------------------ */
  var STUDENTS_KEY = 'srl_students';   // localStorage: array of registered students
  var SESSION_KEY = 'srl_session';     // sessionStorage: current logged-in student

  /* ------------------------------------------------------------------
     Element references
     (all IDs below already exist in index.html — none were added)
     ------------------------------------------------------------------ */
  var els = {};

  function cacheElements() {
    els.tabRegister = document.getElementById('tabRegister');
    els.tabLogin = document.getElementById('tabLogin');

    els.viewRegister = document.getElementById('viewRegister');
    els.viewLogin = document.getElementById('viewLogin');
    els.viewWelcome = document.getElementById('viewWelcome');

    els.banner = document.getElementById('banner');

    els.registerForm = document.getElementById('registerForm');
    els.regName = document.getElementById('regName');
    els.regEmail = document.getElementById('regEmail');
    els.regProgram = document.getElementById('regProgram');
    els.regPassword = document.getElementById('regPassword');
    els.regConfirm = document.getElementById('regConfirm');
    els.registerHint = document.getElementById('registerHint');

    els.loginForm = document.getElementById('loginForm');
    els.loginEmail = document.getElementById('loginEmail');
    els.loginPassword = document.getElementById('loginPassword');
    els.loginHint = document.getElementById('loginHint');

    els.welcomeName = document.getElementById('welcomeName');
    els.wName = document.getElementById('wName');
    els.wEmail = document.getElementById('wEmail');
    els.wProgram = document.getElementById('wProgram');
    els.wId = document.getElementById('wId');

    els.ledgerCount = document.getElementById('ledgerCount');
    els.cardName = document.getElementById('cardName');
    els.cardProgram = document.getElementById('cardProgram');
    els.cardEmail = document.getElementById('cardEmail');
    els.cardId = document.getElementById('cardId');

    // Logout button has no ID in the HTML, only a class — selected as-is.
    els.logoutBtn = document.querySelector('.logout-btn');
  }

  /* ------------------------------------------------------------------
     localStorage helpers — registered students
     ------------------------------------------------------------------ */
  function getStudents() {
    try {
      var raw = localStorage.getItem(STUDENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Could not read student records from localStorage:', err);
      return [];
    }
  }

  function saveStudents(students) {
    try {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
      return true;
    } catch (err) {
      console.error('Could not save student records to localStorage:', err);
      return false;
    }
  }

  function findStudentByEmail(email) {
    var students = getStudents();
    var target = email.trim().toLowerCase();
    for (var i = 0; i < students.length; i++) {
      if (students[i].email.toLowerCase() === target) return students[i];
    }
    return null;
  }

  // Persists a new student record. Returns the saved record (with its id).
  function saveStudent(studentData) {
    var students = getStudents();
    var nextId = students.length ? Math.max.apply(null, students.map(function (s) { return s.id; })) + 1 : 1;

    var record = {
      id: nextId,
      name: studentData.name,
      email: studentData.email,
      program: studentData.program,
      password: studentData.password // demo only — see security note at top of file
    };

    students.push(record);
    saveStudents(students);
    return record;
  }

  // Looks up a single student by email — used by validateLogin / forgot-password style checks.
  function getStudent(email) {
    return findStudentByEmail(email);
  }

  /* ------------------------------------------------------------------
     sessionStorage helpers — current logged-in session
     ------------------------------------------------------------------ */
  function saveSession(student) {
    var session = {
      isLoggedIn: true,
      id: student.id,
      name: student.name,
      email: student.email,
      program: student.program
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ------------------------------------------------------------------
     UI helpers — reuse existing classes only ('show', 'hidden', 'active',
     'ok', 'error'). No inline styles, no new classes.
     ------------------------------------------------------------------ */
  function showBanner(message, kind) {
    els.banner.textContent = message;
    els.banner.className = 'banner show ' + kind; // kind: 'ok' | 'error'
  }

  function hideBanner() {
    els.banner.className = 'banner';
  }

  function setHint(hintEl, message, kind) {
    hintEl.textContent = message || '\u00A0';
    hintEl.className = 'hint' + (kind ? ' ' + kind : ''); // kind: 'ok' | 'error'
  }

  function pad(n) {
    return String(n).padStart(4, '0');
  }

  /* ------------------------------------------------------------------
     Tab switching (register / login / welcome)
     Exposed on window because index.html calls this via inline
     onclick="switchTab('register' | 'login')" attributes that already
     exist in the markup.
     ------------------------------------------------------------------ */
  function switchTab(which) {
    els.viewWelcome.classList.remove('show');

    if (which === 'register') {
      els.tabRegister.classList.add('active');
      els.tabLogin.classList.remove('active');
      els.viewRegister.classList.remove('hidden');
      els.viewLogin.classList.add('hidden');
    } else {
      els.tabLogin.classList.add('active');
      els.tabRegister.classList.remove('active');
      els.viewLogin.classList.remove('hidden');
      els.viewRegister.classList.add('hidden');
    }
    hideBanner();
  }
  window.switchTab = switchTab;

  /* ------------------------------------------------------------------
     Live index-card preview on the left panel, as the registration
     form is filled in. Mirrors the original inline-script behaviour.
     ------------------------------------------------------------------ */
  function updateCardPreview() {
    var students = getStudents();
    var nextId = students.length ? Math.max.apply(null, students.map(function (s) { return s.id; })) + 1 : 1;

    els.cardName.textContent = els.regName.value.trim() || '—';
    els.cardEmail.textContent = els.regEmail.value.trim() || '—';
    els.cardProgram.textContent = els.regProgram.value || '—';
    els.cardId.textContent = 'No. ' + pad(nextId);
  }

  function updateLedgerCount() {
    var count = getStudents().length;
    els.ledgerCount.textContent = count + (count === 1 ? ' student registered' : ' students registered');
  }

  /* ------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------ */
  function isValidEmail(email) {
    // Reasonable, not exhaustive, email pattern.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number.
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  // Validates the registration form's current values.
  // Returns { valid: boolean, message: string }
  function validateRegistration(data) {
    if (!data.name || !data.email || !data.program || !data.password || !data.confirm) {
      return { valid: false, message: 'Please fill in every field before registering.' };
    }
    if (!isValidEmail(data.email)) {
      return { valid: false, message: 'Please enter a valid email address.' };
    }
    if (!isStrongPassword(data.password)) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.'
      };
    }
    if (data.password !== data.confirm) {
      return { valid: false, message: 'Passwords do not match.' };
    }
    if (findStudentByEmail(data.email)) {
      return { valid: false, message: 'That email is already registered — try signing in instead.' };
    }
    return { valid: true, message: '' };
  }

  // Validates the login form's current values against stored students.
  // Returns { valid: boolean, message: string, student: object|null }
  function validateLogin(data) {
    if (!data.email || !data.password) {
      return { valid: false, message: 'Enter both your email and password.', student: null };
    }
    if (!isValidEmail(data.email)) {
      return { valid: false, message: 'Please enter a valid email address.', student: null };
    }
    var student = findStudentByEmail(data.email);
    if (!student || student.password !== data.password) {
      return { valid: false, message: 'No record matches that email and password.', student: null };
    }
    return { valid: true, message: '', student: student };
  }

  /* ------------------------------------------------------------------
     Registration
     ------------------------------------------------------------------ */
  function handleRegistration(event) {
    event.preventDefault(); // no page refresh

    var data = {
      name: els.regName.value.trim(),
      email: els.regEmail.value.trim(),
      program: els.regProgram.value,
      password: els.regPassword.value,
      confirm: els.regConfirm.value
    };

    var result = validateRegistration(data);
    if (!result.valid) {
      setHint(els.registerHint, result.message, 'error');
      return;
    }

    var record = saveStudent(data);

    setHint(els.registerHint, '', null);
    els.registerForm.reset();
    updateCardPreview();
    updateLedgerCount();

    showBanner('Registered as ' + record.name + ' — No. ' + pad(record.id) + '. Sign in to continue.', 'ok');

    // Hand off to the login tab with the email pre-filled, same UX as before.
    setTimeout(function () {
      switchTab('login');
      els.loginEmail.value = record.email;
      showBanner('Registration successful! Sign in below.', 'ok');
    }, 900);
  }

  /* ------------------------------------------------------------------
     Login
     ------------------------------------------------------------------ */
  function handleLogin(event) {
    event.preventDefault(); // no page refresh

    var data = {
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value
    };

    var result = validateLogin(data);
    if (!result.valid) {
      setHint(els.loginHint, result.message, 'error');
      return;
    }

    setHint(els.loginHint, 'Login successful!', 'ok');
    saveSession(result.student);
    showDashboard(result.student);
  }

  /* ------------------------------------------------------------------
     Dashboard (the existing "welcome" view doubles as the dashboard —
     there is no separate dashboard markup in index.html)
     ------------------------------------------------------------------ */
  function showDashboard(student) {
    els.viewLogin.classList.add('hidden');
    els.viewRegister.classList.add('hidden');
    els.viewWelcome.classList.add('show');
    hideBanner();

    els.welcomeName.textContent = ', ' + student.name.split(' ')[0];
    els.wName.textContent = student.name;
    els.wEmail.textContent = student.email;
    els.wProgram.textContent = student.program;
    els.wId.textContent = 'No. ' + pad(student.id);
  }

  /* ------------------------------------------------------------------
     Logout
     Exposed on window because index.html calls this via the existing
     inline onclick="logout()" attribute on the logout button.
     ------------------------------------------------------------------ */
  function logout() {
    clearSession();
    els.loginForm.reset();
    setHint(els.loginHint, '', null);
    switchTab('login');
  }
  window.logout = logout;

  /* ------------------------------------------------------------------
     Restore session on page load — if a session already exists in
     sessionStorage (e.g. user navigated away and back within the same
     tab), show the dashboard immediately instead of the auth forms.
     ------------------------------------------------------------------ */
  function restoreSession() {
    var session = getSession();
    if (session && session.isLoggedIn) {
      showDashboard(session);
      return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------
     Bootstrapping
     ------------------------------------------------------------------ */
  function initializeApp() {
    cacheElements();

    els.registerForm.addEventListener('submit', handleRegistration);
    els.loginForm.addEventListener('submit', handleLogin);

    els.regName.addEventListener('input', updateCardPreview);
    els.regEmail.addEventListener('input', updateCardPreview);
    els.regProgram.addEventListener('change', updateCardPreview);

    updateCardPreview();
    updateLedgerCount();

    if (!restoreSession()) {
      switchTab('register');
    }
  }

  document.addEventListener('DOMContentLoaded', initializeApp);
})();
