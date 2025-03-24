// Utility function to classify WODs by category and structure
import { Wod } from "./WodViewer";

// List of known "Girl" WODs
const GIRL_WODS = [
  "Angie", "Annie", "Barbara", "Chelsea", "Cindy", "Diane", "Elizabeth", 
  "Fran", "Grace", "Helen", "Isabel", "Jackie", "Karen", "Linda", "Mary", 
  "Nancy", "Nicole", "Amanda", "Christine", "Grettel", "Ingrid", "Lynne"
];

// List of known "Hero" WODs
const HERO_WODS = [
  "Murph", "DT", "Abbate", "Holleyman", "JT", "McGhee", "Nate", "Randy", 
  "Ryan", "Whitten", "Hidalgo", "Gallant", "Bowen", "Rene", "Riley", 
  "Marston", "Mogadishu Mile", "Peyton", "Omar", "Maxton", "Schmalls"
];

export function classifyWod(wod: Wod): Wod {
  const updatedWod = { ...wod };
  
  // Classify category
  if (GIRL_WODS.includes(wod.wodName)) {
    updatedWod.category = 'Girl';
  } else if (HERO_WODS.includes(wod.wodName)) {
    updatedWod.category = 'Hero';
  } else if (wod.wodName.includes('Open')) {
    updatedWod.category = 'Open';
  } else if (wod.wodName.includes('Games')) {
    updatedWod.category = 'Games';
  } else if (wod.wodName.includes('Benchmark')) {
    updatedWod.category = 'Benchmark';
  } else {
    updatedWod.category = 'Custom';
  }
  
  // Classify structure tags
  const tags: Array<'Chipper' | 'Couplet' | 'Triplet' | 'EMOM' | 'AMRAP' | 'For Time' | 'Ladder' | 'Partner' | 'Team'> = [];
  
  const description = wod.description || '';
  
  // Check for AMRAP
  if (description.includes('AMRAP')) {
    tags.push('AMRAP');
  }
  
  // Check for EMOM
  if (description.includes('EMOM')) {
    tags.push('EMOM');
  }
  
  // Check for "For Time" or assume if not AMRAP/EMOM
  if (description.includes('For Time') || (!tags.includes('AMRAP') && !tags.includes('EMOM'))) {
    tags.push('For Time');
  }
  
  // Check for Partner/Team workouts
  if (description.toLowerCase().includes('partner')) {
    tags.push('Partner');
  }
  
  if (description.toLowerCase().includes('team')) {
    tags.push('Team');
  }
  
  // Check for Ladder (decreasing or increasing reps)
  if (description.match(/\d+-\d+-\d+/) || description.includes('ladder')) {
    tags.push('Ladder');
  }
  
  // Count distinct movements to determine Couplet/Triplet/Chipper
  // This is a simplified approach - a more accurate approach would parse the description more carefully
  const movementCount = countMovements(description);
  
  if (movementCount === 2) {
    tags.push('Couplet');
  } else if (movementCount === 3) {
    tags.push('Triplet');
  } else if (movementCount > 3) {
    tags.push('Chipper');
  }
  
  updatedWod.tags = tags;
  
  return updatedWod;
}

// Helper function to estimate the number of movements in a WOD
function countMovements(description: string): number {
  // This is a simplified approach - in a real implementation, you'd want to
  // parse the description more carefully to identify distinct movements
  
  // Split by newlines and count non-empty lines that likely contain movements
  const lines = description.split('\n').filter(line => 
    line.trim() !== '' && 
    !line.includes('AMRAP') && 
    !line.includes('EMOM') && 
    !line.includes('For Time') && 
    !line.includes('Rounds') &&
    !line.includes('Rest') &&
    !line.match(/^\d+$/) // Skip lines that are just numbers
  );
  
  // For workouts with formats like "21-15-9", count the movements listed after
  if (description.match(/\d+-\d+-\d+/)) {
    const parts = description.split('\n');
    // Find the line after the rep scheme
    const repSchemeIndex = parts.findIndex(line => line.match(/\d+-\d+-\d+/));
    if (repSchemeIndex >= 0) {
      return parts.slice(repSchemeIndex + 1).filter(line => line.trim() !== '').length;
    }
  }
  
  return Math.min(lines.length, 10); // Cap at 10 to avoid overestimating
}

// Function to process an array of WODs and add classification
export function classifyWods(wods: Wod[]): Wod[] {
  return wods.map(wod => classifyWod(wod));
}
