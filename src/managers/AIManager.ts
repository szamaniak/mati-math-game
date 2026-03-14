// to-do list:
// generowanie zagadek: koszt 15 talarów, nagroda 20 talarów: 
// możliwość dyskusji / pytania naukowego: 50 talarów


import { SaveManager } from "../logic/SaveManager";

export class AIManager {
    // Lista 25 obszarów tematycznych dla zachowania różnorodności
    private static readonly TOPICS: string[] = [
    "Giganty Oceanów", "Sekrety Dinozaurów", "Podróże w Kosmosie", 
    "Rekordy Zwierząt", "Dziwne Rośliny", "Ciało Człowieka", 
    "Wynalazki", "Wielkie Budowle", "Pogoda i Zjawiska", 
    "Życie w Micro-świecie", "Skarby Ziemi", "Zwierzęta Domowe", 
    "Historia Sportu", "Transport Przyszłości", "Muzyka i Dźwięki", 
    "Zabawne Prawa Fizyki", "Słynni Odkrywcy", "Eko-Bohaterzy", 
    "Świat Owadów", "Mitologie Świata", "Jak powstaje czekolada", 
    "Zjawiska Optyczne", "Głębiny Ziemi", "Języki Świata", "Matematyka w Naturze",
    "Roboty i Sztuczna Inteligencja", "Sekrety Internetu", "Jak działają Magnesy?",
    "Energia ze Słońca i Wiatru", "Tajemnice Pieniądza", "Lotnictwo: Dlaczego samolot lata?",
    "Komputery: Od liczydła do smartfona", "Chemia w Twojej kuchni", "Druk 3D: Budowanie z niczego",
    "Prąd elektryczny: Skąd się bierze?", "Niesamowite Grzyby", "Dlaczego liście zmieniają kolor?",
    "Mieszkańcy Pustyni", "Zwierzęta, które świecą w ciemności", "Życie na Rafie Koralowej",
    "Wielka Wędrówka Ptaków", "Pszczoły i ich supermoce", "Jak drzewa rozmawiają ze sobą?",
    "Zwierzęta Arktyki i Antarktydy", "Recykling: Drugie życie śmieci", "Życie w Starożytnym Egipcie",
    "Rycerze i Zamki", "Wikingowie: Morscy wojownicy", "Piramidy Świata", "Siedem Cudów Świata",
    "Wielki Mur Chiński", "Życie Jaskiniowców", "Wyprawa na Mount Everest", "Legendarni Piraci i ich statki",
    "Pierwsze Igrzyska Olimpijskie", "Misja na Marsa", "Czarne Dziury", "Księżyc: Nasz kosmiczny sąsiad",
    "Wulkany: Ogniste góry", "Jak powstaje Diament?", "Trzęsienia Ziemi i Tsunami", "Gwiazdy i Gwiazdozbiory",
    "Komety: Kosmiczne podróżniczki", "Atmosfera: Tarcza ochronna Ziemi", "Zorza Polarna: Taniec świateł",
    "Historia Pizzy i Makaronu", "Jak powstaje papier?", "Sekrety Twojego Snu", "Dlaczego niebo jest niebieskie?",
    "Pismo obrazkowe: Od hieroglifów do Emoji", "Sztuka Kamuflażu", "Najszybsze pociągi świata",
    "Z czego zrobione jest szkło?", "Historia Gier Wideo", "Dziwne Smaki Świata"
];

    // Pamięć sesji dla tematów, aby nie losować tego samego pod rząd
    private static usedTopics: string[] = [];
    private static readonly PROXY_URL = '/api/chat';

    /**
     * Główna metoda pobierająca ciekawostkę.
     * Zdejmuje 1 talar i dodaje 1 talent przy sukcesie.
     */
    static async getEinsteinFact(): Promise<{ success: boolean; message: string }> {
        const settings = SaveManager.load();

        // 1. Walidacja środków
        if (settings.talary < 5) {
            return { success: false, message: "Potrzebujesz przynajmniej 5 talarów, aby mnie zainspirować! 💡" };
        }

        // 2. Wybór unikalnego tematu
        const topic = this.getUniqueTopic();

        try {
            // 3. Zapytanie do Gemini
            const fact = await this.fetchFromGemini(topic);

            // 4. Sukces - Aktualizacja stanu gry (Sync-First)
            await SaveManager.save({
                talary: settings.talary - 5,
                talenty: (settings.talenty || 0) + 1
            });

            return { success: true, message: fact };
        } catch (error) {
            console.error("AIManager Error:", error);
            return { 
                success: false, 
                message: "Mój genialny mózg potrzebuje przerwy. Spróbuj ponownie za chwilę! 🧠💤" 
            };
        }
    }

    /**
     * Losuje temat, dbając o to, by nie powtórzył się zbyt szybko
     */
    private static getUniqueTopic(): string {
        let available = this.TOPICS.filter(t => !this.usedTopics.includes(t));
        
        // Jeśli wszystkie tematy zostały zużyte, czyścimy pamięć
        if (available.length === 0) {
            this.usedTopics = [];
            available = [...this.TOPICS];
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        const selected = available[randomIndex];

        this.usedTopics.push(selected);
        if (this.usedTopics.length > 10) this.usedTopics.shift(); // Pamiętamy 10 ostatnich

        return selected;
    }

    /**
     * Komunikacja z API Gemini
     */
    private static async fetchFromGemini(topic: string): Promise<string> {
        const prompt = {
            contents: [{
                parts: [{
                    text: `Jesteś Albertem Einsteinem, radosnym mentorem w grze MatiMatyk. 
                    Podaj jedną fascynującą ciekawostkę na temat: ${topic}.
                    Zasady:
                    1. Język prosty, dla dziecka.
                    2. Max 2 krótkie zdania.
                    3. Użyj jednej pasującej emotki.
                    4. Nie zaczynaj od zwrotu "Czy wiesz, że".
                    5. Bądź konkretny, podaj fakt lub liczbę.`
                }]
            }],
            generationConfig: {
                temperature: 0.8, // Trochę kreatywności, by uniknąć identycznych zdań
                maxOutputTokens: 100,
            }
        };

        const response = await fetch(AIManager.PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });

        if (!response.ok) throw new Error("Gemini API Connection Error");

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }
}