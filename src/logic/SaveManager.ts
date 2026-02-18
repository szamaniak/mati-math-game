// src/logic/SaveManager.ts

export interface GameSettings {
    score: number;
    talary: number;
    zakresA: number;
    zakresB: number;
    lastA: number;  
    lastB: number;
    userName: string;
    tryb: string; // Dodajemy opcjonalne pole tryb
}

// Struktura przechowująca wielu użytkowników
interface AllUsersData {
    currentUser: string | null;
    users: { [username: string]: GameSettings };
}

export class SaveManager {
    private static readonly SAVE_KEY = 'math_game_multi_storage';

    private static readonly DEFAULT_SETTINGS = (name: string): GameSettings => ({
        score: 0,
        talary: 0,
        zakresA: 10,
        zakresB: 10,
        lastA: -1,
        lastB: -1,
        userName: name,
        tryb: 'praktyka' // Domyślny tryb
    });

    // Pomocnicza metoda do pobrania całej bazy z localStorage
    private static getAllData(): AllUsersData {
        const data = localStorage.getItem(this.SAVE_KEY);
        if (!data) return { currentUser: null, users: {} };
        try {
            return JSON.parse(data);
        } catch {
            return { currentUser: null, users: {} };
        }
    }

    // Logowanie / Przełączanie użytkownika
    static login(username: string) {
        const data = this.getAllData();
        data.currentUser = username;
        
        // Jeśli użytkownik nie istnieje, stwórz go
        if (!data.users[username]) {
            data.users[username] = this.DEFAULT_SETTINGS(username);
        }
        
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }

    static getAvailableUsers(): string[] {
    const data = this.getAllData();
    return Object.keys(data.users);
    }

    // Wczytuje dane AKTUALNEGO użytkownika
    static load(): GameSettings {
        const data = this.getAllData();
        const current = data.currentUser;
        
        if (current && data.users[current]) {
            return data.users[current];
        }
        // Jeśli nikt nie jest zalogowany, zwróć profil Gościa
        return this.DEFAULT_SETTINGS('Gość');
    }

    // Zapisuje postęp aktualnego użytkownika
    static save(update: Partial<GameSettings>) {
        const data = this.getAllData();
        const current = data.currentUser;
        
        if (!current) return; // Nie zapisuj, jeśli nikt nie jest zalogowany

        data.users[current] = { ...data.users[current], ...update };
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    }

    // Przygotowanie danych do wysyłki do Firebase
    static getPayloadForFirebase() {
        const data = this.getAllData();
        const current = data.currentUser;
        if (!current) return null;

        return {
            userId: current.toLowerCase().trim(), // Prosty ID
            timestamp: Date.now(),
            data: data.users[current]
        };
    }
}