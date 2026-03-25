// src/managers/UIManager.ts
import Phaser from 'phaser';
import { GameButton } from '../components/GameButton';

export class UIManager {
    /**
     * Wyświetla eleganckie okno modalne z ciekawostką
     */
    static showTriviaModal(scene: Phaser.Scene, fact: string, onUpdate?: () => void) {
        const { width, height } = scene.scale;

        // Kontener na całe okno (ułatwia animację całości)
        const modalContainer = scene.add.container(0, 0).setDepth(1000).setAlpha(0);

        // 1. Ciemne tło (Overlay)
        const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive();

        // 2. Panel okna
        const panelWidth = 500;
        const panelHeight = 350;
        const panel = scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0xffffff)
            .setStrokeStyle(4, 0xf1c40f);

        // 3. Nagłówek
        const title = scene.add.text(width / 2, height / 2 - 130, 'CIEKAWOSTKA DNIA 💡', {
            fontSize: '28px', 
            fontStyle: 'bold', 
            color: '#2c3e50',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 4. Treść ciekawostki
        const content = scene.add.text(width / 2, height / 2 - 20, fact, {
            fontSize: '20px', 
            color: '#34495e',
            align: 'center',
            wordWrap: { width: 440 },
            lineSpacing: 8
        }).setOrigin(0.5);

        // 5. Przycisk zamknięcia
        // Używamy Twojego GameButton - musimy go dodać do kontenera ręcznie lub pozycjonować
        const closeBtn = new GameButton(scene, width / 2, height / 2 + 120, {
            label: 'Super!', 
            style: 'success', 
            size: 2, 
            callback: () => {
            scene.add.tween({
                targets: modalContainer,
                alpha: 0,
                scale: 0.9,
                duration: 200,
                onComplete: () => {
                    modalContainer.destroy();
                    if (onUpdate) onUpdate(); // Wywołujemy callback (np. skok Einsteina)
                }
            });
        }});

        // Składamy wszystko do kontenera
        modalContainer.add([overlay, panel, title, content, closeBtn]);

        // Animacja wejścia
        scene.add.tween({
            targets: modalContainer,
            alpha: 1,
            duration: 300
        });

        return modalContainer;
    }

    /**
     * Możesz tu później dodać showRewardModal, showLevelUp itd.
     */
}