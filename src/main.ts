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
    "Zadziwiająca precyzja!",
    "O cholerka, chyba jesteś geniuszem!",
    "Twoje umiejętności są kosmiczne!",
    "Matematyka to Twoja supermoc!",
    "Jesteś jak kalkulator, ale lepszy!",
    "Twoje odpowiedzi są obłędne!",
    "Niesamowity wynik! Jesteś mistrzem liczb!",
    "Twoja matematyczna intuicja jest niesamowita!",
    "Cholibka, jesteś matematycznym ninja!"
    ];

    // Obiekty UI
    private tryb: string = 'nauka'; // domyślny tryb
    private dropdownContainer!: Phaser.GameObjects.Container;
    private isDropdownOpen: boolean = false;
    private scoreText!: Phaser.GameObjects.Text;
    private phaserInputObject!: Phaser.GameObjects.DOMElement;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement; // To będzie sam "środek" (input)    
    private einstein!: Phaser.GameObjects.Image;
    private einsteinSpeechBubble!: Phaser.GameObjects.Graphics;
    private einsteinSpeechText!: Phaser.GameObjects.Text;
    private speechEvent?: Phaser.Time.TimerEvent;
    private menuContainer!: Phaser.GameObjects.Container;
    private gameContainer!: Phaser.GameObjects.Container;

    private getRandomCongrats(): string {
        const index = Phaser.Math.Between(0, this.gratulacje.length - 1);
        return this.gratulacje[index];
        }

   showEinsteinSpeech(message: string, duration: number = 3000) {
    // 1. Jeśli zegar już tyka, zatrzymaj go
          if (this.speechEvent) {
              this.speechEvent.remove();
          }

          // 2. Zatrzymaj trwające animacje dymku (żeby nie zniknął w trakcie alpha transition)
          this.tweens.killTweensOf([this.einsteinSpeechBubble, this.einsteinSpeechText]);

          // 3. Ustaw tekst i widoczność
          this.einsteinSpeechText.setText(message);
          this.einsteinSpeechBubble.setVisible(true);
          this.einsteinSpeechText.setVisible(true);
          this.einsteinSpeechBubble.setAlpha(1);
          this.einsteinSpeechText.setAlpha(1);

          // 4. Stwórz nowe odliczanie i przypisz do zmiennej
          this.speechEvent = this.time.delayedCall(duration, () => {
              this.tweens.add({
                  targets: [this.einsteinSpeechBubble, this.einsteinSpeechText],
                  alpha: 0,
                  duration: 300,
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
        const phaserRangeInput = this.add.dom(650, 550, rangeInput); // Dodajemy input do Phasera        
        rangeInput.addEventListener('input', () => { // Słuchamy zmian w polu - każda zmiana w inpucie aktualizuje naszą zmienną
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
            this.tweens.add({ // Powolna animacja pływania            
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
        // Tworzymy grafikę dymku
        this.einsteinSpeechBubble = this.add.graphics({ fillStyle: { color: 0xffffff } });
        this.einsteinSpeechBubble.setDepth(101); // Nad Einsteinem i innymi elementami        
        const bubbleWidth = 200; // Rysujemy zaokrąglony prostokąt (dymek)
        const bubbleHeight = 80;
        const bubbleX = this.einstein.x - 50;  // Obok Einsteina
        const bubbleY = this.einstein.y - 200; // Nad głową Einsteina
        const cornerRadius = 15; // Zaokrąglenie rogów dymku
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
        
        this.setupModeDropdown();
    
    }

    setupModeDropdown() {
    const x = 720; // Pozycja X (prawy górny róg)
    const y = 40;
    const width = 140;
    const height = 40;

    this.dropdownContainer = this.add.container(x, y);

    // 1. Przycisk główny (pokazujący aktualny tryb)
    const mainBg = this.add.graphics();
    this.drawRoundedRect(mainBg, width, height, 0x2ecc71); // Zielony kolor
    
    const mainText = this.add.text(0, 0, `Tryb: ${this.tryb.toUpperCase()}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    this.dropdownContainer.add([mainBg, mainText]);

    // 2. Grupa opcji (na początku ukryta)
    const optionsGroup = this.add.container(0, height + 5);
    optionsGroup.setVisible(false);

    const tryby = ['nauka', 'praktyka', 'ekspert'];
    
    tryby.forEach((opcja, index) => {
        const optContainer = this.add.container(0, index * (height + 2));
        const optBg = this.add.graphics();
        this.drawRoundedRect(optBg, width, height, 0x34495e);
        
        const optText = this.add.text(0, 0, opcja.toUpperCase(), {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        optContainer.add([optBg, optText]);
        
        // Interakcja z opcją
        optContainer.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
        optContainer.on('pointerover', () => optBg.setAlpha(0.8));
        optContainer.on('pointerout', () => optBg.setAlpha(1));
        optContainer.on('pointerdown', () => {
            this.tryb = opcja;
            mainText.setText(`Tryb: ${opcja.toUpperCase()}`);
            optionsGroup.setVisible(false);
            this.isDropdownOpen = false;
            this.showEinsteinSpeech(`Wybrałeś tryb ${opcja}!`, 2000);
        });

        optionsGroup.add(optContainer);
    });

    this.dropdownContainer.add(optionsGroup);

    // 3. Interakcja z głównym przyciskiem
    mainBg.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
    mainBg.on('pointerdown', () => {
        this.isDropdownOpen = !this.isDropdownOpen;
        optionsGroup.setVisible(this.isDropdownOpen);
    });
}

// Funkcja pomocnicza do rysowania zaokrąglonych prostokątów dla przycisków
drawRoundedRect(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w/2, -h/2, w, h, 10);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRoundedRect(-w/2, -h/2, w, h, 10);
}

    createMenu() {
        const title = this.add.text(400, 100, 'MatiMatyk', { 
            fontSize: '50px', fontStyle: 'bold', color: '#f0adb4' 
        }).setOrigin(0.5);

        //const subTitle = this.add.text(400, 180, 'Wybierz działanie:', { fontSize: '24px' }).setOrigin(0.5);

        // Tworzymy przyciski używając naszej pomocniczej metody
        const btnAdd = this.createModeButton(520, 200, 'Dodawanie', '+');
        const btnSub = this.createModeButton(520, 280, 'Odejmowanie', '-');
        const btnMul = this.createModeButton(520, 360, 'Mnożenie', '*');
        const btnDiv = this.createModeButton(520, 440, 'Dzielenie', '÷');

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

    // 1. Tworzymy czysty element HTML
    const inputElement = document.createElement('input');
    inputElement.type = 'number';

    // 2. Nakładamy Twoje style 3D
    Object.assign(inputElement.style, {
        fontSize: '40px',
        padding: '10px',
        width: '180px',
        textAlign: 'center',
        borderRadius: '20px',
        border: '5px solid #3498db',
        backgroundColor: '#ecf0f1',
        boxShadow: '0px 10px 0px #2980b9',
        color: '#2c3e50',
        outline: 'none',
        display: 'none' // Ukryty na start
    });

    // 3. Wrzucamy go do Phasera i przypisujemy do obu zmiennych
    this.phaserInputObject = this.add.dom(400, 350, inputElement);
    this.htmlInput = inputElement; // Teraz this.htmlInput to bezpośrednio INPUT
    this.htmlInput.style.display = 'none'; // Ukrywamy do momentu startu gry
    this.phaserInputObject.setVisible(false); // Ukrywamy cały DOMElement do momentu startu gry


    // 4. Przycisk POWRÓT (Pozostaje bez zmian, jest OK)
    const backContainer = this.add.container(720, 40);
    const backBg = this.add.graphics();
    backBg.fillStyle(0xe74c3c, 1);
    backBg.fillRoundedRect(-60, -20, 120, 40, 10);
    backBg.lineStyle(2, 0xffffff, 1);
    backBg.strokeRoundedRect(-60, -20, 120, 40, 10);

    const backTxt = this.add.text(0, 0, 'POWRÓT', {
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff'
    }).setOrigin(0.5);

    backContainer.add([backBg, backTxt]);
    backContainer.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    backContainer.input!.cursor = 'pointer';

    // Interakcje przycisku (Over/Out/Down)
    backContainer.on('pointerover', () => {
        this.tweens.add({ targets: backContainer, scale: 1.1, duration: 100 });
        backBg.clear().fillStyle(0xc0392b, 1).fillRoundedRect(-60, -20, 120, 40, 10).lineStyle(2, 0xffffff, 1).strokeRoundedRect(-60, -20, 120, 40, 10);
    });

    backContainer.on('pointerout', () => {
        this.tweens.add({ targets: backContainer, scale: 1.0, duration: 100 });
        backBg.clear().fillStyle(0xe74c3c, 1).fillRoundedRect(-60, -20, 120, 40, 10).lineStyle(2, 0xffffff, 1).strokeRoundedRect(-60, -20, 120, 40, 10);
    });

    backContainer.on('pointerdown', () => {
        this.tweens.add({ targets: backContainer, scale: 0.9, duration: 50, onComplete: () => window.location.reload() });
    });

    this.gameContainer.add(backContainer);
    this.input.keyboard?.on('keydown-ENTER', () => this.checkAnswer());
}

    startGame() {
        this.menuContainer.setVisible(false);
        this.dropdownContainer.setVisible(false);
        this.gameContainer.setVisible(true);
        this.phaserInputObject.setVisible(true);

        this.score = 0;
        this.scoreText.setText('Punkty: 0');        
        this.focusInput();

        if (this.tryb === 'nauka') {
          // W nauce najpierw się witamy, a dopiero potem (po 2s) dajemy pierwsze zadanie
          this.showEinsteinSpeech("Witaj! Zaraz pokażę Ci wynik, spróbuj go zapamiętać!", 2500);
          this.time.delayedCall(2600, () => {
              this.nextQuestion();
          });
          } else {
              // W pozostałych trybach lecimy od razu
              this.showEinsteinSpeech("Powodzenia, geniuszu!", 2000);
              this.nextQuestion();
          }
    }

    nextQuestion() {
    let a = Phaser.Math.Between(2, this.zakres);
    let b: number;
    do {
        b = Phaser.Math.Between(2, 10);
    } while (b === this.lastB);
    
    this.lastB = b;
    let questionText = "";
    let fullEquation = ""; // Pełne równanie z wynikiem

    // Logika obliczeń (wspólna dla wszystkich trybów)
    if (this.currentOperation === '+') {
        this.currentSolution = a + b;
        questionText = `${a} + ${b} = `;
    } else if (this.currentOperation === '-') {
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        this.currentSolution = max - min;
        questionText = `${max} - ${min} = `;
    } else if (this.currentOperation === '*') {
        this.currentSolution = a * b;
        questionText = `${a} × ${b} = `;
    } else if (this.currentOperation === '÷') {
        const result = Phaser.Math.Between(2, this.zakres);
        const dividend = b * result;
        this.currentSolution = result;
        questionText = `${dividend} : ${b} = `;
    }

    fullEquation = `${questionText}${this.currentSolution}`;

    // --- LOGIKA TRYBÓW ---

    if (this.tryb === 'nauka') {
        // 1. Pobieramy referencję do pola tekstowego (inputu)
       
        
        // 2. Blokujemy wpisywanie na samym początku
        this.htmlInput.disabled = true;
        this.htmlInput.value = ""; // Czyścimy pole, żeby nic tam nie było
        this.showEinsteinSpeech(`Zapamiętaj to!`, 1500);          
        this.problemText.setText(fullEquation); // Pokazujemy od razu pełne równanie z wynikiem
        // Po 2 sekundach pokazujemy samo pytanie
        this.time.delayedCall(3000, () => {
            this.problemText.setText('Uwaga!');
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });

        this.time.delayedCall(6000, () => {
            this.problemText.setText(questionText);
            this.htmlInput.disabled = false;
            this.htmlInput.focus(); // Automatycznie ustawiamy kursor w polu, żeby Mati mógł pisać
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    } else {
        // Tryb PRAKTYKA i EKSPERT: Pokazujemy od razu pytanie
        this.problemText.setText(questionText);
        this.tweens.add({
            targets: this.problemText,
            scale: { from: 0.8, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }
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
                if (this.tryb === 'praktyka') {
                    // Pobieramy aktualny tekst z ekranu (np. "5 + 2 = ") i dodajemy wynik
                    const fullText = this.problemText.text + this.currentSolution;
                    this.showEinsteinSpeech(`Świetnie! ${fullText}`, 3000);
                }
                if (this.score % 15 === 0) {
                    // Wielkie świętowanie co 15 punktów!
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
                    this.showEinsteinSpeech("Ok! I hop!", 1000); 
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