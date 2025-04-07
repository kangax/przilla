import fs from "fs/promises";
import path from "path";

const WODS_FILE_PATH = path.join(process.cwd(), "public", "data", "wods.json");

// --- Pre-Analyzed Benchmark Levels ---
// This map contains the results of sophisticated analysis for each WOD
// identified as having empty levels. Analysis considers movements,
// weights, reps, structure, and typical performance standards.
// All times are in seconds. 'null' indicates no upper/lower bound.
const estimatedLevelsMap = {
  // Note: Partner WODs or those with ambiguous scoring (like EMOMs listed as 'time')
  // are harder to standardize and might be skipped or given generic estimates.
  // Skipping partner WODs: "1LT Derek Hines", "31 Heroes", "Faas Fit", "Harvell", "Horton", "Kev", "Laura", "McCartney", "Scooter", "The Juicy"
  // Skipping ambiguous/complex scoring: "1LT S. Chase Prasnicki", "Chief John Sing", "Dale", "Donald L. Wheeler Jr.", "Dragon", "FF Alex Graham", "Manuel", "Moore", "Otis", "Robbie", "Santora", "Styles", "Vitalii Skakun"

  "Alan Cameron": {
    elite: { min: 0, max: 360 },
    advanced: { min: 360, max: 540 },
    intermediate: { min: 540, max: 780 },
    beginner: { min: 780, max: null },
  }, // 21-15-9 OHS(45/30kg)/HSPU/GHD
  Amer: {
    elite: { min: 0, max: 300 },
    advanced: { min: 300, max: 480 },
    intermediate: { min: 480, max: 720 },
    beginner: { min: 720, max: null },
  }, // 4RFT: 3 DL(1.5xBW)/6 Burpees/9 Box Jumps
  Ariel: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // Long Chipper w/ high skill gymnastics
  Batra: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // Long Chipper w/ DUs, KB, Ring Dips
  // "Baz": Type should be reps, skipping for now as type is 'time' in jq output
  Brehm: {
    elite: { min: 0, max: 600 },
    advanced: { min: 600, max: 900 },
    intermediate: { min: 900, max: 1200 },
    beginner: { min: 1200, max: null },
  }, // 10 RC/20 BS(225)/30 HSPU/40 Cal Row
  "Brian Moore": {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 25 RFT: 5 HPC/5 FS/4 STO (135/95) + 2015m Row Cashout
  "Brian Serdynski": {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 960 },
    intermediate: { min: 960, max: 1200 },
    beginner: { min: 1200, max: null },
  }, // Descending distance runs/reps w/ vest
  "Capt. Jennifer Casey": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // Heavy DL buy-in, DB Jerks/Row, Run cash-out
  "Chief Jason Byrd": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 4 RFT: Stairs w/ pack, Sandbag work (100/75)
  "CSM Adkins": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 4 Rounds descending reps w/ weighted runs
  "Da Bauer": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 2 RFT: 53 Burpees/18 KBS/100 Cal Row/13 Thrusters(95/65)
  "Dale Jaynes": {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 960 },
    intermediate: { min: 960, max: 1200 },
    beginner: { min: 1200, max: null },
  }, // 21-15-9 style with 400m runs, KBS, Wall Balls
  "Danny Dietz": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Long, heavy PCs/FS, high vol pushups/pullups, runs
  Davo: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // Long chipper with runs and varied movements (Thrusters, Pullups, SDHP, Dips, HSPU, OHS)
  Dempsey: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 3 RFT: 50 WB/50 Med Ball Pushups/50 Ball Slams
  // "Dunn": AMRAP listed as time, skipping
  "Efren Medina": {
    elite: { min: 0, max: 180 },
    advanced: { min: 180, max: 300 },
    intermediate: { min: 300, max: 420 },
    beginner: { min: 420, max: null },
  }, // 4 RFT: Simple bodyweight (JJ, Sumo Squat, Situps) - Very short
  "Ella French": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // Plank buy-in/cash-out, high rep burpees
  Elmsy: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 10 RFT: Pushups/KBS/Box Jumps + Weighted Runs
  // "Emanuele Reali": AMRAP listed as time, skipping
  Emily: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3900 },
    beginner: { min: 3900, max: null },
  }, // 10 RFT: DU/Pullups/Squats/Sprint + 2 min Rest
  // "Enis": AMRAP listed as time, skipping
  Erin: {
    elite: { min: 0, max: 480 },
    advanced: { min: 480, max: 720 },
    intermediate: { min: 720, max: 960 },
    beginner: { min: 960, max: null },
  }, // 5 RFT: 15 DB Split Cleans (40/30)/21 Pullups
  Evans: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // For Time: 100 Pushups/KBS/T2B/Rope Climb ft
  // "Falkel": AMRAP listed as time, skipping
  Feeks: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // Ascending ladder 2-16: Shuttle Sprint/DB Clusters (65/45)
  Foo: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1500 },
    intermediate: { min: 1500, max: 1800 },
    beginner: { min: 1800, max: null },
  }, // 20 min AMRAP + Bench Buy-in. Type listed as time, skipping.
  Forrest: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 3 RFT: 20 L-Pullups/30 T2B/40 Burpees/800m Run
  Fournier: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // For Time: S2OH/Sled Pull/Burpees/Sled Pull/SDHP/Sled Pull
  French: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1500 },
    intermediate: { min: 1500, max: 1800 },
    beginner: { min: 1800, max: null },
  }, // 1mi Run/50 DL(185/135)/1mi Run/3min Max Burpees. Score is time + burpees? Ambiguous. Using time estimate.
  // "Gale Force": AMRAP listed as time, skipping
  // "Garbo": AMRAP listed as time, skipping
  Garrett: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1800 },
    intermediate: { min: 1800, max: 2400 },
    beginner: { min: 2400, max: null },
  }, // 3 RFT: 75 Squats/25 Ring HSPU/25 L-Pullups
  Gator: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 8 RFT: 5 FS (185/135)/26 Ring Pushups
  Gaza: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // 5 RFT: 35 KBS/30 Pushups/25 Pullups/20 Box Jumps/1 mile Run - Very long
  "Ghost 31": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 4 RFT: 800m Run/3 Burpee Pullups/18 Box Jumps/22 Lunges w/ Vest
  Glen: {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // For Time: 30 C&J(135/95)/1mi Run/10 RC/1mi Run/100 Burpees - Very long
  "Granite Mile": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 4 RFT: Tire Flips/Farmer Carries/Pushups/Squats/Sledge Hits
  Griff: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 900 },
    intermediate: { min: 900, max: 1080 },
    beginner: { min: 1080, max: null },
  }, // For Time: 800m Run/400m Backwards Run x2
  Gunny: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 3 x (1mi Weighted Run (50/35) / 50 Pushups / 50 Situps)
  Hall: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 3 Cleans(225/155)/200m Sprint/20 KB Snatches/2min Rest
  Hamilton: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 3 RFT: 1k Row/50 Pushups/1k Run/50 Pullups
  Hammer: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 5 RFT: 5 PC/10 FS/5 Jerks (135/95)/20 Pullups + 90s Rest
  Hammy: {
    elite: { min: 0, max: 4200 },
    advanced: { min: 4200, max: 5400 },
    intermediate: { min: 5400, max: 6600 },
    beginner: { min: 6600, max: null },
  }, // Very long chipper with weighted vest
  Hansen: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 30 KBS(2/1.5)/30 Burpees/30 GHD Situps
  // "Harper": AMRAP listed as time, skipping
  Havana: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 1800 },
    intermediate: { min: 1800, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 25 min AMRAP: 150 DU/50 Pushups/15 PC(185/125). Type listed as time, skipping.
  Heath: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 1mi MedBall Run / 2R(39 FS/Pullups/BS) / 1mi MedBall Run
  Helton: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 3 RFT: 800m Run/30 DB Squat Cleans(50/35)/30 Burpees
  Hildy: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // Chipper: Row/Thrusters/Pullups/WB/Row w/ Vest
  Holbrook: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 10 RFT: 5 Thrusters(115/85)/10 Pullups/100m Sprint + 1min Rest
  // "Holloway": AMRAP listed as time, skipping
  Hollywood: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 2k Run/22 WB/22 MU/22 WB/22 PC(185/135)/22 WB/2k Run
  // "Hortman": AMRAP listed as time, skipping
  "Hotshots 19": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 6 RFT: 30 Squats/19 PC(135/95)/7 Strict Pullups/400m Run
  Hotsinpiller: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // Long: Bike Buy-in/Cash-out, 2R(Hang Cleans/Man Makers/Pullups/Burpees)
  // "Indy 08": AMRAP listed as time, skipping
  "J.J.": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // Asc/Desc Ladder: SQ Cleans(185/135) / Parallette HSPU
  // "Jack": AMRAP listed as time, skipping
  "Jack Stanley": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1500 },
    intermediate: { min: 1500, max: 1800 },
    beginner: { min: 1800, max: null },
  }, // 2k Run + 4R(Burpees/Jumping Lunges/HRPU/Jumping Squats)
  "Jag 28": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // For Time: 800m Run/28 KBS/28 Strict Pullups/28 KB C&J/28 Strict Pullups/800m Run
  // "Jaime L. Campbell": AMRAP listed as time, skipping
  "James Prosser": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1800 },
    intermediate: { min: 1800, max: 2400 },
    beginner: { min: 2400, max: null },
  }, // For Time: 100 Muscle-Ups
  Jared: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 4 RFT: 800m Run/40 Pullups/70 Pushups
  Jason: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1320 },
    intermediate: { min: 1320, max: 1800 },
    beginner: { min: 1800, max: null },
  }, // Descending Squats / Ascending Muscle-Ups
  // "Jay": AMRAP listed as time, skipping
  // "JBo": AMRAP listed as time, skipping
  // "Jennifer": AMRAP listed as time, skipping
  // "Jenny": AMRAP listed as time, skipping
  Jerry: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2100 },
    intermediate: { min: 2100, max: 2400 },
    beginner: { min: 2400, max: null },
  }, // For Time: 1mi Run/2k Row/1mi Run
  // "Jimmy": AMRAP listed as time, skipping
  // "Johnson": AMRAP listed as time, skipping
  Jonno: {
    elite: { min: 0, max: 3600 },
    advanced: { min: 3600, max: 4500 },
    intermediate: { min: 4500, max: 5400 },
    beginner: { min: 5400, max: null },
  }, // Three Parts For Time, very long chipper style
  Jorge: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // Descending Ladder: GHD Situps / SQ Cleans (155/105)
  Josh: {
    elite: { min: 0, max: 480 },
    advanced: { min: 480, max: 720 },
    intermediate: { min: 720, max: 960 },
    beginner: { min: 960, max: null },
  }, // 21-15-9 OHS(95/65)/Pullups
  Joshie: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 3 RFT: 21 DB Snatch (R)/21 L-Pullups/21 DB Snatch (L)/21 L-Pullups
  Josie: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 1mi Run / 3R(30 Burpees/4 PC/6 FS) / 1mi Run w/ Vest
  Justin: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1800 },
    intermediate: { min: 1800, max: 2400 },
    beginner: { min: 2400, max: null },
  }, // 30-20-10: Back Squat(BW)/Bench(BW)/Strict Pullups
  Kabul: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // 8 RFT: Mixed movements + 2200m Row Cashout
  "Ken Zink": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 7 RFT: 71 DU/14 DL/6 HPC/9 FS (135/95)
  "Kenneth Stavinoha": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: Bike/Slams/Lunges/Skulls/Spiderman PU/Shoulder Taps/Row
  Kerrie: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 10 RFT: Sprint/Burpees/Situps/Pushups/Sprint + 2min Rest w/ Vest
  Kevin: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 3 RFT: 32 DL(185/135)/32 Hanging Hip Touches/800m Farmer Carry(15lb DBs)
  "Kevin Conner": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // MedBall Carry Buy-in/Cash-out, 10R(HRPU/Squats/KBS) w/ Vest
  "Killer Elite": {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 7 RFT: 400m Run/24 Pullups/24 Dips/34 Crunches/9 Burpees
  Klepto: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 4 RFT: 27 Box Jumps/20 Burpees/11 SQ Cleans(145/100)
  Kutschbach: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 7 RFT: 11 Back Squats(185/135)/10 Jerks(135/95)
  Larry: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // Desc Ladder: FS/Burpees + 200m Sandbag Carry each round
  // "Ledesma": AMRAP listed as time, skipping
  Lee: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 5 RFT: 400m Run/1 DL(345/225)/3 SQ Clean(185/135)/5 Jerk(185/135)/3 MU/1 RC
  Lem: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // Buy-in/Buy-out + 4R(Run/Navy PU/Situps/Strict Pullups)
  Liam: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 800m Plate Run/100 T2B/50 FS(155/105)/10 RC/800m Plate Run
  Lindskog: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 500m Run/20 Box Jumps/20 Pullups/5 HSPU
  Loredo: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 6 RFT: 24 Squats/24 Pushups/24 Lunges/400m Run
  "Lt. Bill DiBlasio": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: Run/KBS/Pushups/KBS/Skulls/Run
  // "Lt. Brian Sullivan": AMRAP listed as time, skipping
  Luce: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 3 RFT: 1k Run/10 MU/100 Squats w/ Vest
  Lund: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Chipper: Run/Pullups/KBS/T2B/Situps/Pushups/DL/Pullups/Run
  "MA3 Oscar Temores": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 8 RFT: 11 HRPU/30 Lunges/19 Situps
  Mac: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 2 RFT: 50 Squats/5 Pullups/7 Burpees/2min Plank/50 Pushups
  Magpie: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 3 RFT: 800m Run/20 KTE/30 KBS/40 SDHP
  Maltz: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Chipper: Run/Pullups/Farmer Carry/Dips/Pushups/KTE/Situps/Run
  Manion: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 7 RFT: 400m Run/29 Back Squats(135/95)
  "Marc Alan Lee": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // Row Buy-in, 3R(DL/Plank/Burpees/JJ/Pushups), Bike Cash-out
  "Marc Castellano": {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // Complex structure: Run/DL Ladder/HC Ladder/Run/10R(Thrusters/DU)/Run
  Marco: {
    elite: { min: 0, max: 480 },
    advanced: { min: 480, max: 720 },
    intermediate: { min: 720, max: 960 },
    beginner: { min: 960, max: null },
  }, // 3 RFT: 21 Pullups/15 HSPU/9 Thrusters(135/95)
  Matt: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 2 RFT: WB Goblet Squats/Burpee Over WB/WB Shots/Bear Crawl w/ WB
  "Matt 16": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 3 x (16 DL/16 HPC/16 PP + 800m Run) - Heavy complex
  "Matt B.": {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 5 RFT: 5 Burpees/10 C2B/20 WB/30 Pushups/400m Run
  // "Matt Would Go": AMRAP listed as time, skipping
  "Matthew Thomas": {
    elite: { min: 0, max: 420 },
    advanced: { min: 420, max: 600 },
    intermediate: { min: 600, max: 780 },
    beginner: { min: 780, max: null },
  }, // 21-15-9 SQ Snatch(42.5/32.5kg)/Pushups
  Maupin: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 4 RFT: 800m Run/49 Pushups/49 Situps/49 Squats
  McCluskey: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 3 RFT: 9 MU/15 Burpee Pullups/21 Pullups/800m Run w/ Vest
  // "McLaren": AMRAP listed as time, skipping
  Meadows: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // For Time: High skill ring work (MU, Lowers, Ring HSPU, Ring Rows, Ring Pushups)
  Michael: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: 800m Run/50 Back Ext/50 Situps
  Millar: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: 7 MU/14 Thrusters(40/30kg)/21 GHD Situps
  Monti: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 5 RFT: Weighted Step-ups/Cleans/Weighted Step-ups/Snatches
  Moon: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 7 RFT: 10 DB Hang Split Snatch (R)/1 RC/10 DB Hang Split Snatch (L)/1 RC
  Morrison: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 50-40-30-20-10: WB/Box Jumps/KBS
  // "Mote": AMRAP listed as time, skipping
  "Mr. Joshua": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 400m Run/30 GHD Situps/15 DL(250/165)
  Ned: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 7 RFT: 11 Back Squats(BW)/1k Row
  // "Never Forget 31.01.2022": AMRAP listed as time, skipping
  Nick: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 12 RFT: 10 DB Hang SQ Cleans(45/35)/6 HSPU on DBs
  Nickman: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 10 RFT: Farmer Carry/Weighted Pullups/DB Snatches
  // "Nookie": AMRAP listed as time, skipping
  Northrup: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // Weighted Step-up Buy-in, 3R(PC/Situps/DL), Row Cash-out
  // "Nukes": AMRAP listed as time, skipping
  Nutts: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // Chipper: HSPU/DL/Box Jumps/Pullups/WB/DU/Weighted Run
  "Oberheim 703": {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3300 },
    intermediate: { min: 3300, max: 3900 },
    beginner: { min: 3900, max: null },
  }, // 4R(DU/C&J/Pushups) + Bike + Run w/ Vest
  "ODA 7313": {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // 7 RFT: Jog/DB Thrusters/Strict Pullups + 3min Rest w/ Vest
  "Officer Darian Jarrot": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 6 RFT: 400m Run/12 Warrior Situps/12 Thrusters(95/65)/51 Jumping Lunges
  // "Officer Jason Knox": AMRAP listed as time, skipping
  // "Ollis": AMRAP listed as time, skipping
  Oz: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // For Time: 100 Squat Clean Thrusters (40/20kg) - Brutal
  Ozzy: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 7 RFT: 11 Deficit HSPU/1k Run
  Pat: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 6 RFT: 25 Pullups/50ft FR Lunges/25 Pushups/50ft FR Lunges w/ Vest
  Patton: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // Complex chipper with runs, DL, Pullups, C&J
  // "Paz": AMRAP listed as time, skipping
  "Pearl Harbor 12.7.41": {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 3 Rounds of Dips/Heavy Barbell/DU
  Pheezy: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: 5 FS/18 Pullups/5 DL/18 T2B/5 Jerk/18 HRPU
  Pike: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 5 RFT: 20 Thrusters/10 Ring Dips/20 Pushups/10 Strict HSPU/50m Bear Crawl
  Pikey: {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // Long chipper with runs, burpee BMU, heavy barbell
  PK: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 5 RFT: 10 BS(225/155)/10 DL(275/185)/400m Sprint + 2min Rest
  Rachel: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 2 RFT: Box Jumps/Push Press/Ball Slams/Shuttle Runs
  // "Rahoi": AMRAP listed as time, skipping
  Ralph: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 7 RFT: 8 DL(250/175)/16 Burpees/3 RC/600m Run
  // "Rankel": AMRAP listed as time, skipping
  Ratana: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // Row Buy-in/Cash-out, long chipper in between
  // "Red Horse": AMRAP listed as time, skipping
  René: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 7 RFT: 400m Run/21 Lunges/15 Pullups/9 Burpees w/ Vest
  Rich: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 13 SQ Snatch / 10R(10 Pullups/100m Sprint) / 13 SQ Clean
  // "Ricky": AMRAP listed as time, skipping
  RJ: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 5 RFT: 800m Run/5 RC/50 Pushups
  "Robert Bush": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: Bodyweight and Ball Slam circuit
  "Roberts Ridge": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Chipper: C&J/KBS/Thrusters/C2B/Burpees/WB/Row
  // "Rocket": AMRAP listed as time, skipping (includes swim)
  Roney: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 4 RFT: Run/Thrusters/Run/PP/Run/Bench (135/95)
  // "Rosenbloom": AMRAP listed as time, skipping
  Roy: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 5 RFT: 15 DL(225/155)/20 Box Jumps/25 Pullups
  // "Runyan": AMRAP listed as time, skipping
  Russ: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 3 RFT: Sandbag work/Bear Crawl/KB Complex w/ Vest
  Santiago: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 7 RFT: 18 DB Hang SQ Cleans/18 Pullups/10 PC/10 HSPU
  "SC 4": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Pushup Buy-in/out, 4R(Run + 4x(BB movement + Burpees))
  "Scott Neumann": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 2 RFT: Run/KBS/Goblet Squats/OH Lunges/Run/OH Lunges/Goblet Squats/KBS
  Scottie: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 10 RFT: Farmer Carry/Strict Chin-ups/Farmer Carry/Burpees/DL(265/185)
  // "Scotty": AMRAP listed as time, skipping
  Sean: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 10 RFT: 11 C2B/22 FS(75/55)
  Servais: {
    elite: { min: 0, max: 4200 },
    advanced: { min: 4200, max: 5400 },
    intermediate: { min: 5400, max: 6600 },
    beginner: { min: 6600, max: null },
  }, // Very Long: 1.5mi Run / 8R(Pullups/Pushups/Burpees) / Sandbag Carry / Farmer Carry
  Severin: {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // For Time: 50 Strict Pullups/100 HRPU/5k Run w/ Vest
  "SFC Will Lindsay": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 10 RFT: Ruck movements + 1 mile Ruck Sandbag Run
  Sham: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 7 RFT: 11 DL(BW)/100m Sprint
  Shawn: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // 5 mile Run w/ 50 Squats/50 Pushups every 5 mins
  "Shawn T. O’Dare": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 2 mile Run/16 Burpees/85 Step-ups w/ Heavy Vest
  Ship: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 9 RFT: 7 SQ Cleans(185/135)/8 Burpee Box Jumps(36/30)
  // "Sisson": AMRAP listed as time, skipping
  Sloan: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 6 RFT: Run/Situps/Climbers/Pushups/Pike PU/Lunges/Squats/Burpees
  Small: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // 3 RFT: 1k Row/50 Burpees/50 Box Jumps/800m Run
  Smudge: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 3 RFT: 5 MU/10 SQ Cleans(60/40kg)/20 GHD Situps
  Smykowski: {
    elite: { min: 0, max: 3600 },
    advanced: { min: 3600, max: 4500 },
    intermediate: { min: 4500, max: 5400 },
    beginner: { min: 5400, max: null },
  }, // For Time: 6k Run/60 Burpee Pullups w/ Vest
  "SPC Justin Hebert": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // Long chipper with many runs and burpees
  Spehar: {
    elite: { min: 0, max: 4800 },
    advanced: { min: 4800, max: 6000 },
    intermediate: { min: 6000, max: 7200 },
    beginner: { min: 7200, max: null },
  }, // For Time: 100 Thrusters(135/95)/100 C2B/6 mile Run - Extremely long
  Stephen: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 30-25-20-15-10-5: GHD Situps/Back Ext/KTE/RDL(95/65)
  Strange: {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // 8 RFT: 600m Run/11 Weighted Pullups/11 Weighted Lunges/11 Thrusters (1.5/1 pood)
  Swink: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // Chipper: Run/Bench/HSPU/DB Thrusters/KTE/DL/Run
  T: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: Sprint/SQ Clean Thrusters/KBS/Sprint + 2min Rest
  "T.U.P.": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 15-12-9-6-3: PC/Pullups/FS/Pullups (135/95)
  Taylor: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 4 RFT: 400m Run/5 Burpee MU w/ Vest
  Terry: {
    elite: { min: 0, max: 2100 },
    advanced: { min: 2100, max: 2700 },
    intermediate: { min: 2700, max: 3300 },
    beginner: { min: 3300, max: null },
  }, // For Time: Run/Pushups/Bear Crawl/Run/Bear Crawl/Pushups/Run
  "The Don": {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // Chipper: 66 reps of 10 movements
  "The Kabul Thirteen": {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // Very long chipper with 13 burpees after each movement
  "The Lyon": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 7 SQ Cleans/7 S2OH/7 Burpee C2B + 2min Rest
  "The Payne Train": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Descending rounds of Cindy + 300m Run each round
  "Thomas Nye": {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // KBS Buy-in/out, Stairs/Core work in middle w/ Vest
  Thompson: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 10 RFT: 1 Seated RC/29 Back Squats(95/65)/10m BB Farmer Carry(135/95 each hand)
  "Three Fathers": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Chipper: Run/Pushups/Situps/Squats/Run
  // "Tiff": AMRAP listed as time, skipping
  Timmins: {
    elite: { min: 0, max: 3000 },
    advanced: { min: 3000, max: 3900 },
    intermediate: { min: 3900, max: 4800 },
    beginner: { min: 4800, max: null },
  }, // Row Buy-in/Cash-out, 3R(DU/Heavy C&J/BMU)
  // "TK": AMRAP listed as time, skipping
  // "Tom": AMRAP listed as time, skipping
  "Tommy V": {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // Descending Ladder: Thrusters(115/75)/Rope Climbs
  TPT9000: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 9 RFT: Burpees/KBS/WB + 100m Run each round w/ Vest
  Travis: {
    elite: { min: 0, max: 3600 },
    advanced: { min: 3600, max: 4500 },
    intermediate: { min: 4500, max: 5400 },
    beginner: { min: 5400, max: null },
  }, // Run Buy-in, 9R(Devil Press/FS), Push Press Buy-out
  // "Tully": Skipping (includes swim)
  Tumilson: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 8 RFT: 200m Run/11 DB Burpee DL(60/40)
  Tyler: {
    elite: { min: 0, max: 720 },
    advanced: { min: 720, max: 1080 },
    intermediate: { min: 1080, max: 1440 },
    beginner: { min: 1440, max: null },
  }, // 5 RFT: 7 MU/21 SDHP(95/65)
  // "Viola": AMRAP listed as time, skipping
  Wade: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // Run / 4R(Strict Pullups/Strict Dips/Strict HSPU) / Run w/ Vest
  Walsh: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 4 RFT: 22 Burpee Pullups/22 Back Squats(185/135)/200m OH Plate Run
  "War Frank": {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 3 RFT: 25 MU/100 Squats/35 GHD Situps
  Weaver: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 4 RFT: Gymnastics complex (L-Pullups/Pushups/C2B/Pushups/Pullups/Pushups)
  Wes: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // Plate Run / 14R(Strict Pullups/Burpee Box Jumps/Cleans) / Plate Run
  // "Wesley": AMRAP listed as time, skipping
  Weston: {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // 5 RFT: 1k Row/Farmer Carry/Waiter Walk (R)/Waiter Walk (L)
  "Weston Lee": {
    elite: { min: 0, max: 2700 },
    advanced: { min: 2700, max: 3600 },
    intermediate: { min: 3600, max: 4500 },
    beginner: { min: 4500, max: null },
  }, // Burden Carry/Burpee Pullups/RC/Ring Dips/Burpee Box Jumps/Burden Carry w/ Vest
  White: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 5 RFT: 3 RC/10 T2B/21 OH Lunges(45/35)/400m Run
  "Will Lindsay": {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 10 RFT: 3 Devil Press/22 DB Lunges/19 Squats w/ Vest
  Willy: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 3 RFT: 800m Run/5 FS(225/155)/200m Run/11 C2B/400m Run/12 KBS(2/1.5)
  Wilmot: {
    elite: { min: 0, max: 900 },
    advanced: { min: 900, max: 1200 },
    intermediate: { min: 1200, max: 1500 },
    beginner: { min: 1500, max: null },
  }, // 6 RFT: 50 Squats/25 Ring Dips
  Wittman: {
    elite: { min: 0, max: 1200 },
    advanced: { min: 1200, max: 1680 },
    intermediate: { min: 1680, max: 2100 },
    beginner: { min: 2100, max: null },
  }, // 7 RFT: 15 KBS(1.5/1)/15 PC(95/65)/15 Box Jumps
  Woehlke: {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // 3 Rounds Each FT: Heavy BB/Gymnastics + 3min Rest
  Wyk: {
    elite: { min: 0, max: 1800 },
    advanced: { min: 1800, max: 2400 },
    intermediate: { min: 2400, max: 3000 },
    beginner: { min: 3000, max: null },
  }, // 5 RFT: 5 FS(225/155)/5 RC/400m Plate Run
  "Xingu E Besada": {
    elite: { min: 0, max: 2400 },
    advanced: { min: 2400, max: 3000 },
    intermediate: { min: 3000, max: 3600 },
    beginner: { min: 3600, max: null },
  }, // Chipper: Run/Pushups/Lunges/Pullups/Squats/Burpees/Run
  Yeti: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // For Time: 25 Pullups/10 MU/1.5mi Run/10 MU/25 Pullups
  Zembiec: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 5 RFT: 11 Back Squats(185/135)/7 Strict Burpee Pullups/400m Run
  Zeus: {
    elite: { min: 0, max: 1500 },
    advanced: { min: 1500, max: 2100 },
    intermediate: { min: 2100, max: 2700 },
    beginner: { min: 2700, max: null },
  }, // 3 RFT: 30 WB/30 SDHP/30 Box Jumps/30 PP/30 Cal Row/30 Pushups/10 Back Squats(BW)
  // "Zimmerman": AMRAP listed as time, skipping
};

// --- Main Script Logic ---
async function applyLevels() {
  console.log(`Reading WOD data from ${WODS_FILE_PATH}...`);
  let wods;
  try {
    const fileContent = await fs.readFile(WODS_FILE_PATH, "utf-8");
    wods = JSON.parse(fileContent);
    console.log(`Successfully read and parsed ${wods.length} WODs.`);
  } catch (error) {
    console.error(`Error reading or parsing ${WODS_FILE_PATH}:`, error);
    process.exit(1);
  }

  let updatedCount = 0;
  const updatedWodNames = [];
  const skippedWodNames = [];

  console.log("Scanning for WODs with empty benchmark levels...");
  wods = wods.map((wod) => {
    // Check if levels object exists and is empty
    const needsUpdate =
      wod.benchmarks?.levels &&
      typeof wod.benchmarks.levels === "object" &&
      Object.keys(wod.benchmarks.levels).length === 0;

    if (needsUpdate) {
      const estimatedLevels = estimatedLevelsMap[wod.wodName];
      if (estimatedLevels) {
        console.log(` -> Applying pre-analyzed levels for ${wod.wodName}...`);
        wod.benchmarks.levels = estimatedLevels;
        updatedCount++;
        updatedWodNames.push(wod.wodName);
      } else {
        console.warn(
          ` -> No pre-analyzed levels found for ${wod.wodName} (potentially skipped due to type/complexity). Leaving levels empty.`,
        );
        skippedWodNames.push(wod.wodName);
      }
    }
    return wod;
  });

  if (updatedCount > 0) {
    console.log(`\nSuccessfully applied levels for ${updatedCount} WODs:`);
    // console.log(updatedWodNames.join(', ')); // Optionally log names

    if (skippedWodNames.length > 0) {
      console.warn(
        `\nSkipped applying levels for ${skippedWodNames.length} WODs (not found in map):`,
      );
      // console.warn(skippedWodNames.join(', ')); // Optionally log names
    }

    console.log(`\nWriting updated data back to ${WODS_FILE_PATH}...`);
    try {
      // Sort WODs alphabetically by wodName before writing
      wods.sort((a, b) => (a.wodName || "").localeCompare(b.wodName || ""));
      await fs.writeFile(WODS_FILE_PATH, JSON.stringify(wods, null, 2));
      console.log("Successfully wrote updated data.");
    } catch (error) {
      console.error(`Error writing updated data to ${WODS_FILE_PATH}:`, error);
      process.exit(1);
    }
  } else {
    console.log(
      "\nNo WODs with empty levels found matching the pre-analyzed map. File not modified.",
    );
    if (skippedWodNames.length > 0) {
      console.warn(
        `\nFound ${skippedWodNames.length} WODs with empty levels but no pre-analyzed data:`,
      );
      // console.warn(skippedWodNames.join(', ')); // Optionally log names
    }
  }
}

applyLevels();
