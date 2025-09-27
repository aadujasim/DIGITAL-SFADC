import { STAFF_NAMES, CLASS_NAMES, STUDENT_ROSTERS, ATTENDANCE_STATUSES } from './rosters.js';// --- CONFIGURATION ---
// Paste your Firebase config object here. If null, the app runs in local mode.
const FIREBASE_CONFIG = { // Renamed to all caps
  apiKey: "AIzaSyAVt9SNiqWSl1hHWbGbazWOQmDQ9-8sMvk",
  authDomain: "college-portal-app-a6aca.firebaseapp.com",
  projectId: "college-portal-app-a6aca",
  storageBucket: "college-portal-app-a6aca.appspot.com",
  messagingSenderId: "884690245317",
  appId: "1:884690245317:web:2e2beda283e497e28782ac"
};
console.log('--- MY LATEST CODE IS RUNNING ---');
// --- MAIN APP OBJECT ---
const App = {
    // --- State and Config ---
 // ✅ REPLACE your entire config object at the top of app.js with this one

// ✅ REPLACE your entire config object with this one

config: {
    useFirebase: !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey),
    firebaseApp: null,
    firestore: null,
    firebaseAuth: null,
    
    // Paste the BRAND NEW key you just generated from the NEW project here
    apiKey: 'AIzaSyB2D9dS8LKTVdi5-U7IwQKzkGRoaC4QhPI', 
    
    // Change the URL back to the standard 'gemini-pro' model
    apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
},
    state: {
        currentUser: null, // { uid, username, role, email }
        listeners: [], // To detach Firebase listeners on logout
    },

    // --- INITIALIZATION ---
// Replace your entire init() function with this
async init() {
    console.log(`App starting in ${this.config.useFirebase ? "Firebase" : "Local"} mode.`);
    if (this.config.useFirebase) {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js");
            const { getFirestore, collection, doc, getDoc, onSnapshot, addDoc, query, orderBy, where, writeBatch, deleteDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js");
            const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js");

            this.config.firebaseApp = initializeApp(FIREBASE_CONFIG);
            this.config.firestore = getFirestore(this.config.firebaseApp);
            this.config.firebaseAuth = getAuth(this.config.firebaseApp);

            this.db.firestoreFuncs = { collection, doc, getDoc, onSnapshot, addDoc, query, orderBy, where, writeBatch, deleteDoc, updateDoc };
            this.auth.firebaseFuncs = { signInWithEmailAndPassword, signOut };

            onAuthStateChanged(this.config.firebaseAuth, async (user) => {
                if (user) {
                    const userProfile = await this.db.getUserProfile(user.uid);
                    if (userProfile) {
                        this.state.currentUser = { ...user, ...userProfile };
                        this.router.navigateToDashboard();
                    } else {
                        console.error("User profile not found in Firestore for UID:", user.uid);
                        this.auth.logout();
                    }
                } else {
                    this.router.showView("login-view");
                }
            });
        } catch (error) {
            console.error("Firebase initialization failed:", error);
        }
    }
    this.attachEventListeners();
},

    initLocalMode() {
        this.db.seedLocalData();
        this.router.showView("login-view");
    },

    attachEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.auth.login();
        });
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.auth.logout();
        });
    },

    // --- DATA ABSTRACTION LAYER ---
    // --- DATA ABSTRACTION LAYER (Corrected and Consolidated) ---
db: {
    firestoreFuncs: {}, // Populated during Firebase init
    localData: { users: [], notifications: [], bookings: [], foodCancellations: [], attendance: [], library: [], fines: [] },

    // --- User Profile ---
    async getUserProfile(uid) {
        if (App.config.useFirebase) {
            const { doc, getDoc } = this.firestoreFuncs;
            const userDoc = await getDoc(doc(App.config.firestore, "users", uid));
            return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
        } else {
            return this.localData.users.find(u => u.uid === uid);
        }
    },

    // --- Notifications ---
    getNotifications(callback) {
        if (App.config.useFirebase) {
            const { collection, query, orderBy, onSnapshot } = this.firestoreFuncs;
            const q = query(collection(App.config.firestore, "notifications"), orderBy("createdAt", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            App.state.listeners.push(unsubscribe);
        } else {
            callback(this.localData.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
    },
    async createNotification(notificationData) {
        notificationData.createdAt = new Date().toISOString();
        if (App.config.useFirebase) {
            const { collection, addDoc } = this.firestoreFuncs;
            await addDoc(collection(App.config.firestore, "notifications"), notificationData);
        } else {
            notificationData.id = `notif_${Date.now()}`;
            this.localData.notifications.push(notificationData);
            this.saveLocalData('notifications');
        }
    },

    // --- Bookings ---
    getBookings(callback) {
        if (App.config.useFirebase) {
            const { collection, query, orderBy, onSnapshot } = this.firestoreFuncs;
            const q = query(collection(App.config.firestore, "bookings"), orderBy("date", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            App.state.listeners.push(unsubscribe);
        } else {
            callback(this.localData.bookings);
        }
    },
    async createBooking(bookingData) {
        if (App.config.useFirebase) {
            const { collection, addDoc } = this.firestoreFuncs;
            await addDoc(collection(App.config.firestore, "bookings"), bookingData);
        } else {
            bookingData.id = `book_${Date.now()}`;
            this.localData.bookings.push(bookingData);
            this.saveLocalData('bookings');
        }
    },

    // --- Food Cancellations ---
    getFoodCancellations(callback) {
        if (App.config.useFirebase) {
            const { collection, query, orderBy, onSnapshot } = this.firestoreFuncs;
            const q = query(collection(App.config.firestore, "foodCancellations"), orderBy("timestamp", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            App.state.listeners.push(unsubscribe);
        } else {
            callback(this.localData.foodCancellations);
        }
    },
    // In App.db, replace this function
async createFoodCancellation(cancellationData) {
    cancellationData.timestamp = new Date().toISOString();
    cancellationData.date = new Date().toISOString().split('T')[0]; // <-- ADD THIS LINE
    if (App.config.useFirebase) {
        const { collection, addDoc } = this.firestoreFuncs;
        await addDoc(collection(App.config.firestore, "foodCancellations"), cancellationData);
    }
},

    // --- Attendance ---
    getAttendanceForDate(date, callback) {
        if (App.config.useFirebase) {
            const { collection, query, onSnapshot, where } = this.firestoreFuncs;
            const q = query(collection(App.config.firestore, "attendanceRecords"), where("date", "==", date));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (error) => console.error("Error fetching attendance: ", error));
            App.state.listeners.push(unsubscribe);
        } else {
            // Placeholder for local mode if needed
        }
    },
    async markBulkAttendance(records) {
        if (App.config.useFirebase) {
            const { writeBatch, doc, collection } = this.firestoreFuncs;
            const batch = writeBatch(App.config.firestore);
            records.forEach(record => {
                const newDocRef = doc(collection(App.config.firestore, "attendanceRecords"));
                batch.set(newDocRef, record);
            });
            await batch.commit();
        } else {
            // Placeholder for local mode if needed
        }
    },

    // --- LOCAL DATA MANAGEMENT (Now correctly inside the db object) ---
    loadLocalData() {
        for (let key in this.localData) {
            const data = localStorage.getItem(key);
            if (data) this.localData[key] = JSON.parse(data);
        }
    },
    saveLocalData(key) {
        localStorage.setItem(key, JSON.stringify(this.localData[key]));
    },
    seedLocalData() {
        if (localStorage.getItem('seeded')) {
            this.loadLocalData();
            return;
        }
        this.localData = {
            users: [
                { uid: 'u001', username: 'principal', password: 'p123', email: 'principal@campus.com', role: 'Principal', fullName: 'Dr. Evelyn Reed' },
                { uid: 'u002', username: 'staff', password: 's123', email: 'staff@campus.com', role: 'Staff', fullName: 'Mr. David Chen' },
                { uid: 'u003', username: 'student', password: 'st123', email: 'student@campus.com', role: 'Student', fullName: 'Aisha Khan' },
                { uid: 'u004', username: 'canteen', password: 'c123', email: 'canteen@campus.com', role: 'Canteen Worker', fullName: 'Maria Garcia' },
            ],
            notifications: [{ id: 'n1', title: 'Campus Meeting', message: 'All staff are requested to attend a meeting on Friday.', target: 'staff', createdAt: new Date().toISOString() }],
            bookings: [{ id: 'b1', computerId: '12', studentName: 'Aisha Khan', admissionNumber: 'S-987', approverName: 'Mr. David Chen', date: '2025-09-20' }],
            foodCancellations: [{ id: 'fc1', studentName: 'Ravi Kumar', meal: 'night', cancelledBy: 'Mr. David Chen', timestamp: new Date().toISOString() }],
            attendance: [],
            library: [{ book: 'The Laws of Human Nature', holder: 'Aisha Khan' }],
            fines: [{ studentName: 'Aisha Khan', reason: 'Late library book return', amount: '₹50' }],
        };
        for (let key in this.localData) {
            this.saveLocalData(key);
        }
        localStorage.setItem('seeded', 'true');
    }
}, // The single closing brace for the entire 'db' object
    
    // --- AUTHENTICATION ---
    auth: {
        firebaseFuncs: {},
        async login() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            errorEl.textContent = '';

            if (App.config.useFirebase) {
                const email = `${username}@campus.com`;
                try {
                    const { signInWithEmailAndPassword } = this.firebaseFuncs;
                    await signInWithEmailAndPassword(App.config.firebaseAuth, email, password);
                } catch (e) {
                    errorEl.textContent = "Invalid credentials.";
                }
            } else {
                const user = App.db.localData.users.find(u => u.username === username && u.password === password);
                if (user) {
                    App.state.currentUser = user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    App.router.navigateToDashboard();
                } else {
                    errorEl.textContent = "Invalid credentials.";
                }
            }
        },
        
        async logout() {
            if (App.config.useFirebase) {
                const { signOut } = this.firebaseFuncs;
                await signOut(App.config.firebaseAuth);
            } else {
                localStorage.removeItem('currentUser');
            }
            App.state.currentUser = null;
            App.state.listeners.forEach(unsub => unsub());
            App.state.listeners = [];
            document.getElementById('dashboard-nav').innerHTML = '';
            document.getElementById('dashboard-content').innerHTML = '';
            App.router.showView('login-view');
        }
    },
    
    // --- UI ---
    ui: {
        renderDashboard() {
            const user = App.state.currentUser;
            if (!user) return;

            document.getElementById('user-display').textContent = `${user.fullName} (${user.role})`;
            
            const nav = document.getElementById('dashboard-nav');
            nav.innerHTML = '';

            let navLinks = [];
            switch (user.role) {
                case 'Principal':
                    navLinks = ['View Notifications', 'Create Notification', 'View Bookings', 'Attendance','AI Quiz Generator','Campus Chatbot'];
                    break;
                case 'Staff':
                    navLinks = ['Notifications', 'Computer Booking', 'Food Cancellation', 'Attendance','AI Quiz Generator','Campus Chatbot'];
                    break;
                case 'Student':
                    navLinks = ['Notifications', 'View Bookings', 'Library & Fines','AI Study Helper','Campus Chatbot'];
                    break;
                case 'Canteen Worker':
                    navLinks = ['Food Cancellations','Campus Chatbot'];
                    break;
            }

            navLinks.forEach((linkText, index) => {
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'nav-link';
                if (index === 0) a.classList.add('active');
                a.textContent = linkText;

                a.onclick = (e) => {
                    e.preventDefault();
                    document.querySelector('.nav-link.active')?.classList.remove('active');
                    a.classList.add('active');
                    this.renderContent(linkText);
                };
                nav.appendChild(a);
            });
            
            if (navLinks.length > 0) {
                this.renderContent(navLinks[0]);
            }
        },

renderContent(sectionName) {
    // This new logic checks the user's role before rendering the view
    if (sectionName === 'Attendance') {
        if (App.state.currentUser.role === 'Principal') {
            this.renderPrincipalAttendanceReport(); // Show report for Principal
            return;
        } else {
            this.renderAttendance(); // Show marking page for Staff
            return;
        }
    }

    switch (sectionName) {
        case 'Notifications':
        case 'View Notifications':
            this.renderNotifications();
            break;
        case 'Create Notification':
            this.renderCreateNotification();
            break;
        case 'Computer Booking':
        case 'View Bookings':
            this.renderComputerBookings();
            break;
        case 'Food Cancellation':
        case 'Food Cancellations':
            this.renderFoodCancellations();
            break;
        case 'Library & Fines':
            this.renderLibraryAndFines();
            break;
        case 'AI Study Helper':
            this.renderAiStudyHelper();
            break;
        case 'AI Quiz Generator':
            this.renderAiQuizGenerator();
            break;
        case 'Campus Chatbot':
            this.renderCampusChatbot();
            break;
        default:
            document.getElementById('dashboard-content').innerHTML = `<div class="content-section"><h3>Page Not Found</h3></div>`;
    }
},

        
        renderNotifications() {
            const content = document.getElementById('dashboard-content');
            content.innerHTML = `
                <div class="content-section">
                    <h3>📢 Notifications</h3>
                    <div id="notification-list" class.content-grid"><p>Loading notifications...</p></div>
                </div>
            `;

            const listEl = document.getElementById('notification-list');
            
            App.db.getNotifications(notifications => {
                listEl.innerHTML = '';
                const user = App.state.currentUser;

                const filteredNotifications = notifications.filter(notif => 
                    notif.target === 'both' ||
                    (notif.target === 'staff' && (user.role === 'Staff' || user.role === 'Principal')) ||
                    (notif.target === 'students' && (user.role === 'Student' || user.role === 'Principal'))
                );

                if (filteredNotifications.length === 0) {
                    listEl.innerHTML = '<div class="card"><p>No new notifications.</p></div>';
                    return;
                }
                
                const template = document.getElementById('notification-card-template');
                filteredNotifications.forEach(notif => {
                    const card = template.content.cloneNode(true);
                    card.querySelector('.notification-title').textContent = notif.title;
                    card.querySelector('.notification-message').textContent = notif.message;
                    card.querySelector('.notification-meta').textContent = `By ${notif.author || 'Admin'} on ${new Date(notif.createdAt).toLocaleDateString()}`;
                    listEl.appendChild(card);
                });
            });
        },

        renderCreateNotification() {
            const content = document.getElementById('dashboard-content');
            content.innerHTML = `
                <div class="content-section">
                    <h3>Create New Notification</h3>
                    <form id="create-notification-form">
                        <div class="form-group"><label for="notif-title">Title</label><input type="text" id="notif-title" required></div>
                        <div class="form-group"><label for="notif-message">Message</label><textarea id="notif-message" rows="4" required></textarea></div>
                        <div class="form-group"><label for="notif-target">Target Audience</label><select id="notif-target"><option value="both">All (Staff & Students)</option><option value="staff">Staff Only</option><option value="students">Students Only</option></select></div>
                        <button type="submit" class="btn btn-primary">Send Notification</button>
                    </form>
                </div>
            `;

            document.getElementById('create-notification-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const notificationData = {
                    title: document.getElementById('notif-title').value,
                    message: document.getElementById('notif-message').value,
                    target: document.getElementById('notif-target').value,
                    author: App.state.currentUser.fullName
                };
                
                try {
                    await App.db.createNotification(notificationData);
                    alert('Notification sent successfully!');
                    document.getElementById('notif-title').value = '';
                    document.getElementById('notif-message').value = '';
                } catch (error) {
                    console.error("Error sending notification:", error);
                    alert("Failed to send notification.");
                }
            });
        },

        // In App.ui, replace your ENTIRE renderComputerBookings function with this final version

renderComputerBookings() {
    const user = App.state.currentUser;
    let formHTML = '';
    let todaysBookings = [];

    if (user.role === 'Staff' || user.role === 'Principal') {
        formHTML = `
            <h3>Book a Computer</h3>
            <p> it will reset everynew day</p>
            <form id="booking-form" class="card">
                <div class="form-group"><input type="text" id="booking-student-name" placeholder="Student Name" required></div>
                <div class="form-group"><input type="text" id="booking-adm-no" placeholder="Admission Number" required></div>
                <div class="form-group">
                    <select id="booking-computer-id" required>
                        <option value="">Select an available computer...</option>
                        ${Array.from({ length: 24 }, (_, i) => `<option value="${i + 1}">Computer ${i + 1}</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Create Booking</button>
            </form>
            <hr style="margin: 2rem 0;">
        `;
    }

    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
        <div class="content-section">
            <h3>Computer Availability Today</h3>
            <div id="computer-grid" class="computer-grid-container">
                <p>Loading status...</p>
            </div>
            
            ${formHTML}

            <h3>Current Bookings for Today</h3>
            <div id="booking-list" class="content-grid"></div>
        </div>
    `;

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const computerToBook = document.getElementById('booking-computer-id').value;
            const isAlreadyBooked = todaysBookings.some(booking => booking.computerId === computerToBook);

            if (isAlreadyBooked) {
                alert(`Error: Computer ${computerToBook} is already booked for today.`);
                return;
            }

            const bookingData = {
                studentName: document.getElementById('booking-student-name').value,
                admissionNumber: document.getElementById('booking-adm-no').value,
                computerId: computerToBook,
                approverName: user.fullName,
                date: new Date().toISOString().split('T')[0]
            };
            await App.db.createBooking(bookingData);
            alert('Booking created successfully!');
            bookingForm.reset();
        });
    }

    const listEl = document.getElementById('booking-list');
    const gridContainer = document.getElementById('computer-grid');

    App.db.getBookings(allBookings => {
        const today = new Date().toISOString().split('T')[0];
        todaysBookings = allBookings.filter(booking => booking.date === today);

        // --- NEW: Render the Computer Grid ---
        gridContainer.innerHTML = ''; // Clear previous grid
        const bookedComputerIds = todaysBookings.map(b => b.computerId);

        for (let i = 1; i <= 24; i++) {
            const computerIdStr = String(i);
            const box = document.createElement('div');
            box.textContent = `PC ${computerIdStr}`;
            
            if (bookedComputerIds.includes(computerIdStr)) {
                box.className = 'computer-box booked';
            } else {
                box.className = 'computer-box available';
            }
            gridContainer.appendChild(box);
        }
        // --- End of Grid Rendering ---

        // Render the list of bookings below the grid
        listEl.innerHTML = '';
        if (todaysBookings.length === 0) {
            listEl.innerHTML = '<p>No computer bookings found for today.</p>';
            return;
        }

        const template = document.getElementById('booking-card-template');
        todaysBookings.forEach(book => {
            const card = template.content.cloneNode(true);
            card.querySelector('.booking-computer').textContent = book.computerId;
            card.querySelector('.booking-date').textContent = book.date;
            card.querySelector('.booking-student').textContent = book.studentName;
            card.querySelector('.booking-adm').textContent = book.admissionNumber;
            card.querySelector('.booking-approver').textContent = book.approverName;
            listEl.appendChild(card);
        });
    });
},
// In App.ui, replace your ENTIRE renderFoodCancellations function with this one
renderFoodCancellations() {
    const user = App.state.currentUser;
    let formHTML = '';

    // The form is shown to Staff and Principal to create cancellations
    if (user.role === 'Staff' || user.role === 'Principal') {
        formHTML = `
            <h3>Cancel a Student's Meal</h3>
            
            {/* ✅ FIX: The ID is now "food-cancel-form" without "Today " */}
            <form id="food-cancel-form" class="card"> 
                <div class="form-group">
                    <label for="cancel-student-name">Student Name</label>
                    <input type="text" id="cancel-student-name" required>
                </div>
                <div class="form-group">
                    <label for="cancel-student-class">Class</label>
                    <select id="cancel-student-class" required>
                        <option value="">-- Select Class --</option>
                        ${CLASS_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="cancel-table-number">Table Number</label>
                    <input type="number" id="cancel-table-number" required>
                </div>
                <div class="form-group">
                    <label for="cancel-meal">Meal</label>
                    <select id="cancel-meal" required>
                        <option value="">-- Select Meal --</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-full">Confirm Cancellation</button>
            </form>
            <hr style="margin: 2rem 0;">
        `;
    }

    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
        <div class="content-section">
            ${formHTML}
            <h3>Cancellations for Today</h3>
            <div id="cancellation-report-area"></div>
        </div>
    `;

    // This listener now correctly finds the form by its ID
    const cancelForm = document.getElementById('food-cancel-form');
    if (cancelForm) {
        cancelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cancellationData = {
                studentName: document.getElementById('cancel-student-name').value,
                studentClass: document.getElementById('cancel-student-class').value,
                tableNumber: document.getElementById('cancel-table-number').value,
                meal: document.getElementById('cancel-meal').value,
                cancelledBy: user.fullName,
            };
            await App.db.createFoodCancellation(cancellationData);
            alert('Meal cancelled successfully!');
            cancelForm.reset();
        });
    }

    // This part of the code is already correct and will display the report
    // for ANY user, including Canteen Workers. It just needs data to show.
    const reportArea = document.getElementById('cancellation-report-area');
    App.db.getFoodCancellations(allCancellations => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysCancellations = allCancellations.filter(c => c.date === todayStr);

        const breakfast = todaysCancellations.filter(c => c.meal === 'Breakfast');
        const lunch = todaysCancellations.filter(c => c.meal === 'Lunch');
        const dinner = todaysCancellations.filter(c => c.meal === 'Dinner');

        const renderMealList = (mealName, list) => {
            let listHTML = `<div class="card" style="margin-bottom: 1rem;"><h4>${mealName} (${list.length})</h4>`;
            if (list.length === 0) {
                listHTML += '<p>No cancellations for this meal.</p>';
            } else {
                const template = document.getElementById('food-cancellation-card-template');
                list.forEach(cancel => {
                    const card = template.content.cloneNode(true);
                    card.querySelector('.cancellation-student').textContent = cancel.studentName;
                    card.querySelector('.cancellation-class').textContent = cancel.studentClass;
                    card.querySelector('.cancellation-table').textContent = cancel.tableNumber;
                    card.querySelector('.cancellation-approver').textContent = cancel.cancelledBy;
                    listHTML += card.firstElementChild.outerHTML;
                });
            }
            listHTML += '</div>';
            return listHTML;
        };

        reportArea.innerHTML = `
            ${renderMealList('Breakfast', breakfast)}
            ${renderMealList('Lunch', lunch)}
            ${renderMealList('Dinner', dinner)}
        `;
    });
},

       // In App.ui, replace the entire renderAttendance function with this final version

// In App.ui, replace the entire renderAttendance function with this final version

// In App.ui, replace the entire renderAttendance function with this new version

// In App.ui, replace the entire renderAttendance function with this final version

// In App.ui, replace the entire renderAttendance function with this new version

// In App.ui, replace your entire renderAttendance function with this final version

// In App.ui, replace your entire renderAttendance function with this new version

// In App.ui, replace your entire renderAttendance function with this final version

// In App.ui, replace your renderAttendance function with this more robust version

// In App.ui, replace your ENTIRE renderAttendance function with this new version
renderAttendance() {
    const content = document.getElementById('dashboard-content');
    const user = App.state.currentUser;

    if (!user) {
        content.innerHTML = `<div class="content-section"><p>Error: User data not found. Please try refreshing or logging in again.</p></div>`;
        return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    content.innerHTML = `
        <div class="content-section">
            <h3>Attendance</h3>
            <p style="margin-bottom: 1rem; color: var(--secondary-color);">${formattedDate}</p>
            <div class="session-tabs">
                <button id="morning-tab-btn" class="btn active">Morning (7:40 AM)</button>
                <button id="noon-tab-btn" class="btn">Noon (2:00 PM)</button>
            </div>
            <div id="session-content-container"></div>
        </div>
    `;

    const morningBtn = document.getElementById('morning-tab-btn');
    const noonBtn = document.getElementById('noon-tab-btn');
    const sessionContainer = document.getElementById('session-content-container');

    App.db.getAttendanceForDate(todayStr, allDailyRecords => {
        const morningRecords = allDailyRecords.filter(r => r.session === 'Morning');
        const noonRecords = allDailyRecords.filter(r => r.session === 'Noon');

        const renderSessionUI = (sessionName, recordsForThisSession) => {
            // NEW HTML for Staff Attendance with a dropdown
            let staffAttendanceHTML = `
                <h4>Staff Attendance</h4>
                <div class="form-group">
                    <select id="staff-selector" class="form-control">
                        <option value="">-- Select Staff Member --</option>
                        ${STAFF_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                </div>
                <div id="staff-attendance-area"></div>
            `;

            let studentAttendanceHTML = `
                <h4>Student Attendance</h4>
                <div class="form-group">
                    <select id="class-selector" class="form-control">
                        <option value="">-- Select Class --</option>
                        ${CLASS_NAMES.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                </div>
                <div id="class-attendance-area"></div>
            `;
            
            sessionContainer.innerHTML = `${staffAttendanceHTML}<hr style="margin: 2rem 0;">${studentAttendanceHTML}`;

            // --- NEW Event Listeners for the Staff Dropdown ---
            const staffSelector = document.getElementById('staff-selector');
            const staffAttendanceArea = document.getElementById('staff-attendance-area');
            
            staffSelector.addEventListener('change', (e) => {
                const selectedStaff = e.target.value;
                if (!selectedStaff) {
                    staffAttendanceArea.innerHTML = '';
                    return;
                }

                const staffRecord = recordsForThisSession.find(r => r.name === selectedStaff);

                if (staffRecord) {
                    // If attendance is marked, show status
                    staffAttendanceArea.innerHTML = `<div class="card"><p>Status for ${selectedStaff}: <strong>${staffRecord.status}</strong></p></div>`;
                } else {
                    // If not marked, show marking form
                    staffAttendanceArea.innerHTML = `
                        <div class="card">
                            <div class="roster-item" data-name="${selectedStaff}">
                                <span class="roster-name">${selectedStaff}</span>
                                <div class="status-toggle">
                                    <label><input type="radio" name="staff-status" value="Present" checked> Present</label>
                                    <label><input type="radio" name="staff-status" value="Absent"> Absent</label>
                                </div>
                            </div>
                            <button id="submit-staff-btn" class="btn btn-primary" style="margin-top: 1rem;">Submit for ${selectedStaff}</button>
                        </div>`;
                    
                    document.getElementById('submit-staff-btn').addEventListener('click', async () => {
                        const status = document.querySelector('input[name="staff-status"]:checked').value;
                        const record = { name: selectedStaff, status: status, type: 'Staff', class: null, date: todayStr, session: sessionName, markedBy: user.fullName };
                        await App.db.markBulkAttendance([record]);
                        alert(`${sessionName} attendance for ${selectedStaff} submitted!`);
                        staffSelector.value = ''; // Reset dropdown after submission
                    });
                }
            });

            // --- Event Listeners for Student Dropdown (no changes here) ---
            const classSelector = document.getElementById('class-selector');
            const classAttendanceArea = document.getElementById('class-attendance-area');

            classSelector.addEventListener('change', (e) => {
                const selectedClass = e.target.value;
                if (!selectedClass) { classAttendanceArea.innerHTML = ''; return; }
                const recordsForClass = recordsForThisSession.filter(r => r.class === selectedClass);
                if (recordsForClass.length > 0) {
                    let reportHTML = '<h5>Attendance Report</h5><ul>';
                    recordsForClass.forEach(rec => { reportHTML += `<li>${rec.name}: <strong>${rec.status}</strong></li>`; });
                    classAttendanceArea.innerHTML = reportHTML + '</ul>';
                } else {
                    let rosterHTML = `<div id="student-roster">`;
                    if (STUDENT_ROSTERS[selectedClass]) {
                        STUDENT_ROSTERS[selectedClass].forEach(studentName => {
                            rosterHTML += `<div class="roster-item" data-name="${studentName}"><span class="roster-name">${studentName}</span><div class="status-toggle"><label><input type="radio" name="status-${studentName.replace(/\s+/g, '-')}" value="Present" checked> Present</label><label><input type="radio" name="status-${studentName.replace(/\s+/g, '-')}" value="Absent"> Absent</label></div></div>`;
                        });
                    }
                    rosterHTML += `</div><button id="submit-class-btn" class="btn btn-primary" style="margin-top: 1rem;">Submit for ${selectedClass}</button>`;
                    classAttendanceArea.innerHTML = rosterHTML;
                    document.getElementById('submit-class-btn').addEventListener('click', async () => {
                        const newRecords = [];
                        document.querySelectorAll('#student-roster .roster-item').forEach(item => {
                            newRecords.push({ name: item.dataset.name, status: item.querySelector('input:checked').value, type: 'Student', class: selectedClass, date: todayStr, session: sessionName, markedBy: user.fullName });
                        });
                        await App.db.markBulkAttendance(newRecords);
                        alert(`${sessionName} attendance for ${selectedClass} submitted!`);
                    });
                }
            });
        };

        renderSessionUI('Morning', morningRecords);
        morningBtn.addEventListener('click', () => { noonBtn.classList.remove('active'); morningBtn.classList.add('active'); renderSessionUI('Morning', morningRecords); });
        noonBtn.addEventListener('click', () => { morningBtn.classList.remove('active'); noonBtn.classList.add('active'); renderSessionUI('Noon', noonRecords); });
    });
},
// In App.ui, add this ENTIRE new function
renderPrincipalAttendanceReport() {
    const content = document.getElementById('dashboard-content');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 1. Set up the basic HTML structure for the report page
    content.innerHTML = `
        <div class="content-section">
            <h3>Daily Attendance Report</h3>
            <p style="margin-bottom: 1.5rem; color: var(--secondary-color);">${formattedDate}</p>

            <div class="card" style="margin-bottom: 1.5rem;">
                <h4>Morning Session (7:40 AM)</h4>
                <div id="morning-report-area">Loading report...</div>
            </div>

            <div class="card">
                <h4>Noon Session (2:00 PM)</h4>
                <div id="noon-report-area">Loading report...</div>
            </div>
        </div>
    `;

    const morningReportArea = document.getElementById('morning-report-area');
    const noonReportArea = document.getElementById('noon-report-area');

    // 2. Fetch all attendance data for the day
    App.db.getAttendanceForDate(todayStr, allDailyRecords => {
        const morningRecords = allDailyRecords.filter(r => r.session === 'Morning');
        const noonRecords = allDailyRecords.filter(r => r.session === 'Noon');

        // 3. Helper function to generate the HTML for a session's report
        const generateReportHTML = (records) => {
            if (records.length === 0) {
                return '<p>No attendance was marked for this session.</p>';
            }

            let html = '';
            
            // Process Staff Records
            const staffRecords = records.filter(r => r.type === 'Staff' || r.type === 'Principal');
            if (staffRecords.length > 0) {
                html += '<h5>Staff</h5>';
                const presentStaff = staffRecords.filter(r => r.status === 'Present').map(r => `<li>${r.name}</li>`).join('');
                const absentStaff = staffRecords.filter(r => r.status === 'Absent').map(r => `<li>${r.name}</li>`).join('');
                
                if(presentStaff) html += '<strong>Present:</strong><ul>' + presentStaff + '</ul>';
                if(absentStaff) html += '<strong>Absent:</strong><ul>' + absentStaff + '</ul>';
                html += '<hr>';
            }

            // Process Student Records, grouped by class
            const studentRecords = records.filter(r => r.type === 'Student');
            const studentsByClass = studentRecords.reduce((acc, record) => {
                if (!acc[record.class]) {
                    acc[record.class] = { present: [], absent: [] };
                }
                if (record.status === 'Present') {
                    acc[record.class].present.push(record.name);
                } else {
                    acc[record.class].absent.push(record.name);
                }
                return acc;
            }, {});

            if(Object.keys(studentsByClass).length > 0) html += '<h5>Students</h5>';

            for (const className in studentsByClass) {
                html += `<h6>Class: ${className}</h6>`;
                const presentStudents = studentsByClass[className].present.map(name => `<li>${name}</li>`).join('');
                const absentStudents = studentsByClass[className].absent.map(name => `<li>${name}</li>`).join('');

                if(presentStudents) html += '<strong>Present:</strong><ul>' + presentStudents + '</ul>';
                if(absentStudents) html += '<strong>Absent:</strong><ul>' + absentStudents + '</ul>';
            }
            
            return html;
        };

        // 4. Render the reports for both sessions
        morningReportArea.innerHTML = generateReportHTML(morningRecords);
        noonReportArea.innerHTML = generateReportHTML(noonRecords);
    });
},
        // ✅ COPY THIS ENTIRE FUNCTION

// In App.ui, REPLACE your old renderAiQuizGenerator function with this one:
// In App.ui, REPLACE your old renderAiQuizGenerator function with this one:
// In App.ui, REPLACE your current renderAiQuizGenerator function with this final version:
// ✅ REPLACE your entire renderAiQuizGenerator function with this one

// ✅ REPLACE your entire renderAiQuizGenerator function with this one

renderAiQuizGenerator() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
        <div class="content-section">
            <h3>📝 AI Quiz Generator (In-Browser)</h3>
            <p>Paste your study material below. The AI will generate a quiz directly on your device.</p>
            <div class="card">
                <div class="form-group">
                    <label for="quiz-source-text">Source Material</label>
                    <textarea id="quiz-source-text" rows="10" placeholder="Paste your lecture notes..."></textarea>
                </div>
                <button id="generate-quiz-btn" class="btn btn-primary">Generate Quiz</button>
            </div>
            <div id="quiz-result-area" class="content-section" style="margin-top: 1.5rem;"></div>
        </div>
    `;

    const formatQuizHTML = (rawText) => {
        const answerKeyMarkers = /Answer Key:|Answers:|ANSWER KEY:/i;
        const parts = rawText.split(answerKeyMarkers);
        const questionsPart = parts[0];
        const answersPart = parts.length > 1 ? parts[1] : '';
        const questions = questionsPart.trim().split(/\n(?=\d+[\.\)]\s*)/).filter(q => q.trim());
        let formattedHTML = '<ol class="quiz-list">';
        questions.forEach(q => {
            const lines = q.trim().split('\n');
            const questionText = lines[0];
            const options = lines.slice(1).join('\n');
            formattedHTML += `<li><p class="quiz-question">${questionText}</p><pre class="quiz-options">${options}</pre></li>`;
        });
        formattedHTML += '</ol>';
        if (answersPart.trim()) {
            formattedHTML += `<h4 class="answer-key-title">Answer Key</h4><pre class="quiz-answers">${answersPart.trim()}</pre>`;
        }
        return formattedHTML;
    };

    document.getElementById('generate-quiz-btn').addEventListener('click', async () => {
        const sourceText = document.getElementById('quiz-source-text').value;
        const resultArea = document.getElementById('quiz-result-area');
        if (sourceText.trim().length < 50) return alert("Please provide at least 50 characters.");

        const generateBtn = document.getElementById('generate-quiz-btn');
        generateBtn.disabled = true;
        resultArea.innerHTML = `<div class="card"><p>📚 Loading AI model (this happens once)...</p></div>`;

        try {
            const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1");
            const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M');
            
            resultArea.innerHTML = `<div class="card"><p>🧠 Generating quiz on your device...</p></div>`;

            const prompt = `Strictly based *only* on the provided text, create exactly five multiple-choice questions numbered 1 to 5. The answer key must be factually correct according to the text. TEXT: "${sourceText}"`;

            const output = await generator(prompt, { max_length: 800, min_length: 250 });
            let rawQuizText = output[0].generated_text;
            
            // --- NEW LINE TO CLEAN THE OUTPUT ---
            // This removes all the repetitive "(Note:...)" text from the result.
            rawQuizText = rawQuizText.replace(/\s*\(.*?\)\s*/g, " ").trim();
            
            const formattedQuiz = formatQuizHTML(rawQuizText);
            resultArea.innerHTML = `<div class="card"><h3>Generated Quiz</h3>${formattedQuiz}</div>`;

        } catch (error) {
            console.error("In-browser AI Error:", error);
            resultArea.innerHTML = `<div class="card error-text"><p>Sorry, an error occurred with the local AI model.</p></div>`;
        } finally {
            generateBtn.disabled = false;
        }
    });
},

        // CORRECTED AI STUDY HELPER
        // In App.ui, REPLACE your old renderAiStudyHelper function with this one:
async renderAiStudyHelper() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
        <div class="content-section">
            <h3>✨ AI Study Helper</h3>
            <p>Paste any text below, and the AI will provide a concise summary right in your browser.</p>
            <div class="card">
                <div class="form-group">
                    <label for="summary-source-text">Text to Summarize</label>
                    <textarea id="summary-source-text" rows="10" placeholder="Paste a long article..."></textarea>
                </div>
                <button id="generate-summary-btn" class="btn btn-primary">Generate Summary</button>
            </div>
            <div id="summary-result-area" class="content-section" style="margin-top: 1.5rem;"></div>
        </div>
    `;

    document.getElementById('generate-summary-btn').addEventListener('click', async () => {
        const sourceText = document.getElementById('summary-source-text').value;
        const resultArea = document.getElementById('summary-result-area');
        if (sourceText.trim().length < 100) return alert("Please provide at least 100 characters.");

        resultArea.innerHTML = `<div class="card"><p>its take bit more time.</p></div>`;
        
        try {
            // ✅ NEW: Import the pipeline function from the library
            const { pipeline } = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1");

            // ✅ NEW: Create a summarization pipeline. The first time this runs, it will download the model.
            const summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
            
            resultArea.innerHTML = `<div class="card"><p>🧠 Generating summary on your device...</p></div>`;

            // ✅ NEW: Generate the summary locally
            const output = await summarizer(sourceText, { max_length: 150, min_length: 40 });
            const summaryText = output[0].summary_text;

            resultArea.innerHTML = `<div class="card"><h3>Summary</h3><p style="line-height: 1.6;">${summaryText}</p></div>`;

        } catch (error) {
            console.error("In-browser AI Error:", error);
            resultArea.innerHTML = `<div class="card error-text"><p>Sorry, an error occurred with the local AI model.</p></div>`;
        }
    });
},

        // CORRECTED CAMPUS CHATBOT
        // In App.ui, REPLACE your old renderCampusChatbot function with this one:
// In App.ui, replace the renderCampusChatbot function
// ✅ In App.ui, REPLACE your entire renderCampusChatbot function with this powerful hybrid version

// ✅ In App.ui, REPLACE your entire renderCampusChatbot function with this one

async renderCampusChatbot() {
    // --- 1. PREDEFINED QUESTIONS & ANSWERS ---
    // You can easily add, remove, or change any questions and answers here.
    // Inside the renderCampusChatbot function in app.js

const PREDEFINED_QA = {
    // --- General Info ---
       "What are the library hours?": "The main library is open from 5:00 pM to 6:30 PM on everday...",
    "Where is the computer lab?": "The computer lab is located at Near Staff Room.",
    "Where can I find the Lost and Found?": "Fill a complaint to Jaleel Hudawi.",
    // ... (your other existing questions)

    // --- Key Roles & People ---
    "Who is the Principal?": "The Principal is Fawas Hudawi.",
    "Who is the Vice Principal?": "The Vice Principal is Usman Darimi. .", // NEW
    "Who is the Staff Secretary?": "The Staff Secretary is Rashad Hudawi",
    "Who is the Academic Coordinator?": "Fayiz Hudawi is the Academic Coordinator...",
    
    // --- Student Union (NEW SECTION) ---
    "What is the name of the student union?": "IMAD Students, union'.",
    "Who are the student union office-bearers?": "The main office-bearers are: President: [Muhammed Anas], Vice President: [Muhammed Adil], General Secretary: [MIdlaj CK], Joint Secretary: [Anshid], PRO: [Dilshad], Treasurer: [Adil].",
    
    // --- Timings & Policies (NEW SECTION) ---
    "What are the Masjid prayer (Namaz) times?": "The congregational prayer times are approximately (IQAMTH): Fajr: 5:10 AM, Dhuhr: 1:05 PM, Asr: 4:25 PM, Maghrib: 1 mins after sunset, Isha: 8:45 PM. Please check the Masjid notice board for exact daily times.",
    "What are the visiting hours for parents?": "Parents are welcome to visit the campus between 5:00 PM and 6:00 PM. ."

};

    // --- 2. GENERATE HTML ---
    // This creates the buttons for each question you defined above.
    const questionButtonsHTML = Object.keys(PREDEFINED_QA)
        .map(question => `<button class="btn qa-button">${question}</button>`)
        .join('');

    const content = document.getElementById('dashboard-content');
    content.innerHTML = `
        <div class="content-section">
            <h3>🤖 Campus Help Bot</h3>
            <p>Click a question below to see its answer.</p>
            
            <div class="card" style="margin-bottom: 1rem;">
                <h4>Frequently Asked Questions</h4>
                <div class="qa-button-container">
                    ${questionButtonsHTML}
                </div>
            </div>

            <div class="card">
                <h4>Answer</h4>
                <div id="qa-answer-area">
                    <p>Please select a question above.</p>
                </div>
            </div>
        </div>
    `;

    // --- 3. ADD EVENT LISTENERS ---
    const answerArea = document.getElementById('qa-answer-area');
    const questionButtons = document.querySelectorAll('.qa-button');

    questionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' style from any other button
            document.querySelector('.qa-button.active')?.classList.remove('active');
            // Add 'active' style to the clicked button
            button.classList.add('active');
            
            const question = button.textContent;
            const answer = PREDEFINED_QA[question];
            
            // Display the corresponding answer
            answerArea.innerHTML = `<p>${answer}</p>`;
        });
    });
},
        renderLibraryAndFines() {
             document.getElementById('dashboard-content').innerHTML = `
                <div class="content-section">
                    <h3>Library & Fines</h3>
                    <div class="card"><p><strong>Book:</strong> The Laws of Human Nature</p><p><strong>Borrowed by:</strong> You (Aisha Khan)</p></div>
                    <div class="card"><p><strong>Fine:</strong> Late library book return</p><p><strong>Amount:</strong> ₹50.00</p></div>
                </div>
            `;
        }

        // ... (Keep all your other working render functions like renderLibraryAndFines, etc.)

    },
    // Add this entire new function inside the App.ui object

  
    // --- ROUTER --- (CORRECTED AND FINAL VERSION)
    router: {
        showView(viewId) {
            document.querySelectorAll('.view').forEach(v => {
                v.style.display = 'none';
            });
            
            const viewToShow = document.getElementById(viewId);
            if (viewToShow) {
                if (viewId === 'login-view') {
                    viewToShow.style.display = 'flex';
                } else if (viewId === 'dashboard-view') {
                    viewToShow.style.display = 'grid';
                } else {
                    viewToShow.style.display = 'block';
                }
            }
        },
        navigateToDashboard() {
            this.showView('dashboard-view');
            App.ui.renderDashboard();
        }
    }
};

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', () => App.init());