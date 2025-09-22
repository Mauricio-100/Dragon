#!/usr/bin/env node

// Importations des modules nécessaires
const fetch = require('node-fetch');
const { execa } = require('execa');
const chalk = require('chalk');
const dotenv = require('dotenv');
const figlet = require('figlet');
const gradient = require('gradient-string');
const fs = require('fs/promises');
const readline = require('readline');
const os = require('os');
const path = require('path');

// --- CONFIGURATION ---
// Charge les variables d'environnement depuis le fichier .env à la racine du répertoire de l'utilisateur (ex: ~/.env)
// C'est la méthode la plus robuste pour que la commande `drn` fonctionne de n'importe où.
dotenv.config({ path: path.join(os.homedir(), '.env') });
const MY_SERVER_URL = process.env.SERVER_URL;
const MY_BEARER_TOKEN = process.env.BEARER_TOKEN;

// Création de l'interface pour lire les entrées utilisateur
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Fonction utilitaire pour poser une question et attendre la réponse
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// --- FONCTION PRINCIPALE DU SHELL DRAGON ---
async function dragonShell() {
  console.clear();
  
  // Affichage du logo et du titre
  const dragonAscii = `
                   /\\)
    _             ((\\
   (((\\
    \ \\\\
     \ \\\\    /\\)
      \ \\\\  ((\\
       \ \\\\ / \\
        \ \\\\/
         \_\
  `;
  console.log(gradient.passion(dragonAscii));
  const figletText = figlet.textSync('DRAGON', { font: 'Standard' });
  console.log(gradient.passion(figletText));
  
  // Affichage du message de bienvenue et du crédit
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Que puis-je faire pour vous ? (Tapez "exit" pour quitter)'));
  const poweredByText = "Original by powered Dragon 🐉";
  const terminalWidth = process.stdout.columns || 80;
  const padding = " ".repeat(Math.max(0, terminalWidth - poweredByText.length));
  console.log(chalk.gray(padding + poweredByText));

  // Boucle principale pour écouter les commandes de l'utilisateur
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

// --- LE CERVEAU DU DRAGON : Communication avec le serveur IA ---
async function processTask(task) {
  console.log(chalk.blue('🐉 Le dragon contacte son cerveau distant...'));
  
  // Le prompt est envoyé au serveur, qui lui-même l'utilisera pour interroger l'IA.
  const prompt = `
    Tu es Dragon, une IA experte qui opère dans un terminal.
    Ta tâche est de convertir une demande en langage naturel en une commande shell exécutable OU en un bloc de code à écrire dans un fichier.
    Réponds TOUJOURS avec un objet JSON, et rien d'autre. La structure du JSON doit être :
    { "explanation": "...", "type": "shell" | "code" | "error", "command": "...", "filename": "...", "code": "..." }
    Voici la demande de l'utilisateur : "${task}"
  `;

  try {
    // Envoi de la requête au serveur personnel sur Render
    const response = await fetch(MY_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MY_BEARER_TOKEN}`
      },
      body: JSON.stringify({ message: prompt })
    });

    if (!response.ok) {
        throw new Error(`Erreur du serveur : ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Extraction intelligente du JSON, même si l'IA est un peu "bavarde"
    let responseText = aiResponse.reply || '';
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');

    let action = {};
    if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
      const jsonString = responseText.substring(startIndex, endIndex + 1);
      try {
        action = JSON.parse(jsonString);
      } catch (e) {
        console.log(chalk.red("Le Dragon n'a pas pu comprendre la réponse du cerveau (JSON invalide)."));
        return;
      }
    } else {
      console.log(chalk.red("Le Dragon n'a pas trouvé de plan d'action (JSON) dans la réponse du cerveau."));
      return;
    }

    await executeAction(action);

  } catch (error) {
    console.error(chalk.red('Erreur de communication avec votre serveur :'), error);
    console.log(chalk.yellow('Veuillez vérifier votre URL, votre token et que votre serveur est bien en ligne.'));
  }
}

// --- LES GRIFFES DU DRAGON : Exécution des actions ---
async function executeAction(action) {
  if (!action || !action.explanation) {
    console.log(chalk.yellow("Le Dragon n'a pas pu interpréter la demande.\n"));
    return;
  }
    
  console.log(chalk.cyan(`\n🔥 Plan du Dragon : ${action.explanation}`));

  if (action.type === 'error' || (!action.command && !action.code)) {
    console.log(chalk.yellow("Le Dragon ne peut pas traiter cette demande.\n"));
    return;
  }

  // Confirmation de sécurité par l'utilisateur avant toute action
  const confirmationMessage = `Approuvez-vous cette action ? (${action.type === 'shell' ? `Exécuter: ${chalk.bold.yellow(action.command)}` : `Écrire dans: ${chalk.bold.yellow(action.filename)}`}) (y/n) > `;
  const answer = await askQuestion(confirmationMessage);
  
  if (answer.toLowerCase() !== 'y') {
    // Utilisation de guillemets doubles pour éviter les erreurs de syntaxe avec "l'utilisateur"
    console.log(chalk.red("Action annulée par l'utilisateur.\n"));
    return;
  }
  
  // Exécution de l'action confirmée
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
