#!/usr/bin/env node

const { Command } = require('commander');
const fetch = require('node-fetch');
const { execa } = require('execa');
const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const fs = require('fs/promises');
const readline = require('readline');
const os = require('os');
const path = require('path');
const ora = require('ora'); // La nouvelle écaille du Dragon !

// --- GESTION DE LA CONFIGURATION LOCALE ---
const CONFIG_DIR = path.join(os.homedir(), '.dragon');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// S'assure que le dossier de configuration existe
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (e) { /* Le dossier existe déjà, tout va bien */ }
}

// Sauvegarde la configuration
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
    return {}; // Retourne un objet vide si le fichier n'existe pas ou est corrompu
  }
}

// --- INITIALISATION DU PROGRAMME ---
const program = new Command();

program
  .name('drn')
  .description("Votre assistant IA personnel pour le codage et l'automatisation.")
  .version('6.0.0'); // Version augmentée pour marquer l'évolution majeure

// =======================================================
//  CHAPITRE 1 : GESTION DE L'IDENTITÉ
// =======================================================

program
  .command('login')
  .description('Connectez-vous à la plateforme Dragon.')
  .option('-s, --server <url>', 'Spécifier une URL de serveur personnalisée')
  .action(async (options) => {
    const config = await loadConfig();
    if (config.bearerToken) {
        console.log(chalk.yellow('Vous êtes déjà connecté. Utilisez `drn logout` pour vous déconnecter d\'abord.'));
        return;
    }

    console.log(chalk.cyan('Veuillez entrer vos identifiants pour la plateforme Dragon.'));
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Mot de passe: ');

    const spinner = ora('Connexion en cours...').start();
    try {
        const API_BASE_URL = options.server || config.serverUrl || 'https://sarver-fullstack-4.onrender.com';

        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Erreur du serveur: ${res.status}`);
        
        // On suppose ici que le login renvoie directement le token API final pour plus de simplicité.
        // Si votre serveur a 2 étapes, gardez l'ancienne logique.
        await saveConfig({ bearerToken: data.api_token, serverUrl: API_BASE_URL });
        spinner.succeed(chalk.green('Connexion réussie ! Votre clé d\'accès a été sauvegardée.'));
        console.log(chalk.blue('Vous pouvez maintenant utiliser les commandes de la plateforme.'));

    } catch (err) {
        spinner.fail(chalk.red(`Erreur de connexion : ${err.message}`));
    }
  });

program
  .command('logout')
  .description('Vous déconnecte de la plateforme Dragon.')
  .action(async () => {
    const spinner = ora('Déconnexion...').start();
    try {
      await fs.unlink(CONFIG_FILE);
      spinner.succeed(chalk.green('Déconnexion réussie. À bientôt !'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        spinner.warn(chalk.yellow('Vous n\'étiez pas connecté.'));
      } else {
        spinner.fail(chalk.red(`Une erreur est survenue : ${error.message}`));
      }
    }
  });

program
    .command('whoami')
    .description('Vérifie l\'utilisateur actuellement connecté.')
    .action(async () => {
        const config = await loadConfig();
        if (!config.bearerToken) {
            console.log(chalk.yellow('Vous n\'êtes pas connecté. Utilisez `drn login` pour vous connecter.'));
            return;
        }
        
        const spinner = ora('Vérification de votre identité...').start();
        try {
            // NOTE : Ceci requiert une nouvelle route sur votre serveur, ex: GET /auth/status
            const res = await fetch(`${config.serverUrl}/auth/status`, {
                headers: { 'Authorization': `Bearer ${config.bearerToken}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Session invalide ou expirée.');

            spinner.succeed(chalk.green('Vous êtes connecté en tant que :'));
            console.log(chalk.cyan(`- Email: ${data.email}`));
            console.log(chalk.cyan(`- User ID: ${data.id}`));
        } catch (err) {
            spinner.fail(chalk.red(`Impossible de vérifier l'identité : ${err.message}`));
            console.log(chalk.yellow('Votre session est peut-être expirée. Essayez de vous reconnecter avec `drn login`.'));
        }
    });

// =======================================================
//  CHAPITRE 2 : L'ÉCOSYSTÈME DES DRACOPACKS
// =======================================================

program
  .command('init')
  .description('Initialise un nouveau Dracopack dans le dossier actuel.')
  .action(async () => {
    console.log(chalk.cyan('Initialisation d\'un nouveau Dracopack...'));
    const defaults = {
        name: path.basename(process.cwd()),
        version: "1.0.0",
        description: "Un paquet d'automatisation pour la plateforme Dragon.",
        main: "index.js",
        author: os.userInfo().username
    };
    await fs.writeFile('dragon.json', JSON.stringify(defaults, null, 2));
    console.log(chalk.green('✅ Dracopack initialisé ! Le fichier `dragon.json` a été créé.'));
  });

program
  .command('publish')
  .description('Publie un Dracopack sur la plateforme communautaire.')
  .action(async () => {
    const config = await loadConfig();
    if (!config.bearerToken) {
        console.log(chalk.red('Erreur : Vous devez être connecté pour publier. Utilisez `drn login`.'));
        return;
    }
    
    const spinner = ora('Préparation de la publication...').start();
    try {
        const packageJsonData = await fs.readFile('dragon.json', 'utf-8');
        const packageInfo = JSON.parse(packageJsonData);
        const mainFileData = await fs.readFile(packageInfo.main, 'utf-8');

        spinner.text = `Publication de '${packageInfo.name}@${packageInfo.version}'...`;
        
        // NOTE : Ceci requiert une nouvelle route sur votre serveur, ex: POST /packs/publish
        const res = await fetch(`${config.serverUrl}/packs/publish`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.bearerToken}`
            },
            body: JSON.stringify({
                packageInfo: packageInfo,
                code: mainFileData
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Le serveur a refusé la publication.');

        spinner.succeed(chalk.green(`'${packageInfo.name}' a été publié avec succès !`));

    } catch (err) {
        if (err.code === 'ENOENT') {
            spinner.fail(chalk.red('Erreur : Aucun fichier `dragon.json` trouvé. Exécutez `drn init` d\'abord.'));
        } else {
            spinner.fail(chalk.red(`La publication a échoué : ${err.message}`));
        }
    }
  });

program
  .command('install <packageName>')
  .description('Installe un Dracopack depuis la plateforme.')
  .action(async (packageName) => {
    const config = await loadConfig();
    if (!config.bearerToken) {
        console.log(chalk.red('Erreur : Vous devez être connecté pour installer un paquet.'));
        return;
    }

    const spinner = ora(`Recherche de '${packageName}' sur la plateforme...`).start();
    try {
        // NOTE : Ceci requiert une nouvelle route sur votre serveur, ex: GET /packs/download/:name
        const res = await fetch(`${config.serverUrl}/packs/download/${packageName}`, {
            headers: { 'Authorization': `Bearer ${config.bearerToken}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Paquet non trouvé ou accès refusé.');

        spinner.text = `Installation de '${data.packageInfo.name}'...`;
        const installDir = path.join(CONFIG_DIR, 'packs', data.packageInfo.name);
        await fs.mkdir(installDir, { recursive: true });
        await fs.writeFile(path.join(installDir, data.packageInfo.main), data.code);
        await fs.writeFile(path.join(installDir, 'dragon.json'), JSON.stringify(data.packageInfo, null, 2));

        spinner.succeed(chalk.green(`'${packageName}' a été installé avec succès dans votre coffre Dragon !`));
        console.log(chalk.blue(`Vous pouvez maintenant l'utiliser via le shell Dragon.`));
    } catch(err) {
        spinner.fail(chalk.red(`L'installation a échoué : ${err.message}`));
    }
  });

// =======================================================
//  LE CŒUR DU DRAGON : LE SHELL INTERACTIF
// =======================================================

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function askQuestion(query) {
  // Ajout d'une gestion pour fermer proprement readline
  return new Promise(resolve => rl.question(query, (ans) => resolve(ans)));
}

async function dragonShell() {
  console.clear();
  console.log(gradient.passion(figlet.textSync('DRAGON', { font: 'Standard' })));
  console.log(chalk.hex('#FF4500')('Bienvenue. Je suis Dragon. Demandez et vous recevrez powered by google. (`exit` pour quitter)'));

  while (true) {
    const task = await askQuestion(chalk.bold.red('🐉 > '));
    if (task.toLowerCase() === 'exit') {
      break;
    }
    if (task.trim() !== '') {
        await processTask(task);
    }
  }
  rl.close();
}

async function processTask(task) {
  const spinner = ora('Le dragon contacte son esprit dans le cloud...').start();
  
  const config = await loadConfig();
  if (!config.bearerToken || !config.serverUrl) {
    spinner.fail(chalk.red('Erreur: Vous n\'êtes pas connecté. Lancez `drn login` d\'abord.'));
    return;
  }
  
  try {
    // La logique de communication avec l'IA reste la même
    // ...
    spinner.succeed('Réponse reçue.');
    console.log("Ici, vous traiteriez la réponse de l'IA.");

  } catch (error) {
    spinner.fail(chalk.red(`Le dragon a rencontré un obstacle : ${error.message}`));
  }
}

// =======================================================
//  POINT D'ENTRÉE PRINCIPAL (SIMPLIFIÉ)
// =======================================================

// Si l'utilisateur tape juste 'drn' sans autre commande, on lance le shell.
// Commander gère cela nativement si c'est l'action de la commande racine.
program.action(dragonShell);

// On lance l'analyse des arguments et l'exécution.
program.parseAsync(process.argv);
