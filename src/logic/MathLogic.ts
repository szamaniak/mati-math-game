// src/logic/MathLogic.ts

// do opracowania logika dostosowywania trudności pytań do postępów gracza;
// można bazować na szybkości odpowiedzi oraz błędach;

export type Operation = '+' | '-' | '*' | '÷';

export interface Question {
    questionText: string;
    fullEquation: string;
    solution: number;
    newA: number; // Dodajemy opcjonalne pole do przechowywania ostatniej wartości a
    newB: number; // Dodajemy opcjonalne pole do przechowywania ostatniej wartości b
}
export class MathLogic {
    static generateQuestion(operation: Operation, zakresA: number, zakresB: number, tryb: string, lastA: number = -1, lastB: number = -1): Question {
        //console.log(`Generowanie pytania. Tryb: ${tryb}, Ostatnie a: ${lastA}, Ostatnie b: ${lastB}`);
        if (tryb === 'start') {
            return this.generateLinear(operation, zakresA, zakresB, lastA, lastB);
        }
        return this.generateRandom(operation, zakresA, zakresB, lastB);
    }

    private static generateLinear(operation: Operation, zakresA: number, zakresB: number, lastA: number, lastB: number): Question {
        let a = lastA;
        let b = lastB;

        // Inicjalizacja przy pierwszym uruchomieniu (jeśli lastA i lastB to -1)
        if (a === -1) a = 2;
        if (b === -1) b = 0; // Zaczynamy od 0, by po dodaniu 1 wyszło 1

        // Logika przesunięcia: zwiększ b o 1
        b++;

        // Jeśli b przekroczy 10, zwiększ a i zresetuj b do 1
        if (b > zakresB) {
            b = 1;
            a++;
        }

        // Jeśli a przekroczy zakres, wróć do początku (pętla nauki)
        if (a > zakresA) {
            a = 2;
            b = 1;
        }

        return this.formatQuestion(operation, a, b);
    }

    private static generateRandom(operation: Operation, zakresA: number, zakresB: number, lastB: number): Question {
        let a = Phaser.Math.Between(2, zakresA);
        let b: number;
        do {
            b = Phaser.Math.Between(1, zakresB); // Zmienione na 1-10 dla pełnej tabliczki
        } while (b === lastB);

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