
// Utilisation de 'require' pour la compatibilité avec Node.js v16 et CommonJS
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execa } = require('execa'); // execa version 5.1.1 est compatible
const chalk = require('chalk');
const dotenv = require('dotenv');
const inquirer = require('inquirer'); // inquirer version 8.2.4 est compatible
const figlet = require('figlet');
const gradient = require('gradient-string');
const fs = require('fs/promises'); // fs/promises est disponible depuis Node 10.0.0

// --- CONFIGURATION ---
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- FONCTION PRINCIPALE DU SHELL DRAGON ---
async function dragonShell() {
  // 1. L'éveil du Dragon : Changer l'interface du terminal
  console.clear();
  const dragonAscii = `
                   /\\)
    _             ((\\
   (((\\
    \\ \\\\
     \\ \\\\    /\\)
      \\ \\\\  ((\\
       \\ \\\\ / \\
        \\ \\\\/
         \\_\\
  `;
  console.log(gradient.passion(dragonAscii));
  const figletText = figlet.textSync('DRAGON', { font: 'Standard' });
  console.log(gradient.passion(figletText));
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Que puis-je faire pour vous ? (Tapez "exit" pour quitter)'));

  // 2. La boucle de commande : Dragon écoute en permanence
  while (true) {
    const { task } = await inquirer.prompt([{
      type: 'input',
      name: 'task',
      message: chalk.bold.red('🐉 >'),
      prefix: '',
    }]);

    if (task.toLowerCase() === 'exit') {
      console.log(chalk.yellow('Le dragon retourne à son sommeil...'));
      break;
    }

    if(task.trim() !== '') {
        await processTask(task);
    }
  }
}

// --- LE CERVEAU DU DRAGON : Interpréter la tâche ---
async function processTask(task) {
  console.log(chalk.blue('🐉 Le dragon réfléchit...'));
  
  const prompt = `
    Tu es Dragon, une IA experte qui opère dans un terminal.
    Ta tâche est de convertir une demande en langage naturel en une commande shell exécutable OU en un bloc de code à écrire dans un fichier.
    Réponds TOUJOURS avec un objet JSON, et rien d'autre. Le JSON doit avoir la structure suivante :
    {
      "explanation": "Une brève explication de ce que tu vas faire, en une phrase.",
      "type": "shell" | "code" | "error",
      "command": "Si type='shell', la commande exacte à exécuter. Sinon, null.",
      "filename": "Si type='code', le nom du fichier à créer. Sinon, null.",
      "code": "Si type='code', le code à écrire. Sinon, null."
    }
    Exemples de demandes et réponses attendues :
    - Demande: "liste tous les fichiers dans le dossier actuel avec les détails" -> {"explanation": "Je vais lister les fichiers et détails du répertoire courant.", "type": "shell", "command": "ls -la", "filename": null, "code": null}
    - Demande: "crée un serveur express simple dans un fichier server.js" -> {"explanation": "Je vais créer un fichier server.js avec un code de base pour un serveur Express.", "type": "code", "command": null, "filename": "server.js", "code": "const express = require('express');\\nconst app = express();\\nconst port = 3000;\\n\\napp.get('/', (req, res) => {\\n  res.send('Hello World!');\\n});\\n\\napp.listen(port, () => {\\n  console.log(\`Example app listening at http://localhost:\${port}\`);\\n});"}
    - Demande: "comment vas-tu ?" -> {"explanation": "Je ne peux pas répondre à cette question, je ne peux que générer du code ou des commandes.", "type": "error", "command": null, "filename": null, "code": null}
    
    Voici la demande de l'utilisateur : "${task}"
  `;

  try {
    const result = await model.generateContent(prompt);
    // Assurez-vous de bien nettoyer la réponse JSON de l'IA
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const action = JSON.parse(responseText);

    await executeAction(action);

  } catch (error) {
    console.error(chalk.red('Erreur de communication avec le cerveau du Dragon :'), error);
    console.log(chalk.yellow('Veuillez reformuler votre demande ou vérifier votre clé API.'));
  }
}

// --- LES GRIFFES DU DRAGON : Exécuter l'action ---
async function executeAction(action) {
  console.log(chalk.cyan(`\n🔥 Plan du Dragon : ${action.explanation}`));

  if (action.type === 'error' || (!action.command && !action.code)) {
    console.log(chalk.yellow("Le Dragon ne peut pas traiter cette demande ou l'a mal interprétée.\n"));
    return;
  }

  // 3. LA CONFIRMATION : Le garde-fou ultime
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Approuvez-vous cette action ? (${action.type === 'shell' ? `Exécuter: ${chalk.bold.yellow(action.command)}` : `Écrire dans: ${chalk.bold.yellow(action.filename)}`})`,
    default: false,
  }]);

  if (!confirm) {
    console.log(chalk.red('Action annulée par l\'utilisateur.\n'));
    return;
  }
  
  // 4. L'ACTION
  if (action.type === 'shell') {
    try {
      console.log(chalk.gray(`\nRUNNING: ${action.command}\n`));
      // Exécute la commande et affiche la sortie en temps réel
      const subprocess = execa(action.command, { shell: true });
      subprocess.stdout.pipe(process.stdout);
      subprocess.stderr.pipe(process.stderr);
      await subprocess;
      console.log(chalk.green('\nCommande exécutée avec succès.\n'));
    } catch (error) {
      console.error(chalk.red(`\nErreur lors de l'exécution de la commande : ${error.message}\n`));
    }
  } else if (action.type === 'code') {
    try {
      await fs.writeFile(action.filename, action.code);
      console.log(chalk.green(`Fichier ${action.filename} créé/modifié avec succès.\n`));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'écriture du fichier : ${error.message}\n`));
    }
  }
}

// --- DÉMARRAGE ---
dragonShell();
