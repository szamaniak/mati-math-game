import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { MathLogic } from '../logic/MathLogic';
import { Einstein } from '../components/Einstein';
import { GameButton } from '../components/GameButton';
import { SaveManager } from '../logic/SaveManager';

type Operation = '+' | '-' | '*' | '÷';

export class MathScene extends Phaser.Scene { 
// Stan gry
    private currentUser: string = 'Mati';
    private startTime: number = 0;  
    private score: number = 0;
    private talary: number = 0;
    private zakresA: number = 10;
    private zakresB: number = 10;
    private lastB: number = -1; // -1 na start, żeby przy pierwszym pytaniu nic nie blokowało
    private lastA: number = -1; // Dodajemy też lastA, żeby mieć pełną kontrolę nad generowanymi pytaniami
    private maxReward: number = 5; // Maksymalna liczba punktów do zdobycia za jedno pytanie
    private currentSolution: number = 0;
    private currentOperation: Operation = '+';
    private mixedOperations: boolean = false; // Flaga do trybu mieszanego, gdzie operator jest losowy przy każdym pytaniu
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
    private bledneOdpowiedzi: string[] = [
    "Ups, spróbuj jeszcze raz!",
    "Nie tym razem, ale się nie poddawaj!",
    "Prawie, ale nie do końca. Jeszcze raz!",
    "Nie martw się, każdy popełnia błędy. Spróbuj ponownie!",
    "Nie tym razem, ale jesteś blisko! Jeszcze raz!",
    "Nie zniechęcaj się, spróbuj ponownie!",
    "No no, długo mam czekać?",
    "Zaraz zasnę czekając na poprawną odpowiedź!",
    "No nie wierzę!",
    "Ty tak serio?",
    "Chyba muszę Cię nauczyć, jak to się robi...",
    "Ale to był żart, tak?",
    "Może spróbujemy 1+1?"

    ];

    // Obiekty UI
    private tryb: string = 'praktyka'; // domyślny tryb
    private hintMode: boolean = false;
    private dropdownContainer!: Phaser.GameObjects.Container;
    private isDropdownOpen: boolean = false;
    private scoreText!: Phaser.GameObjects.Text;
    private punktyText!: Phaser.GameObjects.Text;
    private questionTimer!: Phaser.Time.TimerEvent;
    private phaserInputObject!: Phaser.GameObjects.DOMElement;
    private backButton!: GameButton;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement; // To będzie sam "środek" (input)    
    private einstein!: Einstein;    
    private menuContainer!: Phaser.GameObjects.Container;
    private gameContainer!: Phaser.GameObjects.Container;

    private updateTimerDisplay(remaining: number) {
    this.punktyText.setText(`Rozgrywka: ${this.score} (+ ${remaining}) / 25`);
    }

    private getRandomCongrats(): string {
        const index = Phaser.Math.Between(0, this.gratulacje.length - 1);
        return this.gratulacje[index];
        }
    private getRandomBledne(): string {
        const index = Phaser.Math.Between(0, this.bledneOdpowiedzi.length - 1);
        return this.bledneOdpowiedzi[index];
        }
    private displayMessage(msg: string) {
    // Jeśli tekst jest dłuższy niż np. 10 znaków, zmniejszamy czcionkę i włączamy zawijanie
    if (msg.length > 10) {
        this.problemText.setFontSize('42px');
        this.problemText.setWordWrapWidth(600); // Żeby tekst nie wychodził poza boki
        } else {
            this.problemText.setFontSize('110px');
            this.problemText.setWordWrapWidth(0); // Wyłączamy zawijanie dla działań matematycznych
        }

        this.problemText.setText(msg);
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
        const savedData = SaveManager.load();
        this.score = savedData.score;
        this.talary = savedData.talary;
        this.zakresA = savedData.zakresA;
        this.zakresB = savedData.zakresB;
        this.lastA = savedData.lastA;
        this.lastB = savedData.lastB;
        this.currentUser = savedData.userName;
        this.tryb = savedData.tryb || 'praktyka'; // Jeśli tryb jest zapisany, użyj go, w przeciwnym razie domyślny 'praktyka'

        // Tło dla całej sceny
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 1. KONTENER MENU
        this.menuContainer = this.add.container(0, 0);
        this.createMenu();

        // 2. Tworzymy kontenery na ustawienia (w prawym dolnym rogu)
       

        // animacje
        // Tworzymy kilka losowych symboli w tle
        const symbols = ['+', '-', '×', '÷', '=', '%', '√', '∑', 'π', '∞', '>', '<'];
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

        this.einstein = new Einstein(this);        
        this.setupModeDropdown();
    
    }

    setupModeDropdown() {
    const x = 700; // Pozycja X (prawy górny róg)
    const y = 40;
    const width = 150;
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

    const tryby = ['start', 'nauka', 'praktyka', 'ekspert'];
    
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
            SaveManager.save({ tryb: this.tryb }); // Zapisujemy wybrany tryb
            mainText.setText(`Tryb: ${opcja.toUpperCase()}`);
            optionsGroup.setVisible(false);
            this.isDropdownOpen = false;
            this.einstein.say(`Wybrałeś tryb ${opcja}!`);
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
        const title = this.add.text(400, 110, 'MatiMatyk', { 
            fontSize: '50px', fontStyle: 'bold', color: '#f0adb4' 
        }).setOrigin(0.5);

        // Tworzymy przyciski używając naszej pomocniczej klasy GameButton
        const btnAdd = new GameButton(this, 520, 200, 'Dodawanie', 0x3498db, 4, () => {
                        this.currentOperation = '+';
                        this.startGame();
                        });
        const btnSub = new GameButton(this, 520, 280, 'Odejmowanie', 0x3498db, 4, () => {
                        this.currentOperation = '-';
                        this.startGame();
                        });
        const btnMul = new GameButton(this, 520, 360, 'Mnożenie', 0x3498db, 4, () => {
                        this.currentOperation = '*';
                        this.startGame();
                        });;
        const btnDiv = new GameButton(this, 520, 440, 'Dzielenie', 0x3498db, 4, () => {
                        this.currentOperation = '÷';
                        this.startGame();
                        });

        this.menuContainer.add([title, btnAdd, btnSub, btnMul, btnDiv]);
    }

  

    setupGameUI() {
    // Tworzymy elementy UI, które będą widoczne podczas gry (wynik, pytanie, input itp.)
    // Wynik i talary użytkownika
    this.scoreText = this.add.text(20, 20, `${this.currentUser}: ${this.talary} 🪙`, { fontSize: '24px', 
        padding: { top: 10, bottom: 10 }
     });
     // Licznik rozgrywki (na dole ekranu)
     this.punktyText = this.add.text(280, 560, `Rozgrywka: ${this.score}`, { fontSize: '20px', 
        padding: { top: 10, bottom: 10 }
     }).setOrigin(0.5);
    
     // Tekst z działaniem matematycznym
    this.problemText = this.add.text(400, 200, '', { 
        fontSize: '110px', 
        fontStyle: 'bold', 
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 700 }, //limit długości tekstu
        shadow: { blur: 10, color: '#000000', fill: true, offsetX: 5, offsetY: 5 }
    }).setOrigin(0.5);

    // Element DOM (input) dla wprowadzenia wyniku
    const inputElement = document.createElement('input');
    inputElement.type = 'number';   
            Object.assign(inputElement.style, {
                fontSize: '40px',
                padding: '10px',
                width: '180px',
                textAlign: 'center',
                borderRadius: '20px',
                border: '5px solid #1976b4',
                backgroundColor: '#ecf0f1',
                //  boxShadow: '0px 10px 0px #2980b9',
                color: '#2c3e50',
                outline: 'none',
                display: 'none' // Ukryty na start
            });
            // Wrzucamy Input do Phasera i przypisujemy do obu zmiennych
            this.phaserInputObject = this.add.dom(600, 320, inputElement);
            this.htmlInput = inputElement; 
            this.htmlInput.style.display = 'none'; // Ukrywamy do momentu startu gry
            this.phaserInputObject.setVisible(false); // Ukrywamy cały DOMElement do momentu startu gry

    // Przycisk OPCJE
    new GameButton(this, 360, 40, 'OPCJE', 0x34495e, 2, () => {
        this.scene.start('SettingsScene'); // Przełącza scenę (zatrzymuje obecną)
    });

    // Przycisk MIESZANY
    new GameButton(this, 460, 40, '?', 0x2ecc71, 1, () => {
            this.mixedOperations = !this.mixedOperations;
            if (this.mixedOperations) {
            this.einstein.say("Tryb mieszany aktywowany! Każde pytanie może być innym działaniem!", 4000);
            this.startGame();}  });      

    // Przycisk POWRÓT
    const backButton = new GameButton(this, 720, 550, 'POWRÓT', 0xe74c3c, 2, () => {
        window.location.reload();
    });
    this.backButton = backButton; // Przechowujemy referencję, żeby móc nim zarządzać później (np. ukrywać w trybie start)
    this.backButton.setVisible(false); // Ukrywamy przycisk POWRÓT do momentu startu gry

    // Przycisk HINT
    const mixerBtn = new GameButton(this, 550, 40, 'NORMAL', 0x2ecc71, 2, () => {
        this.hintMode = !this.hintMode;
        
        if (this.hintMode) {
            mixerBtn.updateText('Psssst');
            this.einstein.say("Pssst, w trybach start i nauka będą podpowiedzi!", 4000);
        } else {
            mixerBtn.updateText('NORMAL');
            this.einstein.say("Wracamy do normalności!", 2000);
        }
    });         
   
    // Obsługa klawisza Enter do zatwierdzania odpowiedzi
    this.input.keyboard?.on('keydown-ENTER', () => this.checkAnswer());
}

    startGame() {
        this.menuContainer.setVisible(false);
        this.dropdownContainer.setVisible(true);
        this.gameContainer.setVisible(true);
        this.phaserInputObject.setVisible(true);
        this.backButton.setVisible(true);
        this.punktyText.setText(`Rozgrywka: ${this.score} / 25`);
        //this.scoreText.setText(`${this.currentUser}: ${this.score}`);

        
        this.focusInput();

        if ((this.tryb === 'nauka' || this.tryb === 'start') && this.hintMode) {
          // W nauce najpierw się witamy, a dopiero potem (po 2s) dajemy pierwsze zadanie         
         this.einstein.say("Witaj! Zaraz pokażę Ci wynik, spróbuj go zapamiętać!");
         this.time.delayedCall(2000, () => {
              this.nextQuestion();
          });
          } else {
              // W pozostałych trybach lecimy od razu
              this.einstein.say("Powodzenia, geniuszu!");
              this.nextQuestion();
          }
    }

    nextQuestion() {        
            // Generujemy dane zadania za pomocą klasy MathLogic
            //console.log("Generowanie nowego pytania..., tryb: " + this.tryb);
            if (this.questionTimer) this.questionTimer.destroy(); // Usuwamy poprzedni timer, jeśli istnieje
            if (this.mixedOperations) {
             this.currentOperation = ['+', '-', '*', '÷'][MathLogic.getRandomInt(0, 3)] as Operation; // Losowy operator do mieszania
            }
            
            const q = MathLogic.generateQuestion(this.currentOperation, this.zakresA, this.zakresB, this.tryb, this.lastA, this.lastB);
            this.lastA = q.newA; // Zapisujemy nową wartość a dla kolejnego pytania
            this.lastB = q.newB; // Zapisujemy nową wartość b dla kolejnego pytania            
            this.currentSolution = q.solution;
            const questionText = q.questionText;
            const fullEquation = q.fullEquation;

            const valueMap: { [key: string]: number } = {
            'start': 1,
            'nauka': 2,
            'praktyka': 3,
            'ekspert': 4
            };     // Pobieramy wartość na podstawie aktualnego trybu (domyślnie 5, jeśli tryb jest nieznany)            
             this.maxReward = valueMap[this.tryb] || 5;
             this.questionTimer = this.time.addEvent({
                delay: 1000,
                callback: () => {
                    if (this.maxReward > 1) { // Minimalna nagroda to 5 talarów
                        this.maxReward--;
                        this.updateTimerDisplay(this.maxReward); 
                    }
                    },
                callbackScope: this,
                loop: true
            });
            this.updateTimerDisplay(this.maxReward);
            this.startTime = this.time.now; // startrujemy niezależny licznik czasu dla tego pytania

    // --- LOGIKA TRYBÓW ---
    if (this.tryb === 'start') {        
        this.htmlInput.disabled = true; //  Blokujemy wpisywanie na samym początku
        this.htmlInput.value = ""; // Czyścimy pole, żeby nic tam nie było
        if (this.hintMode) {
        this.einstein.say(`Zapamiętaj to!`);
        this.displayMessage(fullEquation); // Pokazujemy od razu pełne równanie z wynikiem
        // Po 2 sekundach pokazujemy samo pytanie
        this.time.delayedCall(2000, () => {
            this.displayMessage('Uwaga!');
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    }
        const delTime = this.hintMode ? 4000 : 500; // Dłuższy czas, jeśli hint jest włączony
        this.time.delayedCall(delTime, () => {
            this.displayMessage(questionText);
            this.htmlInput.disabled = false;
            this.htmlInput.focus(); // Automatycznie ustawiamy kursor w polu, żeby uczeń mógł pisać
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    } 
    else if (this.tryb === 'nauka') {        
        // 2. Blokujemy wpisywanie na samym początku
        this.htmlInput.disabled = true;
        this.htmlInput.value = ""; // Czyścimy pole, żeby nic tam nie było
        if (this.hintMode) {
        this.einstein.say(`Zapamiętaj to!`);          
        this.displayMessage(fullEquation); // Pokazujemy od razu pełne równanie z wynikiem
        // Po 2 sekundach pokazujemy samo pytanie
        this.time.delayedCall(2000, () => {
            this.displayMessage('Uwaga!');
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    }
    const delTimeNauka = this.hintMode ? 4000 : 500; // Dłuższy czas, jeśli hint jest włączony
        this.time.delayedCall(delTimeNauka, () => {
            this.displayMessage(questionText);
            this.htmlInput.disabled = false;
            this.htmlInput.focus(); // Automatycznie ustawiamy kursor w polu, żeby Mati mógł pisać
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    } 
    else if (this.tryb === 'praktyka') {  
        
        this.time.delayedCall(1500, () => {
            this.htmlInput.value = ""; // Czyścimy pole, żeby nic tam nie było
            this.einstein.say(`Twór ruch!`);     
            this.displayMessage(questionText);
            this.htmlInput.disabled = false;
            this.htmlInput.focus(); // Automatycznie ustawiamy kursor w polu, żeby Mati mógł pisać
            this.tweens.add({
                targets: this.problemText,
                scale: { from: 0.8, to: 1 },
                duration: 300,
                ease: 'Back.out'
            });
        });
    }
    
    else {
        // Tryb EKSPERT: Pokazujemy od razu pytanie
        this.displayMessage(questionText);
        this.tweens.add({
            targets: this.problemText,
            scale: { from: 0.8, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }
}

checkAnswer() {
    // 1. Zabezpieczenie przed pustym inputem lub blokadą
    if (this.htmlInput.disabled || this.htmlInput.value === "") return;

    const val = parseInt(this.htmlInput.value);
    if (isNaN(val)) return;

    if (val === this.currentSolution) {
        // --- LOGIKA SUKCESU ---
        if (this.questionTimer) this.questionTimer.destroy(); // Usuwamy poprzedni timer, jeśli istnieje
        this.score+= this.maxReward; // Dodajemy punkty w zależności od trybu i czasu
        SaveManager.save({ score: this.score });
         this.punktyText.setText(`Rozgrywka: ${this.score} / 25`);
        this.htmlInput.value = ""; // Czyścimy od razu po poprawnej

        this.einstein.jump();

        // 1. Sprawdzamy warunek wygranej
        if (this.score >= 25) {
            this.endgame(); // Wywołujemy zakończenie
            return;         // KLUCZ: Kończymy funkcję TUTAJ. Kod poniżej się nie wykona.
        }

        // 2. Normalny bieg gry (jeśli nie ma jeszcze 25 pkt)

        // --- LOGIKA KOMUNIKATÓW (DYMEK) ---
        
        if (this.score % 15 === 0 && this.score > 0) {
            // Wielkie świętowanie (priorytet najwyższy)
            const tekst = this.getRandomCongrats();
            this.einstein.say(tekst, 4000);
            confetti({ particleCount: 200, spread: 100 });
            this.einstein.spin();
        } 
        else if (this.tryb === 'praktyka') {
            // Specjalny komunikat dla trybu praktyka
            const fullText = this.problemText.text + this.currentSolution;
            this.displayMessage(fullText); // Pokazujemy pełne równanie z wynikiem
            if (this.time.now - this.startTime > 10000) {
                this.einstein.say("Prawie zasnąłem, to trwało wieki!");
            }
            else {
            this.einstein.say(`Świetnie!`);
            }
        } 
        else {
            // Standardowa gratulacja dla pozostałych trybów
            if (this.time.now - this.startTime > 10000) {
                this.einstein.say("Prawie zasnąłem, to trwało wieki!");
            }
            else {
            this.einstein.say(`Świetnie!`);
            }
            this.einstein.jump();
        }

        // --- PRZEJŚCIE DO KOLEJNEGO PYTANIA ---
        // Dodajemy małe opóźnienie, żeby uczeń zdążył przeczytać dymek w trybach edukacyjnych
        const delay = (this.tryb === 'praktyka' || this.tryb === 'nauka') ? 1000 : 500;
        this.time.delayedCall(delay, () => {
            this.nextQuestion();
        });

    } else {
                this.score--;
                    SaveManager.save({ score: this.score });
                this.punktyText.setText(`Rozgrywka: ${this.score} / 25`);
                this.cameras.main.shake(200, 0.005);
                const tekst = this.getRandomBledne();
                this.einstein.say(tekst); 
            }
        
        this.htmlInput.value = '';
        this.focusInput();
    }

    endgame() {
        this.htmlInput.style.display = 'none'; // Ukrywamy input
        this.htmlInput.disabled = true; // Blokujemy input na wszelki wypadek
        this.phaserInputObject.setVisible(false); // Ukrywamy cały DOMElement, żeby nie było żadnych interakcji
        const tekst = this.getRandomCongrats();
            this.einstein.say(tekst, 4000);
            confetti({ particleCount: 200, spread: 100 });
            this.einstein.spin();
        
        const creditsMap: { [key: string]: number } = {
        'start': 5,
        'nauka': 10,
        'praktyka': 15,
        'ekspert': 20
        };

        // Pobieramy wartość na podstawie aktualnego trybu (domyślnie 5, jeśli tryb jest nieznany)
        
        const grantValue = creditsMap[this.tryb] || 5;
        this.talary += grantValue; // Dodajemy kredyty za wygraną
        this.displayMessage(`Zdobywasz ${grantValue} talarów!`); 
        this.scoreText.setText(`${this.currentUser}: ${this.talary} 🪙`); // Aktualizujemy wyświetlanie talarów
        SaveManager.save({ talary: this.talary });
        this.score = 0; // Resetujemy wynik
        SaveManager.save({ score: this.score });

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