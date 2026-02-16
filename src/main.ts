import './style.css';
import Phaser from 'phaser';
import confetti from 'canvas-confetti';

type Operation = '+' | '-' | '*' | '÷';

class MathScene extends Phaser.Scene {
    // Stan gry
    private score: number = 0;
    private zakres: number = 10;
    private lastB: number = -1; // -1 na start, żeby przy pierwszym pytaniu nic nie blokowało
    private currentSolution: number = 0;
    private currentOperation: Operation = '+';
    private gratulacje: string[] = [
    "Genialnie! Jesteś nowym Einsteinem!",
    "Matematyka Cię kocha!",
    "Niesamowite obliczenia!",
    "Twoje IQ właśnie wzrosło!",
    "E=mc²... a Ty=Mistrz!",
    "Czysta logika! Brawo!",
    "Fantastycznie to policzyłeś!",
    "Twój mózg pracuje na wysokich obrotach!",
    "Zostań moim asystentem!",
    "Zadziwiająca precyzja!"
];

    // Obiekty UI
    private scoreText!: Phaser.GameObjects.Text;
    private phaserInputObject!: Phaser.GameObjects.DOMElement;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement;
    private einstein!: Phaser.GameObjects.Image;
    private einsteinSpeechBubble!: Phaser.GameObjects.Graphics;
    private einsteinSpeechText!: Phaser.GameObjects.Text;
    private menuContainer!: Phaser.GameObjects.Container;
    private gameContainer!: Phaser.GameObjects.Container;

    private getRandomCongrats(): string {
        const index = Phaser.Math.Between(0, this.gratulacje.length - 1);
        return this.gratulacje[index];
        }

    showEinsteinSpeech(message: string, duration: number = 3000) {
          this.einsteinSpeechText.setText(message);
          this.einsteinSpeechBubble.setVisible(true);
          this.einsteinSpeechText.setVisible(true);

          // Animacja pojawienia się dymku (opcjonalnie)
          this.tweens.add({
              targets: [this.einsteinSpeechBubble, this.einsteinSpeechText],
              alpha: { from: 0, to: 1 },
              duration: 200,
              ease: 'Power1'
          });

          // Ukryj dymek po określonym czasie
          this.time.delayedCall(duration, () => {
              this.tweens.add({
                  targets: [this.einsteinSpeechBubble, this.einsteinSpeechText],
                  alpha: { from: 1, to: 0 },
                  duration: 200,
                  ease: 'Power1',
                  onComplete: () => {
                      this.einsteinSpeechBubble.setVisible(false);
                      this.einsteinSpeechText.setVisible(false);
                  }
              });
          });
      }

    constructor() {
        super('MathScene');
    }

    preload() {
    this.load.image('einstein', 'assets/einstein.png');
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

        // animacje
        // Tworzymy kilka losowych symboli w tle
        const symbols = ['+', '-', '×', '÷', '=', '%'];
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const s = this.add.text(x, y, symbols[Phaser.Math.Between(0, symbols.length - 1)], {
                fontSize: '32px',
                color: '#ffffff',
            }).setAlpha(0.1); // Bardzo przezroczyste

            // Powolna animacja pływania
            this.tweens.add({
                targets: s,
                y: y - 50,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // 3. KONTENER GRY (domyślnie ukryty)
        this.gameContainer = this.add.container(0, 0);
        this.gameContainer.setVisible(false);
        this.setupGameUI();

        // Dodajemy postać w lewym dolnym rogu
        // 100, 500 to współrzędne (x, y). Możesz je skorygować.
        this.einstein = this.add.image(120, 480, 'einstein');
        this.einstein.setScale(0.2); // Zmniejszamy go, jeśli jest za duży
        this.einstein.setDepth(1); // Upewniamy się, że jest nad tłem
        
        // Dodajmy mu delikatną animację "oddychania" (pływania)
        // this.tweens.add({
        //   targets: this.einstein,
        //    y: 470,
        //    duration: 2000,
        //    yoyo: true,
        //    repeat: -1,
        //    ease: 'Sine.easeInOut'
        // });

        // Tworzymy grafikę dymku
        this.einsteinSpeechBubble = this.add.graphics({ fillStyle: { color: 0xffffff } });
        this.einsteinSpeechBubble.setDepth(101); // Nad Einsteinem i innymi elementami

        // Rysujemy zaokrąglony prostokąt (dymek)
        const bubbleWidth = 200;
        const bubbleHeight = 80;
        const bubbleX = this.einstein.x - 50;  // Obok Einsteina
        const bubbleY = this.einstein.y - 200; // Nad głową Einsteina
        const cornerRadius = 15;

        this.einsteinSpeechBubble.fillRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);

        // Mały "ogonek" dymku (trójkąt)
        const pointerX = bubbleX + 20;
        const pointerY = bubbleY + bubbleHeight;
        this.einsteinSpeechBubble.fillTriangle(pointerX, pointerY, pointerX + 20, pointerY + 20, pointerX + 40, pointerY);

        // Tworzymy tekst wewnątrz dymku
        this.einsteinSpeechText = this.add.text(bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2, 'Witaj, mistrzu!', {
            fontSize: '18px',
            color: '#000000',
            wordWrap: { width: bubbleWidth - 20 } // Ograniczamy szerokość tekstu, żeby zmieścił się w dymku
        }).setOrigin(0.5);
        this.einsteinSpeechText.setDepth(102); // Nad dymkiem

        // Na początku dymek jest niewidoczny
        this.einsteinSpeechBubble.setVisible(false);
        this.einsteinSpeechText.setVisible(false);

        // Zapamiętajmy go, żeby móc nim poruszać przy dobrej odpowiedzi
        // this.einstein = einstein;
    }

    createMenu() {
        const title = this.add.text(400, 100, 'MatiMatyk', { 
            fontSize: '50px', fontStyle: 'bold', color: '#f0adb4' 
        }).setOrigin(0.5);

        //const subTitle = this.add.text(400, 180, 'Wybierz działanie:', { fontSize: '24px' }).setOrigin(0.5);

        // Tworzymy przyciski używając naszej pomocniczej metody
        const btnAdd = this.createModeButton(400, 250, 'Dodawanie', '+');
        const btnSub = this.createModeButton(400, 330, 'Odejmowanie', '-');
        const btnMul = this.createModeButton(400, 410, 'Mnożenie', '*');
        const btnDiv = this.createModeButton(400, 490, 'Dzielenie', '÷');

        this.menuContainer.add([title, btnAdd, btnSub, btnMul, btnDiv]);
    }

    createModeButton(x: number, y: number, label: string, op: Operation) {
    // Kontener dla przycisku, żeby tekst i tło ruszały się razem
    const container = this.add.container(x, y);

    // Tło przycisku jako zaokrąglony prostokąt
    const bg = this.add.graphics();
    bg.fillStyle(0x3498db, 1);
    bg.fillRoundedRect(-150, -30, 300, 60, 15);
    bg.lineStyle(4, 0xffffff, 1);
    bg.strokeRoundedRect(-150, -30, 300, 60, 15);

    const txt = this.add.text(0, 0, label, {
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, txt]);

    // Interakcja
    const hitArea = new Phaser.Geom.Rectangle(-150, -30, 300, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
        this.tweens.add({
            targets: container,
            scale: 1.1,
            duration: 100,
            ease: 'Power1'
        });
        bg.clear();
        bg.fillStyle(0x2980b9, 1);
        bg.fillRoundedRect(-150, -30, 300, 60, 15);
        bg.lineStyle(4, 0xf1c40f, 1); // Złota obwódka przy najechaniu
        bg.strokeRoundedRect(-150, -30, 300, 60, 15);
    });

    container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
        bg.clear();
        bg.fillStyle(0x3498db, 1);
        bg.fillRoundedRect(-150, -30, 300, 60, 15);
        bg.lineStyle(4, 0xffffff, 1);
        bg.strokeRoundedRect(-150, -30, 300, 60, 15);
    });

    container.on('pointerdown', () => {
        this.currentOperation = op;
        this.startGame();
    });

    return container;
}

    setupGameUI() {
        
        this.scoreText = this.add.text(20, 20, 'Punkty: 0', { fontSize: '32px' });
        
       this.problemText = this.add.text(400, 200, '', { 
            fontSize: '110px', 
            fontStyle: 'bold', 
            color: '#ffffff',
            shadow: { blur: 10, color: '#000000', fill: true, offsetX: 5, offsetY: 5 }
        }).setOrigin(0.5);

        // Input HTML
        const inputElement = document.createElement('input');
        inputElement.type = 'number';

        const phaserInput = this.add.dom(400, 350, inputElement);
        phaserInput.setVisible(false);

        this.htmlInput = inputElement; 
        this.phaserInputObject = phaserInput; // Musisz dodać tę zmienną do klasy na górze!

        Object.assign(inputElement.style, {
            fontSize: '40px',
            padding: '10px',
            width: '180px',
            textAlign: 'center',
            borderRadius: '20px',
            border: '5px solid #3498db',
            backgroundColor: '#ecf0f1',
            boxShadow: '0px 10px 0px #2980b9', // Efekt 3D
            color: '#2c3e50',
            outline: 'none'
        });

        this.htmlInput = inputElement;
        this.htmlInput.style.display = 'none'; // Ukrywamy do momentu startu gry

        // Przycisk powrotu do menu
        const backContainer = this.add.container(720, 40); // Pozycja w prawym górnym rogu

        const backBg = this.add.graphics();
        backBg.fillStyle(0xe74c3c, 1); // Czerwony kolor "wyjścia"
        backBg.fillRoundedRect(-60, -20, 120, 40, 10);
        backBg.lineStyle(2, 0xffffff, 1);
        backBg.strokeRoundedRect(-60, -20, 120, 40, 10);

        const backTxt = this.add.text(0, 0, 'POWRÓT', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        backContainer.add([backBg, backTxt]);

        // Interakcja dla kontenera powrotu
        const backHitArea = new Phaser.Geom.Rectangle(-60, -20, 120, 40);
        backContainer.setInteractive(backHitArea, Phaser.Geom.Rectangle.Contains);
        backContainer.input!.cursor = 'pointer';

        backContainer.on('pointerover', () => {
            this.tweens.add({ targets: backContainer, scale: 1.1, duration: 100 });
            backBg.clear();
            backBg.fillStyle(0xc0392b, 1); // Ciemniejszy czerwony
            backBg.fillRoundedRect(-60, -20, 120, 40, 10);
            backBg.lineStyle(2, 0xffffff, 1);
            backBg.strokeRoundedRect(-60, -20, 120, 40, 10);
        });

        backContainer.on('pointerout', () => {
            this.tweens.add({ targets: backContainer, scale: 1.0, duration: 100 });
            backBg.clear();
            backBg.fillStyle(0xe74c3c, 1);
            backBg.fillRoundedRect(-60, -20, 120, 40, 10);
            backBg.lineStyle(2, 0xffffff, 1);
            backBg.strokeRoundedRect(-60, -20, 120, 40, 10);
        });

        backContainer.on('pointerdown', () => {
            // Delikatny efekt kliknięcia przed przeładowaniem
            this.tweens.add({
                targets: backContainer,
                scale: 0.9,
                duration: 50,
                onComplete: () => window.location.reload()
            });
        });

        // Nie zapomnij dodać go do gameContainer!
        this.gameContainer.add(backContainer);
        
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

        this.showEinsteinSpeech("Powodzenia, geniuszu!", 2500); // Wyświetl na 2.5 sekundy
    }

    nextQuestion() {
        let a = Phaser.Math.Between(2, this.zakres);
        let b: number;
          do {
              b = Phaser.Math.Between(2, 10);
          } while (b === this.lastB); // Losuj ponownie, jeśli b jest takie samo jak ostatnio
          
          // Zapamiętujemy obecne b dla następnego pytania
          this.lastB = b;

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
            // const b = Phaser.Math.Between(2, 10); // Dzielnik
            const result = Phaser.Math.Between(2, this.zakres); // To będzie nasz wynik
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
                // Radosny podskok przy dobrej odpowiedzi
                this.tweens.add({
                    targets: this.einstein,
                    scale: 0.22, // lekko się powiększa (z 0.2 na 0.22)
                    y: 450,      // leci w górę
                    duration: 100,
                    yoyo: true,
                    ease: 'Quad.out'
                });
                if (this.score % 5 === 0) {
                    // Wielkie świętowanie co 5 punktów!
                    const tekst = this.getRandomCongrats();
                    this.showEinsteinSpeech(tekst, 4000);
                    confetti({ particleCount: 200, spread: 100 });
                    this.tweens.add({
                          targets: this.einstein,
                          angle: 360,
                          duration: 500,
                          ease: 'Cubic.easeOut'
                      });
                } else {
                    // Mały efekt "błysku" napisu z punktami dla każdego punktu
                    this.tweens.add({
                        targets: this.scoreText,
                        scale: 1.2,
                        duration: 100,
                        yoyo: true,
                        ease: 'Back.out'
                    });
                    this.showEinsteinSpeech("Ok! I hop!", 2000); 
                }
                this.nextQuestion();
            } else {
                this.score--;
                this.scoreText.setText(`Punkty: ${this.score}`);
                this.cameras.main.shake(200, 0.005);
                this.showEinsteinSpeech("Rozumiem, że to żart?", 2000); 
            }
        }
        this.htmlInput.value = '';
        this.focusInput();
    }

    focusInput() {
    this.time.delayedCall(50, () => {
        if (this.htmlInput) {
            this.htmlInput.focus();
            // Opcjonalnie: czyścimy pole, jeśli coś w nim zostało
            this.htmlInput.value = ''; 
        }
    });
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