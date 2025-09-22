#!/usr-bin/env node

// Importations. Notez l'absence de Google ou Xenova.
const fetch = require('node-fetch');
const { execa } = require('execa');
const chalk = require('chalk');
const dotenv = require('dotenv');
const figlet = require('figlet');
const gradient = require('gradient-string');
const fs = require('fs/promises');
const readline = require('readline');

// --- CONFIGURATION ---
dotenv.config();
// On récupère les informations de connexion à votre serveur depuis .env
const MY_SERVER_URL = process.env.SERVER_URL;
const MY_BEARER_TOKEN = process.env.BEARER_TOKEN;


const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// --- FONCTION PRINCIPALE DU SHELL DRAGON (inchangée) ---
async function dragonShell() {
  console.clear();
  const dragonAscii = `
                   /\\)
    _             ((\\
   (((\\
    \\ \\\\
     \\ \\\\    /\)
      \\ \\\\  ((\\
       \\ \\\\ / \\
        \\ \\\\/
         \\_\\
  `;
  console.log(gradient.passion(dragonAscii));
  const figletText = figlet.textSync('DRAGON', { font: 'Standard' });
  console.log(gradient.passion(figletText));
  
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Que puis-je faire pour vous ? (Tapez "exit" pour quitter)'));

  const poweredByText = "Original by powered Dragon 🐉";
  const terminalWidth = process.stdout.columns || 80;
  const padding = " ".repeat(Math.max(0, terminalWidth - poweredByText.length));
  console.log(chalk.gray(padding + poweredByText));

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

// --- LE CERVEAU DU DRAGON (version connectée à votre serveur Render) ---
async function processTask(task) {
  console.log(chalk.blue('🐉 Le dragon contacte son cerveau distant...'));
  
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
    const response = await fetch(MY_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MY_BEARER_TOKEN}`
      },
      body: JSON.stringify({ message: prompt }) // On envoie le prompt complet dans le champ "message"
    });

    if (!response.ok) {
        throw new Error(`Erreur du serveur : ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // **IMPORTANT** : Adaptez cette ligne à la structure de la réponse de VOTRE serveur.
    // Si votre serveur répond `{"response": "..."}`, utilisez aiResponse.response
    // Si votre serveur répond `{"message": "..."}`, utilisez aiResponse.message
    const responseText = aiResponse.response || aiResponse.message || '{}'; 

    const action = JSON.parse(responseText.trim().replace(/```json/g, '').replace(/```/g, ''));
    await executeAction(action);

  } catch (error) {
    console.error(chalk.red('Erreur de communication avec votre serveur :'), error);
    console.log(chalk.yellow('Veuillez vérifier votre URL, votre token et que votre serveur est bien en ligne.'));
  }
}

// --- LES GRIFFES DU DRAGON (inchangé) ---
async function executeAction(action) {
  // ... (cette fonction reste exactement la même que dans la version précédente)
  console.log(chalk.cyan(`\n🔥 Plan du Dragon : ${action.explanation}`));

  if (!action || action.type === 'error' || (!action.command && !action.code)) {
    console.log(chalk.yellow("Le Dragon ne peut pas traiter cette demande ou l'a mal interprétée.\n"));
    return;
  }

  const confirmationMessage = `Approuvez-vous cette action ? (${action.type === 'shell' ? `Exécuter: ${chalk.bold.yellow(action.command)}` : `Écrire dans: ${chalk.bold.yellow(action.filename)}`}) (y/n) > `;
  const answer = await askQuestion(confirmationMessage);
  
  if (answer.toLowerCase() !== 'y') {
    console.log(chalk.red("Action annulée par l'utilisateur.\n"));
    return;
  }
  
  if (action.type === 'shell') {
    // ... (le reste de la fonction est inchangé)
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
