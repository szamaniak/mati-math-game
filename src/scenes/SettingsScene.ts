import Phaser from 'phaser';
import { SaveManager } from '../logic/SaveManager';
import { GameButton } from '../components/GameButton';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const settings = SaveManager.load();
        
        // Tło
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);

        this.add.text(400, 50, 'USTAWIENIA I LOGOWANIE', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // --- SEKCJA: WYBÓR ISTNIEJĄCEGO GRACZA ---
        this.add.text(100, 120, 'Wybierz profil:', { fontSize: '20px', color: '#bdc3c7' }).setOrigin(0.5);
        
        const users = SaveManager.getAvailableUsers();
        users.forEach((username, index) => {
            // Rozmieszczamy przyciski graczy w rzędzie lub kolumnie
            const xPos = 100;
            const yPos = 170 + (index * 50);
            
            // Podświetlamy aktualnie zalogowanego gracza innym kolorem (np. fioletowy 0x9b59b6)
            const btnColor = (username === settings.userName) ? 0x9b59b6 : 0x34495e;
            
            new GameButton(this, xPos, yPos, username, btnColor, 3, () => {
                SaveManager.login(username);
                this.scene.restart(); // Odświeżamy scenę, by pokazać zmiany
            });
        });

        // --- SEKCJA: NOWY GRACZ ---
        const startYNewPlayer = 170 + (users.length * 50) + 40;
        this.add.text(100, startYNewPlayer, 'Lub dodaj gracza:', { fontSize: '18px', color: '#bdc3c7' }).setOrigin(0.5);

        const nameInput = document.createElement('input');
        nameInput.placeholder = "Wpisz nazwę gracza...";
        nameInput.style.width = '160px';
        nameInput.style.padding = '8px';
        nameInput.style.textAlign = 'center';
        this.add.dom(100, startYNewPlayer + 40, nameInput);

        // Przycisk DODAJ / ZALOGUJ
        new GameButton(this, 100, startYNewPlayer + 100, 'ZALOGUJ', 0x2ecc71, 2, () => {
            const newName = nameInput.value.trim();
            if (newName.length > 0) {
                SaveManager.login(newName);
                this.scene.start('MathScene');
            }
        });

        // USTAWIENIA GRY

        // 1. Definicja wymiarów centralnego panelu
            const panelWidth = 520;
            const panelHeight = 350;
            const panelX = 230 ; 
            const panelY = 100; // Poniżej tytułu

            // 2. Rysowanie ramki i tła panelu
            const panelBg = this.add.graphics();

            // Efekt cienia (lekko przesunięty czarny prostokąt)
            panelBg.fillStyle(0x000000, 0.3);
            panelBg.fillRoundedRect(panelX + 5, panelY + 5, panelWidth, panelHeight, 20);

            // Główny panel (granatowy/szary dla kontrastu z tłem sceny)
            panelBg.fillStyle(0x34495e, 1);
            panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

            // Ozdobna krawędź (Stroke)
            panelBg.lineStyle(4, 0xecf0f1, 1);
            panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

            // 3. Nagłówek wewnątrz ramki
            this.add.text(450, panelY + 30, `USTAWIENIA: ${settings.userName}`, {
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#2ecc71'
            }).setOrigin(0.5);

            // 4. Linia oddzielająca (opcjonalnie)
            panelBg.lineStyle(2, 0xbdc3c7, 0.5);
            panelBg.lineBetween(panelX + 40, panelY + 45, panelX + panelWidth - 40, panelY + 45);
        
            // --- USTAWIENIE ZAKRESU A ---
            this.add.text(panelX + 20, panelY + 75, 'Zakres liczby A:', { 
                fontSize: '20px', 
                color: '#ffffff' 
            }).setOrigin(0, 0.5);

            const inputA = document.createElement('input');
            inputA.type = 'number';
            inputA.value = settings.zakresA.toString();
            Object.assign(inputA.style, {
                width: '60px',
                fontSize: '20px',
                padding: '5px',
                textAlign: 'center',
                borderRadius: '5px',
                border: '2px solid #2ecc71' // Zielona ramka dla liczby A
            });

            this.add.dom(panelX + 260, panelY + 75, inputA);

            inputA.addEventListener('input', () => {
                const val = parseInt(inputA.value);
                if (!isNaN(val) && val > 0) {
                    SaveManager.save({ zakresA: val });
                }
            });

            // --- USTAWIENIE ZAKRESU B ---
            this.add.text(panelX + 20, panelY + 120, 'Zakres liczby B:', { 
                fontSize: '20px', 
                color: '#ffffff' 
            }).setOrigin(0, 0.5);

            const inputB = document.createElement('input');
            inputB.type = 'number';
            inputB.value = settings.zakresB.toString();
            Object.assign(inputB.style, {
                width: '60px',
                fontSize: '20px',
                padding: '5px',
                textAlign: 'center',
                borderRadius: '5px',
                border: '2px solid #3498db' // Niebieska ramka dla liczby B
            });

            this.add.dom(panelX + 260, panelY + 120, inputB);

            inputB.addEventListener('input', () => {
                const val = parseInt(inputB.value);
                if (!isNaN(val) && val > 0) {
                    SaveManager.save({ zakresB: val });
                }
            });




        // Dolny przycisk powrotu
        new GameButton(this, 720, 550, 'POWRÓT', 0xe74c3c, 2, () => {
            this.scene.start('MathScene');
        });
    }
}