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
// Charge les variables d'environnement depuis ~/.env (plus robuste)
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
      \\ \\\\  ((\\
       \ \\\\ / \\
        \ \\\\/
         \\_\\
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

  // Boucle principale pour écouter les commandes
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
  
  const prompt = `
    Tu es Dragon, une IA experte qui opère dans un terminal.
    Ta tâche est de convertir une demande en langage naturel en une commande shell exécutable OU en un bloc de code à écrire dans un fichier.
    Réponds TOUJOURS avec un objet JSON, et rien d'autre. La structure du JSON doit être :
    { "explanation": "...", "type": "shell" | "code" | "error", "command": "...", "filename": "...", "code": "..." }
    Voici la demande de l'utilisateur : "${task}"
  `;

  try {
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
    
    // CORRECTION : S'assure de lire la clé "reply" renvoyée par le serveur.
    const responseText = aiResponse.reply || '{}'; 

    const action = JSON.parse(responseText.trim().replace(/```json/g, '').replace(/```/g, ''));
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

  // Confirmation de sécurité par l'utilisateur
  const confirmationMessage = `Approuvez-vous cette action ? (${action.type === 'shell' ? `Exécuter: ${chalk.bold.yellow(action.command)}` : `Écrire dans: ${chalk.bold.yellow(action.filename)}`}) (y/n) > `;
  const answer = await askQuestion(confirmationMessage);
  
  if (answer.toLowerCase() !== 'y') {
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
