// src/components/GameButton.ts
import Phaser from 'phaser';

export type ButtonSize = 1 | 2 | 3 | 4;
export type ButtonColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
export type IconName = 'coin' | 'settings' | 'play' | 'info_icon' | 'back' | 'user';

/**
 * Interfejs konfiguracji wejściowej przycisku
 */
export interface IButtonOptions {
    label: string;
    callback: () => void;
    width?: number;
    height?: number;
    style?: ButtonColor;
    size?: ButtonSize;
    icon?: IconName;
    onOver?: () => void;
    onOut?: () => void;
}

/**
 * Wewnętrzna konfiguracja wymiarów
 */
interface ButtonConfig {
    width: number;
    height: number;
    fontSize: number;
    radius: number;
}

export class GameButton extends Phaser.GameObjects.Container {
    private bg!: Phaser.GameObjects.Graphics;
    private text!: Phaser.GameObjects.Text;
    private icon?: Phaser.GameObjects.Image;
    private colorValue: number;
    private config: ButtonConfig;
    private onOverCallback?: () => void;
    private onOutCallback?: () => void;

    // --- PALETA KOLORÓW ---
    private static readonly COLORS: Record<ButtonColor, number> = {
        primary: 0x3498db, 
        success: 0x2ecc71, 
        danger:  0xe74c3c, 
        warning: 0xf1c40f,
        info:    0x9b59b6,
        dark:    0x2c3e50
    };

    // --- PREDEFINIOWANE ROZMIARY ---
    private static readonly SIZES: Record<ButtonSize, ButtonConfig> = {
        1: { width: 100, height: 40, fontSize: 14, radius: 8 },
        2: { width: 160, height: 50, fontSize: 18, radius: 10 },
        3: { width: 220, height: 60, fontSize: 22, radius: 12 },
        4: { width: 300, height: 80, fontSize: 28, radius: 15 }
    };

    constructor(scene: Phaser.Scene, x: number, y: number, options: IButtonOptions) {
        super(scene, x, y);

        // 1. Destrukturyzacja opcji z domyślnymi wartościami
        const {
            label,
            callback,
            width = 0,
            height = 0,
            style = 'primary',
            size = 2,
            icon,
            onOver,
            onOut
        } = options;

        // 2. Inicjalizacja konfiguracji (Kopia głęboka obiektu!)
        const baseConfig = GameButton.SIZES[size] || GameButton.SIZES[2];
        this.config = { ...baseConfig };

        // Nadpisanie wymiarów jeśli podano w options
        if (width > 0) this.config.width = width;
        if (height > 0) this.config.height = height;

        this.colorValue = GameButton.COLORS[style] || GameButton.COLORS.primary;
        this.onOverCallback = onOver;
        this.onOutCallback = onOut;

        // 3. Budowa wizualna
        this.setupVisuals(scene, label, icon);

        // 4. Rejestracja w scenie
        scene.add.existing(this);

        // 5. Obsługa interakcji
        this.setupInteractions(scene, callback);
    }

    private setupVisuals(scene: Phaser.Scene, label: string, iconName?: IconName) {
        this.bg = scene.add.graphics();
        
        this.text = scene.add.text(0, 0, label, {
            fontSize: `${this.config.fontSize}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add(this.bg);
        this.add(this.text);

        if (iconName) {
            this.icon = scene.add.image(0, 0, iconName);
            this.add(this.icon);
        }

        this.drawNormal();
        this.positionContent();
    }

    private setupInteractions(scene: Phaser.Scene, callback: () => void) {
        // Obszar trafienia (Hit Area)
        const hitArea = new Phaser.Geom.Rectangle(
            -this.config.width / 2, 
            -this.config.height / 2, 
            this.config.width, 
            this.config.height
        );
        
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.on('pointerover', () => {
            this.drawHover();
            scene.tweens.add({ targets: this, scale: 1.05, duration: 100 });
            this.onOverCallback?.();
        });

        this.on('pointerout', () => {
            this.drawNormal();
            scene.tweens.add({ targets: this, scale: 1.0, duration: 100 });
            this.onOutCallback?.();
        });

        this.on('pointerdown', () => {
            scene.tweens.add({
                targets: this,
                scale: 0.92,
                duration: 50,
                yoyo: true,
                onComplete: () => callback()
            });
        });
    }

    private drawNormal() {
        const { width, height, radius } = this.config;
        this.bg.clear();
        
        // Cień
        this.bg.fillStyle(0x000000, 0.3);
        this.bg.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, width, height, radius);

        // Przycisk
        this.bg.fillStyle(this.colorValue, 1);
        this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

        // Ramka
        this.bg.lineStyle(2, 0xffffff, 0.3);
        this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    }

    private drawHover() {
        const { width, height, radius } = this.config;
        this.bg.clear();

        // Mocniejszy cień
        this.bg.fillStyle(0x000000, 0.4);
        this.bg.fillRoundedRect(-width / 2 + 6, -height / 2 + 6, width, height, radius);

        // Jaśniejszy kolor tła (efekt hover)
        this.bg.fillStyle(this.colorValue, 1);
        this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

        // Złota ramka
        this.bg.lineStyle(3, 0xf1c40f, 1); 
        this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    }

    private positionContent() {
        if (this.icon) {
            const spacing = 10;
            const totalWidth = this.icon.displayWidth + spacing + this.text.width;
            
            this.icon.x = -totalWidth / 2 + this.icon.displayWidth / 2;
            this.text.x = this.icon.x + this.icon.displayWidth / 2 + spacing + this.text.width / 2;
        } else {
            this.text.setPosition(0, 0);
        }
    }
    public updateTheme(newStyle: ButtonColor) {
        this.colorValue = GameButton.COLORS[newStyle];
        this.drawNormal(); // Przerysuj przycisk z nowym kolorem
    }

    public updateText(newText: string) {
        this.text.setText(newText);
        this.positionContent();
    }
}