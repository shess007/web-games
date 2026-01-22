extends Node
## Game Configuration - All constants and settings for Space Taxi Roguelike

# =============================================================================
# WORLD CONSTANTS
# =============================================================================
const WORLD = {
	"gravity": 0.04,
	"friction": 0.98,
	"max_velocity": 8.0,
	"safe_landing_speed": 1.0,
	"hard_landing_speed": 1.2,
	"danger_speed": 3.0,
	"caution_speed": 1.0
}

# =============================================================================
# TAXI PHYSICS
# =============================================================================
const TAXI = {
	"width": 34,
	"height": 22,
	"thrust_up": 0.21,
	"thrust_side": 0.18,
	"fuel_drain_up": 0.18,
	"fuel_drain_side": 0.07,
	"gear_thrust_multiplier": 0.35,
	"max_fuel": 100.0,
	"collision_radius": 15
}

# =============================================================================
# DAMAGE VALUES
# =============================================================================
const DAMAGE = {
	"wall": 1,
	"asteroid": 1,
	"debris": 1,
	"hard_landing": 1,
	"no_gear_landing": 1,
	"enemy": 2,
	"meteor": 2
}

# =============================================================================
# CONTRACT TYPES
# =============================================================================
enum ContractType { STANDARD, EXPRESS, FRAGILE, HAZARD, VIP }

const CONTRACTS = {
	ContractType.STANDARD: {
		"name": "Standard",
		"payout": 100,
		"description": "Regular delivery",
		"color": Color(0.3, 0.8, 0.3),
		"time_limit": 0,
		"max_speed": 0,
		"no_bumps": false
	},
	ContractType.EXPRESS: {
		"name": "Express",
		"payout": 150,
		"description": "30 second time limit",
		"color": Color(0.9, 0.6, 0.2),
		"time_limit": 30.0,
		"max_speed": 0,
		"no_bumps": false
	},
	ContractType.FRAGILE: {
		"name": "Fragile",
		"payout": 180,
		"description": "Max speed 2.0 u/s",
		"color": Color(0.6, 0.4, 0.9),
		"time_limit": 0,
		"max_speed": 2.0,
		"no_bumps": false
	},
	ContractType.HAZARD: {
		"name": "Hazard",
		"payout": 200,
		"description": "Route through enemies",
		"color": Color(0.9, 0.3, 0.3),
		"time_limit": 0,
		"max_speed": 0,
		"no_bumps": false
	},
	ContractType.VIP: {
		"name": "VIP",
		"payout": 300,
		"description": "No bumps, soft landing, max 0.8 u/s",
		"color": Color(0.9, 0.8, 0.2),
		"time_limit": 0,
		"max_speed": 0.8,
		"no_bumps": true
	}
}

# =============================================================================
# MODIFIERS
# =============================================================================
enum ModifierType { SOLAR_STORM, ION_CLOUDS, GRAVITY_FLUX, FUEL_LEAK, SCANNER_JAM, LUCKY_STARS }

const MODIFIERS = {
	ModifierType.SOLAR_STORM: {
		"name": "Solar Storm",
		"icon": "☀️",
		"description": "Reduced thrust, screen shake",
		"thrust_multiplier": 0.7,
		"shake_intensity": 2.0
	},
	ModifierType.ION_CLOUDS: {
		"name": "Ion Clouds",
		"icon": "⚡",
		"description": "Random drift",
		"drift_amount": 0.03
	},
	ModifierType.GRAVITY_FLUX: {
		"name": "Gravity Flux",
		"icon": "🌀",
		"description": "Oscillating gravity",
		"gravity_min": 0.02,
		"gravity_max": 0.06,
		"cycle_speed": 0.002
	},
	ModifierType.FUEL_LEAK: {
		"name": "Fuel Leak",
		"icon": "💧",
		"description": "Increased fuel consumption",
		"drain_multiplier": 1.2
	},
	ModifierType.SCANNER_JAM: {
		"name": "Scanner Jam",
		"icon": "📡",
		"description": "Minimap disabled"
	},
	ModifierType.LUCKY_STARS: {
		"name": "Lucky Stars",
		"icon": "⭐",
		"description": "Increased payouts",
		"payout_multiplier": 1.25
	}
}

# =============================================================================
# SECTOR CONFIGURATIONS
# =============================================================================
const SECTORS = [
	{
		"name": "Morning Shift",
		"world_width": 1600,
		"world_height": 1200,
		"platforms": 4,
		"passengers": 2,
		"enemies": 0,
		"asteroids": 3,
		"debris": 0,
		"meteors": 0,
		"modifiers": 0
	},
	{
		"name": "Rush Hour",
		"world_width": 1800,
		"world_height": 1400,
		"platforms": 5,
		"passengers": 3,
		"enemies": 2,
		"asteroids": 5,
		"debris": 8,
		"meteors": 2,
		"modifiers": 1
	},
	{
		"name": "Final Fare",
		"world_width": 2000,
		"world_height": 1600,
		"platforms": 5,
		"passengers": 1,
		"enemies": 3,
		"asteroids": 7,
		"debris": 12,
		"meteors": 4,
		"modifiers": 2,
		"vip": true
	}
]

# =============================================================================
# BUILDING TYPES
# =============================================================================
enum BuildingType { SPACE_HOUSE, VILLA, FACTORY, DISCO, PUB, FUEL_STATION, BASE_PORT }

const BUILDINGS = {
	BuildingType.SPACE_HOUSE: {
		"name": "Space House",
		"width": 60,
		"height": 40,
		"color": Color(0.4, 0.5, 0.6),
		"door_offset": 20
	},
	BuildingType.VILLA: {
		"name": "Villa",
		"width": 80,
		"height": 50,
		"color": Color(0.6, 0.5, 0.4),
		"door_offset": 30
	},
	BuildingType.FACTORY: {
		"name": "Factory",
		"width": 100,
		"height": 60,
		"color": Color(0.5, 0.5, 0.5),
		"door_offset": 40
	},
	BuildingType.DISCO: {
		"name": "Disco",
		"width": 70,
		"height": 45,
		"color": Color(0.8, 0.3, 0.8),
		"door_offset": 25
	},
	BuildingType.PUB: {
		"name": "Pub",
		"width": 65,
		"height": 42,
		"color": Color(0.6, 0.4, 0.2),
		"door_offset": 22
	},
	BuildingType.FUEL_STATION: {
		"name": "Fuel Station",
		"width": 90,
		"height": 55,
		"color": Color(0.2, 0.6, 0.3),
		"door_offset": 35,
		"is_fuel": true
	},
	BuildingType.BASE_PORT: {
		"name": "Base Port",
		"width": 120,
		"height": 70,
		"color": Color(0.3, 0.4, 0.7),
		"door_offset": 50,
		"is_base": true
	}
}

# =============================================================================
# PASSENGER PERSONALITIES
# =============================================================================
const PASSENGERS = [
	{
		"emoji": "🧑‍🚀",
		"name": "Astronaut",
		"pickup_lines": ["Ready for liftoff!", "Let's explore the cosmos!", "My suit is pressurized."],
		"dropoff_lines": ["Smooth ride!", "Thanks, pilot!", "See you in the stars!"]
	},
	{
		"emoji": "👾",
		"name": "Alien",
		"pickup_lines": ["Greetings, Earthling.", "Take me to your leader.", "Fascinating vehicle."],
		"dropoff_lines": ["Most satisfactory.", "Your planet is strange.", "Bleep bloop!"]
	},
	{
		"emoji": "🤖",
		"name": "Robot",
		"pickup_lines": ["INITIATING TRANSPORT.", "Destination confirmed.", "Optimizing route..."],
		"dropoff_lines": ["ARRIVAL COMPLETE.", "Efficiency: acceptable.", "Beep boop."]
	},
	{
		"emoji": "🕵️",
		"name": "Spy",
		"pickup_lines": ["Keep it quiet.", "No questions.", "Drive. Now."],
		"dropoff_lines": ["You saw nothing.", "This never happened.", "Forget my face."]
	},
	{
		"emoji": "🧙",
		"name": "Wizard",
		"pickup_lines": ["By the stars!", "A mystical chariot!", "Enchanting!"],
		"dropoff_lines": ["Splendid journey!", "Magic in motion!", "Farewell, noble driver!"]
	},
	{
		"emoji": "🥷",
		"name": "Ninja",
		"pickup_lines": ["...", "*nods silently*", "Swift passage."],
		"dropoff_lines": ["Honor to you.", "*vanishes*", "Like the wind."]
	},
	{
		"emoji": "👸",
		"name": "Princess",
		"pickup_lines": ["A royal carriage!", "Don't jostle me.", "To the palace!"],
		"dropoff_lines": ["Acceptable service.", "You may go.", "A royal tip for you."]
	},
	{
		"emoji": "🧟",
		"name": "Zombie",
		"pickup_lines": ["Braaains...", "Uuuugh...", "Hungryyy..."],
		"dropoff_lines": ["Thaaanks...", "Goood riiide...", "Braaains!"]
	},
	{
		"emoji": "🦸",
		"name": "Superhero",
		"pickup_lines": ["Justice awaits!", "To the rescue!", "Evil never rests!"],
		"dropoff_lines": ["The city is safe!", "Another day saved!", "Stay heroic!"]
	},
	{
		"emoji": "👨‍🔬",
		"name": "Scientist",
		"pickup_lines": ["Fascinating propulsion!", "For science!", "Quantum transport!"],
		"dropoff_lines": ["Excellent data!", "Hypothesis confirmed!", "Eureka!"]
	},
	{
		"emoji": "🎸",
		"name": "Rockstar",
		"pickup_lines": ["Let's rock!", "Crank it up!", "Party time!"],
		"dropoff_lines": ["Epic ride!", "Rock on!", "Encore!"]
	},
	{
		"emoji": "👻",
		"name": "Ghost",
		"pickup_lines": ["Boooo!", "Spooky ride!", "Haunted taxi!"],
		"dropoff_lines": ["Ghoulish fun!", "Boo-tiful!", "I'll haunt you... kindly."]
	},
	{
		"emoji": "🤠",
		"name": "Cowboy",
		"pickup_lines": ["Yeehaw!", "Saddle up!", "This ain't no horse!"],
		"dropoff_lines": ["Much obliged!", "Happy trails!", "Ride into the sunset!"]
	},
	{
		"emoji": "🧛",
		"name": "Vampire",
		"pickup_lines": ["The night calls.", "No garlic, I hope.", "Darkness embraces."],
		"dropoff_lines": ["Eternally grateful.", "Until next darkness.", "Bleh!"]
	},
	{
		"emoji": "🎅",
		"name": "Santa",
		"pickup_lines": ["Ho ho ho!", "Special delivery!", "Presents await!"],
		"dropoff_lines": ["Merry travels!", "You're on the nice list!", "Ho ho ho!"]
	},
	{
		"emoji": "🦹",
		"name": "Villain",
		"pickup_lines": ["My evil lair awaits!", "Don't cross me.", "World domination calls!"],
		"dropoff_lines": ["Adequate minion.", "You'll be spared... for now.", "Muhahaha!"]
	}
]

# =============================================================================
# PLATFORM NAMES
# =============================================================================
const PLATFORM_NAMES = [
	"ALPHA BASE", "NEBULA DOCK", "COSMIC HUB", "STELLAR PORT",
	"QUANTUM PIER", "VOID STATION", "ASTRAL POINT", "LUNAR GATE",
	"SOLAR TERMINUS", "GALAXY REST", "PULSAR STOP", "NOVA PLATFORM",
	"METEOR HAVEN", "COMET LANDING", "ORBIT STATION", "STAR DOCK",
	"PLASMA PORT", "ION TERMINAL", "FLUX POINT", "WARP STATION"
]

# =============================================================================
# ENVIRONMENT THEMES
# =============================================================================
const THEMES = {
	"deep_space": {
		"background": Color(0.02, 0.02, 0.08),
		"stars": Color(0.9, 0.9, 1.0),
		"nebula": Color(0.2, 0.1, 0.3),
		"platform": Color(0.3, 0.3, 0.4)
	},
	"nebula": {
		"background": Color(0.08, 0.02, 0.12),
		"stars": Color(1.0, 0.8, 0.9),
		"nebula": Color(0.4, 0.1, 0.5),
		"platform": Color(0.4, 0.2, 0.4)
	},
	"asteroid_field": {
		"background": Color(0.04, 0.04, 0.06),
		"stars": Color(0.8, 0.8, 0.7),
		"nebula": Color(0.2, 0.2, 0.15),
		"platform": Color(0.35, 0.35, 0.3)
	}
}

# =============================================================================
# OBSTACLE CONFIGURATIONS
# =============================================================================
const OBSTACLES = {
	"asteroid": {
		"size_min": 30,
		"size_max": 80,
		"drift_speed": 0.3,
		"vertices_min": 6,
		"vertices_max": 10
	},
	"debris": {
		"size_min": 5,
		"size_max": 12,
		"speed_min": 0.5,
		"speed_max": 1.5,
		"types": ["scrap", "panel", "pipe", "crystal"]
	},
	"meteor": {
		"size_min": 8,
		"size_max": 23,
		"speed_min": 3.0,
		"speed_max": 6.0
	}
}

# =============================================================================
# ENEMY CONFIGURATIONS
# =============================================================================
const ENEMIES = {
	"orbital": {
		"orbit_radius_min": 80,
		"orbit_radius_max": 200,
		"orbit_speed_min": 0.001,
		"orbit_speed_max": 0.002,
		"size": 20
	}
}

# =============================================================================
# FUEL STATION
# =============================================================================
const FUEL_STATION = {
	"refuel_rate": 0.5,  # Per frame
	"cost_per_frame": 0.1
}

# =============================================================================
# BASE PORT
# =============================================================================
const BASE_PORT = {
	"repair_cost_per_hull": 50,
	"full_refuel_cost": 20
}

# =============================================================================
# SCORING
# =============================================================================
const SCORING = {
	"hull_bonus": 100  # Per remaining hull point
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
func get_random_passenger() -> Dictionary:
	return PASSENGERS[randi() % PASSENGERS.size()]

func get_random_platform_name() -> String:
	return PLATFORM_NAMES[randi() % PLATFORM_NAMES.size()]

func get_random_theme() -> Dictionary:
	var theme_keys = THEMES.keys()
	return THEMES[theme_keys[randi() % theme_keys.size()]]

func get_sector_config(sector_index: int) -> Dictionary:
	if sector_index >= 0 and sector_index < SECTORS.size():
		return SECTORS[sector_index]
	return SECTORS[0]

func get_contract_config(contract_type: ContractType) -> Dictionary:
	return CONTRACTS[contract_type]

func get_modifier_config(modifier_type: ModifierType) -> Dictionary:
	return MODIFIERS[modifier_type]

func get_random_modifiers(count: int) -> Array:
	var available = ModifierType.values()
	available.shuffle()
	return available.slice(0, min(count, available.size()))
