<!-- Remplacez "dragon-cli" par le nom de votre paquet npm -->
<!-- Remplacez "Mauricio-100/Dragon" par votre "utilisateur/dépôt" GitHub -->

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
##### L'interface apparaîtra, et vous pourrez commencer à dialoguer avec votre nouvel assistant. Pour quitter, tapez exit.

🛡️ Un Mot sur la Sécurité
La sécurité est primordiale. Dragon ne prendra jamais l'initiative d'exécuter une commande ou de modifier un fichier. Chaque plan d'action généré par l'IA vous est d'abord soumis pour approbation. Vous avez toujours le contrôle final.

Approuvez-vous cette action ? (Exécuter: git log -n 5) (y/n) >

📜 Licence
Distribué sous la licence MIT. Voir LICENSE pour plus d'informations.
