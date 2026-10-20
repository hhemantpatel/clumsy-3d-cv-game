use wasm_bindgen::prelude::*;

#[derive(Clone, Copy)]
pub struct AABB {
    pub min_x: f32,
    pub min_z: f32,
    pub max_x: f32,
    pub max_z: f32,
}

impl AABB {
    pub fn new(min_x: f32, min_z: f32, max_x: f32, max_z: f32) -> Self {
        Self { min_x, min_z, max_x, max_z }
    }

    /// Check circle vs AABB collision. Returns Some(displacement_vector) if colliding.
    pub fn resolve_circle_collision(&self, cx: f32, cz: f32, radius: f32) -> Option<(f32, f32)> {
        // Find closest point on AABB to circle center
        let closest_x = cx.clamp(self.min_x, self.max_x);
        let closest_z = cz.clamp(self.min_z, self.max_z);

        let dx = cx - closest_x;
        let dz = cz - closest_z;
        let dist_sq = dx * dx + dz * dz;

        if dist_sq < radius * radius && dist_sq > 0.000001 {
            let dist = dist_sq.sqrt();
            let overlap = radius - dist;
            let nx = dx / dist;
            let nz = dz / dist;
            Some((nx * overlap, nz * overlap))
        } else if dist_sq <= 0.000001 {
            // Circle center inside box: push out towards nearest edge
            let to_left = (cx - self.min_x).abs();
            let to_right = (self.max_x - cx).abs();
            let to_bottom = (cz - self.min_z).abs();
            let to_top = (self.max_z - cz).abs();

            let min_dist = to_left.min(to_right).min(to_bottom).min(to_top);
            if min_dist == to_left {
                Some((-radius - to_left, 0.0))
            } else if min_dist == to_right {
                Some((radius + to_right, 0.0))
            } else if min_dist == to_bottom {
                Some((0.0, -radius - to_bottom))
            } else {
                Some((0.0, radius + to_top))
            }
        } else {
            None
        }
    }
}

pub struct TriggerZone {
    pub id: &'static str,
    pub x: f32,
    pub z: f32,
    pub radius: f32,
}

pub struct Particle {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub vx: f32,
    pub vy: f32,
    pub vz: f32,
    pub rot_x: f32,
    pub rot_y: f32,
    pub rot_z: f32,
    pub scale: f32,
    pub sway_phase: f32,
}

#[wasm_bindgen]
pub struct PhysicsEngine {
    // Character state
    player_x: f32,
    player_y: f32,
    player_z: f32,
    player_vx: f32,
    player_vz: f32,
    player_speed: f32,
    player_rotation: f32,
    player_target_rotation: f32,
    turn_velocity: f32,
    player_radius: f32,

    // Clumsy animation & stumble dynamics
    wobble_x: f32,
    wobble_z: f32,
    bobbing: f32,
    stumble_intensity: f32,
    stumble_timer: f32,
    stumble_vx: f32,
    stumble_vz: f32,
    skid_intensity: f32,
    walk_cycle: f32,
    prev_walk_sin: f32,
    footstep_trigger: i32,
    is_walking: bool,
    is_running: bool,

    // World state
    is_inside: bool,
    active_interaction: String,

    // Colliders & triggers
    colliders: Vec<AABB>,
    triggers: Vec<TriggerZone>,

    // Floating particles (Leaves & ambient dust)
    particles: Vec<Particle>,
    particle_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl PhysicsEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut colliders = Vec::new();

        // 1. Yard Outer Fences (Keeps player strictly within the home property boundary)
        // Bound: -12.5 to 12.5
        colliders.push(AABB::new(-13.0, -13.0, 13.0, -12.2)); // North fence behind house
        colliders.push(AABB::new(-13.0, 12.2, 13.0, 13.0));   // South fence at front
        colliders.push(AABB::new(-13.0, -13.0, -12.2, 13.0)); // West fence
        colliders.push(AABB::new(12.2, -13.0, 13.0, 13.0));   // East fence

        // 2. House Exterior Walls (Footprint: X: -6.5 to 6.5, Z: -10.5 to -1.5)
        // Back Wall
        colliders.push(AABB::new(-6.8, -10.8, 6.8, -10.2));
        // Left Wall
        colliders.push(AABB::new(-6.8, -10.5, -6.2, -1.2));
        // Right Wall
        colliders.push(AABB::new(6.2, -10.5, 6.8, -1.2));
        // Front Wall Left (doorway between -1.0 and 1.0)
        colliders.push(AABB::new(-6.8, -1.8, -1.0, -1.2));
        // Front Wall Right
        colliders.push(AABB::new(1.0, -1.8, 6.8, -1.2));

        // 3. Interior Walls
        // Bedroom divider (from x: 0.8 to 6.2 at z: -6.0, with a doorway)
        colliders.push(AABB::new(2.2, -6.3, 6.2, -5.7));

        // 4. Furniture Colliders
        // Projects Desk (X: -4.2, Z: -8.5)
        colliders.push(AABB::new(-5.4, -9.4, -3.0, -7.6));
        // Bookshelf (X: -5.6, Z: -4.5)
        colliders.push(AABB::new(-6.2, -5.6, -5.0, -3.4));
        // Bed (X: 4.2, Z: -3.8)
        colliders.push(AABB::new(2.8, -5.2, 5.8, -2.4));
        // Certificates Wall Console (X: 4.5, Z: -9.8)
        colliders.push(AABB::new(3.2, -10.2, 5.8, -9.2));

        // 5. Yard Props
        // Mailbox (X: 1.6, Z: 10.8)
        colliders.push(AABB::new(1.2, 10.4, 2.0, 11.2));
        // Garden Bench (X: -7.5, Z: 4.5)
        colliders.push(AABB::new(-8.8, 3.8, -6.2, 5.2));
        // Garden Tree 1 (X: -8.5, Z: -4.0)
        colliders.push(AABB::new(-9.2, -4.7, -7.8, -3.3));
        // Garden Tree 2 (X: 9.2, Z: -3.5)
        colliders.push(AABB::new(8.5, -4.2, 9.9, -2.8));
        // Garden Tree 3 (X: -6.0, Z: 9.5)
        colliders.push(AABB::new(-6.7, 8.8, -5.3, 10.2));
        // Garden Fountain / Rock (X: 6.5, Z: -8.0)
        colliders.push(AABB::new(5.8, -8.7, 7.2, -7.3));

        // Automaton Garden Planter Box & Potting Bench (Centered at X: 6.8, Z: 5.2)
        // Planter North Rim
        colliders.push(AABB::new(4.7, 1.95, 8.9, 2.25));
        // Planter South Rim
        colliders.push(AABB::new(4.7, 8.15, 8.9, 8.45));
        // Planter West Rim
        colliders.push(AABB::new(4.65, 2.1, 4.85, 8.3));
        // Planter East Rim
        colliders.push(AABB::new(8.75, 2.1, 8.95, 8.3));
        // Garden Potting Workbench
        colliders.push(AABB::new(9.05, 4.3, 9.65, 6.1));

        // Interaction Triggers
        let triggers = vec![
            TriggerZone { id: "projects", x: -4.2, z: -7.4, radius: 2.2 },
            TriggerZone { id: "skills", x: -4.9, z: -4.5, radius: 2.0 },
            TriggerZone { id: "experience", x: 4.5, z: -8.6, radius: 2.2 },
            TriggerZone { id: "bed", x: 4.2, z: -2.2, radius: 2.0 },
            TriggerZone { id: "contact", x: 1.6, z: 9.8, radius: 2.2 },
            TriggerZone { id: "about", x: -7.5, z: 5.8, radius: 2.2 },
            TriggerZone { id: "badminton", x: 6.8, z: 5.2, radius: 2.4 },
        ];

        // Seed 45 floating ambient leaves / wind particles in the yard and sky
        let mut particles = Vec::with_capacity(50);
        let mut seed = 12345u32;
        for i in 0..45 {
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let rx = ((seed % 1000) as f32 / 1000.0) * 24.0 - 12.0;
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let ry = ((seed % 1000) as f32 / 1000.0) * 6.0 + 0.5;
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let rz = ((seed % 1000) as f32 / 1000.0) * 24.0 - 12.0;
            seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
            let scale = 0.12 + ((seed % 1000) as f32 / 1000.0) * 0.16;

            particles.push(Particle {
                x: rx,
                y: ry,
                z: rz,
                vx: -0.8 - ((seed % 500) as f32 / 1000.0),
                vy: -0.3 - ((seed % 300) as f32 / 1000.0),
                vz: 0.4 + ((seed % 400) as f32 / 1000.0),
                rot_x: (i as f32) * 0.3,
                rot_y: (i as f32) * 0.5,
                rot_z: (i as f32) * 0.2,
                scale,
                sway_phase: (i as f32) * 0.4,
            });
        }

        let buffer_len = particles.len() * 7;
        let particle_buffer = vec![0.0; buffer_len];

        Self {
            player_x: 0.0,
            player_y: 0.0,
            player_z: 8.0, // Spawn in front yard path
            player_vx: 0.0,
            player_vz: 0.0,
            player_speed: 0.0,
            player_rotation: std::f32::consts::PI, // Facing towards house
            player_target_rotation: std::f32::consts::PI,
            turn_velocity: 0.0,
            player_radius: 0.45,

            wobble_x: 0.0,
            wobble_z: 0.0,
            bobbing: 0.0,
            stumble_intensity: 0.0,
            stumble_timer: 0.0,
            stumble_vx: 0.0,
            stumble_vz: 0.0,
            skid_intensity: 0.0,
            walk_cycle: 0.0,
            prev_walk_sin: 0.0,
            footstep_trigger: 0,
            is_walking: false,
            is_running: false,

            is_inside: false,
            active_interaction: String::new(),

            colliders,
            triggers,
            particles,
            particle_buffer,
        }
    }

    /// Advance game physics, character movement, collisions, stumbling, and particles by delta_time.
    /// steer: -1.0 (turn left) to +1.0 (turn right)
    /// throttle: +1.0 (walk forward) to -1.0 (backpedal)
    pub fn update(&mut self, steer: f32, throttle: f32, is_running: bool, dt: f32) {
        let dt = dt.clamp(0.001, 0.05);

        let clamped_steer = steer.clamp(-1.0, 1.0);
        let clamped_throttle = throttle.clamp(-1.0, 1.0);

        let has_steer = clamped_steer.abs() > 0.05;
        let has_throttle = clamped_throttle.abs() > 0.05;

        self.is_walking = has_throttle || has_steer;
        self.is_running = is_running && has_throttle && clamped_throttle > 0.0;

        // 1. Steering & Rotation update
        // Calibrated turn rate: 1.6 rad/s (~91.7 deg/s) walking, 2.0 rad/s running
        // Turning right (clamped_steer > 0) turns toward +X (decreases rotation from PI)
        // Turning left (clamped_steer < 0) turns toward -X (increases rotation from PI)
        let turn_rate = if self.is_running { 2.0 } else { 1.6 };
        if has_steer {
            self.player_rotation -= clamped_steer * turn_rate * dt;
            // Normalize rotation to [-PI, PI]
            while self.player_rotation < -std::f32::consts::PI {
                self.player_rotation += std::f32::consts::TAU;
            }
            while self.player_rotation > std::f32::consts::PI {
                self.player_rotation -= std::f32::consts::TAU;
            }
            self.turn_velocity = clamped_steer * turn_rate;
        } else {
            self.turn_velocity = 0.0;
        }
        self.player_target_rotation = self.player_rotation;

        // 2. Linear Velocity along character's facing direction
        let forward_x = self.player_rotation.sin();
        let forward_z = self.player_rotation.cos();

        let base_speed = if self.is_running { 5.8 } else { 3.5 };
        let reverse_speed = 2.2;
        let accel = 14.0;
        let friction = 11.0;

        let (target_vx, target_vz) = if has_throttle {
            if clamped_throttle > 0.0 {
                (forward_x * base_speed * clamped_throttle, forward_z * base_speed * clamped_throttle)
            } else {
                (-forward_x * reverse_speed * (-clamped_throttle), -forward_z * reverse_speed * (-clamped_throttle))
            }
        } else {
            (0.0, 0.0)
        };

        // Detect skid / abrupt reversal
        let dot_move = if self.player_speed > 2.0 && has_throttle {
            (self.player_vx * target_vx + self.player_vz * target_vz) / (self.player_speed * base_speed)
        } else {
            1.0
        };

        if dot_move < -0.3 {
            self.skid_intensity = (self.skid_intensity + 4.5 * dt).min(1.0);
        } else {
            self.skid_intensity = (self.skid_intensity - 3.2 * dt).max(0.0);
        }

        // Apply acceleration & friction
        if has_throttle {
            let active_accel = if self.skid_intensity > 0.3 { accel * 1.5 } else { accel };
            self.player_vx += (target_vx - self.player_vx) * active_accel * dt;
            self.player_vz += (target_vz - self.player_vz) * active_accel * dt;
        } else {
            self.player_vx -= self.player_vx * friction * dt;
            self.player_vz -= self.player_vz * friction * dt;
            self.skid_intensity = (self.skid_intensity - 4.5 * dt).max(0.0);
        }

        // Apply stumble recoil if active (frame-rate independent exponential damping)
        if self.stumble_timer > 0.0 {
            self.stumble_timer -= dt;
            self.player_vx += self.stumble_vx * dt * 4.0;
            self.player_vz += self.stumble_vz * dt * 4.0;
            let decay = (-9.0 * dt).exp();
            self.stumble_vx *= decay;
            self.stumble_vz *= decay;
            self.stumble_intensity = (self.stumble_timer / 0.45).clamp(0.0, 1.0);
        } else {
            self.stumble_intensity *= (-6.0 * dt).exp();
        }

        // Tentative new position
        let mut new_x = self.player_x + self.player_vx * dt;
        let mut new_z = self.player_z + self.player_vz * dt;

        // Resolve collisions against all world colliders
        let mut hit_hard = false;
        let mut bounce_nx = 0.0f32;
        let mut bounce_nz = 0.0f32;

        for collider in &self.colliders {
            if let Some((dx, dz)) = collider.resolve_circle_collision(new_x, new_z, self.player_radius) {
                new_x += dx;
                new_z += dz;

                let push_len = (dx * dx + dz * dz).sqrt();
                if push_len > 1e-4 {
                    let nx = dx / push_len;
                    let nz = dz / push_len;

                    // Compute velocity component along the collision normal
                    let v_dot_n = self.player_vx * nx + self.player_vz * nz;

                    // If moving into the wall, cancel normal velocity so player slides smoothly
                    if v_dot_n < 0.0 {
                        self.player_vx -= v_dot_n * nx;
                        self.player_vz -= v_dot_n * nz;

                        // Only stumble if moving fast directly into the obstacle (not sliding along it)
                        if (-v_dot_n) > 2.2 && self.stumble_timer <= 0.0 {
                            hit_hard = true;
                            bounce_nx = nx;
                            bounce_nz = nz;
                        }
                    }
                }
            }
        }

        // Trigger stumble physics on direct impactful head-on collision
        if hit_hard {
            self.stumble_timer = 0.45;
            self.stumble_intensity = 1.0;
            self.stumble_vx = bounce_nx * 3.2;
            self.stumble_vz = bounce_nz * 3.2;
            self.player_vx = -self.player_vx * 0.3;
            self.player_vz = -self.player_vz * 0.3;
        }

        self.player_x = new_x;
        self.player_z = new_z;

        self.player_speed = (self.player_vx * self.player_vx + self.player_vz * self.player_vz).sqrt();
        self.is_running = is_running && self.player_speed > 2.5;

        // Detect indoor vs outdoor: House interior box is roughly x in [-6.2, 6.2], z in [-10.4, -1.5]
        self.is_inside = self.player_x >= -6.2
            && self.player_x <= 6.2
            && self.player_z >= -10.4
            && self.player_z <= -1.5;

        // Check interaction triggers
        let mut found_interaction = "";
        let mut closest_dist = f32::MAX;
        for trigger in &self.triggers {
            let dx = self.player_x - trigger.x;
            let dz = self.player_z - trigger.z;
            let dist = (dx * dx + dz * dz).sqrt();
            if dist < trigger.radius && dist < closest_dist {
                closest_dist = dist;
                found_interaction = trigger.id;
            }
        }
        self.active_interaction = found_interaction.to_string();

        // Clumsy procedural walk dynamics (steps during walking and turning in place)
        if self.is_walking && (self.player_speed > 0.12 || self.turn_velocity.abs() > 0.1) {
            let effective_speed = if self.player_speed > 0.12 { self.player_speed } else { 1.6 };
            let stride_rate = if self.is_running { 12.2 } else { 7.6 } * (effective_speed / if self.is_running { 5.8 } else { 3.5 }).clamp(0.4, 1.25);
            self.walk_cycle += dt * stride_rate;

            // Zero-crossing footstep trigger
            let cur_sin = self.walk_cycle.sin();
            if self.prev_walk_sin < 0.0 && cur_sin >= 0.0 {
                self.footstep_trigger = 1;
            } else if self.prev_walk_sin > 0.0 && cur_sin <= 0.0 {
                self.footstep_trigger = 2;
            } else {
                self.footstep_trigger = 0;
            }
            self.prev_walk_sin = cur_sin;

            // Side-to-side comedic tilt + centrifugal lean
            let wobble_amp = if self.is_running { 0.22 } else { 0.17 };
            let target_wobble_x = (self.walk_cycle).sin() * wobble_amp - (self.turn_velocity.clamp(-4.0, 4.0) * 0.035);

            // Forward bobbing lean (leaning into the run, or pulling back on skid)
            let forward_lean = if self.is_running { 0.18 } else { 0.07 };
            let target_wobble_z = ((self.walk_cycle * 2.0).cos() * 0.06) - forward_lean + (self.skid_intensity * 0.28);

            // Natural 2-beat bounce
            let bounce_amp = if self.is_running { 0.11 } else { 0.065 };
            let target_bob = ((self.walk_cycle * 2.0).sin().abs()) * bounce_amp;

            self.wobble_x += (target_wobble_x - self.wobble_x) * 14.0 * dt;
            self.wobble_z += (target_wobble_z - self.wobble_z) * 14.0 * dt;
            self.bobbing += (target_bob - self.bobbing) * 14.0 * dt;
        } else {
            // Idle gentle breathing sway & settling
            self.walk_cycle += dt * 1.6;
            self.footstep_trigger = 0;
            self.prev_walk_sin = 0.0;

            let target_wobble_x = (self.walk_cycle * 0.75).sin() * 0.025;
            let target_wobble_z = 0.0;
            let target_bob = (self.walk_cycle * 1.5).cos() * 0.015;

            self.wobble_x += (target_wobble_x - self.wobble_x) * 6.0 * dt;
            self.wobble_z += (target_wobble_z - self.wobble_z) * 8.0 * dt;
            self.bobbing += (target_bob - self.bobbing) * 6.0 * dt;
        }

        // Add extra dramatic stumble tilt if stumbling
        if self.stumble_intensity > 0.05 {
            self.wobble_x += (self.stumble_timer * 22.0).sin() * 0.38 * self.stumble_intensity;
            self.wobble_z += 0.28 * self.stumble_intensity;
            self.bobbing += (self.stumble_timer * 18.0).cos().abs() * 0.07 * self.stumble_intensity;
        }

        // Heavy math simulation: Update 45 floating wind particles
        let wind_t = self.walk_cycle * 0.5;
        for p in &mut self.particles {
            p.sway_phase += dt * 2.5;
            p.x += (p.vx + (p.sway_phase).sin() * 0.4) * dt;
            p.y += p.vy * dt;
            p.z += (p.vz + (p.sway_phase * 0.7).cos() * 0.3) * dt;

            p.rot_x += dt * 1.2;
            p.rot_y += dt * 0.8;
            p.rot_z += dt * 1.5;

            // Boundary wrapping: naturally disperse respawned leaves across the entire yard
            if p.y < 0.1 {
                p.y = 5.5 + ((p.sway_phase.sin() + 1.0) * 1.5);
                let radius = 2.5 + ((p.sway_phase * 1.618).sin().abs() * 9.5);
                p.x = radius * ((wind_t + p.sway_phase).cos());
                p.z = radius * ((wind_t + p.sway_phase).sin());
            }
            if p.x < -12.5 { p.x = 12.5; }
            if p.x > 12.5 { p.x = -12.5; }
            if p.z < -12.5 { p.z = 12.5; }
            if p.z > 12.5 { p.z = -12.5; }
        }

        // Pack particle data into flat buffer: [x, y, z, rx, ry, rz, scale]
        for (i, p) in self.particles.iter().enumerate() {
            let offset = i * 7;
            self.particle_buffer[offset] = p.x;
            self.particle_buffer[offset + 1] = p.y;
            self.particle_buffer[offset + 2] = p.z;
            self.particle_buffer[offset + 3] = p.rot_x;
            self.particle_buffer[offset + 4] = p.rot_y;
            self.particle_buffer[offset + 5] = p.rot_z;
            self.particle_buffer[offset + 6] = p.scale;
        }
    }

    // Getters for JavaScript bridge
    pub fn get_player_x(&self) -> f32 { self.player_x }
    pub fn get_player_y(&self) -> f32 { self.bobbing }
    pub fn get_player_z(&self) -> f32 { self.player_z }
    pub fn get_player_rotation(&self) -> f32 { self.player_rotation }
    pub fn get_player_speed(&self) -> f32 { self.player_speed }
    pub fn get_walk_cycle(&self) -> f32 { self.walk_cycle }
    pub fn is_running(&self) -> bool { self.is_running }
    pub fn get_turn_velocity(&self) -> f32 { self.turn_velocity }
    pub fn get_skid_intensity(&self) -> f32 { self.skid_intensity }
    pub fn get_footstep_trigger(&self) -> i32 { self.footstep_trigger }
    pub fn get_wobble_x(&self) -> f32 { self.wobble_x }
    pub fn get_wobble_z(&self) -> f32 { self.wobble_z }
    pub fn get_bobbing(&self) -> f32 { self.bobbing }
    pub fn get_stumble_intensity(&self) -> f32 { self.stumble_intensity }
    pub fn is_walking(&self) -> bool { self.is_walking }
    pub fn is_inside_house(&self) -> bool { self.is_inside }
    
    pub fn get_active_interaction(&self) -> String {
        self.active_interaction.clone()
    }

    pub fn get_particles_data(&self) -> Vec<f32> {
        self.particle_buffer.clone()
    }

    /// Zero-allocation pointer to the linear memory particle buffer
    pub fn get_particles_ptr(&self) -> *const f32 {
        self.particle_buffer.as_ptr()
    }

    pub fn get_particles_len(&self) -> usize {
        self.particle_buffer.len()
    }

    pub fn get_particle_count(&self) -> usize {
        self.particles.len()
    }

    /// Reset character position to front gate
    pub fn teleport_to_start(&mut self) {
        self.player_x = 0.0;
        self.player_z = 8.0;
        self.player_vx = 0.0;
        self.player_vz = 0.0;
        self.player_rotation = std::f32::consts::PI;
        self.stumble_timer = 0.0;
        self.stumble_intensity = 0.0;
    }

    /// Teleport into house desk
    pub fn teleport_to_desk(&mut self) {
        self.player_x = -4.0;
        self.player_z = -7.0;
        self.player_vx = 0.0;
        self.player_vz = 0.0;
        self.player_rotation = 0.0;
        self.stumble_timer = 0.0;
        self.stumble_intensity = 0.0;
    }

    /// Turn character by incremental delta angle (positive = turn right, negative = turn left)
    pub fn turn(&mut self, steer_angle: f32) {
        self.player_rotation -= steer_angle;
        while self.player_rotation < -std::f32::consts::PI {
            self.player_rotation += std::f32::consts::TAU;
        }
        while self.player_rotation > std::f32::consts::PI {
            self.player_rotation -= std::f32::consts::TAU;
        }
        self.player_target_rotation = self.player_rotation;
    }
}
