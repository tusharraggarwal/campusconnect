import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Bell, Bot, Check, ChevronDown, Compass,
  GraduationCap, Heart, Menu, MessageCircle, Plus, Search, Sparkles,
  Users, X, Zap
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
const demoFallback = [
  {id:1,name:"Aarav Sharma",course:"B.Tech CSE",year:"2nd Year",bio:"Building practical AI products and exploring computer vision.",skills:["Python","Machine Learning","PyTorch","OpenCV"],interests:["AI","Hackathons","Badminton"],avatar:"https://i.pravatar.cc/160?img=12"},
  {id:2,name:"Meera Kapoor",course:"B.Tech IT",year:"2nd Year",bio:"Frontend developer who enjoys turning ideas into clean products.",skills:["React","JavaScript","CSS","Figma"],interests:["Startups","Design","Hackathons"],avatar:"https://i.pravatar.cc/160?img=47"},
  {id:3,name:"Kabir Verma",course:"B.Tech CSE",year:"3rd Year",bio:"Backend developer interested in scalable APIs and cloud systems.",skills:["Python","FastAPI","PostgreSQL","Docker"],interests:["Open Source","Cloud","AI"],avatar:"https://i.pravatar.cc/160?img=14"},
  {id:4,name:"Ananya Singh",course:"B.Tech CSE",year:"1st Year",bio:"Learning data science and loves solving real-world problems.",skills:["Python","SQL","Pandas","Statistics"],interests:["Data Science","Reading","Badminton"],avatar:"https://i.pravatar.cc/160?img=44"},
  {id:5,name:"Rohan Malhotra",course:"B.Des",year:"2nd Year",bio:"Product designer focused on accessible digital experiences.",skills:["UI/UX","Figma","Prototyping","User Research"],interests:["Product Design","Startups","Photography"],avatar:"https://i.pravatar.cc/160?img=13"},
  {id:6,name:"Ishita Rao",course:"B.Tech CSE",year:"3rd Year",bio:"NLP enthusiast experimenting with LLM applications and RAG.",skills:["Python","NLP","Transformers","LangChain"],interests:["Generative AI","Research","Open Source"],avatar:"https://i.pravatar.cc/160?img=49"}
];

function Avatar({person, size="md"}) {
  return <img className={`avatar ${size}`} src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=e8eaff&color=5147bd`} alt={person.name} />;
}

function StudentCard({person, score, reason, onConnect, mode}) {
  const isAI = mode === "For you";
  const isTeam = mode === "Find teammates";
  return <article className={`student-card enhanced-card ${isAI ? "ai-card" : isTeam ? "team-card" : "discover-card"}`}>
    <div className="card-top">
      <div className="avatar-wrap"><Avatar person={person}/><span className="online-indicator"/></div>
      <div className="card-badges">
        {(isAI || isTeam) && <span className="match-badge"><Sparkles size={12}/>{score !== undefined ? `${score}% match` : "AI insight"}</span>}
        <button className="icon-button save-profile" aria-label="Save profile"><Heart size={17}/></button>
      </div>
    </div>
    <div className="person-name">{person.name}</div>
    <div className="muted small">{person.course} <span className="meta-dot">·</span> {person.year}</div>
    <p className="bio">{person.bio}</p>
    <div className="card-label">CORE SKILLS</div>
    <div className="tags">{(person.skills || []).slice(0,4).map(s=><span className="tag" key={s}>{s}</span>)}</div>
    {(isAI || isTeam) && <div className="match-explanation">
      <div className="explanation-title"><span className="explanation-icon"><Sparkles size={13}/></span><b>{isTeam ? "Team fit analysis" : "Why this matches you"}</b><span className="analysis-live">ANALYSIS</span></div>
      <p>{reason || (isTeam ? "Potential fit based on complementary skills and project interests." : "Suggested based on profile skills, interests and goals.")}</p>
    </div>}
    {!isAI && !isTeam && <div className="interest-line"><span>INTERESTS</span><b>{(person.interests || []).slice(0,2).join(" · ") || "Open to connecting"}</b></div>}
    <button className="connect-button" onClick={()=>onConnect(person)}>View profile <ArrowUpRight size={15}/></button>
  </article>;
}

function App() {
  const [students,setStudents] = useState(demoFallback);
  const [recommendations,setRecommendations] = useState([]);
  const [teammates,setTeammates] = useState([]);
  const [active,setActive] = useState("Discover");
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);
  const [apiOnline,setApiOnline] = useState(false);
  const [modal,setModal] = useState(null);
  const [chatOpen,setChatOpen] = useState(false);
  const [chatInput,setChatInput] = useState("");
  const [chatMessages,setChatMessages] = useState([{role:"assistant",text:"Hey! I'm your CampusConnect AI assistant. Tell me what you're interested in building or learning, and I'll help you find your next step."}]);
  const [sending,setSending] = useState(false);
  const [form,setForm] = useState({name:"",course:"",year:"1st Year",bio:"",skills:"",interests:"",goals:"",looking_for:""});
  const [notice,setNotice] = useState("");
  const [authToken,setAuthToken] = useState(()=>localStorage.getItem("campusconnect_token") || "");
  const [currentUser,setCurrentUser] = useState(null);
  const [authMode,setAuthMode] = useState("login");
  const [authStep,setAuthStep] = useState("credentials");
  const [authForm,setAuthForm] = useState({full_name:"",email:"",password:""});
  const [verificationCode,setVerificationCode] = useState("");
  const [authBusy,setAuthBusy] = useState(false);

  async function loadData() {
    try {
      const [s,r,t] = await Promise.all([
        fetch(`${API}/students`), fetch(`${API}/recommendations/1`), fetch(`${API}/teammates/1`)
      ]);
      if (!s.ok) throw new Error("API unavailable");
      setStudents(await s.json());
      if (r.ok) setRecommendations(await r.json());
      if (t.ok) setTeammates(await t.json());
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setRecommendations([]);
      setTeammates([]);
    } finally { setLoading(false); }
  }
  useEffect(()=>{loadData();},[]);
  useEffect(()=>{
    if(!authToken) return;
    fetch(`${API}/auth/me`,{headers:{Authorization:`Bearer ${authToken}`}})
      .then(async r=>{if(!r.ok) throw new Error("Session expired"); return r.json();})
      .then(setCurrentUser)
      .catch(()=>{localStorage.removeItem("campusconnect_token");setAuthToken("");setCurrentUser(null);});
  },[authToken]);

  function openAuth(mode="login") {
    setAuthMode(mode); setAuthStep("credentials"); setModal("auth");
  }
  function logout() {
    localStorage.removeItem("campusconnect_token"); setAuthToken(""); setCurrentUser(null);
    setNotice("You have been logged out.");
  }
  async function submitAuth(e) {
    e.preventDefault(); setAuthBusy(true);
    try {
      let endpoint, body;
      if(authStep==="verify") {
        endpoint="/api/auth/verify"; body={email:authForm.email,code:verificationCode};
      } else if(authMode==="register") {
        endpoint="/auth/register"; body=authForm;
      } else {
        endpoint="/api/auth/login"; body={email:authForm.email,password:authForm.password};
      }
      const response=await fetch(`${API}${endpoint}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();
      if(!response.ok) throw new Error(data.detail || "Authentication failed.");
      if(authStep==="verify" || authMode==="login") {
        localStorage.setItem("campusconnect_token",data.access_token);
        setAuthToken(data.access_token); setCurrentUser(data.user);
        setModal(null); setNotice("Welcome to CampusConnect, "+data.user.full_name+"!");
      } else {
        setAuthStep("verify"); setNotice("Verification code sent to your IILM email.");
      }
    } catch(err) { setNotice(err.message || "Authentication failed."); }
    finally {setAuthBusy(false);}
  }

  const filtered = useMemo(()=>{
    const q=search.toLowerCase().trim();
    if(!q) return students;
    return students.filter(p=>[p.name,p.course,p.bio,...(p.skills||[]),...(p.interests||[])].join(" ").toLowerCase().includes(q));
  },[students,search]);

  function connect(person) { setModal(person); }
  async function createProfile(e) {
    e.preventDefault();
    const payload={...form,skills:form.skills.split(",").map(x=>x.trim()).filter(Boolean),interests:form.interests.split(",").map(x=>x.trim()).filter(Boolean),goals:form.goals.split(",").map(x=>x.trim()).filter(Boolean)};
    try {
      if(!authToken) { setModal("auth"); setAuthMode("login"); setNotice("Please log in before creating your student profile."); return; }
      const response=await fetch(`${API}/students`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${authToken}`},body:JSON.stringify(payload)});
      if(!response.ok) { const errorData=await response.json().catch(()=>({})); throw new Error(errorData.detail || "Could not save profile."); }
      const saved=await response.json();
      setStudents(prev=>[saved,...prev]); setNotice("Your profile has been created!"); setModal(null);
      setForm({name:"",course:"",year:"1st Year",bio:"",skills:"",interests:"",goals:"",looking_for:""});
    } catch(err) { setNotice(err.message || "Could not save your profile."); }
  }
  async function sendChat(e) {
    e.preventDefault(); if(!chatInput.trim()) return;
    const message=chatInput.trim(); setChatInput("");
    setChatMessages(prev=>[...prev,{role:"user",text:message}]); setSending(true);
    try {
      if(!authToken) { setChatMessages(prev=>[...prev,{role:"assistant",text:"Please log in with your IILM email to use Campus AI."}]); return; }
      const res=await fetch(`${API}/assistant`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${authToken}`},body:JSON.stringify({message})});
      const data=await res.json();
      setChatMessages(prev=>[...prev,{role:"assistant",text:data.reply || data.detail || "I couldn't generate a response."}]);
    } catch { setChatMessages(prev=>[...prev,{role:"assistant",text:"I can't reach the backend right now. Start FastAPI and try again."}]); }
    finally {setSending(false);}
  }

  const displayList = active==="For you" ? recommendations.map(x=>({...x.student,matchScore:x.score,matchReason:x.reason})) :
    active==="Find teammates" ? teammates.map(x=>({...x.student,matchScore:x.score,matchReason:x.reason})) : filtered;
  const pageCopy = {
    "Discover": { kicker: "CAMPUS NETWORK / DISCOVER", title: <>Discover. <span>Connect.</span> Grow.</>, description: "Meet curious minds, explore new interests and find people to build something meaningful with.", section: "Explore students", detail: "A growing community of people, skills and ideas." },
    "For you": { kicker: "INTELLIGENCE / PERSONALIZED MATCHES", title: <>Your next <span>great connection</span> starts here.</>, description: "AI-assisted suggestions shaped by your skills, interests and goals.", section: "Recommended for you", detail: "A closer look at people whose interests and direction overlap with yours." },
    "Find teammates": { kicker: "COLLABORATION / TEAM BUILDER", title: <>Build better. <span>Together.</span></>, description: "Find collaborators with complementary strengths and shared ambitions.", section: "Potential teammates", detail: "Explore people who could bring a missing skill or fresh perspective to your project." }
  }[active];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Users size={20}/></span><span>campus<span className="brand-accent">connect</span><sup>AI</sup></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {[["Discover",Compass],["For you",Sparkles],["Find teammates",Users]].map(([label,Icon])=><button key={label} className={`nav-link ${active===label?"selected":""}`} onClick={()=>setActive(label)}><Icon size={18}/>{label}{label==="For you"&&<span className="nav-dot"/>}</button>)}
      </nav>
      <div className="workspace-label network-label">CAMPUS INTELLIGENCE</div>
      <div className="sidebar-feature"><div className="feature-icon"><Zap size={15}/></div><div><b>AI match engine</b><span>Finding your next connection</span></div><i/></div>
      <div className="sidebar-bottom">
        <div className="campus-card"><div className="campus-icon"><Bot size={19}/></div><b>Your AI collaboration hub.</b><p>Discover people, combine strengths and turn ideas into projects.</p><span className="campus-card-glow"/></div>
        <div className="mini-profile"><div className="mini-avatar">{currentUser?.full_name?.[0]||"S"}</div><div><b>{currentUser?.full_name||"Student account"}</b><span>{currentUser?"Verified account":"Explore mode"}</span></div><ChevronDown size={15}/></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="mobile-brand"><span className="brand-mark"><Users size={18}/></span>campusconnect<sup>AI</sup></div>
        <div className="breadcrumb">Community <span>/</span> <b>{active}</b></div>
        <div className="top-actions"><span className={`api-status ${apiOnline?"online":""}`}><i/>{apiOnline?"API connected":"Demo preview"}</span><button className="icon-button notification"><Bell size={18}/></button>{currentUser?<button className="outline-button" onClick={logout}>Log out</button>:<button className="outline-button" onClick={()=>openAuth("login")}>Log in</button>}<button className="primary-button compact" onClick={()=>setModal("create")}><Plus size={16}/> Create profile</button></div>
      </header>

      <section className="command-header">
        <div className="command-heading">
          <div className="eyebrow"><span className="live-pulse"/> CAMPUSCONNECT INTELLIGENCE / {active.toUpperCase()}</div>
          <h1>{active === "Discover" ? <>Your campus.<br/><span>Infinite possibilities.</span></> : active === "For you" ? <>Connections that<br/><span>make sense for you.</span></> : <>Find your next<br/><span>project partner.</span></>}</h1>
          <p>{pageCopy.description}</p>
          <div className="command-actions">
            <button className="primary-button" onClick={()=>document.getElementById("people")?.scrollIntoView({behavior:"smooth"})}><Compass size={16}/> Explore network <ArrowRight size={16}/></button>
            <button className="outline-button" onClick={()=>setModal("create")}><Plus size={15}/> Build your profile</button>
          </div>
        </div>
        <div className="intelligence-panel">
          <div className="intelligence-top"><div className="intelligence-icon"><Bot size={19}/></div><div><b>Campus AI engine</b><span><i/> {apiOnline ? "Connected to your campus data" : "Preview mode · sample insights"}</span></div><span className="engine-version">LIVE</span></div>
          <div className="intelligence-orb"><div className="orb-ring orb-ring-a"/><div className="orb-ring orb-ring-b"/><div className="orb-center"><Sparkles size={25}/></div><span className="orb-dot orb-dot-a"/><span className="orb-dot orb-dot-b"/></div>
          <div className="intelligence-caption"><b>{active === "Find teammates" ? "Team compatibility" : active === "For you" ? "Personalized discovery" : "Smarter campus discovery"}</b><span>{active === "Find teammates" ? "Bring different strengths together." : active === "For you" ? "Find people aligned with your interests." : "Turn shared interests into real connections."}</span></div>
        </div>
      </section>

      <section className="overview-metrics">
        <div className="metric-card"><span className="metric-icon purple"><Users size={17}/></span><div><b>{students.length.toString().padStart(2,"0")}</b><span>Campus profiles</span></div><small>COMMUNITY</small></div>
        <div className="metric-card"><span className="metric-icon blue"><Sparkles size={17}/></span><div><b>{recommendations.length.toString().padStart(2,"0")}</b><span>Suggested for you</span></div><small>AI MATCHES</small></div>
        <div className="metric-card"><span className="metric-icon green"><Zap size={17}/></span><div><b>{teammates.length.toString().padStart(2,"0")}</b><span>Team possibilities</span></div><small>COLLABORATE</small></div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main" id="people">
          <div className="dashboard-section-title"><div><div className="eyebrow">{pageCopy.kicker}</div><h2>{pageCopy.section}</h2><p>{pageCopy.detail}</p></div><span className="result-count">{displayList.length} RESULTS</span></div>
          <div className="filter-row"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people, skills, interests..."/></div><div className="filter-label"><Sparkles size={15}/> {active==="For you"?"ML-powered matches":active==="Find teammates"?"Complementary skills":"Explore students"}</div></div>
          {!apiOnline && <div className="demo-notice">You're viewing demo profiles. Start the FastAPI backend to enable profile creation, live recommendations and the AI assistant.</div>}
          <div className="student-grid">{displayList.map(person=><StudentCard key={person.id} person={person} score={person.matchScore} reason={person.matchReason} mode={active} onConnect={connect}/>)}{!displayList.length&&<div className="empty-state">No matches yet. Try another search or add a profile.</div>}</div>
        </div>
        <aside className="dashboard-rail">
          <div className="rail-card focus-card"><div className="rail-card-heading"><span className="rail-icon"><Sparkles size={15}/></span><span>AI INSIGHT</span><span className="rail-live">● ACTIVE</span></div><h3>{active === "Find teammates" ? "Build a balanced team" : active === "For you" ? "Your next connection is closer" : "Your campus is full of potential"}</h3><p>{active === "Find teammates" ? "Look for collaborators whose strengths add something different to your own." : active === "For you" ? "Explore students with overlapping interests, skills and goals." : "Discover people beyond your usual circle and find new opportunities to collaborate."}</p><div className="insight-graphic"><div className="insight-node node-main"><Bot size={17}/></div><span className="insight-line line-one"/><span className="insight-line line-two"/><span className="insight-node node-small one"/><span className="insight-node node-small two"/><span className="insight-node node-small three"/></div><button className="rail-action" onClick={()=>setActive(active === "Discover" ? "For you" : "Find teammates")}>{active === "Discover" ? "See your AI matches" : "Explore team candidates"}<ArrowRight size={14}/></button></div>
          <div className="rail-card quick-card"><div className="rail-card-heading"><span className="rail-icon cyan"><Zap size={15}/></span><span>QUICK ACTIONS</span></div><button onClick={()=>setModal("create")}><Plus size={15}/> Complete your student profile<ArrowUpRight size={14}/></button><button onClick={()=>setChatOpen(true)}><Bot size={15}/> Ask Campus AI<ArrowUpRight size={14}/></button><button onClick={()=>setActive("Find teammates")}><Users size={15}/> Find project teammates<ArrowUpRight size={14}/></button></div>
          <div className="rail-note"><span className="note-spark">✦</span><div><b>Good things happen together.</b><p>Share what you're learning. Find people who want to build with you.</p></div></div>
        </aside>
      </section>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Users size={17}/></span>campus<span className="brand-accent">connect</span><sup>AI</sup></a><span>Made for curious minds and big ideas.</span><span>© 2026 CampusConnect AI</span></footer>
    </main>

    <button className="ai-fab" onClick={()=>setChatOpen(true)}><Bot size={19}/><span>Ask Campus AI</span><span className="fab-spark">✦</span></button>

    {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}

    {modal && <div className="modal-backdrop" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setModal(null)}><X size={19}/></button>
      {modal==="auth" ? <><div className="modal-kicker"><Sparkles size={15}/> IILM STUDENT ACCESS</div><h2>{authStep==="verify"?"Verify your email":authMode==="register"?"Create your account":"Welcome back"}</h2><p className="muted">{authStep==="verify"?"Enter the six-digit code sent to your university email.": "Use your @iilm.edu email address to access CampusConnect."}</p>
        <form className="profile-form" onSubmit={submitAuth}>
          {authStep==="credentials" && authMode==="register" && <label>Full name<input required minLength="2" value={authForm.full_name} onChange={e=>setAuthForm({...authForm,full_name:e.target.value})} placeholder="Your full name"/></label>}
          <label>University email<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@iilm.edu" disabled={authStep==="verify"}/></label>
          {authStep==="credentials" && <label>Password<input required type="password" minLength={authMode==="register"?10:1} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder={authMode==="register"?"At least 10 characters":"Your password"}/></label>}
          {authStep==="verify" && <label>Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={verificationCode} onChange={e=>setVerificationCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit code"/></label>}
          <button className="primary-button full-width" type="submit" disabled={authBusy}>{authBusy?"Please wait...":authStep==="verify"?"Verify and continue":authMode==="register"?"Create account":"Log in"} <ArrowRight size={16}/></button>
        </form>
        {authStep==="credentials" && <p className="auth-switch">{authMode==="register"?"Already registered?":"New to CampusConnect?"} <button type="button" onClick={()=>setAuthMode(authMode==="register"?"login":"register")}>{authMode==="register"?"Log in":"Create an account"}</button></p>}
        {authStep==="verify" && <p className="auth-switch">Didn't receive a code? <button type="button" onClick={async()=>{try{const r=await fetch(`${API}/auth/resend-verification?email=${encodeURIComponent(authForm.email)}`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Could not resend code");setNotice(d.message);}catch(err){setNotice(err.message);}}}>Resend code</button> · <button type="button" onClick={()=>setAuthStep("credentials")}>Go back</button></p>}
      </> : modal==="create" ? <><div className="modal-kicker"><Sparkles size={15}/> JOIN THE COMMUNITY</div><h2>Create your student profile</h2><p className="muted">Help others discover what you bring to the table.</p>
        <form className="profile-form" onSubmit={createProfile}>
          <label>Full name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Tushar Aggarwal"/></label>
          <div className="form-two"><label>Course<input value={form.course} onChange={e=>setForm({...form,course:e.target.value})} placeholder="B.Tech CSE"/></label><label>Year<select value={form.year} onChange={e=>setForm({...form,year:e.target.value})}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label></div>
          <label>About you<textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="What are you curious about?"/></label>
          <label>Skills <small>comma separated</small><input value={form.skills} onChange={e=>setForm({...form,skills:e.target.value})} placeholder="Python, React, UI/UX"/></label>
          <label>Interests <small>comma separated</small><input value={form.interests} onChange={e=>setForm({...form,interests:e.target.value})} placeholder="AI, badminton, startups"/></label>
          <label>Goals <small>comma separated</small><input value={form.goals} onChange={e=>setForm({...form,goals:e.target.value})} placeholder="Build a product, learn ML"/></label>
          <label>Looking for<input value={form.looking_for} onChange={e=>setForm({...form,looking_for:e.target.value})} placeholder="A teammate, study group..."/></label>
          <button className="primary-button full-width" type="submit">Create my profile <ArrowRight size={16}/></button>
        </form></> :
        <><div className="profile-modal-head"><Avatar person={modal} size="xl"/><div><h2>{modal.name}</h2><p className="muted">{modal.course} · {modal.year}</p></div></div><p>{modal.bio}</p><h4>Skills</h4><div className="tags">{(modal.skills||[]).map(s=><span className="tag" key={s}>{s}</span>)}</div><h4>Interests</h4><div className="tags">{(modal.interests||[]).map(s=><span className="tag" key={s}>{s}</span>)}</div><div className="looking-box"><b>Looking for</b><p>{modal.looking_for||"Open to meeting new people and collaborating."}</p></div><button className="primary-button full-width" onClick={()=>{setModal(null);setNotice("Connection requests are coming in the next version.")}}> <MessageCircle size={16}/> Interested in connecting</button></>}
    </div></div>}

    {chatOpen && <div className="chat-panel"><div className="chat-header"><div className="chat-avatar"><Bot size={19}/></div><div><b>Campus AI</b><span><i/> Your collaboration assistant</span></div><button className="icon-button" onClick={()=>setChatOpen(false)}><X size={18}/></button></div><div className="chat-body">{chatMessages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}>{m.text}</div>)}{sending&&<div className="chat-message assistant">Thinking...</div>}</div><form className="chat-input" onSubmit={sendChat}><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask me anything..."/><button type="submit" disabled={sending}><ArrowRight size={17}/></button></form><div className="chat-foot">AI can make mistakes. Verify important information.</div></div>}
  </div>;
}

export default App;
