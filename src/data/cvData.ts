export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  stars?: number;
  featured?: boolean;
  liveUrl?: string;
  githubUrl?: string;
  highlights: string[];
}

export interface SkillCategory {
  category: string;
  iconName: string;
  skills: { name: string; level: number; highlight?: boolean }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  type: 'work' | 'education' | 'achievement';
  summary: string;
  bullets: string[];
  skills: string[];
}

export interface CVData {
  name: string;
  title: string;
  bioShort: string;
  bioLong: string[];
  location: string;
  email: string;
  iitEmail: string;
  phone: string;
  github: string;
  linkedin: string;
  website: string;
  stats: { label: string; value: string }[];
  hobbies: { icon: string; name: string; desc: string }[];
  projects: Project[];
  skillCategories: SkillCategory[];
  timeline: ExperienceItem[];
  leadership: { role: string; org: string; period: string; bullets: string[] }[];
}

export const cvData: CVData = {
  name: "Hemant Patel",
  title: "Software & AI Engineer | B.Tech. IIT Jodhpur",
  bioShort: "Undergraduate at IIT Jodhpur passionate about AI/ML systems, Rust, React, and chemical process modeling.",
  bioLong: [
    "Hello! I am Hemant Patel, currently pursuing B.Tech. in Chemical Engineering at the Indian Institute of Technology Jodhpur (IIT Jodhpur, CGPA 7.52).",
    "I bridge high-performance software engineering (Rust, WebAssembly, React, TypeScript) with modern AI/ML (PyTorch, RAG pipelines, Vision-Language models, Reinforcement Learning) and scientific computing.",
    "Currently interning as a Software Developer at CoralDune Partners, architecting production document-intelligence pipelines, RAG engines, and reactive web applications."
  ],
  location: "IIT Jodhpur, Rajasthan, India",
  email: "patelhemant.7509@gmail.com",
  iitEmail: "b23ch1018@iitj.ac.in",
  phone: "+91 70676-91264",
  github: "https://github.com/hhemantpatel",
  linkedin: "https://www.linkedin.com/in/hemant-patel-992753369/",
  website: "https://github.com/hhemantpatel",
  stats: [
    { label: "College", value: "IIT Jodhpur" },
    { label: "Degree", value: "B.Tech. '27" },
    { label: "CGPA", value: "7.52 / 10.0" },
    { label: "Core Stack", value: "Rust, Python, React" }
  ],
  hobbies: [
    {
      icon: "🎨",
      name: "Drawing & Sketching",
      desc: "Pencil sketching, architectural doodles, digital concept art, and perspective studies"
    },
    {
      icon: "🏓",
      name: "Table Tennis",
      desc: "Fast-paced spin rallies, agile reaction drills, and campus tournament matches"
    },
    {
      icon: "🏸",
      name: "Badminton",
      desc: "Doubles rallies, smash drills, and competitive play at IIT Jodhpur courts"
    },
    {
      icon: "🎬",
      name: "Media & Filmmaking",
      desc: "Head of FrameX Filmmaking Club, cinematography, and creative video editing"
    }
  ],
  projects: [
    {
      id: "clumsy-3d-cv-game",
      title: "Clumsy 3D CV Game",
      tagline: "Interactive 3D Portfolio Engine with Compiled Rust WASM Physics & In-Engine Farming Game",
      description: "Architected a high-performance interactive 3D WebGL portfolio combining a custom Rust physics engine compiled to WebAssembly with Three.js rendering, Web Audio synthesis, and an in-engine Python automaton harvest puzzle.",
      tags: ["Rust", "WebAssembly", "Three.js", "React", "TypeScript", "Tailwind CSS"],
      featured: true,
      githubUrl: "https://github.com/hhemantpatel/clumsy-3d-cv-game",
      highlights: [
        "Zero-allocation compiled Rust WASM physics engine simulating character kinematics, stumble physics, and circle-to-AABB collisions",
        "Declarative Three.js / React Three Fiber WebGL scene with procedural cottage, foliage, and dynamic lighting",
        "In-engine Automaton Garden mini-game with sandboxed Python compiler, reactive drone lerp, and Web Audio synthesizers"
      ]
    },
    {
      id: "alpha-chess-zero",
      title: "Alpha-Chess-Zero",
      tagline: "AlphaZero-style Reinforcement Learning Chess Engine with MCTS & Live GUI",
      description: "Designed an AlphaZero-style reinforcement learning chess engine using a 10-block ResNet with 256 filters for policy and value estimation paired with Monte Carlo Tree Search (MCTS) and self-play training.",
      tags: ["Python", "PyTorch", "ResNet", "MCTS", "Reinforcement Learning", "Pygame"],
      featured: true,
      githubUrl: "https://github.com/hhemantpatel/alpha-chess-zero",
      highlights: [
        "10-block ResNet with 256 filters for simultaneous policy and position evaluation",
        "Live analysis GUI with origin/destination heatmaps and KL-divergence Surprise Score",
        "Thresholded Heat Delta and principal variation visualization gated at 60% search confidence"
      ]
    },
    {
      id: "chemical-yield-predictor",
      title: "Chemical Reaction Yield Predictor",
      tagline: "Predictive chemistry engine with Tobit regression and Streamlit operating map",
      description: "Modelled reaction yield from temperature, pressure, and catalyst loading over 10,000 runs; treated complete conversion runs as censored data with a Tobit regression reaching R² = 0.93.",
      tags: ["Python", "scikit-learn", "SciPy", "Streamlit", "MySQL", "Chemistry"],
      featured: true,
      githubUrl: "https://github.com/hhemantpatel/chemical-yield-predictor",
      highlights: [
        "Reached noise floor with R² = 0.93 (5-fold CV RMSE 4.18%), cutting error 21% vs linear models",
        "Outperformed KNN, SVR, neural network, and gradient boosting benchmarks",
        "Interactive Streamlit app with operating-window map giving optimal temperature per catalyst loading"
      ]
    },
    {
      id: "anpr-ocr",
      title: "Automated Number Plate Detection & OCR",
      tagline: "YOLOv8 plate localization with Thin Plate Spline perspective rectification",
      description: "Trained YOLOv8 for vehicle number plate localization, achieving 95% detection accuracy on real-world traffic images, with automated perspective rectification for tilted license plates.",
      tags: ["YOLOv8", "OpenCV", "EasyOCR", "Docker", "Python", "Computer Vision"],
      featured: true,
      highlights: [
        "Trained YOLOv8 reaching 95% detection accuracy under varying lighting and traffic angles",
        "Boosted OCR recognition accuracy by 35% using Thin Plate Spline geometric correction",
        "Containerized inference workflow in Docker for one-command reproducible deployment"
      ]
    },
    {
      id: "van-de-vusse-cstr",
      title: "AI-Based Modelling of a Van de Vusse CSTR",
      tagline: "First-principles kinetic reactor modeling with ANFIS and LSTM surrogates",
      description: "Developed a first-principles continuous stirred-tank reactor model from component mass balances with parameter identification from 400 steady states and deep neural surrogate dynamics.",
      tags: ["Python", "SciPy", "ANFIS", "LSTM", "Process Modelling", "Dynamics"],
      featured: true,
      highlights: [
        "ANFIS surrogate reduced steady-state RMSE to 0.028 (from 0.83 in linear regression) across 5 folds",
        "Trained LSTM dynamic model achieving 0.081 free-run RMSE vs 0.42 (RNN) and 0.94 (ARX)",
        "Tested physical input sensitivities and sensor noise robustness for genetic algorithm control"
      ]
    },
    {
      id: "md-ionic-liquids",
      title: "Molecular Dynamics of Borate Ionic Liquids",
      tagline: "GROMACS all-atom simulation for high-temperature energy storage",
      description: "Conducted OPLS-AA all-atom molecular dynamics in GROMACS on the PARAM Ananta supercomputer to predict thermophysical properties of novel borate ionic liquids without parameter fitting.",
      tags: ["GROMACS", "SLURM", "HPC", "OPLS-AA", "Python", "Molecular Dynamics"],
      featured: false,
      highlights: [
        "Predicted density within 1.9–2.9% of experiment without empirical parameter tuning",
        "Diagnosed barostat density instability swinging 1078–1504 kg/m³ and resolved with C-rescale coupling",
        "Computed RDF, coordination numbers, MSD diffusivity, Nernst-Einstein conductivity, and Green-Kubo viscosity"
      ]
    }
  ],
  skillCategories: [
    {
      category: "Languages & Core",
      iconName: "Code2",
      skills: [
        { name: "Python", level: 95, highlight: true },
        { name: "Rust", level: 88, highlight: true },
        { name: "C / C++", level: 85 },
        { name: "TypeScript / JavaScript", level: 92, highlight: true },
        { name: "SQL (PostgreSQL / MySQL)", level: 88 }
      ]
    },
    {
      category: "AI, ML & Data Science",
      iconName: "Cpu",
      skills: [
        { name: "PyTorch & Deep Learning", level: 92, highlight: true },
        { name: "RAG & LLM Workflows (Docling, Qwen)", level: 90, highlight: true },
        { name: "Computer Vision (YOLOv8, OpenCV)", level: 88 },
        { name: "Scikit-Learn & SciPy", level: 92 },
        { name: "Reinforcement Learning (MCTS, ResNet)", level: 85 }
      ]
    },
    {
      category: "Frontend, 3D & Web",
      iconName: "Layout",
      skills: [
        { name: "React (Hooks, Context, Memo)", level: 95, highlight: true },
        { name: "Three.js / React Three Fiber", level: 90, highlight: true },
        { name: "WebAssembly (WASM)", level: 86, highlight: true },
        { name: "Tailwind CSS", level: 94 },
        { name: "REST APIs & SSE Streaming", level: 90 }
      ]
    },
    {
      category: "HPC, Systems & Engineering",
      iconName: "Wrench",
      skills: [
        { name: "Docker & Containerization", level: 90, highlight: true },
        { name: "Linux & Shell Scripting", level: 92 },
        { name: "Git & Version Control", level: 95 },
        { name: "GROMACS & SLURM (HPC)", level: 84 },
        { name: "Aspen Plus / HYSYS", level: 82 }
      ]
    }
  ],
  timeline: [
    {
      id: "exp-coraldune",
      role: "Software Developer Intern",
      company: "CoralDune Partners",
      location: "Remote / Hybrid",
      period: "Jan. 2026 -- Present",
      type: "work",
      summary: "Building document intelligence RAG pipelines, Rust backend microservices, and high-performance React user interfaces.",
      bullets: [
        "Architected scalable React interfaces with reusable components, custom hooks, and Context API across dashboards, reports, and document analysis workflows.",
        "Engineered production RAG pipeline integrating Docling for layout-aware PDF extraction, section hierarchy, table parsing, and RRF parallel comparison retrieval.",
        "Developed Rust backend services for asynchronous document ingestion and SSE streaming APIs for long-running AI operations.",
        "Built fact-reconciliation comparison engine with JSON state stitching and guardrails for reliable comparison of 200+ page technical documents.",
        "Resolved GPU VRAM contention between Docling/TableFormer and Qwen2.5-VL through lifecycle management and pre-warming."
      ],
      skills: ["Python", "Rust", "React", "PostgreSQL", "Docker", "Docling", "RAG", "Qwen2.5-VL"]
    },
    {
      id: "edu-iitj",
      role: "B.Tech. in Chemical Engineering",
      company: "Indian Institute of Technology Jodhpur (IIT Jodhpur)",
      location: "Jodhpur, Rajasthan, India",
      period: "2023 -- 2027 (Present)",
      type: "education",
      summary: "CGPA: 7.52 / 10.0. Core coursework in Reaction Engineering, Process Control, Molecular Dynamics, Algorithms, Machine Learning.",
      bullets: [
        "Core Coursework: Chemical Reaction Engineering, Process Dynamics & Control, Heat & Mass Transfer, Molecular Modelling.",
        "Undergraduate research in AI surrogate reactor modeling (ANFIS/LSTM) and Supercomputer molecular dynamics of borate ionic liquids.",
        "Active leader across campus cultural and technical festival committees."
      ],
      skills: ["Process Control", "Molecular Dynamics", "AI Modelling", "Python", "Data Analysis"]
    },
    {
      id: "edu-school",
      role: "Senior Secondary (CBSE 89.6%) & Secondary (CBSE 90.2%)",
      company: "Central Board of Secondary Education",
      location: "India",
      period: "2020 -- 2022",
      type: "education",
      summary: "Graduated with distinction in Physics, Chemistry, and Mathematics.",
      bullets: [
        "Senior Secondary (Class XII): 89.6%",
        "Secondary School (Class X): 90.2%",
        "Qualified JEE Advanced with admission into IIT Jodhpur"
      ],
      skills: ["Mathematics", "Physics", "Chemistry"]
    }
  ],
  leadership: [
    {
      role: "Head, Media & Publicity",
      org: "Varchas & Ignus (Flagship Festivals), IIT Jodhpur",
      period: "2025 -- 2026",
      bullets: [
        "Led a 22-member team managing media, design, video, and publicity operations for IIT Jodhpur's flagship sports and cultural festivals.",
        "Coordinated parallel workstreams, production schedules, sponsorships, and deliverables across campus."
      ]
    },
    {
      role: "Social Media Head",
      org: "FrameX Filmmaking Club, IIT Jodhpur",
      period: "2024 -- 2025",
      bullets: [
        "Increased social media engagement and follower count by 40% through structured content strategy, video production, and event campaigns."
      ]
    }
  ]
};
