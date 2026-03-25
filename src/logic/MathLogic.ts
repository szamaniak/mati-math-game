// src/logic/MathLogic.ts

// do opracowania logika dostosowywania trudności pytań do postępów gracza;
// można bazować na szybkości odpowiedzi oraz błędach;

export type Operation = '+' | '-' | '*' | '÷' ; 

export interface Question {
    questionText: string;
    fullEquation: string;
    solution: number;
    newA: number; // Dodajemy opcjonalne pole do przechowywania ostatniej wartości a
    newB: number; // Dodajemy opcjonalne pole do przechowywania ostatniej wartości b
}
export class MathLogic {
    static generateQuestion(operation: Operation, zakresAmin: number, zakresA: number, zakresBmin: number, zakresB: number, tryb: string, lastA: number = -1, lastB: number = -1, fixedA: number = 0, fractions: boolean = false): Question {
        //console.log(`Generowanie pytania. Tryb: ${tryb}, Ostatnie a: ${lastA}, Ostatnie b: ${lastB}`);
        if (tryb === 'start') {
            return this.generateLinear(operation, zakresAmin, zakresA, zakresBmin, zakresB, lastA, lastB, fixedA);
        }
        return this.generateRandom(operation, zakresAmin, zakresA, zakresBmin, zakresB, lastB, fractions);
    }

    private static generateLinear(operation: Operation,  zakresAmin: number, zakresA: number, zakresBmin: number, zakresB: number, lastA: number, lastB: number, fixedA: number = 0): Question {
        let a = lastA;
        let b = lastB;
// 1. Obsługa trybu "Tylko jedna liczba"
    if (fixedA > 0) {
        a = fixedA; // Zawsze wymuszamy wybraną liczbę
        
        if (b === -1 || b >= zakresB) {
            b = 1; // Zaczynamy od początku sekwencji (np. 7 * 1)
        } else {
            b++; // Kolejny krok (7 * 2, 7 * 3...)
        }
    } 
    // 2. Obsługa trybu standardowego (Twoja dotychczasowa logika)
    else {
        if (a === -1) a = 2;
        if (b === -1) b = 0; // Poprawiłem na 0, żeby pierwszy krok b++ dał 1

        b++;

        if (b > zakresB) {
            b = zakresBmin;
            a++;
        }

        if (a > zakresA) {
            a = 2;
            b = zakresBmin;
        }
    }

    return this.formatQuestion(operation, a, b);
}

    static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomValue(min: number, max: number, useFractions: boolean): number {
        
        if (!useFractions) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            
            // Losujemy liczbę i zaokrąglamy do 1 miejsca po przecinku
            const val = Math.random() * (max - min) + min;
            return Math.round(val * 10) / 10;
        }
    }

    private static generateRandom(operation: Operation, zakresAmin: number, zakresA: number, zakresBmin: number, zakresB: number, lastB: number, fractions: boolean): Question {
        
        let a = this.getRandomValue(zakresAmin, zakresA, fractions);
        let b: number;
        if (lastB > 4 || zakresB <= 5) { // Jeśli ostatnie b było większe niż 4 lub zakres jest mały, pozwól na pełną losowość
        do {
            b = this.getRandomValue(zakresBmin, zakresB, fractions); 
        } while (b === lastB);
        } else {
            b = this.getRandomValue(5, zakresB, fractions); // Dla większej trudności, jeśli ostatnie b było małe, generuj większe b
        }

        return this.formatQuestion(operation, a, b);
    }

    // Wspólna funkcja do formatowania tekstu i obliczeń
    private static formatQuestion(operation: Operation, a: number, b: number): Question {
        let questionText = "";
        let solution = 0;
          
        // Pomocnicza funkcja do formatowania wyświetlania ujemnych w nawiasach
        const fmt = (num: number) => num < 0 ? `(${num})` : `${num}`;

        switch (operation) {
            case '+':
                solution = a + b;
                questionText = `${fmt(a)} + ${fmt(b)} = `;
                break;
            case '-':
                solution = a; 
                questionText = `${Math.round((a + b) * 10) / 10} - ${fmt(b)} = `;
                break;
            case '*':
                solution = a * b;
                questionText = `${fmt(a)} × ${fmt(b)} = `;
                break;
            case '÷':
                solution = a;
                questionText = `${Math.round((a * b) * 10) / 10} : ${fmt(b)} = `;
                break;
        }
        // FINALNY FIX PRECYZJI:
        // Zawsze zaokrąglamy rozwiązanie do 1 miejsca po przecinku przed wysłaniem
        solution = Math.round(solution * 10) / 10;

        return {
            questionText,
            solution,
            fullEquation: `${questionText}${solution}`,
            newA: a,
            newB: b
        };
    }
}