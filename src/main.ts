import './style.css';
import Phaser from 'phaser';
import confetti from 'canvas-confetti';

type Operation = '+' | '-' | '*' | '÷';

class MathScene extends Phaser.Scene {
    // Stan gry
    private score: number = 0;
    private zakres: number = 10;
    private currentSolution: number = 0;
    private currentOperation: Operation = '+';

    // Obiekty UI
    private scoreText!: Phaser.GameObjects.Text;
    private phaserInputObject!: Phaser.GameObjects.DOMElement;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement;
    private menuContainer!: Phaser.GameObjects.Container;
    private gameContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('MathScene');
    }

    create() {
        
        // console.log("GRA URUCHOMIONA - WERSJA 0.0.2");
        console.log("MatiMatyk");
        const savedZakres = localStorage.getItem('mati_zakres'); // Pobieramy z pamięci przeglądarki wartość pod kluczem 'mati_zakres'
          if (savedZakres) {
              this.zakres = parseInt(savedZakres); // Jeśli istnieje, ustawiamy naszą zmienną 'zakres' na tę wartość
          }

        // Tło dla całej sceny
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 1. KONTENER MENU
        this.menuContainer = this.add.container(0, 0);
        this.createMenu();

        // 2. Tworzymy kontener na ustawienia (w prawym dolnym rogu)
        const settingsText = this.add.text(600, 550, 'Maks. liczba:', { fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0.5);

        const rangeInput = document.createElement('input');
        rangeInput.type = 'number';
        rangeInput.value = this.zakres.toString(); // Ustawiamy początkową wartość inputa na aktualny zakres
        Object.assign(rangeInput.style, {
            width: '50px',
            fontSize: '20px',
            padding: '5px',
            textAlign: 'center',
            borderRadius: '5px',
            border: '2px solid #f0adb4'
        });

        // Dodajemy input do Phasera
        const phaserRangeInput = this.add.dom(650, 550, rangeInput);

        // Słuchamy zmian w polu - każda zmiana w inpucie aktualizuje naszą zmienną
        rangeInput.addEventListener('input', () => {
            const val = parseInt(rangeInput.value);
            if (!isNaN(val) && val > 0) {
                this.zakres = val;
                // Zapisujemy w pamięci przeglądarki pod kluczem 'mati_zakres'
                localStorage.setItem('mati_zakres', val.toString());
            }
        });

        // Dodajemy napisy i input do menuContainer, żeby zniknęły po kliknięciu "Start"
        this.menuContainer.add([settingsText, phaserRangeInput]);

        // 3. KONTENER GRY (domyślnie ukryty)
        this.gameContainer = this.add.container(0, 0);
        this.gameContainer.setVisible(false);
        this.setupGameUI();
    }

    createMenu() {
        const title = this.add.text(400, 100, 'MatiMatyk', { 
            fontSize: '50px', fontStyle: 'bold', color: '#f0adb4' 
        }).setOrigin(0.5);

        const subTitle = this.add.text(400, 180, 'Wybierz działanie:', { fontSize: '24px' }).setOrigin(0.5);

        // Tworzymy przyciski używając naszej pomocniczej metody
        const btnAdd = this.createModeButton(400, 250, 'Dodawanie', '+');
        const btnSub = this.createModeButton(400, 330, 'Odejmowanie', '-');
        const btnMul = this.createModeButton(400, 410, 'Mnożenie', '*');
        const btnDiv = this.createModeButton(400, 490, 'Dzielenie', '÷');

        this.menuContainer.add([title, subTitle, btnAdd, btnSub, btnMul, btnDiv]);
    }

    createModeButton(x: number, y: number, label: string, op: Operation) {
        const btn = this.add.text(x, y, label, {
            fontSize: '32px',
            backgroundColor: '#34495e',
            padding: { x: 20, y: 10 },
            fixedWidth: 300,
            align: 'center'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#5d6d7e' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#34495e' }));
        
        btn.on('pointerdown', () => {
            this.currentOperation = op;
            this.startGame();
        });

        return btn;
    }

    setupGameUI() {
        
        this.scoreText = this.add.text(20, 20, 'Punkty: 0', { fontSize: '32px' });
        
        this.problemText = this.add.text(400, 200, '', { 
            fontSize: '100px', fontStyle: 'bold', color: '#f0adb4' 
        }).setOrigin(0.5);

        // Input HTML
        const inputElement = document.createElement('input');
        inputElement.type = 'number';

        const phaserInput = this.add.dom(400, 350, inputElement);
        phaserInput.setVisible(false);

        this.htmlInput = inputElement; 
        this.phaserInputObject = phaserInput; // Musisz dodać tę zmienną do klasy na górze!

        Object.assign(inputElement.style, {
            fontSize: '40px', padding: '10px', width: '150px', textAlign: 'center',
            borderRadius: '10px', border: '4px solid #f0adb4', outline: 'none'
        });

        this.htmlInput = inputElement;
        this.htmlInput.style.display = 'none'; // Ukrywamy do momentu startu gry

        // Przycisk powrotu do menu
        const backBtn = this.add.text(780, 20, 'Powrót', { fontSize: '20px', backgroundColor: '#e74c3c', padding: {x:10, y:5} })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => window.location.reload()); // Najprostszy restart

        this.gameContainer.add([this.scoreText, this.problemText, backBtn]);
        
        this.input.keyboard?.on('keydown-ENTER', () => this.checkAnswer());
    }

    startGame() {
        this.menuContainer.setVisible(false);
        this.gameContainer.setVisible(true);
        this.phaserInputObject.setVisible(true);

        this.score = 0;
        this.scoreText.setText('Punkty: 0');
        this.nextQuestion();
        this.focusInput();
    }

    nextQuestion() {
        let a = Phaser.Math.Between(1, this.zakres);
        let b = Phaser.Math.Between(1, this.zakres);

        if (this.currentOperation === '+') {
            this.currentSolution = a + b;
            this.problemText.setText(`${a} + ${b} = `);
        } else if (this.currentOperation === '-') {
            // Zabezpieczenie przed ujemnymi: większa liczba zawsze pierwsza
            const max = Math.max(a, b);
            const min = Math.min(a, b);
            this.currentSolution = max - min;
            this.problemText.setText(`${max} - ${min} = `);
        } else if (this.currentOperation === '*') {
            this.currentSolution = a * b;
            this.problemText.setText(`${a} × ${b} = `);
        }
         else if (this.currentOperation === '÷') {
            const b = Phaser.Math.Between(1, this.zakres); // Dzielnik
            const result = Phaser.Math.Between(1, this.zakres); // To będzie nasz wynik
            const a = b * result; // To będzie liczba, którą dzielimy

            this.currentSolution = result;
            this.problemText.setText(`${a} : ${b} = `);
        }

        this.tweens.add({
            targets: this.problemText,
            scale: { from: 0.8, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    checkAnswer() {
        const val = parseInt(this.htmlInput.value);
        if (!isNaN(val)) {
            if (val === this.currentSolution) {
                this.score++;
                this.scoreText.setText(`Punkty: ${this.score}`);
                if (this.score % 5 === 0) {
                    // Wielkie świętowanie co 5 punktów!
                    confetti({ particleCount: 200, spread: 100 });
                } else {
                    // Mały efekt "błysku" napisu z punktami dla każdego punktu
                    this.tweens.add({
                        targets: this.scoreText,
                        scale: 1.2,
                        duration: 100,
                        yoyo: true,
                        ease: 'Quad.easeInOut'
                    });
                }
                this.nextQuestion();
            } else {
                this.score--;
                this.scoreText.setText(`Punkty: ${this.score}`);
                this.cameras.main.shake(200, 0.005);
            }
        }
        this.htmlInput.value = '';
        this.focusInput();
    }

    focusInput() {
        this.time.delayedCall(10, () => this.htmlInput.focus());
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'app',
    dom: { createContainer: true },
    scene: MathScene
};

new Phaser.Game(config);