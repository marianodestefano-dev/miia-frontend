// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_d3somFQOR17zBVKyO0wuSftqqT0t4vk",
  authDomain: "miia-app-8cbd0.firebaseapp.com",
  projectId: "miia-app-8cbd0",
  storageBucket: "miia-app-8cbd0.firebasestorage.app",
  messagingSenderId: "603310007208",
  appId: "1:603310007208:web:9bffcaf4a34a3ce465b39d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a los servicios
const db = firebase.firestore();
const auth = firebase.auth();

console.log('✅ Firebase conectado correctamente');