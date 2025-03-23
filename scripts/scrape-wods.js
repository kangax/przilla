#!/usr/bin/env node
import fs from 'fs-extra';
import axios from 'axios';
import * as cheerio from 'cheerio';
import readline from 'readline';
import chalk from 'chalk';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const WODS_FILE = './public/data/wods.json';
const BACKUP_FILE = './public/data/wods-backup.json';
const REQUEST_DELAY = 2000; // 2 seconds between requests

async function main() {
  try {
    // Create backup
    await fs.copy(WODS_FILE, BACKUP_FILE);
    console.log(chalk.green(`Created backup at ${BACKUP_FILE}`));

    // Load WODs
    const wods = await fs.readJson(WODS_FILE);
    
    for (const wod of wods) {
      if (wod.description) {
        console.log(chalk.yellow(`Skipping ${wod.wodName} - already has description`));
        continue;
      }

      console.log(chalk.blue(`\nProcessing: ${wod.wodName}`));
      console.log(chalk.gray(`URL: ${wod.wodUrl}`));

      try {
        // Fetch WOD page
        const { data } = await axios.get(wod.wodUrl);
        const $ = cheerio.load(data);

        // Wait for and extract WOD content
        const wodContent = $('.wod-content');
        
        if (!wodContent.length) {
          console.log(chalk.red('No WOD content found'));
          continue;
        }

        // Extract and clean description
        const description = wodContent
          .find('.description')
          .text()
          .trim()
          .replace(/\s+/g, ' ');
        
        if (!description) {
          console.log(chalk.red('No description found in WOD content'));
          continue;
        }

        // Show description and confirm
        console.log(chalk.cyan('\nExtracted Description:'));
        console.log(chalk.white(description));
        
        const answer = await askQuestion('Does this look correct? (y/n/q) ');
        
        if (answer.toLowerCase() === 'y') {
          wod.description = description;
          console.log(chalk.green('Description saved'));
        } else if (answer.toLowerCase() === 'q') {
          console.log(chalk.yellow('Quitting and saving progress...'));
          break;
        } else {
          console.log(chalk.yellow('Skipping this WOD'));
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
      } catch (error) {
        if (error instanceof Error) {
          console.log(chalk.red(`Error processing ${wod.wodName}: ${error.message}`));
        } else {
          console.log(chalk.red(`Unknown error processing ${wod.wodName}`));
        }
      }
    }

    // Save updated WODs
    await fs.writeJson(WODS_FILE, wods, { spaces: 2 });
    console.log(chalk.green('\nAll done! Updated WODs saved'));
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.red(`Fatal error: ${error.message}`));
    } else {
      console.log(chalk.red('Unknown fatal error'));
    }
  } finally {
    rl.close();
  }
}

/**
 * Prompts the user with a question and returns their response
 * @param {string} query - The question to ask the user
 * @returns {Promise<string>} The user's response
 */
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

main();
