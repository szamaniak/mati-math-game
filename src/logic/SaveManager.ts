import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";

export interface GameSettings {
    IQ: number;
    score: number;    
    talary: number;
    talenty: number; // ✨ Nowa waluta za ciekawostki
    fixedA: number;
    zakresA: number;
    zakresAmin: number;
    zakresB: number;
    zakresBmin: number;
    lastA: number;  
    lastB: number;
    fractions: boolean;
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
        fixedA: 4,
        zakresA: 10,
        zakresAmin: 1,
        zakresB: 10,
        zakresBmin: 1,
        lastA: -1,
        lastB: -1,
        fractions: false,
        userName: name,
        tryb: 'praktyka'
    });

    /**
     * Wczytuje dane z localStorage z rzutowaniem na GameSettings
     */
    static load(): GameSettings {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return this.DEFAULT_SETTINGS('Gość');
        
        // MIGRACJA: Sprawdzamy czy nowe pola istnieją. Jeśli nie - dodajemy domyślne.
    // Dzięki temu kod w SettingsScene nigdy nie dostanie 'undefined'
    const parsed = JSON.parse(data);
    if (parsed.zakresAmin === undefined) {
        parsed.zakresAmin = 1;
        parsed.zakresBmin = 1;
        parsed.fractions = false;
        // Opcjonalnie: od razu zapisz naprawione dane
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(parsed));
    }

    return parsed as GameSettings;
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