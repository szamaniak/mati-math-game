import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import { MathLogic } from '../logic/MathLogic';
import { Einstein } from '../components/Einstein';
import { GameButton } from '../components/GameButton';
import { SaveManager } from '../logic/SaveManager';
import { AIManager } from '../managers/AIManager';
import {UIManager} from '../managers/UIManager'

import { auth } from '../config/firebaseConfig';
import { AuthManager } from '../managers/AuthManager';


type Operation = '+' | '-' | '*' | '÷';

export class MathScene extends Phaser.Scene { 
// Stan gry
    private currentUser: string = 'Gość'; // Domyślna nazwa użytkownika, zostanie nadpisana po wczytaniu zapisu
    //private userId: string | null = null;
    private startTime: number = 0;  
    private score: number = 0;
    private talary: number = 0;
    private talenty: number = 0;
    private zakresA: number = 10;
    private zakresB: number = 10;
    private lastB: number = -1; // -1 na start, żeby przy pierwszym pytaniu nic nie blokowało
    private lastA: number = -1; // Dodajemy też lastA, żeby mieć pełną kontrolę nad generowanymi pytaniami
    private fixedA: number = 0; // Dodajemy fixedA, które będzie używane w trybie 'start' do generowania pytań z ustalonym a
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
    private infoTalentyText!: Phaser.GameObjects.Text;
    private infoTalaryText!: Phaser.GameObjects.Text;
    private questionTimer!: Phaser.Time.TimerEvent;
    private phaserInputObject!: Phaser.GameObjects.DOMElement;
    private backButton!: GameButton;
    private problemText!: Phaser.GameObjects.Text;
    private htmlInput!: HTMLInputElement; // To będzie sam "środek" (input)    
    private einstein!: Einstein;    
    private menuContainer!: Phaser.GameObjects.Container;
    private gameContainer!: Phaser.GameObjects.Container;
    private infoPanel!: Phaser.GameObjects.Container;

    private updateTimerDisplay(remaining: number) {
    this.punktyText.setText(`Rozgrywka: ${this.score} (+ ${remaining}) / 25`);
    }

    private refreshUI() {
        // Aktualizacja głównych liczników na ekranie (tych zawsze widocznych)
        this.scoreText.setText(`${this.currentUser}: ${this.talary} 🪙`);
        // Jeśli masz talentText na wierzchu:
        // this.talentText.setText(`Talenty: ${this.talenty} ✨`);

        // Aktualizacja tekstów wewnątrz ukrytego panelu Info
        if (this.infoTalaryText && this.infoTalentyText) {
            this.infoTalaryText.setText(`talary: ${this.talary}`);
            this.infoTalentyText.setText(`talenty: ${this.talenty}`);
        }
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
        
        console.log("MatiMatyk - gra uruchomiona");
        const user = auth.currentUser;
        
        if (user) {
            //this.userId = user.uid;
            // Jeśli to konto Google, używamy displayName, jeśli Nick - email/login
            this.currentUser = user.displayName || user.email?.split('@')[0] || 'Gracz';
        } else {
            this.currentUser = 'Gość';
        }

        // 2. Wczytaj ustawienia (zakresy, talary) przez SaveManager
        const savedData = SaveManager.load();
        
        // Synchronizujemy lokalne zmienne sceny z tym, co jest w SaveManagerze (który z kolei synchronizuje z Firebase, jeśli użytkownik jest zalogowany)
        this.score = savedData.score;
        this.talary = savedData.talary || 0;
        this.talenty = savedData.talenty || 0;
        this.fixedA = savedData.fixedA;
        this.zakresA = savedData.zakresA;
        this.zakresB = savedData.zakresB;
        this.lastA = savedData.lastA;
        this.lastB = savedData.lastB;
        this.tryb = savedData.tryb || 'praktyka'; // Jeśli tryb jest zapisany, użyj go, w przeciwnym razie domyślny 'praktyka'

        // Tło dla całej sceny
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 1. KONTENER MENU
        this.menuContainer = this.add.container(0, 0);
        this.createMenu();

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
        // 1. Sprawiamy, że Einstein reaguje na mysz
        this.einstein.setInteractive({ useHandCursor: true });

        /*
        const hintText = this.add.text(this.einstein.x, this.einstein.y - 120, 
            'Kliknij mnie, a za pięć talarów opowiem Ci niezwykłą ciekawostkę! 💡', 
            {
                fontSize: '14px', 
                backgroundColor: '#34495e', 
                padding: { x: 8, y: 8 }, 
                color: '#ffffff',
                align: 'center', // Centrowanie tekstu wewnątrz ramki
                wordWrap: { width: 180 } // Kluczowe: szerokość, po której tekst przejdzie do nowej linii
            }
        ).setOrigin(0.5).setAlpha(0).setDepth(200);
        */

        this.einstein.on('pointerover', () => {
            if (!this.einstein.isTalking) this.einstein.say('Kliknij mnie, a za pięć talarów opowiem Ci niezwykłą ciekawostkę! 💡', 4000)
                //this.add.tween({ targets: hintText, alpha: 1, duration: 200 });
        });

        //this.einstein.on('pointerout', () => {
          
            //this.add.tween({ targets: hintText, alpha: 0, duration: 200 });
        //});

        this.einstein.on('pointerdown', async () => {
           // if (this.einstein.isTalking) return;

            this.einstein.say("Szukam czegoś specjalnego...", 2000);
            this.einstein.spin();
            
            const result = await AIManager.getEinsteinFact();
            
            if (result.success) {
                // 1. Odśwież dane
                const settings = SaveManager.load();
                this.talary = settings.talary;
                this.talenty = settings.talenty || 0;
                
                // 2. Zaktualizuj UI na scenie
                this.refreshUI();
                
                // 3. Wywołaj managera okien (CZYSTO I PORZĄDNIE!)
                UIManager.showTriviaModal(this, result.message, () => {
                    this.einstein.jump(); // To się wykona po zamknięciu okna
                });
            } else {
                this.einstein.say(result.message, 4000);
            }
        });

        this.setupModeDropdown();
        this.setupInfoPanel(250, 350);    
    }

    setupInfoPanel(customWidth: number, customHeight: number) {
    // 1. Obliczamy marginesy, aby wszystko było wyśrodkowane
    const offsetX = -customWidth / 2;
    const offsetY = -customHeight / 2;
    const screenCenter = { x: 120, y: 300 };
    
    // 1. Tworzymy kontener
    this.infoPanel = this.add.container(screenCenter.x, screenCenter.y);
    this.infoPanel.setDepth(100); // Upewniamy się, że jest nad wszystkim
    this.infoPanel.setVisible(false); // Domyślnie ukryte

    // 2. Tło panelu (półprzezroczyste)
    const bg = this.add.graphics();
    bg.fillStyle(0x2c3e50, 0.95); // Ciemny granat
    bg.fillRoundedRect(offsetX, offsetY, customWidth, customHeight, 20);
    bg.lineStyle(4, 0x3498db, 1); // Niebieska ramka
    bg.strokeRoundedRect(offsetX, offsetY, customWidth, customHeight, 20);

    // 3. Tytuł lub tekst informacji
    const title = this.add.text(-50, -150, 'Info:', {
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff'
    }).setOrigin(0.5);

    const desc = this.add.text(-50, -120, this.currentUser, {
        fontSize: '20px',
        color: '#ecf0f1',
        align: 'center'
    }).setOrigin(0.5);

    this.infoTalaryText = this.add.text(-50, -90, `talary: ${this.talary}`, {
        fontSize: '16px',
        color: '#bdc3c7',
        align: 'center'
    }).setOrigin(0.5);

    this.infoTalentyText = this.add.text(-50, -60, `talenty: ${this.talenty}`, {
        fontSize: '16px',
        color: '#bdc3c7',
        align: 'center'
    }).setOrigin(0.5);

    // 4. Przycisk ZAMKNIJ wewnątrz panelu
    const closeBtn = new GameButton(this, 85, -150, 'X', 'danger', 1, () => {
        this.toggleInfoPanel();
    });

    const logoutBtn = new GameButton(this, 0, 110, 'Wyloguj', 'dark', 3, async () => {
        await AuthManager.logout();
                    localStorage.removeItem('math_game_data_v2'); 
                    this.scene.start('LoginScene');
    });


        // Dodajemy elementy do kontenera
        this.infoPanel.add([bg, title, desc, this.infoTalaryText, this.infoTalentyText, closeBtn, logoutBtn]);
    }

    private toggleInfoPanel() {
    this.infoPanel.setVisible(!this.infoPanel.visible);    
    // Opcjonalnie: blokujemy input w grze, gdy panel jest otwarty
    if (this.htmlInput) {
        this.htmlInput.disabled = this.infoPanel.visible;
    } 
    } 

    setupModeDropdown() {
    const x = 700;
    const y = 40;
    const tryby = ['start', 'nauka', 'praktyka', 'ekspert'];
    
    // Pobieramy aktualny tryb z ustawień
    const currentSettings = SaveManager.load();
    this.tryb = currentSettings.tryb || 'praktyka'; // Domyślnie 'praktyka', jeśli nie ma zapisanego trybu

    // 1. Kontener na całe menu
    this.dropdownContainer = this.add.container(x, y);

    // 2. Grupa opcji (początkowo ukryta)
    const optionsGroup = this.add.container(0, 45); // Odstęp pod głównym przyciskiem
    optionsGroup.setVisible(false);

    // 3. Przycisk GŁÓWNY (używamy GameButton!)
    const mainBtn = new GameButton(
        this, 0, 0, 
        this.tryb.toUpperCase(), 
        'success', 3, // Rozmiar 3 pasuje do szerokości ok. 130-150px
        () => {
            this.isDropdownOpen = !this.isDropdownOpen;
            optionsGroup.setVisible(this.isDropdownOpen);
            
            // Reakcja Einsteina przy otwieraniu
            if (this.isDropdownOpen) {
                this.einstein.say("Wybierz poziom trudności!");
            }
        }, undefined, () => {
            this.einstein.say("Kliknij, aby wybrać tryb gry!", 3000);
        }, () => {  
            this.einstein.say("", 500); 
        }
    );

    // 4. Generowanie przycisków opcji
    tryby.forEach((opcja, index) => {
        const optBtn = new GameButton(
            this, 0, index * 42, // Rozmieszczenie w pionie
            opcja.toUpperCase(),
            'dark', 3,
            () => {
                // Logika wyboru
                this.tryb = opcja;
                SaveManager.save({ tryb: this.tryb });
                
                // Aktualizacja przycisku głównego
                mainBtn.updateText(`TRYB: ${opcja.toUpperCase()}`);
                
                // Zamknięcie menu
                optionsGroup.setVisible(false);
                this.isDropdownOpen = false;
                
                this.einstein.say(`Świetnie! Tryb ${opcja} to dobry wybór.`);
            },
            undefined, // brak ikony
            () => { 
                switch(opcja) {
                case 'start': this.einstein.say("Tutaj będą działania po kolei, 5 talarów. Możesz w opcjach ustawić konkretną liczbę!"); break;
                case 'nauka': this.einstein.say("Tryb działań matematycznych z możliwą podpowiedzią, 10 talarów"); break;
                case 'praktyka': this.einstein.say("Po każdym działaniu będzie powtórka, 15 talarów"); break;
                case 'ekspert': this.einstein.say("Tryb eksperta - żadnych podpowiedzi!, 20 talarów"); break;
                }
            }, // pointerover
            () => { this.einstein.say("", 300); } // pointerout
        );
        
        optionsGroup.add(optBtn);
    });

    // Składamy wszystko w całość
    this.dropdownContainer.add([optionsGroup, mainBtn]);
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
    // Przycisk użytkownika (z możliwością wylogowania i zmianą użytkownika)
    new GameButton(this, 30, 40, '👤', 'dark', 1, async () => {
        this.toggleInfoPanel();
    }, undefined, () => {
        this.einstein.say("Tu możesz sprawdzić swoje osiągnięcia, przelogować się lub zmienić użytkownika!", 3000);
    }, () => {
        this.einstein.say("", 300); // Czyścimy tekst po wyjściu z przycisku
    });

    // Wynik i talary użytkownika
    this.scoreText = this.add.text(60, 20, `${this.currentUser}: ${this.talary} 🪙`, { fontSize: '24px', 
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
    new GameButton(this, 440, 40, 'OPCJE', 0x34495e, 2, () => {
        this.scene.start('SettingsScene'); // Przełącza scenę (zatrzymuje obecną)
    }, undefined, () => {;
        this.einstein.say("Tu możesz zmienić ustawienia i zmienić gracza!", 4000);
    }, () => {        this.einstein.say("", 300); // Czyścimy tekst po wyjściu z przycisku
    });

    // Przycisk MIESZANY
    const btnMixed = new GameButton(this, 530, 40, 'Mix', this.mixedOperations ? 'info' : 'dark', 1, () => {
            this.mixedOperations = !this.mixedOperations;
            btnMixed.updateTheme(this.mixedOperations ? 'info' : 'dark');
            if (this.mixedOperations) {
            this.einstein.say("Tryb mieszany aktywowany! Każde pytanie może być innym działaniem!", 4000);
            this.startGame();}  }, undefined, () => {
            this.einstein.say("Tu włączasz tryb mieszany!", 3000);
        }); 
            
    // Przycisk HINT
    const mixerBtn = new GameButton(this, 590, 40, '?', this.hintMode ? 'success' : 'dark', 1, () => {
        this.hintMode = !this.hintMode;
        mixerBtn.updateTheme(this.hintMode ? 'success' : 'dark');
        
        if (this.hintMode) {            
            this.einstein.say("Tryb podpowiedzi aktywowany!", 2000);
            if (this.tryb === 'start' || this.tryb === 'nauka') {
            this.tryb = 'nauka'; // Automatycznie przełączamy na tryb nauka, bo w innych trybach hinty nie działają
                SaveManager.save({ tryb: this.tryb }); // Zapisujemy zmianę trybu
            }
        } else {
            
            this.einstein.say("Wyłączam tryb podpowiedzi!", 2000);
        }
    }, undefined, () => {
        this.einstein.say("Tu włączasz podpowiedzi! W trybach start i nauka pokażą Ci wynik na 2 sekundy!", 5000);
    });   

    // Przycisk POWRÓT
    const backButton = new GameButton(this, 720, 550, 'POWRÓT', 0xe74c3c, 2, () => {
        this.scene.start('MathScene'); // Przełącza scenę (zatrzymuje obecną)
    });
    this.backButton = backButton; // Przechowujemy referencję, żeby móc nim zarządzać później (np. ukrywać w trybie start)
    this.backButton.setVisible(false); // Ukrywamy przycisk POWRÓT do momentu startu gry      
   
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
            
            const q = MathLogic.generateQuestion(this.currentOperation, this.zakresA, this.zakresB, this.tryb, this.lastA, this.lastB, this.fixedA);
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
                    if (this.maxReward > 1) { // Minimalna nagroda to 1 punkt, nie schodzimy poniżej tego
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