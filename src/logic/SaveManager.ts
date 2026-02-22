import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";

export interface GameSettings {
    IQ: number;
    score: number;    
    talary: number;
    zakresA: number;
    zakresB: number;
    lastA: number;  
    lastB: number;
    userName: string;
    email?: string; // opcjonalne pole na email (przydatne do migracji z nicków)
    tryb: string;
}

export class SaveManager {
    private static readonly SAVE_KEY = 'math_game_data_v2'; // Zmieniamy klucz dla nowej struktury

    private static readonly DEFAULT_SETTINGS = (name: string): GameSettings => ({
        IQ: 0,
        score: 0,
        talary: 0,
        zakresA: 10,
        zakresB: 10,
        lastA: -1,
        lastB: -1,
        userName: name,
        tryb: 'praktyka'
    });

    // Wczytuje dane z localStorage (bez podziału na wielu userów - Firebase zajmie się izolacją)
    static load(): GameSettings {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return this.DEFAULT_SETTINGS('Gość');
        return JSON.parse(data);
    }

    // Zapisuje lokalnie i próbuje wysłać do Firebase
    static async save(update: Partial<GameSettings>) {
        // 1. Aktualizacja lokalna
        const currentData = this.load();
        const updatedData = { ...currentData, ...update };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(updatedData));

        // 2. Aktualizacja w Firebase (jeśli użytkownik jest zalogowany)
        const user = auth.currentUser;
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                // Używamy { merge: true }, aby nie nadpisać wszystkiego, jeśli nie trzeba
                await setDoc(userRef, updatedData, { merge: true });
                console.log("☁️ Postęp zapisany w chmurze");
            } catch (error) {
                console.warn("⚠️ Brak synchronizacji z chmurą (działa tryb offline)");
            }
        }
    }

    // Specjalna metoda do nadpisania całego zapisu (używana przy logowaniu/synchronizacji)
    static forceOverwrite(data: GameSettings) {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }
}