rm(list = ls())
# 1. Load Modules (Logic)
source("ODDSTUFF/helpers_func/activity_helper.R")
source("ODDSTUFF/helpers_func/params_helper.R")
source("ODDSTUFF/helpers_func/age_helper.R")
source("ODDSTUFF/helpers_func/traits_helper.R")
source("ODDSTUFF/helpers_func/species_helper.R")
source("ODDSTUFF/helpers_func/profiles_helper.R")

# 3. Load the RAW Data for that Scenario
source(file.path("ODDSTUFF/raw_tables", "activities", "activities_guess.R")) # Loads 'raw_data'
source(file.path("ODDSTUFF/raw_tables", "parameters", "parameters_guess.R"))     # Loads 'raw_params'
source(file.path("ODDSTUFF/raw_tables", "age", "age_basic.R"))     # Loads 'raw_params'
source(file.path("ODDSTUFF/raw_tables", "traits", "traits.R"))     # Loads 'raw_params'
source(file.path("ODDSTUFF/raw_tables", "species", "species_strategies.R"))     # Loads 'raw_params'
source(file.path("ODDSTUFF/raw_tables", "profiles", "profiles.R"))     # Loads 'raw_params'

# 4. coompute what need to be computed
age_lookup_table <- calculate_age_probabilities(age_params, age_max = 250)




# Export to ODD folder
export_activity_json(raw_activity, path = "ODDSTUFF/created_json_tables/activity_distributions.json")
export_params_json(raw_params, path = "ODDSTUFF/created_json_tables/parameter_distributions.json")
export_age_json(age_lookup_table, path = "ODDSTUFF/created_json_tables/age_class_lookup.json")
export_trait_json(trait_data, path = "ODDSTUFF/created_json_tables/agent_traits.json")
export_species_json(species_data, path = "ODDSTUFF/created_json_tables/species_config.json")
export_profile_json(target_dbh_raw, key_col = "species", value_col = "dbh_threshold", path = "ODDSTUFF/created_json_tables/targetDBH_profiles.json")
export_profile_json(plenter_raw,  key_col = "dbh_class",  value_col = "stem_count",  path = "ODDSTUFF/created_json_tables/plenter_profiles.json")

# Export to Model folder
model_base <- "../abe/SOCO/config/tables"
export_activity_json(raw_activity, path = file.path(model_base, "activities", "activity_distributions.json"))
export_params_json(raw_params, path = file.path(model_base, "params", "parameter_distributions.json"))
export_age_json(age_lookup_table, path = file.path(model_base, "age_class", "age_class_lookup.json"))
export_species_json(species_data, path = file.path(model_base, "species", "species_config.json"))
export_trait_json(trait_data, path = file.path(model_base, "traits", "agent_traits.json"))
export_profile_json(target_dbh_raw, key_col = "species", value_col = "dbh_threshold", path = file.path(model_base, "profiles", "targetDBH_profiles.json"))
export_profile_json(plenter_raw, key_col = "dbh_class",  value_col = "stem_count",  path = file.path(model_base, "profiles", "plenter_profiles.json"))


# ==============================================================================
# 7. GRID & LANDSCAPE GENERATION
# ==============================================================================
source("ODDSTUFF/helpers_func/init_grid_helper.R")
source("ODDSTUFF/helpers_func/grid_helper.R")
source("ODDSTUFF/raw_tables/grid/grid.R")

# Define Input Paths (Adjust if your init folder is elsewhere)
base_grid_in <- "../init/env_grid_CLUSTER10_REPL1.asc"
env_csv_in   <- "../init/env_file_CLUSTER10_REPL1_ICHEC-EC-EARTH_historical.csv"
tree_csv_in  <- "../init/trees_CLUSTER10.csv"
sap_csv_in   <- "../init/saplings_CLUSTER10.csv"
init_out_dir <- "../init" 

# --- Step 3.1: Pre-process Full Landscape ---
# Generates the 11km x 11km raster (stand_blocks_10x10.asc) and Full CSVs (tree2.csv)
full_raster_path <- preprocess_grid_clean(
  base_grid_path   = base_grid_in,
  env_csv_path     = env_csv_in,
  tree_csv_path    = tree_csv_in,
  sapling_csv_path = sap_csv_in,
  output_dir       = init_out_dir
)

# --- Step 3.2: Create Active Subset ---
# Your existing subset function is mostly fine, BUT verify it reads the "clean" files.
create_active_subset(
  full_raster_path  = full_raster_path,
  full_tree_path    = file.path(init_out_dir, "tree2_clean.csv"),     # <--- UPDATED NAME
  full_sapling_path = file.path(init_out_dir, "sapling2_clean.csv"),  # <--- UPDATED NAME
  full_env_path     = file.path(init_out_dir, "env_file_clean.csv"),  # <--- UPDATED NAME
  output_dir        = init_out_dir,
  landscape_meta    = landscape_meta 
)

# --- Step 3.3: Generate Agents on Active Landscape ---
if(file.exists(full_raster_path)) {
  
  # Load Full Raster
  stand_raw <- terra::rast(full_raster_path)
  
  # Define Crop Extent (Must match landscape_meta exactly)
  ext_obj <- terra::ext(
    landscape_meta$x, 
    landscape_meta$x + landscape_meta$width,
    landscape_meta$y, 
    landscape_meta$y + landscape_meta$height
  )
  
  # Crop in memory for Agent Allocation
  stand_r <- terra::crop(stand_raw, ext_obj)
  
  # SAFETY: Get valid IDs in this crop to ensure 1:1 match with iLand
  valid_ids <- unique(terra::values(stand_r, mat=FALSE))
  valid_ids <- valid_ids[!is.na(valid_ids)]
  
  message(sprintf("Generating Agents for %d stands in a %.1fx%.1f km window.", 
                  length(valid_ids), landscape_meta$width/1000, landscape_meta$height/1000))
  
  # Generate Scenarios
  landscape_owner_list <- list()
  
  # Standard Scenarios (Random -> High Clustering)
  for(i in 1:nrow(scenarios_config)) {
    name <- scenarios_config$name[i]
    coeff <- scenarios_config$cluster_coeff[i]
    
    # Cluster
    map_tbl <- cluster_stands_by_clustering(stand_r, props = target_proportions, cluster = coeff, seed = 7)
    
    # Filter to Valid IDs only (Prevent Ghost Stands)
    map_tbl <- map_tbl %>% filter(stand_id %in% valid_ids)
    
    landscape_owner_list[[name]] <- map_tbl
  }
  
  # Homogeneous Scenarios
  f_clust <- function(p) {
    cluster_stands_by_clustering(stand_r, props = p, cluster = 1, seed = 7) %>%
      filter(stand_id %in% valid_ids)
  }
  landscape_owner_list[["state_only"]] <- f_clust(c(0,1,0))
  landscape_owner_list[["small_only"]] <- f_clust(c(1,0,0))
  landscape_owner_list[["big_only"]]   <- f_clust(c(0,0,1))
  
  # Export CSVs (Shuffled = FALSE)
  # 1. To ODD
  export_agent_tables(landscape_owner_list, 
                      owner_params = agent_size_params, 
                      shuffled = FALSE, 
                      out_dir = "created_json_tables/grid")
  
  # 2. To Model
  model_stand_dir <- file.path("..", "abe", "stand_files")
  export_agent_tables(landscape_owner_list, 
                      owner_params = agent_size_params, 
                      shuffled = FALSE, 
                      out_dir = model_stand_dir)
  
  print("--- 3. LANDSCAPE & AGENTS EXPORTED ---")
  
} else {
  warning("Raster generation failed. Agents not updated.")
}
t <- read.csv("../init/tree2_active.csv")
s <- read.csv("../init/sapling2.csv")
x <- read.csv("../abe/stand_files/agent_table_high_shuffled-false.csv")
x


length(unique(s$stand_id))
length(unique(t$stand_id))
s$bwi_plot_id
s_ref <- read.csv("../../../Documents/small_landscape/init/saplings_CLUSTER10.csv")
head(s_ref)
head(s)
