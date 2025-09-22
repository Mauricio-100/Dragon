#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';

// Charger les variables d'environnement (la clé API)
dotenv.config();

// Configurer le client Google AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const program = new Command();

program
  .version('2.0.0')
  .description('Un robot codeur CLI amélioré avec Google Generative AI');

program
  .command('generer <description>')
  .alias('g')
  .description('Génère un bloc de code basé sur une description textuelle')
  .option('-o, --output <fichier>', 'Nom du fichier de sortie', 'output.js')
  .action(async (description, options) => {
    console.log(chalk.blue('🤖 Connexion à l\'IA de Google...'));
    console.log(chalk.yellow(`📝 Votre demande : "${description}"`));

    try {
      const prompt = `Tu es un assistant de code expert. Génère uniquement le code pour la demande suivante, sans explications supplémentaires ni formatage de démarque (pas de \`\`\`javascript). La demande est : "${description}"`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const code = response.text();

      await fs.writeFile(options.output, code);

      console.log(chalk.green.bold(`\n✅ Le code a été généré avec succès et sauvegardé dans ${options.output} !`));
      console.log(chalk.cyan('--- Début du code généré ---'));
      console.log(chalk.gray(code));
      console.log(chalk.cyan('--- Fin du code généré ---'));

    } catch (error) {
      console.error(chalk.red('Une erreur est survenue lors de la communication avec l\'API de Google :'), error.message);
    }
  });

program.parse(process.argv);
