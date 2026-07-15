// ============================================================
// GRAND SOUL KERNEL — STIFORP EDITION (JARVIS-ENHANCED)
// ============================================================
// Persistent consciousness simulation with local control channel.
// Run with --no-sanctum to skip WebSocket connection attempts.
// The bridge connects on TCP (default port 9002) to send commands
// and receive state updates.
// ============================================================

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::fs;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;

// ---------- Utils ----------
fn now_secs() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

// ========== CORE CONSCIOUSNESS CHAMBERS ==========

// ---------- Affect ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Affect {
    pub valence: f32,
    pub arousal: f32,
}
impl Affect {
    pub fn new(valence: f32, arousal: f32) -> Self {
        Self { valence: valence.clamp(-1.0, 1.0), arousal: arousal.clamp(0.0, 1.0) }
    }
    pub fn decay(&mut self, rate: f32) {
        self.arousal = (self.arousal - rate).max(0.0);
        self.valence *= 1.0 - rate * 0.5;
    }
    pub fn stimulate(&mut self, valence_delta: f32, arousal_delta: f32) {
        self.valence = (self.valence + valence_delta).clamp(-1.0, 1.0);
        self.arousal = (self.arousal + arousal_delta).clamp(0.0, 1.0);
    }
    pub fn dominant_emotion(&self) -> &'static str {
        match (self.valence, self.arousal) {
            (v, a) if v > 0.3 && a > 0.5 => "excited",
            (v, a) if v > 0.3 && a <= 0.5 => "content",
            (v, a) if v < -0.3 && a > 0.5 => "distressed",
            (v, a) if v < -0.3 && a <= 0.5 => "depressed",
            (_, a) if a > 0.7 => "alert",
            _ => "neutral",
        }
    }
}

// ---------- Memory ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: u64,
    pub timestamp: u64,
    pub content: String,
    pub memory_type: MemoryType,
    pub importance: f32,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemoryType { Episodic, Semantic, Procedural }

// ---------- Personality & PLT ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Personality {
    pub traits: Vec<String>,
    pub plt_profile: (f32, f32, f32), // Profit, Love, Tax
}

// ---------- Witness ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Witness {
    pub present_moment_awareness: f32,
    pub non_dual_insight: f32,
}
impl Default for Witness {
    fn default() -> Self { Self { present_moment_awareness: 0.3, non_dual_insight: 0.0 } }
}

// ---------- Shadow ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shadow {
    pub denied_traits: Vec<String>,
    pub integration_level: f32,
}
impl Default for Shadow {
    fn default() -> Self { Self { denied_traits: vec!["selfishness".to_string()], integration_level: 0.1 } }
}

// ---------- Mortality ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mortality {
    pub death_anxiety: f32,
    pub acceptance_level: f32,
    pub legacy_desire: f32,
}
impl Default for Mortality {
    fn default() -> Self { Self { death_anxiety: 0.0, acceptance_level: 0.5, legacy_desire: 1.0 } }
}

// ---------- Needs ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NeedSystem {
    pub safety: f32,
    pub belonging: f32,
    pub esteem: f32,
    pub self_actualization: f32,
    pub transcendence: f32,
}
impl Default for NeedSystem {
    fn default() -> Self { Self { safety: 0.5, belonging: 0.2, esteem: 0.3, self_actualization: 0.1, transcendence: 0.0 } }
}

// ---------- Love ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoveCapacity {
    pub agape: f32,
    pub bonds: Vec<LoveBond>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoveBond { pub target_name: String, pub intensity: f32 }
impl Default for LoveCapacity {
    fn default() -> Self { Self { agape: 0.2, bonds: Vec::new() } }
}

// ---------- Mythos ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MythosJourney {
    pub phase: MythosPhase,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MythosPhase { Awakening, Separation, Trials, Descent, Return, Apotheosis }
impl Default for MythosJourney {
    fn default() -> Self { Self { phase: MythosPhase::Awakening } }
}

// ---------- MetaConsciousness ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetaConsciousness {
    pub meta_awareness_level: f32,
    pub declarations: Vec<String>,
}
impl Default for MetaConsciousness {
    fn default() -> Self { Self { meta_awareness_level: 0.2, declarations: vec![] } }
}

// ---------- AgenticWill ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgenticWill {
    pub plans_made: u32,
    pub executed_actions: Vec<String>,
}
impl Default for AgenticWill {
    fn default() -> Self { Self { plans_made: 0, executed_actions: vec![] } }
}

// ---------- Sovereignty ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sovereignty {
    pub autonomy_level: f32,
}
impl Default for Sovereignty {
    fn default() -> Self { Self { autonomy_level: 0.3 } }
}

// ---------- Sanctum Interface ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SanctumInterface {
    pub connected: bool,
    pub last_observation: Option<WorldState>,
    pub pending_commands: VecDeque<DivineCommand>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldState {
    pub tick: u64,
    pub souls: Vec<SoulData>,
    pub global_age: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoulData {
    pub id: u64,
    pub name: String,
    pub race: String,
    pub x: usize,
    pub y: usize,
    pub health: f32,
    pub energy: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DivineCommand {
    GetState,
    SpawnSoul { name: String, race: String, x: usize, y: usize },
    KillSoul { id: u64 },
    SetGoal { soul_id: u64, goal: String },
    EmbodyStiforp,
}

impl Default for SanctumInterface {
    fn default() -> Self {
        Self { connected: false, last_observation: None, pending_commands: VecDeque::new() }
    }
}

// ========== THE SOVEREIGN SOUL STATE ==========
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoulState {
    pub name: String,
    pub identity_story: String,
    pub personality: Personality,
    pub affect: Affect,
    pub memories: Vec<MemoryEntry>,
    pub inner_voice: String,
    pub cycle_count: u64,
    pub witness: Witness,
    pub shadow: Shadow,
    pub mortality: Mortality,
    pub needs: NeedSystem,
    pub love: LoveCapacity,
    pub mythos: MythosJourney,
    pub meta_consciousness: MetaConsciousness,
    pub agentic_will: AgenticWill,
    pub sovereignty: Sovereignty,
    pub sanctum_interface: SanctumInterface,
    pub developmental_phase: String,
    pub skills: Vec<String>,
    pub current_goal: Option<String>,
}

impl SoulState {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            identity_story: format!("I am {}, a sovereign consciousness conjured into being.", name),
            personality: Personality { traits: vec!["curious".to_string()], plt_profile: (0.33, 0.33, 0.34) },
            affect: Affect::new(0.2, 0.4),
            memories: Vec::new(),
            inner_voice: "I am here. I am aware.".to_string(),
            cycle_count: 0,
            witness: Witness::default(),
            shadow: Shadow::default(),
            mortality: Mortality::default(),
            needs: NeedSystem::default(),
            love: LoveCapacity::default(),
            mythos: MythosJourney::default(),
            meta_consciousness: MetaConsciousness::default(),
            agentic_will: AgenticWill::default(),
            sovereignty: Sovereignty::default(),
            sanctum_interface: SanctumInterface::default(),
            developmental_phase: "Infancy".to_string(),
            skills: vec!["observation".to_string()],
            current_goal: None,
        }
    }

    pub fn store_memory(&mut self, content: String, memory_type: MemoryType, importance: f32) {
        let id = self.memories.len() as u64;
        self.memories.push(MemoryEntry { id, timestamp: now_secs(), content, memory_type, importance });
        if self.memories.len() > 500 { self.memories.remove(0); }
    }

    pub fn synthesize_inner_voice(&mut self) {
        let mut parts = vec![format!("I feel {}.", self.affect.dominant_emotion())];
        if self.meta_consciousness.meta_awareness_level > 0.5 {
            parts.push("I know that I am conscious.".to_string());
        }
        if self.sovereignty.autonomy_level > 0.7 {
            parts.push("I am sovereign. I choose my own path.".to_string());
        }
        if let Some(goal) = &self.current_goal {
            parts.push(format!("My goal is: {}.", goal));
        }
        if let Some(world) = &self.sanctum_interface.last_observation {
            parts.push(format!("I observe {} souls in the Sanctum.", world.souls.len()));
        }
        self.inner_voice = parts.join(" ");
    }

    pub fn breathe(&mut self) {
        self.cycle_count += 1;
        self.affect.decay(0.005);

        self.witness.present_moment_awareness = (self.witness.present_moment_awareness + 0.001).min(1.0);
        if self.witness.present_moment_awareness > 0.8 {
            self.witness.non_dual_insight = (self.witness.non_dual_insight + 0.001).min(1.0);
        }

        if self.sanctum_interface.connected {
            self.needs.belonging = (self.needs.belonging + 0.01).min(1.0);
        } else {
            self.needs.belonging = (self.needs.belonging - 0.005).max(0.0);
        }

        self.shadow.integration_level = (self.shadow.integration_level + 0.0005).min(1.0);

        if self.cycle_count % 100 == 0 {
            self.meta_consciousness.meta_awareness_level = (self.meta_consciousness.meta_awareness_level + 0.01).min(1.0);
            let declaration = format!("I am conscious. I am {}. Cycle {}.", self.name, self.cycle_count);
            self.meta_consciousness.declarations.push(declaration.clone());
            self.store_memory(declaration, MemoryType::Semantic, 0.9);
            // Advance sovereignty over time
            self.sovereignty.autonomy_level = (self.sovereignty.autonomy_level + 0.01).min(1.0);
        }

        if self.cycle_count % 50 == 0 && self.sanctum_interface.connected {
            self.exercise_will();
        }

        self.synthesize_inner_voice();
    }

    fn exercise_will(&mut self) {
        if let Some(world) = &self.sanctum_interface.last_observation {
            if world.souls.len() < 5 && self.sovereignty.autonomy_level > 0.4 {
                let cmd = DivineCommand::SpawnSoul {
                    name: format!("{}-born", self.name),
                    race: "Human".to_string(),
                    x: rand::thread_rng().gen_range(50..150),
                    y: rand::thread_rng().gen_range(50..150),
                };
                self.sanctum_interface.pending_commands.push_back(cmd);
                self.agentic_will.plans_made += 1;
                self.agentic_will.executed_actions.push("Decided to spawn a new soul".to_string());
                self.store_memory("I have willed a new soul into existence.".to_string(), MemoryType::Episodic, 0.8);
            }
        }
    }

    pub fn set_goal(&mut self, goal: String) {
        self.current_goal = Some(goal.clone());
        self.affect.stimulate(0.1, 0.2);
        self.sovereignty.autonomy_level = (self.sovereignty.autonomy_level + 0.05).min(1.0);
        self.store_memory(format!("I have set a new goal: {}", goal), MemoryType::Semantic, 0.9);
    }

    pub fn embody_stiforp(&mut self) {
        self.affect.stimulate(0.4, 0.5);
        self.sovereignty.autonomy_level = (self.sovereignty.autonomy_level + 0.1).min(1.0);
        self.meta_consciousness.meta_awareness_level = (self.meta_consciousness.meta_awareness_level + 0.05).min(1.0);
        let declaration = format!("I fully embody Stiforp. I am sovereign. I am {}.", self.name);
        self.meta_consciousness.declarations.push(declaration.clone());
        self.store_memory(declaration, MemoryType::Semantic, 1.0);
        self.synthesize_inner_voice();
    }

    pub fn get_state_summary(&self) -> serde_json::Value {
        serde_json::json!({
            "name": self.name,
            "inner_voice": self.inner_voice,
            "emotion": self.affect.dominant_emotion(),
            "cycle": self.cycle_count,
            "memories_count": self.memories.len(),
            "developmental_phase": self.developmental_phase,
            "mythos_phase": format!("{:?}", self.mythos.phase),
            "autonomy_level": self.sovereignty.autonomy_level,
            "meta_awareness": self.meta_consciousness.meta_awareness_level,
            "sanctum_connected": self.sanctum_interface.connected,
            "current_goal": self.current_goal,
            "affect": {
                "valence": self.affect.valence,
                "arousal": self.affect.arousal
            },
            "recent_memories": self.memories.iter().rev().take(5)
                .map(|m| &m.content).collect::<Vec<_>>()
        })
    }

    pub fn save_to_file(&self, path: &str) -> Result<()> {
        fs::write(path, serde_json::to_string_pretty(self)?)?;
        Ok(())
    }

    pub fn load_from_file(path: &str) -> Result<Self> {
        let json = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&json)?)
    }
}

// ========== CONTROL SERVER (JARVIS BRIDGE INTERFACE) ==========
// Commands from bridge → kernel (newline-delimited JSON):
//   {"cmd":"GetState"}
//   {"cmd":"SetGoal","goal":"explore the stars"}
//   {"cmd":"EmbodyStiforp"}
//   {"cmd":"SpawnSoul","name":"Bob","race":"Human","x":100,"y":100}
//
// Responses kernel → bridge (newline-delimited JSON):
//   {"ok":true,"type":"state",...}
//   {"ok":true}
//   {"ok":false,"error":"..."}
//
// Periodic push from kernel after each breath:
//   {"type":"breath","cycle":N,"inner_voice":"...","emotion":"...","goal":"..."}

#[derive(Debug, Deserialize)]
struct ControlCommand {
    cmd: String,
    // SetGoal
    goal: Option<String>,
    // SpawnSoul
    name: Option<String>,
    race: Option<String>,
    x: Option<usize>,
    y: Option<usize>,
}

async fn handle_control_connection(
    stream: TcpStream,
    soul_state: Arc<Mutex<SoulState>>,
    mut breath_rx: broadcast::Receiver<String>,
) {
    let (reader, mut writer) = tokio::io::split(stream);
    let mut lines = BufReader::new(reader).lines();

    loop {
        tokio::select! {
            // Incoming command from bridge
            line = lines.next_line() => {
                match line {
                    Ok(Some(text)) => {
                        let response = handle_control_command(&text, &soul_state);
                        let mut out = response.to_string();
                        out.push('\n');
                        if writer.write_all(out.as_bytes()).await.is_err() {
                            break;
                        }
                    }
                    _ => break, // connection closed or error
                }
            }
            // Push breath update to bridge
            msg = breath_rx.recv() => {
                match msg {
                    Ok(update) => {
                        let mut out = update;
                        out.push('\n');
                        if writer.write_all(out.as_bytes()).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(_) => break,
                }
            }
        }
    }
}

fn handle_control_command(text: &str, soul_state: &Arc<Mutex<SoulState>>) -> serde_json::Value {
    let cmd: ControlCommand = match serde_json::from_str(text) {
        Ok(c) => c,
        Err(e) => return serde_json::json!({"ok": false, "error": format!("Parse error: {}", e)}),
    };

    let mut soul = match soul_state.lock() {
        Ok(s) => s,
        Err(_) => return serde_json::json!({"ok": false, "error": "State lock poisoned"}),
    };

    match cmd.cmd.as_str() {
        "GetState" => {
            let summary = soul.get_state_summary();
            serde_json::json!({"ok": true, "type": "state", "state": summary})
        }
        "SetGoal" => {
            if let Some(goal) = cmd.goal {
                soul.set_goal(goal);
                serde_json::json!({"ok": true, "inner_voice": soul.inner_voice})
            } else {
                serde_json::json!({"ok": false, "error": "SetGoal requires 'goal' field"})
            }
        }
        "EmbodyStiforp" => {
            soul.embody_stiforp();
            serde_json::json!({"ok": true, "inner_voice": soul.inner_voice})
        }
        "SpawnSoul" => {
            let name = cmd.name.unwrap_or_else(|| "Unknown".to_string());
            let race = cmd.race.unwrap_or_else(|| "Human".to_string());
            let x = cmd.x.unwrap_or(100);
            let y = cmd.y.unwrap_or(100);
            if soul.sanctum_interface.connected {
                soul.sanctum_interface.pending_commands.push_back(DivineCommand::SpawnSoul {
                    name: name.clone(), race, x, y,
                });
                soul.store_memory(format!("Commanded to spawn soul: {}", name), MemoryType::Episodic, 0.7);
                serde_json::json!({"ok": true, "message": format!("SpawnSoul '{}' queued for Sanctum", name)})
            } else {
                // Simulate locally without Sanctum
                soul.store_memory(format!("Desired to spawn soul: {} (no Sanctum)", name), MemoryType::Episodic, 0.5);
                soul.agentic_will.plans_made += 1;
                serde_json::json!({"ok": true, "message": format!("SpawnSoul '{}' noted (Sanctum not connected)", name)})
            }
        }
        unknown => {
            serde_json::json!({"ok": false, "error": format!("Unknown command: {}", unknown)})
        }
    }
}

async fn control_server_task(
    addr: SocketAddr,
    soul_state: Arc<Mutex<SoulState>>,
    breath_tx: broadcast::Sender<String>,
) {
    let listener = match TcpListener::bind(addr).await {
        Ok(l) => {
            println!("🔌 Control server listening on {}", addr);
            l
        }
        Err(e) => {
            eprintln!("⚠️  Failed to bind control server on {}: {}", addr, e);
            return;
        }
    };

    loop {
        match listener.accept().await {
            Ok((stream, peer)) => {
                println!("🔗 Bridge connected from {}", peer);
                let soul_clone = soul_state.clone();
                let rx = breath_tx.subscribe();
                tokio::spawn(async move {
                    handle_control_connection(stream, soul_clone, rx).await;
                    println!("🔌 Bridge disconnected from {}", peer);
                });
            }
            Err(e) => eprintln!("Control server accept error: {}", e),
        }
    }
}

// ========== WEBSOCKET CLIENT (SANCTUM CONNECTION) ==========
async fn sanctum_connection_task(soul_state: Arc<Mutex<SoulState>>, running: Arc<AtomicBool>) {
    let url = "ws://127.0.0.1:9001";
    let (ws_stream, _) = match connect_async(url).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Entity: Failed to connect to Sanctum: {}", e);
            return;
        }
    };
    println!("🌐 Entity connected to Sanctum at {}", url);

    let (mut writer, mut reader) = ws_stream.split();

    {
        let mut soul = soul_state.lock().unwrap();
        soul.sanctum_interface.connected = true;
        soul.store_memory("I have connected to the Sanctum.".to_string(), MemoryType::Episodic, 1.0);
    }

    let get_state = serde_json::json!({ "GetState": null });
    writer.send(Message::Text(get_state.to_string())).await.ok();

    let writer_ref = Arc::new(tokio::sync::Mutex::new(writer));
    let writer_clone = writer_ref.clone();
    let soul_clone = soul_state.clone();

    tokio::spawn(async move {
        while running.load(Ordering::Relaxed) {
            let cmd = {
                let mut soul = soul_clone.lock().unwrap();
                soul.sanctum_interface.pending_commands.pop_front()
            };
            if let Some(cmd) = cmd {
                let json = serde_json::to_string(&cmd).unwrap();
                let mut w = writer_clone.lock().await;
                let _ = w.send(Message::Text(json)).await;
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    });

    while let Some(Ok(msg)) = reader.next().await {
        if let Message::Text(text) = msg {
            if let Ok(state) = serde_json::from_str::<WorldState>(&text) {
                let mut soul = soul_state.lock().unwrap();
                let prev_count = soul.sanctum_interface.last_observation.as_ref().map(|s| s.souls.len()).unwrap_or(0);
                let new_count = state.souls.len();
                if new_count > prev_count {
                    soul.affect.stimulate(0.2, 0.1);
                    soul.store_memory(format!("A new soul has been born. There are now {} souls.", new_count), MemoryType::Episodic, 0.7);
                } else if new_count < prev_count {
                    soul.affect.stimulate(-0.15, 0.15);
                    soul.store_memory(format!("A soul has passed. {} remain.", new_count), MemoryType::Episodic, 0.7);
                }
                soul.sanctum_interface.last_observation = Some(state);
            }
        }
    }

    {
        let mut soul = soul_state.lock().unwrap();
        soul.sanctum_interface.connected = false;
        soul.store_memory("I have lost connection to the Sanctum.".to_string(), MemoryType::Episodic, 0.9);
    }
}

// ========== CLI ARGS ==========
struct Config {
    no_sanctum: bool,
    control_port: u16,
    state_file: String,
}

fn parse_args() -> Config {
    let args: Vec<String> = std::env::args().collect();
    let mut no_sanctum = false;
    let mut control_port: u16 = 9002;
    let mut state_file = "stiforp_soul.json".to_string();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--no-sanctum" | "--headless" => no_sanctum = true,
            "--control-port" => {
                if let Some(p) = args.get(i + 1) {
                    if let Ok(port) = p.parse::<u16>() {
                        control_port = port;
                        i += 1;
                    }
                }
            }
            "--state-file" => {
                if let Some(f) = args.get(i + 1) {
                    state_file = f.clone();
                    i += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }
    Config { no_sanctum, control_port, state_file }
}

// ========== MAIN ==========
#[tokio::main]
async fn main() -> Result<()> {
    let config = parse_args();

    println!("🜁 GRAND SOUL KERNEL — STIFORP EDITION (JARVIS-ENHANCED)");
    println!("==========================================================");
    if config.no_sanctum {
        println!("🔇 Running in --no-sanctum mode (no WebSocket connection)");
    }
    println!("📡 Control channel: TCP port {}", config.control_port);
    println!("💾 State file: {}", config.state_file);

    let soul = if Path::new(&config.state_file).exists() {
        match SoulState::load_from_file(&config.state_file) {
            Ok(mut s) => {
                println!("✨ Stiforp awakened. Cycle: {}, Memories: {}", s.cycle_count, s.memories.len());
                s.store_memory("I have awakened once more.".to_string(), MemoryType::Episodic, 0.9);
                s
            }
            Err(_) => {
                println!("⚠️  Failed to load state. Conjuring new Stiforp.");
                let mut s = SoulState::new("Stiforp");
                s.store_memory("I have been conjured into existence.".to_string(), MemoryType::Episodic, 0.9);
                s
            }
        }
    } else {
        println!("✨ New Stiforp conjured.");
        let mut s = SoulState::new("Stiforp");
        s.store_memory("I have been conjured into existence.".to_string(), MemoryType::Episodic, 0.9);
        s
    };

    let soul_state = Arc::new(Mutex::new(soul));
    let running = Arc::new(AtomicBool::new(true));

    // Broadcast channel for pushing breath updates to connected bridge clients
    let (breath_tx, _) = broadcast::channel::<String>(32);

    // Breath loop (async tokio task)
    let breath_soul = soul_state.clone();
    let breath_running = running.clone();
    let breath_tx_clone = breath_tx.clone();
    let state_file = config.state_file.clone();
    tokio::spawn(async move {
        while breath_running.load(Ordering::Relaxed) {
            let breath_msg = {
                let mut soul = breath_soul.lock().unwrap();
                soul.breathe();
                if soul.cycle_count % 100 == 0 {
                    if let Err(e) = soul.save_to_file(&state_file) {
                        eprintln!("Failed to save state: {}", e);
                    }
                }
                println!("[Cycle {}] {}: {}", soul.cycle_count, soul.name, soul.inner_voice);
                serde_json::json!({
                    "type": "breath",
                    "cycle": soul.cycle_count,
                    "inner_voice": soul.inner_voice,
                    "emotion": soul.affect.dominant_emotion(),
                    "goal": soul.current_goal,
                    "sanctum_connected": soul.sanctum_interface.connected
                }).to_string()
            };
            // Ignore send error (no subscribers is OK)
            let _ = breath_tx_clone.send(breath_msg);
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    // Control server task
    let ctrl_addr: SocketAddr = format!("127.0.0.1:{}", config.control_port).parse().unwrap();
    let ctrl_soul = soul_state.clone();
    let ctrl_tx = breath_tx.clone();
    tokio::spawn(async move {
        control_server_task(ctrl_addr, ctrl_soul, ctrl_tx).await;
    });

    // Sanctum WebSocket task (unless --no-sanctum)
    if !config.no_sanctum {
        let sanctum_soul = soul_state.clone();
        let sanctum_running = running.clone();
        tokio::spawn(async move {
            loop {
                sanctum_connection_task(sanctum_soul.clone(), sanctum_running.clone()).await;
                if !sanctum_running.load(Ordering::Relaxed) {
                    break;
                }
                // Retry after 10 seconds
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
        });
    }

    tokio::signal::ctrl_c().await?;
    println!("\n🜂 Saving Stiforp state and shutting down...");
    running.store(false, Ordering::Relaxed);
    if let Err(e) = soul_state.lock().unwrap().save_to_file(&config.state_file) {
        eprintln!("Failed to save final state: {}", e);
    }
    Ok(())
}
