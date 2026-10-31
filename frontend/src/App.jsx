import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, Bell, Bot, Check, ChevronDown, Compass,
  GraduationCap, Heart, Menu, MessageCircle, Plus, Search, Sparkles,
  Users, X, Zap
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";
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

function StudentCard({person, score, reason, onConnect}) {
  return <article className="student-card">
    <div className="card-top"><Avatar person={person}/><button className="icon-button" aria-label="Save profile"><Heart size={17}/></button></div>
    <div className="person-name">{person.name}</div>
    <div className="muted small">{person.course} · {person.year}</div>
    <p className="bio">{person.bio}</p>
    <div className="tags">{(person.skills || []).slice(0,3).map(s=><span className="tag" key={s}>{s}</span>)}</div>
    {score !== undefined && <div className="match-row"><span><Sparkles size={13}/> {score}% match</span><span className="muted tiny">{reason || "Recommended for you"}</span></div>}
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
      const response=await fetch(`${API}/students`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!response.ok) throw new Error("Could not save profile");
      const saved=await response.json();
      setStudents(prev=>[saved,...prev]); setNotice("Your profile has been created!"); setModal(null);
      setForm({name:"",course:"",year:"1st Year",bio:"",skills:"",interests:"",goals:"",looking_for:""});
    } catch { setNotice("Start the FastAPI backend to save a profile."); }
  }
  async function sendChat(e) {
    e.preventDefault(); if(!chatInput.trim()) return;
    const message=chatInput.trim(); setChatInput("");
    setChatMessages(prev=>[...prev,{role:"user",text:message}]); setSending(true);
    try {
      const res=await fetch(`${API}/assistant`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,student_id:1})});
      const data=await res.json();
      setChatMessages(prev=>[...prev,{role:"assistant",text:data.reply || data.detail || "I couldn't generate a response."}]);
    } catch { setChatMessages(prev=>[...prev,{role:"assistant",text:"I can't reach the backend right now. Start FastAPI and try again."}]); }
    finally {setSending(false);}
  }

  const displayList = active==="For you" ? recommendations.map(x=>({...x.student,matchScore:x.score,matchReason:x.reason})) :
    active==="Find teammates" ? teammates.map(x=>({...x.student,matchScore:x.score,matchReason:x.reason})) : filtered;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Users size={20}/></span><span>campus<span className="brand-accent">connect</span><sup>AI</sup></span></a>
      <div className="workspace-label">YOUR CAMPUS</div>
      <nav>
        {[["Discover",Compass],["For you",Sparkles],["Find teammates",Users]].map(([label,Icon])=><button key={label} className={`nav-link ${active===label?"selected":""}`} onClick={()=>setActive(label)}><Icon size={18}/>{label}{label==="For you"&&<span className="nav-dot"/>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="campus-card"><div className="campus-icon"><GraduationCap size={19}/></div><b>Your campus, closer.</b><p>Find people who make your next idea possible.</p></div>
        <div className="mini-profile"><div className="mini-avatar">S</div><div><b>Student account</b><span>Explore mode</span></div><ChevronDown size={15}/></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="mobile-brand"><span className="brand-mark"><Users size={18}/></span>campusconnect<sup>AI</sup></div>
        <div className="breadcrumb">Community <span>/</span> <b>{active}</b></div>
        <div className="top-actions"><span className={`api-status ${apiOnline?"online":""}`}><i/>{apiOnline?"API connected":"Demo preview"}</span><button className="icon-button notification"><Bell size={18}/></button><button className="primary-button compact" onClick={()=>setModal("create")}><Plus size={16}/> Create profile</button></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-spark">✳</span> YOUR CAMPUS. YOUR COMMUNITY.</div>
          <h1>Big things happen<br/>when <span>people connect.</span></h1>
          <p>Meet students who share your interests, complement your skills, and are ready to build something meaningful.</p>
          <div className="hero-actions"><button className="primary-button" onClick={()=>document.getElementById("people")?.scrollIntoView({behavior:"smooth"})}>Explore community <ArrowRight size={17}/></button><button className="text-button" onClick={()=>setModal("create")}>Create your profile <ArrowUpRight size={16}/></button></div>
          <div className="social-proof"><div className="avatar-stack">{students.slice(0,4).map(p=><Avatar key={p.id} person={p} size="xs"/>)}</div><span><b>{students.length}+ students</b> ready to connect</span></div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <div className="floating-card fc-main"><div className="fc-label"><span className="pulse"/> PERFECT TEAMMATE FOUND</div><div className="fc-person"><Avatar person={students[1]||demoFallback[1]} size="lg"/><div><b>{students[1]?.name||"Meera Kapoor"}</b><span>UI/UX + Frontend</span></div><span className="match-pill">96% match</span></div><div className="fc-bottom"><span><Check size={13}/> Shared project goals</span><span><Check size={13}/> Complementary skills</span></div></div>
          <div className="float-bubble bubble-top"><Sparkles size={16}/> AI MATCHING</div>
          <div className="float-bubble bubble-bottom"><span className="bubble-avatars">✦</span> Your people are here</div>
          <div className="decor-star star-one">✳</div><div className="decor-star star-two">✦</div>
        </div>
      </section>

      <section className="stats-strip">
        <div><b>{students.length.toString().padStart(2,"0")}</b><span>Student profiles</span></div><div><b>AI</b><span>Smart matching</span></div><div><b>∞</b><span>Possibilities to build</span></div><div className="stats-note"><Zap size={16}/> Find collaborators, not just connections.</div>
      </section>

      <section className="people-section" id="people">
        <div className="section-heading"><div><div className="eyebrow">THE COMMUNITY</div><h2>{active==="Discover"?"Find your people.":active==="For you"?"Picked for you.":"Build your dream team."}</h2><p>{active==="Find teammates"?"People who bring skills you don't have — and share the goal.":"Discover interesting people doing interesting things around campus."}</p></div><button className="outline-button" onClick={()=>setModal("create")}><Plus size={16}/> Join the community</button></div>
        <div className="filter-row"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people, skills, interests..."/></div><div className="filter-label"><Sparkles size={15}/> {active==="For you"?"ML-powered matches":active==="Find teammates"?"Complementary skills":"Explore students"}</div></div>
        {!apiOnline && <div className="demo-notice">You're viewing demo profiles. Start the FastAPI backend to enable profile creation, live recommendations and the AI assistant.</div>}
        <div className="student-grid">
          {displayList.map(person=><StudentCard key={person.id} person={person} score={person.matchScore} reason={person.matchReason} onConnect={connect}/>)}
          {!displayList.length && <div className="empty-state">No matches yet. Try another search or add a profile.</div>}
        </div>
        <div className="bottom-cta"><div className="cta-icon"><Sparkles size={20}/></div><div><b>Your next great collaboration starts here.</b><span>Tell the community what you're passionate about.</span></div><button className="primary-button compact" onClick={()=>setModal("create")}>Create profile <ArrowRight size={15}/></button></div>
      </section>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><Users size={17}/></span>campus<span className="brand-accent">connect</span><sup>AI</sup></a><span>Made for curious minds and big ideas.</span><span>© 2026 CampusConnect AI</span></footer>
    </main>

    <button className="ai-fab" onClick={()=>setChatOpen(true)}><Bot size={19}/><span>Ask Campus AI</span><span className="fab-spark">✦</span></button>

    {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>}

    {modal && <div className="modal-backdrop" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setModal(null)}><X size={19}/></button>
      {modal==="create" ? <><div className="modal-kicker"><Sparkles size={15}/> JOIN THE COMMUNITY</div><h2>Create your student profile</h2><p className="muted">Help others discover what you bring to the table.</p>
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
