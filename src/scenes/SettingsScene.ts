import { SaveManager } from '../logic/SaveManager';
import { GameButton } from '../components/GameButton';
import { auth } from '../config/firebaseConfig';
import type { GameSettings } from '../logic/SaveManager';

export class SettingsScene extends Phaser.Scene {
    constructor() { super('SettingsScene'); }

    create() {
        const { width, height } = this.scale; 
        const settings = SaveManager.load() as GameSettings;
        const user = auth.currentUser;

        if (!user) { this.scene.start('LoginScene'); return; }

        // 1. Tło z gradientem lub jednolity głęboki kolor
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Nagłówek główny
        this.add.text(width / 2, 60, 'USTAWIENIA I PROFIL', { 
            fontSize: '42px', 
            fontStyle: 'bold', 
            color: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Wyliczamy wymiary paneli (np. 40% szerokości ekranu każdy)
        const panelWidth = width * 0.4;
        const panelHeight = height * 0.6;
        const leftColX = width * 0.28;
        const rightColX = width * 0.72;
        const centerY = height * 0.45;

        // 2. Rysowanie paneli tła dla sekcji
        this.drawPanel(leftColX, centerY, panelWidth, panelHeight);
        this.drawPanel(rightColX, centerY, panelWidth, panelHeight);

        // 3. Zawartość sekcji
        this.drawProfileSection(leftColX, centerY - (panelHeight / 2) + 50, user);
        this.drawGameSettingsSection(rightColX, centerY - (panelHeight / 2) + 50, settings);

        // 4. PRZYCISK POWRÓT (na dole, wycentrowany)
        new GameButton(this, width / 2, height - 80, {
            label: 'POWRÓT DO GRY',
            style: 'success',
            size: 3,
            width: 300,
            callback: () => { this.scene.start('MathScene'); }
        });
    }

    private drawPanel(x: number, y: number, w: number, h: number) {
        // Obrys i wypełnienie panelu
        const panel = this.add.graphics();
        panel.fillStyle(0x34495e, 0.8);
        panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
        panel.lineStyle(4, 0x3498db, 1);
        panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    }

    private drawProfileSection(x: number, y: number, user: any) {
        this.add.text(x, y, 'TWOJE KONTO', { fontSize: '28px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        
        let loginIdentity = (user.email || "Gracz").split('@')[0].toUpperCase();

        // Awatar (opcjonalne - kółko z literą)
        const avatarCircle = this.add.graphics();
        avatarCircle.fillStyle(0x3498db, 1);
        avatarCircle.fillCircle(x, y + 100, 50);
        this.add.text(x, y + 100, loginIdentity[0], { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5);

        this.add.text(x, y + 180, `Zalogowany jako:\n${loginIdentity}`, { 
            fontSize: '20px', 
            color: '#ecf0f1', 
            align: 'center',
            lineSpacing: 10 
        }).setOrigin(0.5);

        // Przycisk wylogowania wewnątrz panelu
        new GameButton(this, x, y + 280, {
            label: "WYLOGUJ",
            style: 'danger',
            size: 2,
            icon: 'user',
            callback: async () => { 
                await auth.signOut(); 
                this.scene.start('LoginScene'); 
            }
        });
    }

    private drawGameSettingsSection(x: number, y: number, settings: GameSettings) {
        this.add.text(x, y, 'PARAMETRY GRY', { fontSize: '28px', color: '#3498db', fontStyle: 'bold' }).setOrigin(0.5);
        
        const startY = y + 70;
        const spacing = 70;

        this.createNumericSetting(x, startY, 'Zakres A (min):', settings.zakresAmin, (val) => SaveManager.save({ zakresAmin: val }));
        this.createNumericSetting(x, startY + spacing, 'Zakres A (max):', settings.zakresA, (val) => SaveManager.save({ zakresA: val }));

        this.createNumericSetting(x, startY + (spacing * 2), 'Zakres B (min):', settings.zakresBmin, (val) => SaveManager.save({ zakresBmin: val }));
        this.createNumericSetting(x, startY + (spacing * 3), 'Zakres B (max):', settings.zakresB, (val) => SaveManager.save({ zakresB: val }));

        this.createNumericSetting(x, startY + (spacing * 4), 'Moja wybrana liczba:', settings.fixedA, (val) => SaveManager.save({ fixedA: val }));

        this.createCheckboxSetting(x, startY + (spacing * 5), 'Znam już ułamki:', settings.fractions, (val) => SaveManager.save({fractions: val}));

        
        this.add.text(x, startY + spacing * 6, 'Zmiany są zapisywane automatycznie', { 
            fontSize: '14px', 
            color: '#bdc3c7', 
            fontStyle: 'italic' 
        }).setOrigin(0.5);
    }

    private createNumericSetting(x: number, y: number, label: string, value: number, onUpdate: (val: number) => void) {
        // Label wyrównany do prawej od środka
        this.add.text(x - 20, y, label, { fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0.5);
        
        // Stylizacja inputu HTML
        const input = document.createElement('input');
        input.type = 'number';
        input.value = (value !== undefined ? value : 1).toString();

        input.value = value.toString();
        Object.assign(input.style, { 
            width: '100px', 
            height: '35px',
            fontSize: '20px', 
            textAlign: 'center',
            borderRadius: '8px',
            border: '2px solid #3498db',
            backgroundColor: '#ecf0f1',
            color: '#2c3e50',
            fontWeight: 'bold'
        });

        this.add.dom(x + 50, y, input);
        
        input.addEventListener('input', () => {
            let val = parseInt(input.value);
            if (!isNaN(val)) {                
                onUpdate(val);
            }
        });
    }

    private createCheckboxSetting(x: number, y: number, label: string, initialValue: boolean, onUpdate: (val: boolean) => void) {
    // 1. Label wyrównany do prawej (tak samo jak w numeric)
    this.add.text(x - 20, y, label, { 
        fontSize: '20px', 
        color: '#ffffff' 
    }).setOrigin(1, 0.5);

    // 2. Tworzymy element HTML input typu checkbox
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initialValue;

    // 3. Stylizacja CSS (spójna z Twoim inputem numeric)
    Object.assign(input.style, {
        width: '35px',              // Kwadratowy, wysokość taka sama jak numeric
        height: '35px',
        cursor: 'pointer',
        borderRadius: '8px',
        border: '2px solid #3498db',
        backgroundColor: '#ecf0f1',
        appearance: 'none',         // Usuwamy domyślny wygląd systemowy
        webkitAppearance: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s'
    });

    // Dodajemy "ptaszka" za pomocą pseudoelementu w CSS lub prostej zmiany koloru
    // Tutaj dla prostoty zmienimy tło, gdy zaznaczony
    const updateVisuals = () => {
        input.style.backgroundColor = input.checked ? '#3498db' : '#ecf0f1';
        input.style.color = input.checked ? '#ffffff' : 'transparent';
        input.value = input.checked ? '✓' : ''; // Wstawiamy znak bezpośrednio
        input.style.textAlign = 'center';
        input.style.fontSize = '24px';
        input.style.lineHeight = '35px';
    };

    // Ustawienie początkowe treści (ptaszka)
    input.style.display = 'inline-block';
    updateVisuals();

    // 4. Dodanie do sceny jako obiekt DOM
    // Ustawiamy x + 50, aby był w tej samej kolumnie co inputy liczbowe
    this.add.dom(x + 50, y, input);

    // 5. Obsługa zdarzenia zmiany
    input.addEventListener('change', () => {
        updateVisuals();
        onUpdate(input.checked);
    });
}
}