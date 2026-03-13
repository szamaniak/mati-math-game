import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";

export interface GameSettings {
    IQ: number;
    score: number;    
    talary: number;
    talenty: number; // ✨ Nowa waluta za ciekawostki
    fixedA: number;
    zakresA: number;
    zakresB: number;
    lastA: number;  
    lastB: number;
    userName: string;
    email?: string;
    tryb: string;
}

export class SaveManager {
    private static readonly SAVE_KEY = 'math_game_data_v2';

    private static readonly DEFAULT_SETTINGS = (name: string): GameSettings => ({
        IQ: 0,
        score: 0,
        talary: 0,
        talenty: 0,
        fixedA: 0,
        zakresA: 10,
        zakresB: 10,
        lastA: -1,
        lastB: -1,
        userName: name,
        tryb: 'praktyka'
    });

    /**
     * Wczytuje dane z localStorage z rzutowaniem na GameSettings
     */
    static load(): GameSettings {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return this.DEFAULT_SETTINGS('Gość');
        
        // Używamy as GameSettings, aby zachować bezpieczeństwo typów w reszcie aplikacji
        return JSON.parse(data) as GameSettings;
    }

    /**
     * Zapisuje zmiany (Partial pozwala wysłać tylko np. { talary: 10 })
     */
    static async save(update: Partial<GameSettings>) {
        const currentData = this.load();
        const updatedData = { ...currentData, ...update };
        
        // 1. Lokalny zapis (natychmiastowy UX)
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(updatedData));

        // 2. Chmura (asynchronicznie)
        const user = auth.currentUser;
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                // merge: true jest kluczowe, by nie nadpisać pól, których nie ma w obiekcie updatedData
                await setDoc(userRef, updatedData, { merge: true });
                console.log("☁️ Postęp zsynchronizowany z Firebase");
            } catch (error) {
                console.warn("⚠️ Tryb offline: Zapisano tylko lokalnie");
            }
        }
    }

    /**
     * Nadpisuje cały profil (używane w AuthManager po zalogowaniu)
     */
    static forceOverwrite(data: GameSettings) {
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }
}