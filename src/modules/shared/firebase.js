//src/modules/shared/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyDGbWOmA28Lb0aoe0HIXeOYZ6lHH4rTNLk",

  authDomain: "calendario-rcbba.firebaseapp.com",

  projectId: "calendario-rcbba",

  storageBucket: "calendario-rcbba.firebasestorage.appspot.com",

  messagingSenderId: "874861663623",

  appId: "1:874861663623:web:2c24b216123a876b4d2f22"

};



const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };