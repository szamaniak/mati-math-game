import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup,
    signOut,
    // type User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../config/firebaseConfig";
import { SaveManager } from "../logic/SaveManager";
import type { GameSettings } from "../logic/SaveManager";


export class AuthManager {
    
    // 1. Pomocnicza metoda: Zamiana nicku na format techniczny Firebase
    private static formatToEmail(identifier: string): string {
        const input = identifier.toLowerCase().trim();
        if (input.includes('@')) return input; // Jeśli ma @, to już jest mailem
        // Jeśli to nick, tworzymy unikalny wirtualny adres
        return `${input}@mati-math-game.local`;
    }

    // 2. REJESTRACJA (Nick/Email + Hasło)
    static async register(identifier: string, pass: string) {
        const isEmail = identifier.includes('@');
        const email = this.formatToEmail(identifier);
        const username = identifier.toLowerCase().trim();

        try {
            // Jeśli użytkownik podaje nick, sprawdzamy w Firestore czy nie jest zajęty
            if (!isEmail) {
                const nameRef = doc(db, "usernames", username);
                const nameSnap = await getDoc(nameRef);
                if (nameSnap.exists()) {
                    throw new Error("Ten nick jest już zajęty!");
                }
            }

            // Tworzymy konto w Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // Zapisujemy mapowanie nicku w Firestore
            if (!isEmail) {
                await setDoc(doc(db, "usernames", username), {
                    uid: user.uid,
                    email: email,
                    createdAt: new Date()
                });
            }

            return { success: true, user };
        } catch (error: any) {
            return { success: false, message: this.translateError(error.code) };
        }
    }

    // 3. LOGOWANIE (Nick/Email + Hasło)
    static async login(identifier: string, pass: string) {
        const email = this.formatToEmail(identifier);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            return { success: false, message: this.translateError(error.code) };
        }
    }

    // 4. LOGOWANIE GOOGLE
    static async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error: any) {
            return { success: false, message: this.translateError(error.code) };
        }
    }

    // 5. WYLOGOWANIE
    static async logout() {
        await signOut(auth);
    }

    // Pomocnicze: Tłumaczenie błędów Firebase na ludzki język
    private static translateError(code: string): string {
        switch (code) {
            case 'auth/user-not-found': return "Nie znaleziono takiego gracza.";
            case 'auth/wrong-password': return "Błędne hasło.";
            case 'auth/email-already-in-use': return "Ten użytkownik już istnieje.";
            case 'auth/weak-password': return "Hasło musi mieć min. 6 znaków.";
            case 'auth/invalid-email': return "Niepoprawny format nicku/emaila.";
            default: return "Wystąpił błąd. Spróbuj ponownie.";
        }
    }

    // Pomocnicza metoda do pobierania danych użytkownika z Firestore (np. podczas synchronizacji)
    static async getUserData(uid: string) {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef); // Jeśli to się zawiesza, sprawdź połączenie z Firebase
    return docSnap.exists() ? docSnap.data() : null;
}

    // Zapisuje dane w Firestore
    static async saveUserData(uid: string, data: any) {
        const userRef = doc(db, "users", uid);
        // merge: true sprawi, że nie skasujemy sobie innych pól w przyszłości
        await setDoc(userRef, data, { merge: true });
    }

    static async prepareSessionAndGo(user: any, scene: Phaser.Scene) {
    console.log("1. Start synchronizacji");
    
    try {
        console.log("2. Pobieranie z chmury...");
        const cloudData = await this.getUserData(user.uid);
        console.log("3. Pobrano z chmury:", cloudData);

        const localData = SaveManager.load();
        console.log("4. Wczytano lokalne:", localData);

        if (cloudData) {
            SaveManager.forceOverwrite(cloudData as GameSettings);
            console.log("5. Nadpisano lokalne");
        } else {
            console.log("5. Chmura pusta, wysyłam lokalne...");
            await SaveManager.save(localData);
        }

        console.log("6. Próba startu MathScene...");
        scene.scene.start('MathScene');

    } catch (error) {
        console.error("BŁĄD W SYNCHRONIZACJI:", error);
        scene.scene.start('MathScene');
    }
}
}