library(tidyverse)
library(jsonlite)
library(kableExtra)
library(RColorBrewer)

# ==============================================================================
# 1. DATA LOADING HELPERS
# ==============================================================================

load_detailed_log <- function(path = "../../soco_log_detailed_stands.csv") {
  if(!file.exists(path)) stop("Detailed log not found: ", path)
  
  read_csv(path, show_col_types = FALSE) %>%
    mutate(
      owner_type = str_to_title(owner_type),
      activity_name = ifelse(activity_name == "noManagement", NA, activity_name)
    )
}

load_aggregated_log <- function(path = "../../soco_log_aggregated_species.csv") {
  if(!file.exists(path)) {
    warning("Aggregated species log not found: ", path)
    return(NULL)
  }
  read_csv(path, show_col_types = FALSE) %>%
    mutate(owner_type = str_to_title(owner_type))
}

# ==============================================================================
# 2. STAND DYNAMICS (3 Examples per Owner)
# ==============================================================================

plot_stand_dynamics <- function(data) {
  
  # A. Select 3 Representative Stands per Owner
  set.seed(42) 
  selected_ids <- data %>%
    distinct(owner_type, stand_id) %>%
    group_by(owner_type) %>%
    slice_sample(n = 3) %>%
    pull(stand_id)
  
  df_plot <- data %>%
    filter(stand_id %in% selected_ids) %>%
    mutate(
      facet_label = paste0(owner_type, "\nStand ", stand_id),
      # Only label active events
      activity_plot = ifelse(is_active == 1 & !is.na(activity_name), activity_name, NA)
    )
  
  # B. Plot Volume Curves + Interaction Points
  ggplot(df_plot, aes(x = year, y = volume)) +
    # Background: Volume Growth
    geom_line(color = "grey40", size = 0.8) +
    
    # Foreground: Activities
    geom_point(data = subset(df_plot, !is.na(activity_plot)), 
               aes(color = activity_plot, shape = activity_plot), 
               size = 3, stroke = 1.2) +
    
    facet_wrap(~facet_label, scales = "free_y", ncol = 3) + 
    
    scale_color_brewer(palette = "Set1", name = "Activity") +
    scale_shape_manual(values = c(16, 17, 15, 18, 8, 3, 4, 1, 10, 12), name = "Activity") +
    
    theme_bw(base_size = 11) +
    labs(
      title = "Stand Dynamics & Interventions (Examples)",
      subtitle = "Volume development overlaid with performed activities",
      y = "Volume (m3/ha)", x = "Simulation Year"
    ) +
    theme(
      strip.background = element_rect(fill = "#f0f0f0"),
      strip.text = element_text(face = "bold"),
      legend.position = "bottom",
      legend.box = "vertical"
    )
}

# ==============================================================================
# 3. DETAILED AGENT ACTIVITY TABLE
# ==============================================================================
get_agent_activity_table <- function(data, selected_agent_id = NULL) {
  
  # 1. Select Agent ID if not provided
  if(is.null(selected_agent_id)) {
    selected_agent_id <- data %>%
      filter(is_active == 1, !is.na(activity_name)) %>%
      count(agent_id) %>%
      arrange(desc(n)) %>%
      slice(1) %>%
      pull(agent_id)
  }
  
  # 2. Define Columns to Keep
  cols_to_select <- c(
    "stand_id", "year", "activity_name", "absolute_age", 
    "volume", "height", "species_composition"
  )
  
  if("structure_class" %in% names(data)) {
    cols_to_select <- c(cols_to_select, "structure_class")
  }
  
  # 3. CREATE 'agent_data' (This was missing!)
  # Filter rows and select columns
  agent_data <- data %>%
    filter(agent_id == selected_agent_id) %>%
    filter(is_active == 1, !is.na(activity_name)) %>%
    select(any_of(cols_to_select)) %>%  # Use any_of for safety
    rename(
      Stand = stand_id,
      Year = year,
      Activity = activity_name,
      `Stand Age` = absolute_age,
      `Vol (m3)` = volume,
      `H (m)` = height,
      `Dom Species` = species_composition
    )
  
  # Optional rename for Structure if it exists
  if("structure_class" %in% names(data)) {
    agent_data <- agent_data %>% rename(Structure = structure_class)
  }
  
  # 4. Clean Species JSON and Render
  agent_data %>%
    mutate(`Dom Species` = map_chr(`Dom Species`, function(x) {
      tryCatch({
        parsed <- fromJSON(x)
        if(length(parsed) > 0) names(parsed)[1] else "-"
      }, error = function(e) "-")
    })) %>%
    arrange(Stand, Year) %>%
    kbl(caption = paste("Activity Execution Log for Agent:", selected_agent_id)) %>%
    kable_styling(bootstrap_options = c("striped", "hover", "condensed"), full_width = F) %>%
    collapse_rows(columns = 1, valign = "top")
}
# ==============================================================================
# 4. LANDSCAPE COMPOSITION (Aggregated Log)
# ==============================================================================

plot_landscape_composition <- function(data_agg) {
  
  if(is.null(data_agg)) return(ggplot() + annotate("text", x=1, y=1, label="No Data"))
  
  # 1. Parse JSON Column
  # The species_composition column contains strings like '{"piab":0.5, "fasy":0.5}'
  df_long <- data_agg %>%
    rowwise() %>%
    mutate(comp = list(fromJSON(species_composition))) %>%
    unnest_longer(comp, values_to = "share", indices_to = "species") %>%
    ungroup()
  
  # 2. Plot
  ggplot(df_long, aes(x = year, y = share, fill = species)) +
    geom_area(position = "fill", alpha = 0.9, color = "white", size = 0.1) +
    
    facet_wrap(~owner_type) +
    
    scale_fill_brewer(palette = "Set3", name = "Species") +
    scale_y_continuous(labels = scales::percent, expand = c(0,0)) +
    scale_x_continuous(expand = c(0,0)) +
    
    theme_minimal(base_size = 14) +
    labs(
      title = "Full Landscape Composition by Owner",
      subtitle = "Aggregated species share (Basal Area weighted)",
      y = "Share of Landscape",
      x = "Simulation Year"
    ) +
    theme(legend.position = "bottom")
}

# ==============================================================================
# 5. EXECUTION AGE (Distribution)
# ==============================================================================

plot_execution_age <- function(data) {
  
  act_data <- data %>%
    filter(is_active == 1, !is.na(activity_name)) %>%
    filter(!activity_name %in% c("planting", "MegaSTP_Planting"))
  
  if(nrow(act_data) == 0) return(NULL)
  
  ggplot(act_data, aes(x = activity_name, y = absolute_age, fill = owner_type)) +
    geom_violin(scale = "width", alpha = 0.7, draw_quantiles = 0.5) +
    
    facet_wrap(~owner_type, scales = "free_x") +
    scale_fill_brewer(palette = "Set2") +
    
    labs(title = "Activity Execution Age",
         subtitle = "Age distribution when activities are triggered",
         x = NULL, y = "Stand Age") +
    
    theme_bw(base_size = 12) +
    theme(
      legend.position = "none",
      axis.text.x = element_text(angle = 45, hjust = 1)
    )
}


