// src/components/GameButton.ts
import Phaser from 'phaser';

export type ButtonSize = 1 | 2 | 3 | 4;
export type ButtonColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
export type IconName = 'coin' | 'settings' | 'play' | 'info_icon' | 'back' | 'user'; // Dodaj nazwy swoich ikon

interface ButtonConfig {
    width: number;
    height: number;
    fontSize: number;
    radius: number;
    iconOffset?: number; // Opcjonalny offset dla ikony
}

export class GameButton extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private icon?: Phaser.GameObjects.Image; // Ikona jest opcjonalna
    private colorValue: number;
    private config: ButtonConfig;
    private onOverCallback?: () => void;
    private onOutCallback?: () => void;
    //private label: string; // Przechowujemy label dla ewentualnego przeliczania pozycji

    // --- PALETA KOLORÓW ---
    private static readonly COLORS: Record<ButtonColor, number> = {
        primary: 0x3498db, 
        success: 0x2ecc71, 
        danger:  0xe74c3c, 
        warning: 0xf1c40f, 
        info:    0x9b59b6, 
        dark:    0x2c3e50  
    };

    // --- ROZMIARY Z DODATKOWYM ODCINKIEM DLA IKON ---
    private static readonly SIZES: Record<ButtonSize, ButtonConfig> = {
        1: { width: 50,  height: 40, fontSize: 18, radius: 8 },
        2: { width: 100, height: 40, fontSize: 18, radius: 12, iconOffset: 15 }, // Ikona trochę odsunięta
        3: { width: 130, height: 40, fontSize: 18, radius: 12, iconOffset: 20 },
        4: { width: 300, height: 60, fontSize: 28, radius: 15, iconOffset: 25 }
    };

    constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        label: string, 
        colorTheme: ButtonColor | number, 
        sizeType: ButtonSize, 
        callback: () => void,
        iconName?: IconName, // Opcjonalny parametr ikony
        onOver?: () => void,
        onOut?: () => void
    ) {
        super(scene, x, y);
        //this.label = label;
        
        this.onOverCallback = onOver;
        this.onOutCallback = onOut;

        this.colorValue = typeof colorTheme === 'string' 
            ? GameButton.COLORS[colorTheme] 
            : colorTheme;
        this.config = GameButton.SIZES[sizeType];

        this.bg = scene.add.graphics();
        this.drawNormal();

        this.text = scene.add.text(0, 0, label, {
            fontSize: this.config.fontSize + 'px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // --- OBSŁUGA IKONY ---
        if (iconName) {
            this.icon = scene.add.image(0, 0, `icon_${iconName}`); // Nazwa pliku to 'icon_' + nazwa
            this.icon.setScale(this.config.fontSize / this.icon.width); // Skalowanie do wielkości czcionki
            this.icon.setOrigin(0.5);
            this.add(this.icon);
        }
        // --- KONIEC OBSŁUGI IKONY ---

        this.add([this.bg, this.text]);
        this.positionContent(iconName); // Nowa funkcja do pozycjonowania

        const hitArea = new Phaser.Geom.Rectangle(
            -this.config.width / 2, 
            -this.config.height / 2, 
            this.config.width, 
            this.config.height
        );
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.input!.cursor = 'pointer';

        this.setupAnimations(scene, callback);
        scene.add.existing(this);
    }

    // --- NOWA METODA DO POZYCJONOWANIA TEKSTU I IKONY ---
    private positionContent(iconName?: IconName) {
        if (iconName && this.icon) {
            // Obliczamy szerokość tekstu, żeby przesunąć go w prawo
            const textWidth = this.text.width; 
            const iconWidth = this.icon.displayWidth; // Używamy displayWidth po skalowaniu

            // Przesuwamy ikonę w lewo, a tekst w prawo
            this.icon.x = - (textWidth / 2) - (iconWidth / 2) - (this.config.iconOffset || 0);
            this.text.x = (iconWidth / 2) + (textWidth / 2) + (this.config.iconOffset || 0);
            
            // Jeszcze raz to dopracujmy:
            // Obliczamy całkowitą szerokość "treści" (tekst + ikona + odstęp)
            const totalContentWidth = textWidth + iconWidth + (this.config.iconOffset || 0);

            // Przesuwamy ikonę i tekst tak, aby były wyśrodkowane
            this.icon.x = -totalContentWidth / 2 + iconWidth / 2;
            this.text.x = this.icon.x + iconWidth / 2 + (this.config.iconOffset || 0) + textWidth / 2;

        } else {
            this.text.x = 0; // Tekst wyśrodkowany
        }
    }
    // --- KONIEC NOWEJ METODY ---

    private drawNormal() {
        const { width, height, radius } = this.config;
        this.bg.clear();
        
        this.bg.fillStyle(0x000000, 0.2);
        this.bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width, height, radius);

        this.bg.fillStyle(this.colorValue, 1);
        this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        
        this.bg.lineStyle(2, 0xffffff, 1);
        this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    }

    private setupAnimations(scene: Phaser.Scene, callback: () => void) {
        this.on('pointerover', () => {
            this.bg.clear();
            const { width, height, radius } = this.config;
            this.bg.fillStyle(0x000000, 0.2);
            this.bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width, height, radius);
            this.bg.fillStyle(this.colorValue, 1);
            this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
            this.bg.lineStyle(3, 0xf1c40f, 1); 
            this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

            scene.tweens.add({ targets: this, scale: 1.05, duration: 100 });
            if (this.onOverCallback) this.onOverCallback();
        });

        this.on('pointerout', () => {
            this.drawNormal();
            scene.tweens.add({ targets: this, scale: 1.0, duration: 100 });
            if (this.onOutCallback) this.onOutCallback();
        });

        this.on('pointerdown', () => {
            scene.tweens.add({
                targets: this,
                scale: 0.92,
                duration: 50,
                yoyo: true,
                onComplete: callback
            });
        });
    }

    public updateText(newText: string) {
        //this.label = newText; // Zapisujemy nowy label
        this.text.setText(newText);
        this.positionContent(this.icon ? (this.icon.texture.key.replace('icon_', '') as IconName) : undefined); // Przeliczamy pozycję
    }
    public updateTheme(newColorTheme: ButtonColor | number) {
    this.colorValue = typeof newColorTheme === 'string' 
        ? GameButton.COLORS[newColorTheme] 
        : newColorTheme;
    this.drawNormal(); 
}
}