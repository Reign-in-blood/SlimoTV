# SlimoTV

Télécommande infrarouge Android simplifiée pour une **LG 42CS460-ZA (2012)**.

Version 0.1.0 : trois boutons uniquement (**ON/OFF**, **VOL+**, **VOL−**), interface gris sombre inspirée de la télécommande LG fournie dans `Images/cmb4695.jpg`.

## Codes IR de départ (non encore testés)

Profil supposé compatible : **LG 6710V00090N Older TV**. Encodage **NEC1, 32 bits**, fréquence **38 000 Hz** :

| Bouton | Code |
| --- | --- |
| ON / OFF | `0x20DF10EF` |
| Volume + | `0x20DF40BF` |
| Volume - | `0x20DFC03F` |

Si un code ne fonctionne pas, ouvrir **Réglages avancés → Codes IR**, modifier le code de la commande, et enregistrer. Les réglages sont stockés localement sur le téléphone et peuvent être réinitialisés. Le remappage porte sur les codes NEC1, pas encore sur d'autres protocoles IR.

## Technique

Projet **Vite + TypeScript + Capacitor 7**, basé sur l'architecture de [iDual Remote](https://github.com/Reign-in-blood/Idual_app). L'émission native utilise `ConsumerIrManager` d'Android et le plugin Java `ConsumerIrPlugin`. Aucun réseau n'est nécessaire pour utiliser la télécommande.

L'interface peut être ouverte dans un navigateur avec `npm run dev`, mais **l'émission infrarouge ne fonctionne que dans l'application Android, sur un téléphone avec émetteur IR**.

## Construction Android (Windows / PowerShell)

Installer **Node.js**, **Android SDK** (Android Studio) et **Eclipse Temurin JDK 21**.

```powershell
git clone https://github.com/Reign-in-blood/SlimoTV.git
cd SlimoTV
npm ci
.\scripts\build-android.ps1
```

Le script prépare automatiquement le projet Android si nécessaire, copie le plugin IR, synchronise Capacitor et compile l'APK avec Java 21.

**APK locale** : `android/app/build/outputs/apk/debug/app-debug.apk`

Une GitHub Action construit aussi un APK de test à chaque push sur `master`. Aller dans **Actions → SlimoTV - Android debug APK → dernier run → Artifacts → SlimoTV-debug-apk**.

## Notes

- Les codes ont été repris d'un profil de télécommande LG ancien et restent **à valider sur la TV réelle**.
- La fonction d'appui long / répétition continue pour le volume n'est pas implémentée dans ce premier prototype. Un appui transmet une trame.
- Aucun contenu de `Images/` n'est modifié.
