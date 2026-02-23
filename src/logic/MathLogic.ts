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
    static generateQuestion(operation: Operation, zakresA: number, zakresB: number, tryb: string, lastA: number = -1, lastB: number = -1, fixedA: number = 0): Question {
        //console.log(`Generowanie pytania. Tryb: ${tryb}, Ostatnie a: ${lastA}, Ostatnie b: ${lastB}`);
        if (tryb === 'start') {
            return this.generateLinear(operation, zakresA, zakresB, lastA, lastB, fixedA);
        }
        return this.generateRandom(operation, zakresA, zakresB, lastB);
    }

    private static generateLinear(operation: Operation, zakresA: number, zakresB: number, lastA: number, lastB: number, fixedA: number = 0): Question {
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
            b = 1;
            a++;
        }

        if (a > zakresA) {
            a = 2;
            b = 1;
        }
    }

    return this.formatQuestion(operation, a, b);
}

    static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private static generateRandom(operation: Operation, zakresA: number, zakresB: number, lastB: number): Question {
        let a = this.getRandomInt(2, zakresA);
        let b: number;
        if (lastB > 4 || zakresB <= 5) { // Jeśli ostatnie b było większe niż 4 lub zakres jest mały, pozwól na pełną losowość
        do {
            b = this.getRandomInt(1, zakresB); 
        } while (b === lastB);
        } else {
            b = this.getRandomInt(5, zakresB); // Dla większej trudności, jeśli ostatnie b było małe, generuj większe b
        }

        return this.formatQuestion(operation, a, b);
    }

    // Wspólna funkcja do formatowania tekstu i obliczeń
    private static formatQuestion(operation: Operation, a: number, b: number): Question {
        let questionText = "";
        let solution = 0;
                

        switch (operation) {
            case '+':
                solution = a + b;
                questionText = `${a} + ${b} = `;
                break;
            case '-':
                solution = a + b - b; // a to wynik odejmowania dla uproszczenia
                questionText = `${a + b} - ${b} = `;
                solution = a; 
                break;
            case '*':
                solution = a * b;
                questionText = `${a} × ${b} = `;
                break;
            case '÷':
                solution = a;
                questionText = `${a * b} : ${b} = `;
                break;
        }

        return {
            questionText,
            solution,
            fullEquation: `${questionText}${solution}`,
            newA: a,
            newB: b
        };
    }
}