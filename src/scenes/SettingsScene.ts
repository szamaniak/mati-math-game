import { SaveManager } from '../logic/SaveManager';
import { GameButton } from '../components/GameButton';
import { auth } from '../config/firebaseConfig';
import { AuthManager } from '../managers/AuthManager';
import { updatePassword, updateProfile } from 'firebase/auth';

export class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const settings = SaveManager.load();
        const user = auth.currentUser;

        if (!user) {
            this.scene.start('LoginScene');
            return;
        }

        // --- TŁO ---
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);
        this.add.text(530, 40, 'USTAWIENIA PROFILU', {
            fontSize: '32px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        // --- SEKCJA PROFILU I KONTA (Lewa strona) ---
        const leftX = 130;

        // 

         // 1. Wyciągamy informację o sposobie logowania
        let loginIdentity = user.email || "Zalogowano przez Google";
        const providerId = user.providerData[0]?.providerId; // Sprawdzamy czy to 'password' czy 'google.com'

        // 2. Funkcja różnicująca: jeśli to konto na hasło i zawiera nasz dodatek, ucinamy go
        if (providerId === 'password' && loginIdentity.endsWith('@mati-math-game.local')) {
            loginIdentity = loginIdentity.replace('@mati-math-game.local', '');
        }

        // 3. Dodajemy panel informacyjny (z Twoimi wymiarami)
        const infoBoxY = 30; 
        this.add.rectangle(leftX, infoBoxY, 220, 40, 0x34495e).setAlpha(1);

            this.add.text(leftX, infoBoxY - 10, 'Twój login:', { 
                fontSize: '14px', 
                color: '#bdc3c7' 
            }).setOrigin(0.5);

            this.add.text(leftX, infoBoxY + 8, loginIdentity, { 
                fontSize: '14px', 
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Dodatkowa ikonka/tekst informujący o metodzie
            const methodText = providerId === 'password' ? '🔐 Logowanie nickiem' : '🔵 Logowanie Google';
            this.add.text(leftX, infoBoxY + 25, methodText, { 
                fontSize: '12px', 
                color: providerId === 'password' ? '#2ecc71' : '#3498db'
            }).setOrigin(0.5);
        
        // 1. Edycja NICKU (Nickname)
        this.add.text(leftX, 120, 'Twoja nazwa (Nick):', { fontSize: '18px', color: '#bdc3c7' }).setOrigin(0.5);
        const nickInput = document.createElement('input');
        nickInput.value = settings.userName || (user.displayName || "");
        Object.assign(nickInput.style, {
            width: '200px', padding: '8px', textAlign: 'center', fontSize: '18px',
            borderRadius: '5px', border: '2px solid #9b59b6', backgroundColor: '#ecf0f1'
        });
        this.add.dom(leftX, 160, nickInput);

        // Przycisk Zapisu Nicku
        new GameButton(this, leftX, 210, 'ZAPISZ NICK', 0x9b59b6, 3, async () => {
            const newNick = nickInput.value.trim();
            if (newNick) {
                // Aktualizacja w Auth (opcjonalnie dla Google) i w naszym systemie zapisu
                await updateProfile(user, { displayName: newNick });
                SaveManager.save({ userName: newNick });
                console.log("Nick zaktualizowany!");
                // Możesz dodać tekst "Zapisano!" na ekranie
            }
        });

       

        // 2. Sekcja HASŁA (Tylko jeśli chcemy umożliwić logowanie Nick/Hasło w przyszłości)
        this.add.text(leftX, 250, 'Ustaw nowe hasło:', { fontSize: '18px', color: '#bdc3c7' }).setOrigin(0.5);
        const passInput = document.createElement('input');
        passInput.type = 'password';
        passInput.placeholder = "Min. 6 znaków";
        Object.assign(passInput.style, {
            width: '200px', padding: '8px', textAlign: 'center', fontSize: '18px',
            borderRadius: '5px', border: '2px solid #34495e', backgroundColor: '#ecf0f1'
        });
        this.add.dom(leftX, 290, passInput);

        new GameButton(this, leftX, 340, 'USTAW HASŁO', 0x34495e, 3, async () => {
            const newPass = passInput.value;
            if (newPass.length >= 6) {
                try {
                    await updatePassword(user, newPass);
                    alert("Hasło zostało ustawione!");
                    passInput.value = "";
                } catch (e: any) {
                    alert("Błąd: " + e.message + " (Zaloguj się ponownie, aby zmienić hasło)");
                }
            } else {
                alert("Hasło za krótkie!");
            }
        });

        // Statystyka talarów (niżej)
        this.add.text(leftX, 410, `💰 Twoje talary: ${settings.talary}`, { 
            fontSize: '22px', color: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Przycisk WYLOGUJ
        new GameButton(this, leftX, 520, 'WYLOGUJ', 0xe74c3c, 3, async () => {
            await AuthManager.logout();
            localStorage.removeItem('math_game_data_v2'); 
            this.scene.start('LoginScene');
        });

        // --- PANEL USTAWIEŃ GRY (Prawa strona) ---
        const panelWidth = 380;
        const panelHeight = 320;
        const panelX = 380; 
        const panelY = 120;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x000000, 0.3);
        panelBg.fillRoundedRect(panelX + 5, panelY + 5, panelWidth, panelHeight, 20);
        panelBg.fillStyle(0x34495e, 1);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panelBg.lineStyle(4, 0xecf0f1, 1);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

        this.add.text(panelX + panelWidth/2, panelY + 30, `POZIOM TRUDNOŚCI`, {
            fontSize: '22px', fontStyle: 'bold', color: '#2ecc71'
        }).setOrigin(0.5);
        
        this.add.text(panelX + panelWidth/2, panelY + 60, `Dla trybu start można ustawić konkretną liczbę A`, {
            fontSize: '12px', fontStyle: 'bold', color: '#e5e7e4'
        }).setOrigin(0.5);
        this.add.text(panelX + panelWidth/2, panelY + 80, `Jeśli ZakresA(Start) = 0 - zadania zaczną się od 2x2`, {
            fontSize: '11px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        // --- USTAWIENIE trybu konkretnej liczby A ---
        this.add.text(panelX + 40, panelY + 120, 'Uczę się liczby:', { fontSize: '18px', color: '#ffffff' }).setOrigin(0, 0.5);
        const input_fixedA = document.createElement('input');
        input_fixedA.type = 'number';
        const fixedAValue = settings.fixedA ? settings.fixedA : 0; // Domyślnie 10, jeśli nie ma ustawionej wartości
        input_fixedA.value = fixedAValue.toString();
        Object.assign(input_fixedA.style, {
            width: '60px', fontSize: '20px', padding: '5px', textAlign: 'center',
            borderRadius: '5px', border: '2px solid #2ecc71'
        });
        this.add.dom(panelX + 300, panelY + 120, input_fixedA);
        input_fixedA.addEventListener('input', () => {
            const val = parseInt(input_fixedA.value);
            if (!isNaN(val) && val > 0) SaveManager.save({ fixedA: val });
        });

        // --- USTAWIENIE ZAKRESU A ---
        this.add.text(panelX + 40, panelY + 170, 'Zakres A:', { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        const inputA = document.createElement('input');
        inputA.type = 'number';
        inputA.value = settings.zakresA.toString();
        Object.assign(inputA.style, {
            width: '60px', fontSize: '20px', padding: '5px', textAlign: 'center',
            borderRadius: '5px', border: '2px solid #2ecc71'
        });
        this.add.dom(panelX + 300, panelY + 170, inputA);
        inputA.addEventListener('input', () => {
            const val = parseInt(inputA.value);
            if (!isNaN(val) && val > 0) SaveManager.save({ zakresA: val });
        });

        // --- USTAWIENIE ZAKRESU B ---
        this.add.text(panelX + 40, panelY + 210, 'Zakres B:', { fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        const inputB = document.createElement('input');
        inputB.type = 'number';
        inputB.value = settings.zakresB.toString();
        Object.assign(inputB.style, {
            width: '60px', fontSize: '20px', padding: '5px', textAlign: 'center',
            borderRadius: '5px', border: '2px solid #3498db'
        });
        this.add.dom(panelX + 300, panelY + 210, inputB);
        inputB.addEventListener('input', () => {
            const val = parseInt(inputB.value);
            if (!isNaN(val) && val > 0) SaveManager.save({ zakresB: val });
        });

        // --- PRZYCISK POWROTU ---
        new GameButton(this, 570, 520, 'Gramy!', 0x2ecc71, 3, () => {
            this.scene.start('MathScene');
        });
    }
}