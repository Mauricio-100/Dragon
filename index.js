#!/usr/bin/env node

const { Command } = require('commander');
import fetch from 'node-fetch';
import { execa } from 'execa';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import fs from 'fs/promises';
import readline from 'readline';
import os from 'os';
import path from 'path';

// --- GESTION DE LA CONFIGURATION LOCALE ---
const CONFIG_DIR = path.join(os.homedir(), '.dragon');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// S'assure que le dossier de configuration existe
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (e) { /* Le dossier existe déjà */ }
}

// Sauvegarde la configuration (le token API)
async function saveConfig(config) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Charge la configuration
async function loadConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    return {}; // Retourne un objet vide si le fichier n'existe pas ou est invalide
  }
}

// --- INITIALISATION DU PROGRAMME ---
const program = new Command();

program
  .name('drn')
  .description("Votre assistant IA personnel pour le codage et l'automatisation.")
  .version('5.0.0');

// =======================================================
//  DÉFINITION DES COMMANDES DU CLI
// =======================================================

program
  .command('login')
  .description('Connectez-vous à votre compte de la plateforme Dragon.')
  .action(async () => {
    console.log(chalk.yellow('Veuillez entrer vos identifiants.'));
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Mot de passe: '); // Note: un vrai CLI utiliserait un input masqué

    try {
        const config = await loadConfig();
        const API_BASE_URL = config.serverUrl || 'https://sarver-fullstack-4.onrender.com';

        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Maintenant, on demande le VRAI token API (sk-...)
        const tokenRes = await fetch(`${API_BASE_URL}/user/api-token`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error);
        
        await saveConfig({ bearerToken: tokenData.api_token, serverUrl: API_BASE_URL });
        console.log(chalk.green('✅ Connexion réussie ! Vos informations ont été sauvegardées en toute sécurité.'));

    } catch (err) {
        console.error(chalk.red(`Erreur de connexion : ${err.message}`));
    }
  });

program
  .command('init')
  .description('Initialise un nouveau paquet Dragon dans le dossier actuel.')
  .option('-y, --yes', 'Créer avec les valeurs par défaut')
  .action(async (options) => {
    const defaults = {
        name: path.basename(process.cwd()),
        version: "1.0.0",
        description: "Un paquet d'automatisation créé avec Dragon.",
        main: "index.js",
        author: os.userInfo().username
    };
    await fs.writeFile('dragon.json', JSON.stringify(defaults, null, 2));
    console.log(chalk.green('Paquet Dragon initialisé ! Fichier `dragon.json` créé.'));
  });

// Les commandes 'publish' et 'install' sont ici pour l'exemple
// et nécessitent les routes correspondantes sur le serveur.
program
  .command('publish')
  .description('Publie un paquet Dragon sur le registre.')
  .action(() => {
    console.log(chalk.yellow('Fonctionnalité à venir : publication de paquets.'));
  });

program
  .command('install <packageName>')
  .description('Installe un paquet Dragon depuis le registre.')
  .action((packageName) => {
    console.log(chalk.yellow(`Fonctionnalité à venir : installation de '${packageName}'.`));
  });


// =======================================================
//  LOGIQUE DU SHELL IA (Le Cœur du Dragon)
// =======================================================

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function dragonShell() {
  console.clear();
  const dragonAscii = `... (votre ASCII art ici) ...`;
  console.log(gradient.passion(figlet.textSync('DRAGON', { font: 'Standard' })));
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Que puis-je faire pour vous ?'));

  while (true) {
    const task = await askQuestion(chalk.bold.red('🐉 > '));
    if (task.toLowerCase() === 'exit') {
      console.log(chalk.yellow('Le dragon retourne à son sommeil...'));
      break;
    }
    if (task.trim() !== '') {
        await processTask(task);
    }
  }
  rl.close();
}

async function processTask(task) {
  console.log(chalk.blue('🐉 Le dragon contacte son cerveau distant...'));
  
  const config = await loadConfig();
  if (!config.bearerToken || !config.serverUrl) {
    console.error(chalk.red('Erreur: Vous n\'êtes pas connecté. Veuillez lancer `drn login` d\'abord.'));
    return;
  }
  
  const prompt = `... (votre prompt système ici) ...\nDemande: "${task}"`;

  try {
    const response = await fetch(config.serverUrl + '/chat-direct', { /* ... identique à avant ... */ });
    // ... reste de la logique de processTask ...
  } catch (error) {
    // ... gestion des erreurs ...
  }
}

async function executeAction(action) {
  // ... votre logique executeAction reste identique ...
}

// =======================================================
//  POINT D'ENTRÉE PRINCIPAL
// =======================================================

async function main() {
  const args = process.argv;
  // Si l'utilisateur tape juste 'drn' ou 'drn <prompt>', on lance le shell.
  // Commander considère les arguments qui ne sont pas des options comme des commandes.
  // On vérifie donc si le 3ème argument N'EST PAS une commande connue.
  const knownCommands = program.commands.map(cmd => cmd.name());
  if (args.length <= 2 || !knownCommands.includes(args[2])) {
    await dragonShell();
  } else {
    // Sinon, on laisse Commander gérer la commande spécifique (login, init, etc.)
    await program.parseAsync(process.argv);
  }
}

main();
