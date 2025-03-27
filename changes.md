**Summary of Structural Data Changes:**

1. **Benchmark Certainty Removed:**

   * The `certainty` field (key-value pair) has been completely **removed** from the `benchmarks` object within each WOD entry. UI logic related to displaying or using benchmark certainty should be removed.  
2. **Time Unit Standardization in Benchmarks:**

   * For all WOD entries where `benchmarks.type` is `"time"`, the `min` and `max` values within `benchmarks.levels` (e.g., `benchmarks.levels.elite.max`) now consistently represent time in **integer seconds**.  
   * UI logic displaying these benchmarks should format these second values into a human-readable format (e.g., MM:SS) where appropriate.  
3. **Score Representation Overhaul in Results:**

   * The original `score` field within each object in the `results` array has been **removed**.  
   * **Five new fields** have been added to each `results` object to represent different score types. These fields are all **nullable numbers**:  
     * `score_time_seconds`: Stores the finishing time in **integer seconds** if the workout was completed for time. Null otherwise.  
     * `score_reps`: Stores the **total rep count** if the workout score was purely reps (e.g., reps completed at a time cap, total reps in a Tabata WOD, max reps). Null otherwise.  
     * `score_load`: Stores the **load/weight** (e.g., in lbs) if the workout was scored by load. Null otherwise.  
     * `score_rounds_completed`: Stores the number of **full rounds** completed if the workout was an AMRAP scored as Rounds \+ Reps. Null otherwise.  
     * `score_partial_reps`: Stores the number of **additional reps** in the incomplete round if the workout was an AMRAP scored as Rounds \+ Reps. Null otherwise (or 0).

**Implications for UI Agent:**

* **Displaying Scores:** The UI must now check which of the five new score fields (`score_time_seconds`, `score_reps`, `score_load`, `score_rounds_completed`) contains a non-null value for a given result to determine the score type and display it correctly.  
  * Format `score_time_seconds` from seconds to MM:SS.  
  * Display `score_reps` with a "Reps" label.  
  * Display `score_load` with a unit label (e.g., "lbs").  
  * Combine `score_rounds_completed` and `score_partial_reps` to display in the standard "Rounds \+ Reps" format (e.g., "11 \+ 5" or just "11" if partial reps is 0).  
* **Data Input/Editing:** If the UI allows adding or editing results, it needs to capture the appropriate score type and value(s) and save them into the corresponding new field(s). Time inputs might need conversion to seconds before saving. "Rounds+Reps" input needs parsing into the two separate fields.  
* **Data Reading:** All existing logic that read the old `score` field must be updated to read from the appropriate new field(s) based on the score type expected for the WOD or determined by checking which field is non-null.

