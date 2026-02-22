import Phaser from 'phaser';
import { GameButton } from '../components/GameButton';
import { AuthManager } from '../managers/AuthManager';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
//import { SaveManager } from '../logic/SaveManager';
//import type { GameSettings } from '../logic/SaveManager';

export class LoginScene extends Phaser.Scene {
    private loginInput?: any;

    constructor() {
        super('LoginScene');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Tło i Tytuł
        this.add.text(width / 2, 80, 'MatiMatyk', { 
            fontSize: '42px', fontStyle: 'bold', color: '#f1c40f' 
        }).setOrigin(0.5);

        // 2. Formularz HTML (Nick i Hasło)
        // Tworzymy prosty formularz w pamięci
        const htmlForm = `
            <div style="display: flex; flex-direction: column; gap: 10px; width: 250px;">
                <input type="text" name="username" placeholder="Nick lub Email" 
                    style="padding: 10px; border-radius: 5px; border: none; font-size: 16px;">
                <input type="password" name="password" placeholder="Hasło" 
                    style="padding: 10px; border-radius: 5px; border: none; font-size: 16px;">
            </div>
        `;

        this.loginInput = this.add.dom(width / 2, height / 2 - 40).createFromHTML(htmlForm);
        // Obsługa klawisza Enter do zatwierdzania odpowiedzi
        this.input.keyboard?.on('keydown-ENTER', () => this.handleLogin());

        // 3. Przycisk Logowania
        new GameButton(this, width / 2, height / 2 + 80, 'ZALOGUJ SIĘ', 'success', 4, () => {
            this.handleLogin();
        });

        // 4. Przycisk Rejestracji
        new GameButton(this, width / 2, height / 2 + 150, 'ZAŁÓŻ KONTO', 'primary', 3, () => {
            this.handleRegister();
        });

        // 5. Przycisk Google
        new GameButton(this, width / 2, height / 2 + 220, 'Loguj -> Google', 'dark', 4, () => {
            this.handleGoogleLogin();
        });

        onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Użytkownik zalogowany:", user.displayName);
        // Tutaj robimy migrację (o której wspominałeś) i zmieniamy scenę
        this.handlePostLogin(user);
        }
    });
    }

    private async handleLogin() {
        const username = (this.loginInput.getChildByName('username') as HTMLInputElement).value;
        const password = (this.loginInput.getChildByName('password') as HTMLInputElement).value;

        if (!username || !password) return alert("Wypełnij wszystkie pola!");

        const result = await AuthManager.login(username, password);
        if (!result.success) {            
            alert(result.message);
        }
    }

   private async handlePostLogin(user: any) {
    // Wywołujemy wspólną logikę przygotowania sesji
    await AuthManager.prepareSessionAndGo(user, this);
}

    private async handleRegister() {
        const username = (this.loginInput.getChildByName('username') as HTMLInputElement).value;
        const password = (this.loginInput.getChildByName('password') as HTMLInputElement).value;

        if (username.length < 3) return alert("Nick za krótki!");

        const result = await AuthManager.register(username, password);
        if (result.success) {
            alert("Konto utworzone! Możesz się zalogować.");
        } else {
            alert(result.message);
        }
    }

    private async handleGoogleLogin() {
        const result = await AuthManager.loginWithGoogle();
        if (result.success) {
            this.scene.start('MathScene');
        }
    }
    
    
}