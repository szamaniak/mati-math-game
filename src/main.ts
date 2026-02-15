import './style.css';
import Phaser from 'phaser';
import confetti from 'canvas-confetti';

// Główna scena gry
class MathScene extends Phaser.Scene {
    private score: number = 0;
    private currentSolution: number = 0;
    
    // Referencje do obiektów (używamy ! bo inicjalizujemy je w create)
    private scoreText!: Phaser.GameObjects.Text;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement;

    constructor() {
        super('MathScene');
    }

    preload() {
        // Tutaj moglibyśmy ładować zewnętrzne assety, np.:
        // this.load.image('background', 'assets/bg.png');
    }

    create() {
        // 1. Tło i UI
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        
        this.scoreText = this.add.text(20, 20, 'Punkty: 0', { 
            fontSize: '32px', 
            color: '#ffffff' 
        });

        this.problemText = this.add.text(400, 200, '', { 
            fontSize: '100px', 
            color: '#f0adb4', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 2. Tworzenie pola INPUT za pomocą DOM
        // Tworzymy element HTML bezpośrednio w kodzie, aby nie musieć edytować index.html
        const inputElement = document.createElement('input');
        inputElement.type = 'number';
        inputElement.id = 'math-input';
        // Stylizujemy go przez właściwość style (można też w style.css)
        Object.assign(inputElement.style, {
            fontSize: '40px',
            padding: '10px',
            width: '150px',
            textAlign: 'center',
            borderRadius: '10px',
            border: '4px solid #f0adb4',
            outline: 'none'
        });

        // Dodajemy element do kontenera Phasera
        this.add.dom(400, 350, inputElement);        this.htmlInput = inputElement;

        // 3. Obsługa klawiszy
        this.input.keyboard?.on('keydown-ENTER', () => this.checkAnswer());

        // 4. Start pierwszej rundy
        this.nextQuestion();
        this.focusInput();
    }

    nextQuestion() {
        const a = Phaser.Math.Between(1, 10);
        const b = Phaser.Math.Between(1, 10);
        this.currentSolution = a + b;
        this.problemText.setText(`${a} + ${b} = `);

        // Animacja pojawienia się pytania
        this.tweens.add({
            targets: this.problemText,
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    checkAnswer() {
        const userValue = parseInt(this.htmlInput.value);

        if (!isNaN(userValue)) {
            if (userValue === this.currentSolution) {
                this.handleWin();
            } else {
                this.handleLose();
            }
        }

        // Czyścimy pole i wracamy kursorem niezależnie od wyniku
        this.htmlInput.value = '';
        this.focusInput();
    }

    handleWin() {
        this.score += 1;
        this.scoreText.setText(`Punkty: ${this.score}`);
        
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        this.nextQuestion();
    }

    handleLose() {
        this.score = Math.max(0, this.score - 1);
        this.scoreText.setText(`Punkty: ${this.score}`);
        
        // Wizualny feedback błędu - potrząsanie napisem
        this.tweens.add({
            targets: this.problemText,
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 3
        });
        
        this.cameras.main.shake(200, 0.005);
    }

    focusInput() {
        // Krótkie opóźnienie zapewnia, że kursor zawsze wskoczy na miejsce
        this.time.delayedCall(10, () => {
            this.htmlInput.focus();
        });
    }
}

// Konfiguracja silnika
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    dom: {
        createContainer: true // To pozwala na renderowanie HTML nad Canvasem
    },
    scene: MathScene,
    physics: {
        default: 'arcade'
    }
};

new Phaser.Game(config);