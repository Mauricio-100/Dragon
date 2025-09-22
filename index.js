#!/usr/bin/env node

// ÉTAPE 1: Ajout du polyfill pour 'fetch' pour la compatibilité avec Node.js v16
const fetch = require('node-fetch');
global.fetch = fetch;

// ÉTAPE 2: Importation de toutes les autres dépendances
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execa } = require('execa');
const chalk = require('chalk');
const dotenv = require('dotenv');
const figlet = require('figlet');
const gradient = require('gradient-string');
const fs = require('fs/promises');
const readline = require('readline');

// --- CONFIGURATION ---
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// Utilisation du modèle Gemini Flash pour une vitesse maximale
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Création de l'interface readline pour les prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question et attendre la réponse
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// --- FONCTION PRINCIPALE DU SHELL DRAGON ---
async function dragonShell() {
  // 1. L'éveil du Dragon
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
  
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Que puis-je faire pour vous ? (Tapez "exit" pour quitter)\nOriginal by powered Dragon 🐉'));

  // 2. La boucle de commande
  while (true) {
    const task = await askQuestion(chalk.bold.red('🐉 > '));

    if (task.toLowerCase() === 'exit') {
      console.log(chalk.yellow('Le dragon retourne à son sommeil...'));
      break;
    }

    if(task.trim() !== '') {
        await processTask(task);
    }
  }
  rl.close();
}

// --- LE CERVEAU DU DRAGON ---
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
    
    Voici la demande de l'utilisateur : "${task}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const action = JSON.parse(responseText);

    await executeAction(action);

  } catch (error) {
    console.error(chalk.red('Erreur de communication avec le cerveau du Dragon :'), error);
    console.log(chalk.yellow('Veuillez reformuler votre demande ou vérifier votre clé API.'));
  }
}

// --- LES GRIFFES DU DRAGON ---
async function executeAction(action) {
  console.log(chalk.cyan(`\n🔥 Plan du Dragon : ${action.explanation}`));

  if (action.type === 'error' || (!action.command && !action.code)) {
    console.log(chalk.yellow("Le Dragon ne peut pas traiter cette demande ou l'a mal interprétée.\n"));
    return;
  }

  // 3. LA CONFIRMATION
  const confirmationMessage = `Approuvez-vous cette action ? (${action.type === 'shell' ? `Exécuter: ${chalk.bold.yellow(action.command)}` : `Écrire dans: ${chalk.bold.yellow(action.filename)}`}) (y/n) > `;
  const answer = await askQuestion(confirmationMessage);
  
  if (answer.toLowerCase() !== 'y') {
    // LA CORRECTION : Utilisation de guillemets doubles pour éviter l'erreur de syntaxe
    console.log(chalk.red("Action annulée par l'utilisateur.\n"));
    return;
  }
  
  // 4. L'ACTION
  if (action.type === 'shell') {
    try {
      console.log(chalk.gray(`\nRUNNING: ${action.command}\n`));
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
