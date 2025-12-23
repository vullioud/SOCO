library(tibble)

# 1. LANDSCAPE DIMENSIONS
# Defines the window we want to Simulate/Manage agents on.
landscape_meta <- list(
  width  = 3000, # m
  height = 3000, # m
  x      = 00, # offset x
  y      = 00  # offset y
)

# 2. TARGET PROPORTIONS (Small, State, Big)
target_proportions <- c(0.45, 0.30, 0.25)

# 3. CLUSTERING SCENARIOS
scenarios_config <- tribble(
  ~name,    ~cluster_coeff,
  "Random", 0.01,
  "Low",    0.03,
  "Medium", 0.08,
  "High",   1.0
)

# 4. AGENT SIZE PARAMETERS (ZTP)
agent_size_params <- list(
  small = list(lambda = 5,  max_stands = 20),
  state = list(lambda = 10, max_stands = 42),
  big   = list(lambda = 15, max_stands = 60)
)