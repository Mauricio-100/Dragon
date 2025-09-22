#!/usr/bin/env node

// --- TEST DE STABILITÉ ---
// Nous allons commenter les modules les plus complexes pour trouver le coupable.

console.log("Démarrage du script de test Dragon...");

try {
    const chalk = require('chalk');
    console.log(chalk.green("Module 'chalk' chargé avec succès."));

    const figlet = require('figlet');
    console.log(chalk.green("Module 'figlet' chargé avec succès."));

    const gradient = require('gradient-string');
    console.log(chalk.green("Module 'gradient-string' chargé avec succès."));

    const inquirer = require('inquirer');
    console.log(chalk.green("Module 'inquirer' chargé avec succès."));

    const execa = require('execa');
    console.log(chalk.green("Module 'execa' chargé avec succès."));

    // --- ATTENTION : LE SUSPECT PRINCIPAL ---
    // Le module Google AI est le plus susceptible de causer un crash de bas niveau.
    // Nous le laissons commenté pour l'instant.
    // const { GoogleGenerativeAI } = require('@google/generative-ai');
    // console.log(chalk.green("Module '@google/generative-ai' chargé avec succès."));

    console.log(chalk.yellow("\n--- Test de base réussi ! ---"));
    console.log(chalk.yellow("Si vous voyez ce message, cela signifie que le crash est très probablement causé par le module '@google/generative-ai'."));

} catch (error) {
    console.error("Une erreur s'est produite lors du chargement des modules :", error);
}
