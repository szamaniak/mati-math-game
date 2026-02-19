// src/components/GameButton.ts
import Phaser from 'phaser';

export type ButtonSize = 1 | 2 | 3 | 4;

interface ButtonConfig {
    width: number;
    height: number;
    fontSize: number;
    radius: number;
}
export class GameButton extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Graphics;
    private text: Phaser.GameObjects.Text;
    private color: number;
    private config: ButtonConfig;

    // Definicja naszych schematów (presetów)
    private static readonly SIZES: Record<ButtonSize, ButtonConfig> = {
        1: { width: 50, height: 40, fontSize: 18, radius: 8 },  // Mały (np. pomocnicze)
        2: { width: 100, height: 40, fontSize: 18, radius: 12 }, // Średni (standardowy)
        3: { width: 130, height: 40, fontSize: 18, radius: 12 }, // Duży 
        4: { width: 300, height: 60, fontSize: 28, radius: 15 }  // Duży (menu)
    };
constructor(
        scene: Phaser.Scene, 
        x: number, 
        y: number, 
        label: string, 
        color: number, 
        sizeType: ButtonSize, // Zmieniamy fontSize na typ rozmiaru
        callback: () => void
    ) {
        super(scene, x, y);
        
        this.color = color;
        this.config = GameButton.SIZES[sizeType];

        // 1. Rysowanie tła
        this.bg = scene.add.graphics();
        this.drawNormal();

        // 2. Tekst
        this.text = scene.add.text(0, 0, label, {
            fontSize: this.config.fontSize + 'px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // 3. Dodanie do kontenera
        this.add([this.bg, this.text]);

        // 4. Interakcja - Dynamiczna strefa kliknięcia na podstawie konfiguracji
        const hitArea = new Phaser.Geom.Rectangle(
            -this.config.width / 2, 
            -this.config.height / 2, 
            this.config.width, 
            this.config.height
        );
        this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.input!.cursor = 'pointer';

        // 5. Efekty (Tweens)
        this.setupAnimations(scene, callback);

        scene.add.existing(this);
    }

    private drawNormal() {
        const { width, height, radius } = this.config;
        this.bg.clear();
        
        // Cień (opcjonalny, dodaje głębi)
        this.bg.fillStyle(0x000000, 0.2);
        this.bg.fillRoundedRect(-width / 2 + 3, -height / 2 + 3, width, height, radius);

        // Główny przycisk
        this.bg.fillStyle(this.color, 1);
        this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        
        // Obramowanie
        this.bg.lineStyle(2, 0xffffff, 1);
        this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    }

    private setupAnimations(scene: Phaser.Scene, callback: () => void) {
        this.on('pointerover', () => {
                                   
            scene.tweens.add({ targets: this, scale: 1.1, duration: 100 });
        });

        this.on('pointerout', () => {
            this.bg.lineStyle(2, 0xffffff, 1); // Przywracamy białą obwódkę
            scene.tweens.add({ targets: this, scale: 1.0, duration: 100 });
        });

        this.on('pointerdown', () => {
            scene.tweens.add({
                targets: this,
                scale: 0.95,
                duration: 50,
                yoyo: true, // Automatyczny powrót skali
                onComplete: callback
            });
        });
    }

    public updateText(newText: string) {
        this.text.setText(newText);
    }
}