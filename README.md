
<img width="1024" height="1024" alt="Generated Image September 22, 2025 - 12_30PM" src="https://github.com/user-attachments/assets/76efd099-933b-4dd3-8a8b-d4c3e56ed7d5" />
/dépôt" GitHub 

# 🐉 Dragon CLI - Votre Assistant IA Personnel dans le Terminal

[![NPM Version](https://img.shields.io/npm/v/dragon-cli.svg?style=for-the-badge)](https://www.npmjs.com/package/dragon-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/dragon-cli.svg?style=for-the-badge)](https://www.npmjs.com/package/dragon-cli)
[![Licence](https://img.shields.io/github/license/Mauricio-100/Dragon?style=for-the-badge)](./LICENSE)

**Dragon CLI est un outil en ligne de commande qui transforme votre terminal en un dialogue intelligent avec une IA. Au lieu de vous souvenir de commandes complexes, décrivez simplement ce que vous voulez faire. Dragon se connecte à *votre propre serveur IA* pour une expérience rapide, sécurisée et entièrement sous votre contrôle.**

---

<p align="center">
  <i>"Crée un serveur express simple dans un fichier app.js"</i><br>
  <i>"Affiche les 5 derniers commits de ce projet"</i><br>
  <i>"Installe la dépendance 'chalk' avec npm"</i>
</p>

---

## Architecture : Comment ça fonctionne ?

La puissance de Dragon réside dans son architecture découplée. Le CLI est intentionnellement léger et ne contient aucune logique IA. Il agit comme une interface sécurisée vers votre propre cerveau distant.

1.  **Vous** donnez un ordre en langage naturel à Dragon CLI.
2.  **Dragon CLI** envoie cet ordre de manière sécurisée à votre serveur personnel.
3.  **Votre Serveur IA** (que vous contrôlez) reçoit l'ordre, le met en forme dans un prompt système, et l'envoie à l'API de Gemini.
4.  La réponse de l'IA est renvoyée à votre serveur, qui la formate en JSON et la transmet à Dragon CLI.
5.  **Dragon CLI** vous présente le plan d'action et attend votre confirmation avant d'exécuter quoi que ce soit.

Cette approche garantit que vos clés API secrètes ne sont **jamais** exposées sur la machine cliente.

## 🚀 Guide de Démarrage Complet en 3 Étapes

Pour utiliser Dragon, vous avez besoin de ses deux composantes : le cerveau (le serveur) et le corps (le CLI).

### Étape 1 : Déployer Votre Propre Serveur IA (Le Cerveau)

Le CLI a besoin d'une URL à qui parler. Nous fournissons un serveur template prêt à être déployé sur des plateformes comme Render.

1.  **Cliquez sur ce lien pour créer votre propre copie du serveur :**
    *   **[Utiliser ce template de serveur IA](https://github.com/Mauricio-100/Dragon-Server-Template)** <!-- Remplacez par le lien vers VOTRE template de serveur -->

2.  **Déployez ce nouveau dépôt sur un service d'hébergement** comme [Render](https://render.com/), Vercel, ou Heroku. Le déploiement est généralement automatique.

3.  **Configurez les variables d'environnement sur la plateforme d'hébergement :** Votre serveur aura besoin de connaître votre clé API secrète de Google. Dans les paramètres de votre service sur Render, ajoutez une variable d'environnement :
    *   `GEMINI_API_KEY`: Votre clé API que vous obtenez depuis Google AI Studio.
    *   `SECRET_KEY`: Une longue chaîne de caractères aléatoires que vous inventez, pour sécuriser les tokens de votre serveur.

4.  Une fois le déploiement terminé, Render vous donnera une URL publique. **Notez cette URL**, vous en aurez besoin.

### Étape 2 : Installer Dragon CLI (Le Corps)

Maintenant que le cerveau est en ligne, installez le client sur votre machine.

```bash
npm install -g dragon-cli```
<!-- Remplacez "dragon-cli" par le nom final de votre paquet sur npm -->
```
### Étape 3 : Configurer la Connexion

Créez un pont entre le corps et le cerveau.

1.  Créez un fichier `.env` dans votre répertoire personnel. C'est le moyen le plus sûr de stocker vos informations de connexion.
    ```bash
    nano ~/.env
    ```

2.  Ajoutez-y les informations de votre serveur. Le `BEARER_TOKEN` est la clé API (`sk-...`) que **votre propre serveur** a générée pour vous (via l'endpoint `/user/api-token` par exemple).

    ```env
    # L'URL de votre serveur déployé à l'étape 1
    SERVER_URL="https://votre-serveur-sur-render.onrender.com/chat-direct"
    ```

    # La clé API générée par VOTRE serveur pour vous authentifier
    .oso
    ```
    BEARER_TOKEN="sk-sxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ```

4.  Sauvegardez le fichier.

## 🎮 Utilisation

Tout est prêt ! Réveillez le Dragon :

```bash
drn
```
### Ex de Server utiliser 

```bash
// ==========================
//  IMPORTS DES MODULES
// ==========================
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

// ==========================
//  CONFIGURATION INITIALE
// ==========================
dotenv.config();
const app = express();

// Middlewares
app.use(express.json()); // Pour comprendre le JSON envoyé par le Dragon
app.use(cors());         // Pour autoriser les requêtes (bonne pratique)

const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const INTERNAL_SECRET_TOKEN = process.env.INTERNAL_SECRET_TOKEN;

// Validation : le serveur ne démarrera pas si les secrets ne sont pas définis
if (!GEMINI_API_KEY || !INTERNAL_SECRET_TOKEN) {
  console.error("ERREUR: GEMINI_API_KEY et INTERNAL_SECRET_TOKEN doivent être définis dans le fichier .env");
  process.exit(1); // Arrête le processus
}

// ==========================
//  CLIENT IA GEMINI
// ==========================
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Nous utilisons "gemini-pro", le modèle le plus stable et universellement disponible.
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


// ==========================
//  SÉCURITÉ (MIDDLEWARE D'AUTHENTIFICATION)
// ==========================
function apiAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extrait le token "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Accès non autorisé : token manquant." });
  }

  if (token !== INTERNAL_SECRET_TOKEN) {
    return res.status(403).json({ error: "Accès interdit : token invalide." });
  }

  next(); // Si le token est bon, on continue vers la route principale
}


// ==========================
//  LA ROUTE PRINCIPALE DE L'IA
// ==========================
// C'est ici que le Dragon CLI envoie ses requêtes.
app.post('/chat-direct', apiAuth, async (req, res) => {
  try {
    const { message } = req.body; // Le "message" est le prompt complet envoyé par le Dragon

    if (!message) {
      return res.status(400).json({ error: "Le champ 'message' est requis." });
    }

    // On envoie le prompt directement à Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const aiTextResponse = response.text();

    // On renvoie la réponse de l'IA au Dragon, dans un champ "reply"
    res.json({ reply: aiTextResponse });

  } catch (error) {
    console.error("Erreur lors de la communication avec l'API Gemini :", error);
    res.status(500).json({ error: `Erreur interne du serveur : ${error.message}` });
  }
});


// ==========================
//  DÉMARRAGE DU SERVEUR
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Le cerveau du Dragon est en ligne et écoute sur le port ${PORT}`);
});
```
##### L'interface apparaîtra, et vous pourrez commencer à dialoguer avec votre nouvel assistant. Pour quitter, tapez exit.

🛡️ Un Mot sur la Sécurité
La sécurité est primordiale. Dragon ne prendra jamais l'initiative d'exécuter une commande ou de modifier un fichier. Chaque plan d'action généré par l'IA vous est d'abord soumis pour approbation. Vous avez toujours le contrôle final.

Approuvez-vous cette action ? (Exécuter: git log -n 5) (y/n) >

📜 Licence
Distribué sous la licence MIT. Voir LICENSE pour plus d'informations.
